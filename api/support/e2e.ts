import './commands/auth.commands';
import { API_CONFIG } from '../../config/api.config';

beforeEach(() => {
    cy.intercept('**/*', (req) => {
        // Set default headers
        req.headers = {
            ...req.headers,
            ...API_CONFIG.headers
        };

        // Add auth token if available
        const token = Cypress.env('authToken');
        if (token) {
            req.headers['Authorization'] = `Bearer ${token}`;
        }
    });
});