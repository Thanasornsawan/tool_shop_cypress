import BasePage from './BasePage';

export default class NavBarPage extends BasePage {
  private readonly accountMenu = '[data-test="nav-menu"]';
  private readonly myInvoicesLink = '[data-test="nav-my-invoices"]';
  private readonly cartIcon = '[data-test="nav-cart"]';

  async goToMyInvoices(): Promise<void> {
    cy.get(this.accountMenu)
      .should('be.visible')
      .click();

    cy.get(this.myInvoicesLink)
      .should('be.visible')
      .click();

    // Wait for navigation
    cy.url().should('include', '/invoices');
    
  }

  async goToCart(): Promise<void> {
    cy.get(this.cartIcon)
      .should('be.visible')
      .click();

    // Wait for navigation
    cy.url().should('include', '/checkout');
    
  }

  getUserName(): Cypress.Chainable<string> {
    return cy.get(this.accountMenu)
      .should('be.visible')
      .invoke('text')
      .then(text => text.trim());
  }
}