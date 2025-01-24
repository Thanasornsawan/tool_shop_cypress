import BasePage from './BasePage';
import paymentData from '@fixtures/paymentData.json';

export default class CartPage extends BasePage {
  private readonly paymentOptions = paymentData.paymentOptions;
  private readonly cartTable = '.table.table-hover';
  private readonly cartUpdateSuccess = 'div[role="alert"]:contains("Product quantity updated.")';
  private readonly cartDeleteSuccess = 'div[role="alert"]:contains("Product deleted.")';
  private readonly cartTotal = '[data-test="cart-total"]';
  private readonly proceedToCheckoutButton1 = '[data-test="proceed-1"]';
  private readonly proceedToCheckoutButton2 = '[data-test="proceed-2"]';
  private readonly proceedToCheckoutButton3 = '[data-test="proceed-3"]';
  private readonly paymentMethodDropdown = '[data-test="payment-method"]';
  private readonly confirmPaymentButton = '[data-test="finish"]';
  private readonly orderConfirmation = '#order-confirmation';
  private readonly paymentSuccess = 'text="Payment was successful"';

  private getProductLocators(productName: string) {
    const baseLocator = cy.contains('span', productName).parent().parent();

    return {
      quantity: baseLocator.find('input[data-test="product-quantity"]'),
      unitPrice: baseLocator.find('span[data-test="product-price"]'),
      totalPrice: baseLocator.find('span[data-test="line-price"]'),
      deleteButton: baseLocator.find('a.btn.btn-danger svg[data-icon="xmark"]')
    };
  }

  async adjustProductQuantity(productName: string, newQuantity: number): Promise<void> {
    const locators = this.getProductLocators(productName);
    
    locators.quantity
      .should('be.visible')
      .clear()
      .type(newQuantity.toString())
      .trigger('input')  // Trigger Angular form update
      .trigger('ngModelChange') // Trigger Angular binding update
      .type('{enter}');

    // Wait for update confirmation
    cy.get(this.cartUpdateSuccess).should('be.visible');
    locators.totalPrice.should('be.visible');
    
  }

  async deleteProduct(productName: string): Promise<void> {
    const locators = this.getProductLocators(productName);
    
    locators.deleteButton
      .should('be.visible')
      .click();

    // Wait for delete confirmation
    cy.get('body').then($body => {
      if ($body.find(this.cartDeleteSuccess).length) {
        cy.get(this.cartDeleteSuccess).should('be.visible');
      }
    });

    // Verify product removal
    cy.contains('span[data-test="product-title"]', productName)
      .should('not.exist');
    
    
  }

  getProductPriceInfo(productName: string): Cypress.Chainable<{
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }> {
    const locators = this.getProductLocators(productName);
    
    return locators.unitPrice
      .invoke('text')
      .then(text => parseFloat(text.replace('$', '')))
      .then(unitPrice => {
        return locators.quantity
          .invoke('val')
          .then(Number)
          .then(quantity => {
            return locators.totalPrice
              .invoke('text')
              .then(text => parseFloat(text.replace('$', '')))
              .then(totalPrice => {
                return { unitPrice, quantity, totalPrice };
              });
          });
      });
  }

  getCartTotal(): Cypress.Chainable<number> {
    return cy.get(this.cartTotal)
      .invoke('text')
      .then(text => parseFloat(text.replace('$', '')));
  }

  async processToCompleteCheckoutPayment(paymentMethod: string): Promise<void> {
    const paymentValue = this.paymentOptions[paymentMethod];
    if (!paymentValue) {
      throw new Error(
        `Invalid payment method: ${paymentMethod}. Valid options are: ${Object.keys(this.paymentOptions).join(', ')}`
      );
    }

    // Process checkout steps with Angular-specific waiting
    cy.get(this.proceedToCheckoutButton1)
      .should('be.visible')
      .should('not.be.disabled')
      .click();
    

    cy.get(this.proceedToCheckoutButton2)
      .should('be.visible')
      .should('not.be.disabled')
      .click();
    

    cy.get(this.proceedToCheckoutButton3)
      .should('be.visible')
      .should('not.be.disabled')
      .click();
    

    // Select payment method with Angular form handling
    cy.get(this.paymentMethodDropdown)
      .select(paymentValue)
      .trigger('change')
      .trigger('ngModelChange');
    

    // Confirm payment
    cy.get(this.confirmPaymentButton)
      .should('be.visible')
      .should('not.be.disabled')
      .click();
    
    cy.get(this.paymentSuccess).should('be.visible');
    
    cy.get(this.confirmPaymentButton)
      .should('be.visible')
      .should('not.be.disabled')
      .click();
    
    
  }

  getInvoiceNumberFromConfirmation(): Cypress.Chainable<string | null> {
    return cy.get(this.orderConfirmation)
      .should('be.visible')
      .invoke('text')
      .then(text => {
        const match = text.match(/INV-\d+/);
        return match ? match[0] : null;
      });
  }
}