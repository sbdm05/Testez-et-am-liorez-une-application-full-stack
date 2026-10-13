describe('Sessions list', () => {
  const sessions = [
    { id: 1, name: 'Yoga doux', description: 'Pour débutants', date: '2026-10-10', teacher_id: 1, users: [] },
    { id: 2, name: 'Vinyasa', description: 'Dynamique', date: '2026-10-12', teacher_id: 2, users: [] },
  ];

  // Plan de test : Sessions – affichage de la liste
  it('should display every session', () => {
    cy.login({ sessions });

    cy.get('mat-card.item').should('have.length', 2);
    cy.contains('Yoga doux').should('be.visible');
    cy.contains('Pour débutants').should('be.visible');
    cy.contains('Vinyasa').should('be.visible');
  });

  // Plan de test : Sessions – boutons Create et Detail si admin
  it('should show Create, Detail and Edit buttons to an admin', () => {
    cy.login({ admin: true, sessions });

    cy.contains('button', 'Create').should('be.visible');
    cy.get('mat-card.item').each(card => {
      cy.wrap(card).contains('button', 'Detail').should('be.visible');
      cy.wrap(card).contains('button', 'Edit').should('be.visible');
    });
  });

  it('should hide Create and Edit buttons from a non-admin', () => {
    cy.login({ admin: false, sessions });

    cy.contains('button', 'Create').should('not.exist');
    cy.contains('button', 'Edit').should('not.exist');
    cy.get('mat-card.item').first().contains('button', 'Detail').should('be.visible');
  });

  it('should open the detail page when clicking Detail', () => {
    cy.login({ sessions });
    cy.intercept('GET', '/api/session/1', sessions[0]);
    cy.intercept('GET', '/api/teacher/1', { id: 1, firstName: 'Sophie', lastName: 'Durand' });

    cy.get('mat-card.item').first().contains('button', 'Detail').click();

    cy.url().should('include', '/sessions/detail/1');
  });

  it('should open the creation form when an admin clicks Create', () => {
    cy.login({ admin: true, sessions });
    cy.intercept('GET', '/api/teacher', []);

    cy.contains('button', 'Create').click();

    cy.url().should('include', '/sessions/create');
  });
});