import { LoginCredentials } from '../support/interfaces/auth.interface';

describe('User API', () => {
    let authData: {
        validAdmin: LoginCredentials;
    };

    before(() => {
        cy.fixture('auth').then((data) => {
            authData = data;
            cy.login(authData.validAdmin);
        });
    });

    beforeEach(() => {
        cy.ensureFreshToken();
    });

    it('should get current user details', () => {
        const token = Cypress.env('authToken');
        cy.request({
            method: 'GET',
            url: '/users/me',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('email');
            expect(response.body.email).to.eq(authData.validAdmin.email);
            expect(response.body).to.have.property('role');
            expect(response.body.role).to.eq('admin');
        });
    });

    it('should handle unauthorized access without token', () => {
        cy.request({
            method: 'GET',
            url: '/users/me',
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(401);
        });
    });

    it('should handle expired token automatically', () => {
        // Force token expiry
        Cypress.env('tokenExpiry', Date.now() - 1000);

        const token = Cypress.env('authToken');
        cy.request({
            method: 'GET',
            url: '/users/me',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('email');
            expect(response.body.email).to.eq(authData.validAdmin.email);
        });
    });
});