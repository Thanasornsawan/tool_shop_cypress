import 'cypress-real-events';
import './commands';
import addContext from 'mochawesome/addContext';
import 'cypress-plugin-steps';
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

afterEach(function () {
  const test = this.currentTest;
  const screenshotName = `${test.fullTitle().replace(/\s+/g, '_')}`;
  const specFile = Cypress.spec.name;

  if (!Cypress.env('type') || Cypress.env('type') === 'web') {
    cy.screenshot(screenshotName, {
      capture: 'fullPage',
      overwrite: true,
      scale: false
    });
    cy.addTestContext(`./assets/${specFile}/${screenshotName}.png`);
  }
});
