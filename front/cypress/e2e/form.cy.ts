describe('Session form', () => {
  const teachers = [
    { id: 1, firstName: 'Sophie', lastName: 'Durand' },
    { id: 2, firstName: 'Jess', lastName: 'Doe' },
  ];
  const session = {
    id: 1,
    name: 'Yoga doux',
    description: 'Séance pour débutants',
    date: '2026-10-10',
    teacher_id: 2,
    users: [],
  };

  beforeEach(() => {
    cy.intercept('GET', '/api/teacher', teachers);
  });

  // --- Création -------------------------------------------------------------

  const openCreateForm = () => {
    cy.login({ admin: true, sessions: [session] });
    cy.contains('button', 'Create').click();
    cy.contains('Create session').should('be.visible');
  };

  // Plan de test : Création session – la session est créée
  it('should create a session', () => {
    openCreateForm();
    cy.intercept('POST', '/api/session', { statusCode: 200, body: { ...session, id: 2 } }).as('create');

    cy.get('input[formControlName=name]').type('Vinyasa');
    cy.get('input[formControlName=date]').type('2026-11-01');
    cy.get('mat-select[formControlName=teacher_id]').click();
    cy.contains('mat-option', 'Sophie Durand').click();
    cy.get('textarea[formControlName=description]').type('Séance dynamique');
    cy.get('button[type=submit]').click();

    cy.wait('@create').its('request.body').should('deep.equal', {
      name: 'Vinyasa',
      date: '2026-11-01',
      teacher_id: 1,
      description: 'Séance dynamique',
    });
    cy.contains('Session created !').should('be.visible');
    cy.url().should('match', /\/sessions$/);
  });

  // Plan de test : Création session – erreur en l'absence d'un champ obligatoire
  it('should keep Save disabled while a required field is empty', () => {
    openCreateForm();

    cy.get('input[formControlName=name]').type('Vinyasa');
    cy.get('input[formControlName=date]').type('2026-11-01');

    cy.get('button[type=submit]').should('be.disabled');
  });

  // --- Modification ---------------------------------------------------------

  const openUpdateForm = () => {
    cy.login({ admin: true, sessions: [session] });
    cy.intercept('GET', '/api/session/1', session).as('detail');
    cy.contains('button', 'Edit').click();
    cy.wait('@detail');
    cy.contains('Update session').should('be.visible');
  };

  // Plan de test : Modification session – la session est modifiée
  it('should prefill the form and update the session', () => {
    openUpdateForm();
    cy.intercept('PUT', '/api/session/1', { statusCode: 200, body: session }).as('update');

    cy.get('input[formControlName=name]').should('have.value', 'Yoga doux');
    cy.get('input[formControlName=name]').clear().type('Yoga très doux');
    cy.get('button[type=submit]').click();

    cy.wait('@update').its('request.body').should('deep.equal', {
      name: 'Yoga très doux',
      date: '2026-10-10',
      teacher_id: 2,
      description: 'Séance pour débutants',
    });
    cy.contains('Session updated !').should('be.visible');
    cy.url().should('match', /\/sessions$/);
  });

  // Plan de test : Modification session – erreur en l'absence d'un champ obligatoire
  it('should disable Save when a required field is cleared', () => {
    openUpdateForm();

    cy.get('textarea[formControlName=description]').clear();

    cy.get('button[type=submit]').should('be.disabled');
  });
});