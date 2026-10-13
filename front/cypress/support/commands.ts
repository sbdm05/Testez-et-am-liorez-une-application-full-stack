// Déclare la commande pour TypeScript (autocomplétion de cy.login)
declare global {
  namespace Cypress {
    interface Chainable {
      login(options?: { admin?: boolean; sessions?: unknown[] }): Chainable<void>;
    }
  }
}

// Connecte un utilisateur en simulant la réponse du back
Cypress.Commands.add('login', ({ admin = true, sessions = [] } = {}) => {
  cy.intercept('POST', '/api/auth/login', {
    body: {
      token: 'fake-jwt',
      type: 'Bearer',
      id: 1,
      username: 'yoga@studio.com',
      firstName: 'Admin',
      lastName: 'Admin',
      admin,
    },
  }).as('login');
  cy.intercept('GET', '/api/session', sessions).as('sessions');

  cy.visit('/login');
  cy.get('input[formControlName=email]').type('yoga@studio.com');
  cy.get('input[formControlName=password]').type('test!1234');
  cy.get('button[type=submit]').click();
  cy.wait('@login');
  cy.url().should('include', '/sessions');
});

export {};