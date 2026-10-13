describe('Register', () => {
  const user = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@doe.com',
    password: 'test!1234',
  };

  // Remplit les 4 champs du formulaire
  const fillForm = () => {
    cy.get('input[formControlName=firstName]').type(user.firstName);
    cy.get('input[formControlName=lastName]').type(user.lastName);
    cy.get('input[formControlName=email]').type(user.email);
    cy.get('input[formControlName=password]').type(user.password);
  };

  beforeEach(() => {
    cy.visit('/register');
  });

  // Plan de test : Register – la création de compte
  it('should create an account and redirect to the login page', () => {
    cy.intercept('POST', '/api/auth/register', { statusCode: 200 }).as('register');

    fillForm();
    cy.get('button[type=submit]').click();

    cy.wait('@register').its('request.body').should('deep.equal', user);
    cy.url().should('include', '/login');
  });

  it('should display an error when the email is already taken', () => {
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 400,
      body: { message: 'Error: Email is already taken!' },
    }).as('register');

    fillForm();
    cy.get('button[type=submit]').click();
    cy.wait('@register');

    cy.contains('An error occurred').should('be.visible');
    cy.url().should('include', '/register');
  });

  // Plan de test : Register – erreur en l'absence d'un champ obligatoire
  it('should keep Submit disabled while a required field is empty', () => {
    cy.get('input[formControlName=firstName]').type(user.firstName);
    cy.get('input[formControlName=email]').type(user.email);
    cy.get('input[formControlName=password]').type(user.password);

    cy.get('button[type=submit]').should('be.disabled');
  });
});