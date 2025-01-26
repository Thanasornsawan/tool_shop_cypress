import BasePage from './BasePage';

export default class InvoiceDetailPage extends BasePage {
  private readonly invoiceNumber = '[data-test="invoice-number"]';
  private readonly invoiceDate = '[data-test="invoice-date"]';
  private readonly paymentMethod = '[data-test="payment-method"]';
  private readonly downloadPdfButton = '[data-test="download-invoice"]';
  private readonly productTable = '.table';

  getInvoiceDetails() {
    return cy.get(this.invoiceNumber).invoke('val').then(invoiceNumber => {
      return cy.get(this.invoiceDate).invoke('val').then(date => {
        return cy.get(this.paymentMethod).invoke('val').then(paymentMethod => {
          return {
            invoiceNumber,
            date,
            paymentMethod
          };
        });
      });
    });
  }

  getProductDetails(productName: string) {
    return cy.contains(this.productTable + ' tr', productName)
      .find('td')
      .then($cells => ({
        quantity: parseInt($cells.eq(0).text()),
        name: $cells.eq(1).text(),
        unitPrice: parseFloat($cells.eq(2).text().replace('$', '')),
        totalPrice: parseFloat($cells.eq(3).text().replace('$', ''))
      }));
  }

  /**
   * Wait for the download button to be enabled
   */
  waitForDownloadButtonEnabled(): Cypress.Chainable<JQuery<HTMLElement>> {
    let attempt = 0; // Counter for attempts
    const maxAttempts = 10;
  
    const checkIfEnabled = (): Cypress.Chainable<JQuery<HTMLElement>> => {
      return cy.get(this.downloadPdfButton).then(($button) => {
        const isDisabled = $button.attr('disabled');
        
        if (isDisabled && attempt < maxAttempts) {
          attempt++; // Increment attempt counter
  
          // Log attempt
          cy.log(`Attempt ${attempt} - Button is still disabled, reloading the page...`);
  
          // Reload the page and wait for 2 seconds (adjust network idle wait here)
          cy.reload();
  
          // Wait for 6 seconds to ensure the page and network are stable
          cy.wait(6000);
  
          // Retry the check
          return checkIfEnabled(); // Ensure to return a Cypress.Chainable value here
        } else {
          // Button is enabled or max attempts reached
          if (attempt >= maxAttempts) {
            cy.log('Max attempts reached, exiting...');
          }
          expect($button).not.to.have.attr('disabled');
          return cy.wrap($button); // Return the button wrapped in Cypress.Chainable
        }
      });
    };
  
    return checkIfEnabled(); // Ensure to return the result of the recursive function
  }  

  /**
   * Download the invoice PDF
   * @returns Cypress.Chainable<string> - The name of the downloaded file
   */
  downloadPDF(invoiceNumber: string): Cypress.Chainable<string> {
    const filePath = `web/downloads/${invoiceNumber}.pdf`;

    // Wait for the download button to be enabled
    this.waitForDownloadButtonEnabled();

    // Click the download button and ensure the file exists
    cy.get(this.downloadPdfButton).click();

    return cy.readFile(filePath, { timeout: 10000 }).should('exist').then(() => {
      return `${invoiceNumber}.pdf`; // Return the file name
    });
  }
}