import BasePage from './BasePage';

export default class ProductDetailPage extends BasePage {
  // Encapsulated selectors
  private readonly quantityPlus = '[data-test="increase-quantity"]';
  private readonly quantityMinus = '[data-test="decrease-quantity"]';
  private readonly quantityInput = '[data-test="quantity"]';
  private readonly addToCartButton = '[data-test="add-to-cart"]';
  private readonly cartIcon = '[data-test="nav-cart"]';
  private readonly cartQuantity = '[data-test="cart-quantity"]';
  private readonly outOfStockLabel = '//p[text()="Out of stock"]';
  private readonly brandLabel = '//span[@aria-label="brand"]';
  private readonly categoryLabel = '//span[@aria-label="category"]';
  private readonly productName = '[data-test="product-name"]';
  private readonly productPrice = '[data-test="unit-price"]';
  private readonly addToCartSuccess = 'div[role="alert"]:contains("Product added to shopping cart.")';
  private readonly relatedProductSection = '//h1[text()="Related products"]';
  private readonly relatedProductCardTitle = '.card-title';
  private readonly relatedProductCardLink = '//h5[@class="card-title"]/parent::div/parent::a'

  // Get the product name
  getProductName(): Cypress.Chainable<string> {
    return cy.get(this.productName).invoke('text');
  }

  // Get the product price as a number
  getProductPrice(): Cypress.Chainable<number> {
    return cy.get(this.productPrice)
      .invoke('text')
      .then(text => parseFloat(text.replace('$', '')));
  }

  // Get current quantity value
  getCurrentQuantity(): Cypress.Chainable<number> {
    return cy.get(this.quantityInput, { timeout: 10000 }) // Wait for the element
      .should('be.visible') // Ensure it’s visible
      .invoke('val') // Get the value
      .then((val) => Number(val)); // Convert to number
  }  

  // Increase quantity by specified amount
  increaseQuantity(times: number): Cypress.Chainable<number> {
    // Chain multiple increases together
    let chain = cy.wrap(null);
    for (let i = 0; i < times; i++) {
      chain = chain.then(() => {
        return cy.get(this.quantityPlus)
          .should('be.visible')
          .should('not.be.disabled')
          .click();
      });
    }
    
    // Return final quantity after increases
    return chain.then(() => this.getCurrentQuantity());
  }

  // Add current product to cart
  addToCart(): Cypress.Chainable<unknown> {
    return cy.get(this.addToCartButton)
      .should('be.visible')
      .should('not.be.disabled')
      .click()
      .then(() => {
        // Wait for success message
        cy.get(this.addToCartSuccess).should('be.visible');
        cy.get(this.addToCartSuccess).should('not.exist');
      });
  }

  // Navigate to cart page
  goToCart(): Cypress.Chainable<unknown> {
    return cy.get(this.cartIcon)
      .should('be.visible')
      .click()
      .then(() => {
        cy.url().should('include', '/checkout');
      });
  }

  getCategory(): Cypress.Chainable<string> {
    return cy.xpath(this.categoryLabel)
      .should('be.visible')
      .invoke('text');
  }

  getBrand(): Cypress.Chainable<string> {
    return cy.xpath(this.brandLabel)
      .should('be.visible')
      .invoke('text')
      .then(text => text.trim());
  }

  getRelatedProductNames(): Cypress.Chainable<string[]> {
    return cy.get(this.relatedProductCardTitle)
      .should('be.visible')
      .then($elements => 
        Array.from($elements).map(el => el.textContent || '')
      );
  }

  openRelatedProducts(mainCategory: string): void {
    const relatedProductCardTitle = this.relatedProductCardTitle; // Store the locator in a variable
    const categoryLabel = this.categoryLabel; // Store the locator in a variable
    const productName = this.productName; // Store the locator in a variable

    cy.get(productName) // Get the main product name once
        .invoke('text')
        .then(mainProductName => {
            cy.get(relatedProductCardTitle) // Use cy.get for CSS selectors
                .should('be.visible')
                .should('not.have.class', 'loading') // If there’s any loading class, wait until it's gone
                .then($titles => {
                    const titlesArray = Array.from($titles); // Convert NodeList to array

                    function processLink(index: number) {
                        if (index >= titlesArray.length) return; // Exit condition

                        // Dynamically re-query the related product card title
                        cy.get(`${relatedProductCardTitle}:eq(${index})`).as('currentCardTitle'); // Use eq() for index-based selection

                        cy.get('@currentCardTitle')
                            .should('be.visible')
                            .should('not.have.class', 'loading') // Ensure no loading state is present
                            .click(); // Click the related product card title

                            cy.wait(6000);
                        
                        // Wait for the page to load (e.g., wait for the product name element)
                        cy.get(productName)
                            .should('be.visible') // Ensure the product name is visible (page is loaded)
                            .invoke('text') // Get the text of the product name
                            .then(relatedProductName => {
                                expect(relatedProductName).not.to.equal(mainProductName); // Ensure product name is different

                                // Verify category on the new page
                                cy.xpath(categoryLabel)
                                    .should('be.visible')
                                    .should('have.text', mainCategory);

                                // Navigate back and stabilize the DOM
                                cy.go('back');
                                cy.get(relatedProductCardTitle) // Wait for related products to reappear
                                    .should('be.visible')
                                    .should('not.have.class', 'loading'); // Ensure loading class is not present
                            });

                        // Process the next related product
                        processLink(index + 1);
                    }

                    processLink(0); // Start processing links
                });
        });
}

  outOfStockLabelDisplay(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.xpath(this.outOfStockLabel).should('be.visible');
  }

  increaseQuanityDisabled(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.quantityPlus).should('be.disabled');
  }

  descreaseQuantityDisabled(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.quantityMinus).should('be.disabled');
  }

  addTocartDisabled(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.addToCartButton).should('be.disabled');
  }

}