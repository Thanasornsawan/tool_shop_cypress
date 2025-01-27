import { LoginCredentials } from '../support/interfaces/auth.interface';

describe('Authentication API', () => {
    let authData: {
        validAdmin: LoginCredentials;
        invalidCredentials: LoginCredentials;
    };

    before(() => {
        cy.fixture('auth').then((data) => {
            authData = data;
        });
    });

    beforeEach(() => {
        // Clear any existing token before each test
        Cypress.env('authToken', null);
        Cypress.env('tokenExpiry', null);
        Cypress.env('credentials', null);
    });

    it('should successfully login with valid credentials', () => {
        cy.login(authData.validAdmin).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('access_token');
            expect(response.body.token_type).to.eq('bearer');
            expect(response.body.expires_in).to.eq(300);
            expect(Cypress.env('authToken')).to.be.a('string');
        });
    });

    it('should fail to login with invalid credentials', () => {
        cy.login(authData.invalidCredentials).then((response) => {
            expect(response.status).to.eq(401);
            expect(response.body).to.have.property('error');
            expect(response.body.error).to.equal('Unauthorized');
            expect(Cypress.env('authToken')).to.be.null;
        });
    });

    it('should successfully refresh token', () => {
        cy.login(authData.validAdmin).then(() => {
            cy.refreshToken().then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property('access_token');
                expect(response.body.token_type).to.eq('bearer');
                expect(response.body.expires_in).to.eq(300);
                expect(Cypress.env('authToken')).to.not.eq(null);
            });
        });
    });

    it('should handle expired token by auto re-login', () => {
        cy.login(authData.validAdmin).then(() => {
            // Force token expiry
            Cypress.env('tokenExpiry', Date.now() - 1000);
            
            cy.refreshToken().then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property('access_token');
                expect(Cypress.env('authToken')).to.not.eq(null);
            });
        });
    });

    it('should maintain token freshness with ensureFreshToken', () => {
        cy.login(authData.validAdmin).then((loginResponse) => {
            const initialToken = loginResponse.body.access_token;
            
            // Force token to be near expiry
            Cypress.env('tokenExpiry', Date.now() + 30000); // 30 seconds until expiry
            
            cy.ensureFreshToken().then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.access_token).to.not.eq(initialToken);
                expect(Cypress.env('authToken')).to.not.eq(initialToken);
            });
        });
    });
});