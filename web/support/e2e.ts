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

  cy.screenshot(screenshotName, {
    capture: 'fullPage',  // Changed to fullPage
    overwrite: true,
    scale: false  // Disable scaling
  });
  cy.addTestContext(`./assets/${specFile}/${screenshotName}.png`);
});

beforeEach(function () {
  const globalTag = Cypress.env('TAG') || '';  // Set the tag to an environment variable or an empty string by default
  cy.log('Running tests with tag:', globalTag);
  cy.wrap(globalTag).as('globalTag');  // Store the global tag
});

Cypress.on('test:before:run', (test) => {
  const globalTag = Cypress.env('TAG') || '';  // Fetch the global tag
  const testTags = test.title.match(/@[\w-]+/g);  // Find any tags in the test title, e.g., @smoke

  if (testTags && testTags.length > 0) {
    const hasMatchingTag = testTags.some(tag => tag === globalTag);  // Check if the test has the global tag

    if (!hasMatchingTag) {
      test.skip();  // Skip the test if the tag does not match
    }
  }
});

