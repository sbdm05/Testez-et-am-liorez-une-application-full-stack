describe('Account page', () => {
  const buildUser = (admin: boolean) => ({
    id: 1,
    email: 'yoga@studio.com',
    firstName: 'John',
    lastName: 'Doe',
    admin,
    createdAt: '2026-01-01',
    updatedAt: '2026-02-01',
  });

  // Se connecte puis ouvre la page Account via la barre de navigation
  const openAccount = (admin: boolean) => {
    cy.login({ admin });
    cy.intercept('GET', '/api/user/1', buildUser(admin)).as('user');
    cy.contains('span', 'Account').click();
    cy.wait('@user');
  };

  // Plan de test : Account – affichage des informations de l'utilisateur
  it('should display the user information', () => {
    openAccount(false);

    cy.contains('John DOE').should('be.visible');           // pipe uppercase
    cy.contains('yoga@studio.com').should('be.visible');
    cy.contains('Delete my account').should('be.visible');
  });

  it('should show "You are admin" and no delete button to an admin', () => {
    openAccount(true);

    cy.contains('You are admin').should('be.visible');
    cy.contains('Delete my account').should('not.exist');
  });

  it('should delete the account, log out and go back home', () => {
    openAccount(false);
    cy.intercept('DELETE', '/api/user/1', { statusCode: 200 }).as('deleteUser');

    cy.contains('button', 'delete').click();

    cy.wait('@deleteUser');
    cy.contains('Your account has been deleted !').should('be.visible');
    cy.contains('Login').should('be.visible');               // l'utilisateur est déconnecté
  });

  it('should go back with the back arrow', () => {
    openAccount(false);

    cy.contains('button', 'arrow_back').click();

    cy.url().should('match', /\/sessions$/);
  });
});