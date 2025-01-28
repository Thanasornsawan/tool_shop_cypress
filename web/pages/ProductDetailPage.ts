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
    const relatedProductCardLink = this.relatedProductCardLink;
    const categoryLabel = this.categoryLabel;

    cy.xpath(relatedProductCardLink)
        .should('be.visible')
        .should('not.have.class', 'loading') // If there’s any loading class, wait until it's gone
        .then($links => {
            const linksArray = Array.from($links); // Convert NodeList to array

            function processLink(index: number) {
                if (index >= linksArray.length) return; // Exit condition

                // Dynamically re-query the link and ensure it's stable
                cy.xpath(`(${relatedProductCardLink})[${index + 1}]`).as('currentLink');

                cy.get('@currentLink')
                    .should('exist')
                    .should('be.visible')
                    .should('not.have.class', 'loading') // Ensure no loading state is present
                    .click(); // Perform click action

                // Verify category on the new page
                cy.xpath(categoryLabel)
                    .should('be.visible')
                    .should('have.text', mainCategory);

                // Navigate back and stabilize the DOM
                cy.go('back');
                cy.xpath(relatedProductCardLink)
                    .should('be.visible') // Wait for related products to reappear
                    .should('not.have.class', 'loading'); // Ensure loading class is not present

                processLink(index + 1); // Process the next link
            }

            processLink(0); // Start processing links
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