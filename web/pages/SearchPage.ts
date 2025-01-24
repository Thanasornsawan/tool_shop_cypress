import BasePage from './BasePage';

export default class SearchPage extends BasePage {
  private readonly priceRangeMin = '.ngx-slider-pointer-min';
  private readonly priceRangeMax = '.ngx-slider-pointer-max';
  private readonly sortDropdown = '[data-test="sort"]';
  private readonly searchInput = '[data-test="search-query"]';
  private readonly searchReset = '[data-test="search-reset"]';
  private readonly searchResults = '.card-body';
  private readonly productPrices = '[data-test="product-price"]';
  private readonly productNames = '.card-title';
  private readonly searchKeywordText = '[data-test="search-caption"]';
  private readonly filterSection = '#filters';
  private readonly brandSection = 'h4:contains("By brand:")';
  private readonly paginationSection = '.pagination';

  private waitForPriceUpdate(): void {
    cy.get(this.productPrices).should('be.visible');
    cy.wait(500); // Wait for Angular to update
  }

  getAllProductNames(): Cypress.Chainable<string[]> {
    return cy.get(this.productNames)
      .then($elements => 
        Array.from($elements, el => el.textContent?.toLowerCase() || '')
      );
  }

  clickProduct(index: number): Cypress.Chainable<unknown> {
    return cy.get(this.searchResults).eq(index).click();
  }

  search(keyword: string): Cypress.Chainable<number> {
    // Clear existing search first
    cy.get(this.searchInput)
      .clear()
      .type(keyword)
      .type('{enter}');

    // Wait for search results
    cy.get(this.searchResults).should('be.visible');
    cy.get(this.searchKeywordText)
      .should('be.visible')
      .should('contain', keyword);

    // Return found index
    return cy.get(this.productNames).then($elements => {
      const index = Array.from($elements).findIndex(el => 
        el.textContent?.toLowerCase().includes(keyword.toLowerCase())
      );
      return index;
    });
  }

  getProductPrice(productName: string): Cypress.Chainable<number> {
    return cy.contains(this.productNames, productName)
      .parents(this.searchResults)
      .find(this.productPrices)
      .invoke('text')
      .then(text => parseFloat(text.replace('$', '')));
  }

  getAllPrices(): Cypress.Chainable<number[]> {
    return cy.get(this.productPrices).then($elements => 
      Array.from($elements, el => parseFloat(el.textContent?.replace('$', '') || '0'))
    );
  }

  clearSearch(): Cypress.Chainable<unknown> {
    return cy.get(this.searchReset).click().then(() => {
      cy.get(this.searchKeywordText).should('not.exist');
      cy.get(this.paginationSection).should('be.visible');
    });
  }

  getBrandCheckbox(brand: string): Cypress.Chainable {
    return cy.contains('label', brand.trim())
      .find('input[type="checkbox"]')
      .should('exist');
  }

  isProductOutOfStock(productName: string): Cypress.Chainable<boolean> {
    return cy.contains('h5', productName)
      .should('exist')
      .parent()
      .next()
      .then(($nextElement) => {
        const isOutOfStock = $nextElement.find('span:contains("Out of stock")').length > 0;
        expect(isOutOfStock).to.be.a('boolean');
        return isOutOfStock;
      });
  }

  filterPriceRange(min: number | null = null, max: number | null = null): void {
    const targetMin = min ?? 10;  // Set default min to 10 if null
    const targetMax = max ?? 50;  // Set default max to 50 if null
    
    // Min slider logic
    cy.get(this.priceRangeMin)
      .click({ force: true })  // Force click because slider might be covered
      .focused()  // Ensure slider is focused for keyboard input
      .then($slider => {
        const startValue = parseInt($slider.attr('aria-valuenow') || '0');  // Get current slider value
        let currentSteps = 0;  // Track steps moved
        const totalSteps = Math.ceil((targetMin - startValue) / 2);  // Calculate steps needed (slider moves 2 units per step)
        
        const moveSlider = () => {
          if (currentSteps >= totalSteps) return;  // Stop if reached required steps
          cy.wrap($slider)
            .type('{rightarrow}', { delay: 500 })  // Move right with delay for UI update
            .then(() => {
              cy.get(this.priceRangeMin)
                .invoke('attr', 'aria-valuenow')  // Get new value after movement
                .then(value => {
                  const currentValue = parseInt(value || '0');
                  if (currentValue >= targetMin) return;  // Stop if reached/exceeded target
                  currentSteps++;
                  moveSlider();  // Recursive call for next movement
                });
            });
        };
        moveSlider();
      });
  
    // Max slider logic
    cy.get(this.priceRangeMax)
      .click({ force: true })
      .focused()
      .then($slider => {
        cy.get(this.priceRangeMin)
          .invoke('attr', 'aria-valuenow')  // Get min slider value to prevent overlap
          .then(minValue => {
            const currentMinValue = parseInt(minValue || '0');
            const startValue = parseInt($slider.attr('aria-valuenow') || '0');
            const direction = startValue > targetMax ? '{leftarrow}' : '{rightarrow}';  // Determine direction
            let currentSteps = 0;
            const totalSteps = Math.ceil(Math.abs(targetMax - startValue) / 2);
  
            const moveSlider = () => {
              if (currentSteps >= totalSteps) return;  // Stop if reached required steps
              cy.wrap($slider)
                .type(direction, { delay: 500 })
                .then(() => {
                  cy.get(this.priceRangeMax)
                    .invoke('attr', 'aria-valuenow')
                    .then(value => {
                      const currentValue = parseInt(value || '0');
                      // Stop conditions:
                      if (direction === '{leftarrow}' && currentValue <= targetMax) return;  // Reached target moving left
                      if (direction === '{rightarrow}' && currentValue >= targetMax) return;  // Reached target moving right
                      if (currentValue <= currentMinValue + 2) return;  // Prevent overlap with min slider
                      currentSteps++;
                      moveSlider();
                    });
                });
            };
            moveSlider();
        });
    });
   }

  sortBy(option: string): void {
    cy.get(this.sortDropdown)
      .select(option)
      .trigger('change')
      .trigger('ngModelChange');
    
    cy.wait(1000);

    if (option === 'name,asc') {
      cy.get(this.productNames).should('be.visible')
        .then($elements => {
          const names = Array.from($elements, el => el.textContent?.toLowerCase() || '');
          expect(names).to.deep.equal([...names].sort());
        });
    } else if (option === 'price,asc') {
      cy.get(this.productPrices).should('be.visible')
        .then($prices => {
          const prices = Array.from($prices).map(el => 
            parseFloat(el.textContent?.replace('$', '') || '0')
          );
          expect(prices).to.deep.equal([...prices].sort((a,b) => a-b));
        });
    }
  }

  filterByBrand(brand: string): void {
    cy.get(this.filterSection).scrollIntoView();
    
    // Find the brand section and scroll to it
    cy.contains('h4', 'By brand:')
      .scrollIntoView()
      .should('be.visible');
    
    // Get exact brand text from label before checking
    cy.contains('label', brand.trim())
      .invoke('text')
      .then(labelText => {
        // Find and check the checkbox
        cy.contains('label', labelText.trim())
          .find('input[type="checkbox"]')
          .check({ force: true });
      });

    // Wait for results to update
    cy.wait(1000);
    cy.get(this.searchResults).should('be.visible');
  }

  getSearchResultPrices(): Cypress.Chainable<string[]> {
    return cy.get(this.productPrices)
      .should('be.visible')
      .then($elements => 
        Array.from($elements).map(el => el.textContent || '')
      );
  }

  clearSearchResult(): void {
    cy.get(this.searchReset).click();
    cy.get(this.searchKeywordText).should('not.exist');
    cy.get(this.paginationSection).should('be.visible');
    cy.get(this.searchResults).first().should('be.visible');
  }

  getTotalSearchResults(): Cypress.Chainable<number> {
    return cy.get(this.searchResults)
      .should('be.visible')
      .its('length');
  }

  getRandomProduct(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.searchResults)
      .should('be.visible')
      .then($elements => {
        const randomIndex = Math.floor(Math.random() * $elements.length);
        return cy.wrap($elements.eq(randomIndex));
      });
  }
}