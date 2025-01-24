import BasePage from './BasePage';

export default class LoginPage extends BasePage {
  private readonly emailInput = '[data-test="email"]';
  private readonly passwordInput = '[data-test="password"]';
  private readonly loginButton = '[data-test="login-submit"]';

  async login(email: string, password: string): Promise<void> {
    cy.get(this.emailInput)
      .should('be.visible')
      .clear()
      .type(email)
      .trigger('input');

    cy.get(this.passwordInput)
      .should('be.visible')
      .clear()
      .type(password)
      .trigger('input');

    cy.get(this.loginButton)
      .should('be.visible')
      .should('not.be.disabled')
      .click();

    // Wait for successful login and navigation
    cy.url().should('include', '/account');
    
  }
}