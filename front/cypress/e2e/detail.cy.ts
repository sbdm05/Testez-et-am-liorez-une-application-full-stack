describe('Session detail', () => {
  const session = {
    id: 1,
    name: 'yoga doux',
    description: 'Séance pour débutants',
    date: '2026-10-10',
    teacher_id: 2,
    users: [] as number[],
    createdAt: '2026-01-01',
    updatedAt: '2026-02-01',
  };
  const teacher = { id: 2, firstName: 'Sophie', lastName: 'Durand' };

  // Se connecte, puis ouvre la page de détail de la session
  const openDetail = (admin: boolean, users: number[] = []) => {
    cy.login({ admin, sessions: [session] });
    cy.intercept('GET', '/api/session/1', { ...session, users }).as('detail');
    cy.intercept('GET', '/api/teacher/2', teacher);

    cy.contains('button', 'Detail').click();
    cy.wait('@detail');
  };

  // Plan de test : Informations session – les informations sont correctement affichées
  it('should display the session information', () => {
    openDetail(false, [1, 3]);

    cy.contains('Yoga Doux').should('be.visible');           // pipe titlecase
    cy.contains('Séance pour débutants').should('be.visible');
    cy.contains('Sophie DURAND').should('be.visible');       // pipe uppercase
    cy.contains('2 attendees').should('be.visible');
  });

  // Plan de test : Informations session – bouton Delete si admin
  it('should show the Delete button and no Participate button to an admin', () => {
    openDetail(true);

    cy.contains('button', 'Delete').should('be.visible');
    cy.contains('button', 'Participate').should('not.exist');
  });

  // Plan de test : Suppression session – la session est correctement supprimée
  it('should delete the session and go back to the list', () => {
    openDetail(true);
    cy.intercept('DELETE', '/api/session/1', { statusCode: 200 }).as('delete');

    cy.contains('button', 'Delete').click();

    cy.wait('@delete');
    cy.contains('Session deleted !').should('be.visible');   // message MatSnackBar
    cy.url().should('match', /\/sessions$/);
  });

  it('should let a non-admin participate', () => {
    openDetail(false, []);
    cy.contains('button', 'Delete').should('not.exist');
    cy.intercept('POST', '/api/session/1/participate/1', { statusCode: 200 }).as('participate');
    // Après l'inscription, la page recharge la session : l'utilisateur 1 y figure
    cy.intercept('GET', '/api/session/1', { ...session, users: [1] });

    cy.contains('button', 'Participate').click();

    cy.wait('@participate');
    cy.contains('button', 'Do not participate').should('be.visible');
    cy.contains('1 attendees').should('be.visible');
  });

  it('should let a participant unsubscribe', () => {
    openDetail(false, [1]);
    cy.intercept('DELETE', '/api/session/1/participate/1', { statusCode: 200 }).as('unParticipate');
    cy.intercept('GET', '/api/session/1', { ...session, users: [] });

    cy.contains('button', 'Do not participate').click();

    cy.wait('@unParticipate');
    cy.contains('button', 'Participate').should('be.visible');
    cy.contains('0 attendees').should('be.visible');
  });

  it('should go back to the list with the back arrow', () => {
    openDetail(false);

    cy.contains('button', 'arrow_back').click();

    cy.url().should('match', /\/sessions$/);
  });
});