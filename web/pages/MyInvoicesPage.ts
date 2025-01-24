import BasePage from './BasePage';

export default class MyInvoicesPage extends BasePage {
  private readonly invoicesTable = 'table';

  getInvoiceData(invoiceNumber: string): Cypress.Chainable<{
    invoiceNumber: string;
    address: string;
    date: string;
    total: string;
  }> {
    return cy.contains('tbody tr td', invoiceNumber)
      .parent('tr')
      .find('td')
      .should('have.length.at.least', 4)
      .then($cells => ({
        invoiceNumber: $cells.eq(0).text(),
        address: $cells.eq(1).text(),
        date: $cells.eq(2).text(),
        total: $cells.eq(3).text()
      }));
  }

  async viewInvoiceDetails(invoiceNumber: string): Promise<void> {
    cy.contains(`td:contains("${invoiceNumber}")`)
      .parent('tr')
      .find('a:contains("Details")')
      .should('be.visible')
      .click();

    // Wait for navigation
    cy.url().should('include', '/invoice');
    
  }
}