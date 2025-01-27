import './commands/auth.commands';
import { API_CONFIG } from '../../config/api.config';
import addContext from 'mochawesome/addContext';

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

// Store the last API response
let lastApiResponse: any = null;

afterEach(function () {
    const testName = this.currentTest.fullTitle().replace(/\s+/g, '_');
    if (lastApiResponse) {
        cy.addTestContext(`Response for ${testName}:\n${JSON.stringify(lastApiResponse, null, 2)}`);
    }
});

beforeEach(() => {
    // Reset last response
    lastApiResponse = null;

    // Add default headers
    cy.intercept('**/*', (req) => {
        req.headers = {
            ...req.headers,
            ...API_CONFIG.headers
        };

        const token = Cypress.env('authToken');
        if (token) {
            req.headers['Authorization'] = `Bearer ${token}`;
        }
    });

    // Capture API responses
    cy.intercept('**/*', (req) => {
        req.on('response', (res) => {
            lastApiResponse = {
                status: res.statusCode,
                body: res.body,
                headers: res.headers
            };
        });
    });
});