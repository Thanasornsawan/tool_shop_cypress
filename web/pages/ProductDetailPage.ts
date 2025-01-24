import BasePage from './BasePage';

export default class ProductDetailPage extends BasePage {
  // Encapsulated selectors
  private readonly quantityPlus = '[data-test="increase-quantity"]';
  private readonly quantityMinus = '[data-test="decrease-quantity"]';
  private readonly quantityInput = '[data-test="quantity"]';
  private readonly addToCartButton = '[data-test="add-to-cart"]';
  private readonly cartIcon = '[data-test="nav-cart"]';
  private readonly cartQuantity = '[data-test="cart-quantity"]';
  private readonly outOfStockLabel = 'text=Out of stock';
  private readonly brandLabel = '[aria-label="brand"]';
  private readonly categoryLabel = '[aria-label="category"]';
  private readonly productName = '[data-test="product-name"]';
  private readonly productPrice = '[data-test="unit-price"]';
  private readonly addToCartSuccess = 'div[role="alert"]:contains("Product added to shopping cart.")';
  private readonly relatedProductSection = 'text=Related products';
  private readonly relatedProductCardTitle = '.card-title';

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
    return cy.get(this.quantityInput)
      .invoke('val')
      .then(val => Number(val));
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
    return cy.get(this.categoryLabel)
      .should('be.visible')
      .invoke('text');
  }

  getBrand(): Cypress.Chainable<string> {
    return cy.get(this.brandLabel)
      .should('be.visible')
      .invoke('text');
  }

  getRelatedProductNames(): Cypress.Chainable<string[]> {
    return cy.get(this.relatedProductCardTitle)
      .should('be.visible')
      .then($elements => 
        Array.from($elements).map(el => el.textContent || '')
      );
  }

  openRelatedProductInNewTab(index: number): Cypress.Chainable<Cypress.AUTWindow> {
    cy.get(this.relatedProductSection).scrollIntoView();
    
    return cy.get(this.relatedProductCardTitle)
      .eq(index)
      .should('be.visible')
      .then($el => {
        cy.wrap($el).invoke('removeAttr', 'target'); // Remove target="_blank"
        cy.wrap($el).click();
        
        return cy.window();
      });
  }

}