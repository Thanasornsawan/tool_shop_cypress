import BasePage from './BasePage';
import paymentData from '@fixtures/paymentData.json';

export default class CartPage extends BasePage {
  private readonly paymentOptions = paymentData.paymentOptions;
  private readonly cartTable = '.table.table-hover';
  private readonly cartUpdateSuccess = 'div[role="alert"]:contains("Product quantity updated.")';
  private readonly cartDeleteSuccess = 'div[role="alert"]:contains("Product deleted.")';
  private readonly cartTotal = '//td[@data-test="cart-total"]';
  private readonly proceedToCheckoutButton1 = '[data-test="proceed-1"]';
  private readonly proceedToCheckoutButton2 = '[data-test="proceed-2"]';
  private readonly proceedToCheckoutButton3 = '[data-test="proceed-3"]';
  private readonly paymentMethodDropdown = '[data-test="payment-method"]';
  private readonly confirmPaymentButton = '[data-test="finish"]';
  private readonly orderConfirmation = '#order-confirmation';
  private readonly paymentSuccess = '//div[text()="Payment was successful"]';
  private readonly productTitle = 'span[data-test="product-title"]';
  private readonly productPrice = 'span[data-test="product-price"]';
  private readonly productQuantity = 'input[data-test="product-quantity"]';
  private readonly productTotalPrice = 'span[data-test="line-price"]';

  async adjustProductQuantity(productName: string, newQuantity: number): Promise<void> {
    cy.contains(this.productTitle, productName)
      .parents('tr')
      .find(this.productQuantity)
      .clear()
      .type(newQuantity.toString())
      .trigger('input')
      .trigger('ngModelChange')
      .type('{enter}');
   
    // Wait for update confirmation to appear
    cy.get(this.cartUpdateSuccess).should('be.visible');
    
    // Add a small wait for Angular update
    cy.wait(1000);
   
    cy.contains(this.productTitle, productName)
      .parents('tr')
      .find(this.productTotalPrice)
      .should('be.visible');
   }

  async deleteProduct(productName: string): Promise<void> {
    // Find and click delete button directly
    cy.contains(this.productTitle, productName)
      .parents('tr')
      .find('.btn-danger')
      .click();
   
    // Verify deletion
    cy.get('body').then($body => {
      if ($body.find(this.cartDeleteSuccess).length) {
        cy.get(this.cartDeleteSuccess).should('be.visible');
      }
    });
   
    cy.contains(this.productTitle, productName).should('not.exist');
   }

  getProductPriceInfo(productName: string): Cypress.Chainable<{
    name: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
   }> {
    const result = {
      name: '',
      unitPrice: 0,
      quantity: 0,
      totalPrice: 0
    };
   
    return cy.contains(this.productTitle, productName)
      .parents('tr')
      .within(() => {
        cy.get(this.productTitle)
          .invoke('text')
          .then(text => {
            result.name = text.trim();
          });
   
        cy.get(this.productPrice)
          .invoke('text')
          .then(text => {
            result.unitPrice = parseFloat(text.replace('$', ''));
            cy.log('unitPrice:', result.unitPrice);
          });
   
        cy.get(this.productQuantity)
          .invoke('val')
          .then(val => {
            result.quantity = Number(val);
            cy.log('quantity:', result.quantity);
          });
   
        cy.get(this.productTotalPrice)
          .invoke('text')
          .then(text => {
            result.totalPrice = parseFloat(text.replace('$', ''));
            cy.log('totalPrice:', result.totalPrice);
          });
      })
      .then(() => result);
   }

  getCartTotal(): Cypress.Chainable<number> {
    return cy.xpath(this.cartTotal)
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
    
    cy.xpath(this.paymentSuccess).should('be.visible');
    
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