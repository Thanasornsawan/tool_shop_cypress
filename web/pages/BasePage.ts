export default abstract class BasePage {
    protected baseUrl: string;
  
    constructor() {
      this.baseUrl = Cypress.config().baseUrl || 'https://practicesoftwaretesting.com';
    }
  
    protected visit(path: string = ''): void {
      cy.visit(`${this.baseUrl}${path}`);
    }
  
    protected waitForPageLoad(): void {
      cy.intercept('**/*').as('pageLoad');
      cy.wait('@pageLoad');
      
    }
}