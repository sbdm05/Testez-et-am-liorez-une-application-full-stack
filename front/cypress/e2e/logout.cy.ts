describe('Logout and access control', () => {
  // Plan de test : Logout – la déconnexion de l'utilisateur
  it('should log the user out', () => {
    cy.login();

    cy.contains('span', 'Logout').click();

    cy.contains('Login').should('be.visible');
    cy.contains('Register').should('be.visible');
    cy.contains('Logout').should('not.exist');
  });

  it('should redirect to the login page when visiting /sessions while logged out', () => {
    cy.visit('/sessions');

    cy.url().should('include', '/login');
  });
});