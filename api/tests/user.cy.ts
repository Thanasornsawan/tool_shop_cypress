import { LoginCredentials } from '../support/interfaces/auth.interface';

describe('User API', () => {
    let authData: {
        validAdmin: LoginCredentials;
    };

    beforeEach(() => {
        cy.fixture('auth').then((data) => {
            authData = data;
            return cy.login(authData.validAdmin);
        });
    });

    it('should get current user details', () => {
        cy.request({
            method: 'GET',
            url: '/users/me',
            headers: {
                'Authorization': `Bearer ${Cypress.env('authToken')}`
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('email');
            expect(response.body.email).to.eq(authData.validAdmin.email);
        });
    });

    it('should handle unauthorized access without token', () => {
        Cypress.env('authToken', null);
        cy.request({
            method: 'GET',
            url: '/users/me',
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(401);
        });
    });

    it('should handle expired token automatically', () => {
        Cypress.env('tokenExpiry', Date.now() - 1000);
        
        cy.refreshToken().then(() => {
            cy.request({
                method: 'GET',
                url: '/users/me',
                headers: {
                    'Authorization': `Bearer ${Cypress.env('authToken')}`
                }
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property('email');
            });
        });
    });
});