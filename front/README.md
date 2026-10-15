# Yoga App — Front-end

Front Angular de l'application Yoga App : inscription et connexion, liste et détail des sessions, participation aux sessions, gestion des sessions (administrateur) et page de compte.

## Prérequis

- Node.js 22
- npm

## Installation et lancement

Depuis le dossier `front/` :

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer l'application
npm run start
```

L'application est disponible sur `http://localhost:4200`.

Les appels `/api` sont redirigés vers le back (`http://localhost:8080`) par le proxy Angular : lancer d'abord le back (voir `back/README.md`).

## Tests

### Tests unitaires et d'intégration (Jest)

```bash
# Tous les tests
npm run test

# Mode watch
npm run test:watch

# Avec le rapport de couverture
npm run test -- --coverage
```

Les tests se trouvent à côté des fichiers testés : `src/app/**/*.spec.ts`.

106 tests, dont 30,2 % de tests d'intégration.

### Tests end-to-end (Cypress)

Les tests e2e simulent le back avec `cy.intercept` : il n'est pas nécessaire de lancer l'API.

```bash
# Mode interactif
npm run e2e

# Mode headless
npm run e2e:ci

# Générer le rapport de couverture (après une exécution des tests e2e)
npm run e2e:coverage
```

Les tests se trouvent dans `cypress/e2e/` : 29 tests répartis dans 7 fichiers.

## Couverture

| Rapport | Emplacement |
|---|---|
| Jest | `coverage/lcov-report/index.html` |
| Cypress | `coverage-e2e/lcov-report/index.html` |

| Tests | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| Jest | 100 % | 100 % | 100 % | 100 % |
| Cypress | 97,8 % | 92,3 % | 98,7 % | 97,6 % |