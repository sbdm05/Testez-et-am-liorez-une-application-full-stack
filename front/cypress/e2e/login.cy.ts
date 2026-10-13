describe('Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  // Plan de test : Login – la connexion
  it('should log in and redirect to the sessions page', () => {
    cy.login();

    cy.contains('Logout').should('be.visible');
    cy.contains('Account').should('be.visible');
  });

  // Plan de test : Login – erreur en cas de mauvais login / password
  it('should display an error with wrong credentials', () => {
    cy.intercept('POST', '/api/auth/login', { statusCode: 401 }).as('login');

    cy.get('input[formControlName=email]').type('yoga@studio.com');
    cy.get('input[formControlName=password]').type('wrong{enter}');
    cy.wait('@login');

    cy.contains('An error occurred').should('be.visible');
    cy.url().should('include', '/login');
  });

  // Plan de test : Login – erreur en l'absence d'un champ obligatoire
  it('should keep Submit disabled when the password is missing', () => {
    cy.get('input[formControlName=email]').type('yoga@studio.com');

    cy.get('button[type=submit]').should('be.disabled');
  });

  it('should keep Submit disabled when the email format is invalid', () => {
    cy.get('input[formControlName=email]').type('not-an-email');
    cy.get('input[formControlName=password]').type('test!1234');

    cy.get('button[type=submit]').should('be.disabled');
  });

  it('should toggle the password visibility', () => {
    cy.get('input[formControlName=password]').should('have.attr', 'type', 'password');
    cy.get('button[mat-icon-button]').click();
    cy.get('input[formControlName=password]').should('have.attr', 'type', 'text');
  });
});