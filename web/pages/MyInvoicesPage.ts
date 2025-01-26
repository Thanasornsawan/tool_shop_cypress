import BasePage from './BasePage';

export default class MyInvoicesPage extends BasePage {
  private readonly invoiceNumberCell = (invoiceNumber: string) => `//td[text()="${invoiceNumber}"]`;
  private readonly invoiceAddressCell = (invoiceNumber: string) => `//td[text()="${invoiceNumber}"]/parent::tr/td[2]`;
  private readonly invoiceDateCell = (invoiceNumber: string) => `//td[text()="${invoiceNumber}"]/parent::tr/td[3]`;
  private readonly invoiceTotalCell = (invoiceNumber: string) => `//td[text()="${invoiceNumber}"]/parent::tr/td[4]`;
  private readonly invoiceDetailsButton = (invoiceNumber: string) => `//td[text()="${invoiceNumber}"]/parent::tr/td[5]/a[text()="Details"]`;

  getInvoiceData(invoiceNumber: string): Cypress.Chainable<{
    invoiceNumber: string;
    address: string;
    date: string;
    total: string;
  }> {
    return cy.then(() => {
      return cy.xpath(this.invoiceAddressCell(invoiceNumber)).invoke('text').then(address => {
        return cy.xpath(this.invoiceDateCell(invoiceNumber)).invoke('text').then(date => {
          return cy.xpath(this.invoiceTotalCell(invoiceNumber)).invoke('text').then(total => {
            return {
              invoiceNumber,
              address,
              date,
              total
            };
          });
        });
      });
    });
  }

  viewInvoiceDetails(invoiceNumber: string): Cypress.Chainable {
    cy.xpath(this.invoiceDetailsButton(invoiceNumber))
      .should('be.visible')
      .click();
    return cy.url().should('include', '/invoice');
  }
}