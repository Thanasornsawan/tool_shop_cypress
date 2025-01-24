import BasePage from './BasePage';

interface UserData {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  email: string;
  password: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export default class RegisterPage extends BasePage {
  private readonly firstNameInput = '[data-test="first-name"]';
  private readonly lastNameInput = '[data-test="last-name"]';
  private readonly dateOfBirthInput = '[data-test="dob"]';
  private readonly emailInput = '[data-test="email"]';
  private readonly passwordInput = '[data-test="password"]';
  private readonly addressInput = '[data-test="address"]';
  private readonly cityInput = '[data-test="city"]';
  private readonly stateInput = '[data-test="state"]';
  private readonly postalCodeInput = '[data-test="postcode"]';
  private readonly countrySelect = '[data-test="country"]';
  private readonly phoneInput = '[data-test="phone"]';
  private readonly submitButton = '[data-test="register-submit"]';

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  async registerUser(userData: UserData): Promise<void> {
    cy.visit('/auth/register');
    

    // Fill form with Angular-specific event handling
    cy.get(this.firstNameInput)
      .type(userData.firstName)
      .trigger('input')
      .trigger('blur');

    cy.get(this.lastNameInput)
      .type(userData.lastName)
      .trigger('input')
      .trigger('blur');

    if (userData.dateOfBirth) {
      const formattedDate = this.formatDateForInput(userData.dateOfBirth);
      cy.get(this.dateOfBirthInput)
        .type(formattedDate)
        .trigger('input')
        .trigger('blur');
    }

    cy.get(this.emailInput)
      .type(userData.email)
      .trigger('input')
      .trigger('blur');

    cy.get(this.passwordInput)
      .type(userData.password)
      .trigger('input')
      .trigger('blur');

    cy.get(this.addressInput)
      .type(userData.address)
      .trigger('input')
      .trigger('blur');

    cy.get(this.cityInput)
      .type(userData.city)
      .trigger('input')
      .trigger('blur');

    cy.get(this.stateInput)
      .type(userData.state)
      .trigger('input')
      .trigger('blur');

    cy.get(this.postalCodeInput)
      .type(userData.postalCode)
      .trigger('input')
      .trigger('blur');

    cy.get(this.countrySelect)
      .select(userData.country)
      .trigger('change')
      .trigger('ngModelChange');

    cy.get(this.phoneInput)
      .type(userData.phone)
      .trigger('input')
      .trigger('blur');

    // Submit form
    cy.get(this.submitButton)
      .should('be.visible')
      .should('not.be.disabled')
      .click();

    // Wait for navigation
    cy.url().should('include', '/auth/login');
    
  }
}