import { LoginCredentials, LoginResponse, ErrorResponse } from '../interfaces/auth.interface';

const handleLoginResponse = (response: Cypress.Response<LoginResponse>, credentials?: LoginCredentials) => {
    if (response.status === 200) {
        Cypress.env('authToken', response.body.access_token);
        Cypress.env('tokenExpiry', Date.now() + (response.body.expires_in * 1000));
        if (credentials) {
            Cypress.env('credentials', credentials);
        }
    }
    return response;
};

Cypress.Commands.add('login', (credentials: LoginCredentials): Cypress.Chainable<Cypress.Response<LoginResponse>> => {
    return cy.request<LoginResponse>({
        method: 'POST',
        url: '/users/login',
        body: credentials,
        failOnStatusCode: false
    }).then(response => handleLoginResponse(response, credentials));
});

Cypress.Commands.add('refreshToken', (): Cypress.Chainable<Cypress.Response<LoginResponse>> => {
    const makeRefreshRequest = () => {
        const currentToken = Cypress.env('authToken');
        const storedCredentials = Cypress.env('credentials') as LoginCredentials;

        if (!currentToken && storedCredentials) {
            return cy.login(storedCredentials);
        }

        if (!currentToken) {
            return cy.request<LoginResponse>({
                method: 'POST',
                url: '/users/login',
                body: storedCredentials,
                failOnStatusCode: false
            });
        }

        return cy.request({
            method: 'GET',
            url: '/users/refresh',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            failOnStatusCode: false
        }).then((response: Cypress.Response<LoginResponse | ErrorResponse>) => {
            const storedCredentials = Cypress.env('credentials') as LoginCredentials;
            
            if ('message' in response.body && storedCredentials) {
                return cy.login(storedCredentials);
            }
            
            if (response.status === 200 && 'access_token' in response.body) {
                return cy.wrap(handleLoginResponse(response as Cypress.Response<LoginResponse>));
            }
            
            return cy.login(storedCredentials);
        });
    };

    return cy.wrap(null).then(makeRefreshRequest);
});

Cypress.Commands.add('ensureFreshToken', (): Cypress.Chainable<Cypress.Response<LoginResponse>> => {
    const checkToken = () => {
        const tokenExpiry = Cypress.env('tokenExpiry');
        const currentToken = Cypress.env('authToken');
        const storedCredentials = Cypress.env('credentials') as LoginCredentials;
        
        if (!currentToken && storedCredentials) {
            return cy.login(storedCredentials);
        }
        
        if (!tokenExpiry || Date.now() > tokenExpiry - 60000) {
            return cy.refreshToken();
        }
        
        return cy.request<LoginResponse>({
            method: 'GET',
            url: '/users/refresh',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            failOnStatusCode: false
        });
    };

    return cy.wrap(null).then(checkToken);
});

declare global {
    namespace Cypress {
        interface Chainable {
            login(credentials: LoginCredentials): Chainable<Response<LoginResponse>>;
            refreshToken(): Chainable<Response<LoginResponse>>;
            ensureFreshToken(): Chainable<Response<LoginResponse>>;
        }
    }
}