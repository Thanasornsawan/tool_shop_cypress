// web/support/commands.ts
/// <reference types="cypress" />
/// <reference types="cypress-real-events" />

export {};

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      getByTestId(dataTestId: string): Chainable<JQuery<HTMLElement>>;
      verifyPdfContent(pdfPath: string, expectedContent: Record<string, any>): Chainable<void>;
      forceType(text: string, options?: Partial<TypeOptions>): Chainable<Subject>;
    }
  }
}

type ScrollBehaviorOption = 'center' | 'top' | 'bottom' | 'nearest';

interface OptionObject {
  scrollBehavior?: ScrollBehaviorOption;
  pointerStateCheck?: boolean;
  position?: 'topLeft' | 'top' | 'topRight' | 'left' | 'center' | 'right' | 'bottomLeft' | 'bottom' | 'bottomRight';
}

Cypress.Commands.add('forceType', { prevSubject: 'element' }, (subject, text, options = {}) => {
    return cy.wrap(subject)
      .invoke('val', text)
      .trigger('input')
      .trigger('change')
      .type(text, { delay: 100, ...options });
  });

Cypress.Commands.overwrite<'realMouseMove'>(
    'realMouseMove',
    (
      originalFn: Function,
      ...args: any[]
    ) => {
      const defaultOptions: OptionObject = {
        scrollBehavior: 'nearest',
        pointerStateCheck: true
      };
  
      const [subject, xOrOptions, y, options] = args;
  
      if (typeof xOrOptions === 'number' && typeof y === 'number') {
        const combinedOptions: OptionObject = {
          ...options,
          ...defaultOptions
        };
        return originalFn(subject, xOrOptions, y, combinedOptions);
      }
  
      const combinedOptions: OptionObject = {
        ...(xOrOptions as OptionObject),
        ...defaultOptions
      };
      return originalFn(subject, combinedOptions);
    }
);

Cypress.Commands.add('getByTestId', (dataTestId: string) => {
  return cy.get(`[data-test="${dataTestId}"]`);
});