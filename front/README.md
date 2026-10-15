# Yoga App — Back-end

API REST de l'application Yoga App, sécurisée par JWT : gestion des utilisateurs, des professeurs, des sessions de yoga et des inscriptions aux sessions.

## Prérequis

- JDK 21
- Maven 3.9
- Docker Desktop

## Installation et lancement

Depuis le dossier `back/` :

```bash
# 1. Installer les dépendances
mvn clean install -DskipTests

# 2. Démarrer la base MySQL (configurée via .env)
docker compose up -d

# 3. Lancer l'API
mvn spring-boot:run
```

L'API est disponible sur `http://localhost:8080/api`.

### Compte administrateur

Exécuter le script `src/main/resources/sql/insert_user.sql` dans la base MySQL, puis se connecter avec :

- email : `yoga@studio.com`
- mot de passe : `test!1234`

## Structure du projet

```text
src/main/java/com/openclassrooms/starterjwt/
├── controllers/   # API REST
├── services/      # logique métier
├── repository/    # accès aux données (Spring Data JPA)
├── models/        # entités JPA
├── dto/, mapper/  # objets échangés avec le front et conversion (MapStruct)
├── exception/     # exceptions métier et handler global
└── security/      # Spring Security et JWT
```

## Tests

Les tests utilisent une base H2 en mémoire : ni Docker ni MySQL ne sont nécessaires.

```bash
# Tous les tests + rapport + contrôle des 80 % de couverture
mvn clean verify

# Un seul fichier de test
mvn test -Dtest=SessionControllerIntegrationTest
```

- **Tests unitaires** (`src/test/.../services`) : JUnit 5 + Mockito.
- **Tests d'intégration** (`src/test/.../controllers`) : `@SpringBootTest` + MockMvc + H2.

43 tests, dont 32,6 % de tests d'intégration.

## Couverture

Rapport : `target/site/jacoco/index.html`

| Instructions | Branches | Lignes | Méthodes |
|---|---|---|---|
| 90 % | 91 % | 91 % | 92 % |

Sont exclus du calcul : les DTO, le code généré par MapStruct et Lombok, et la classe principale Spring Boot.