import 'cypress-real-events';
import './commands';
import addContext from 'mochawesome/addContext';
require('@cypress/xpath');

Cypress.on('uncaught:exception', () => false);

declare global {
  namespace Cypress {
    interface Chainable {
      addTestContext(value: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('addTestContext', (context: string) => {
  cy.once('test:after:run', (test) => addContext({ test }, context));
});

afterEach(function() {
    const test = this.currentTest;
    const screenshotName = `${test.fullTitle().replace(/\s+/g, '_')}`;
    const specFile = Cypress.spec.name;
    
    cy.screenshot(screenshotName, {
      capture: 'fullPage',  // Changed to fullPage
      overwrite: true,
      scale: false  // Disable scaling
    });
    cy.addTestContext(`./assets/${specFile}/${screenshotName}.png`);
  });