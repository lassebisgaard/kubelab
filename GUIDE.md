# Kubelab Guide

## Hurtig Start
### Forudsætninger
- Node.js installeret
- Git installeret
- Docker Desktop installeret og kørende

### Database Setup
1. Opret en ny database kaldet `Kubelab` i MySQL
   - Via phpMyAdmin:
     - Åbn phpMyAdmin
     - Klik "Ny" i venstre sidebar
     - Indtast `Kubelab` som databasenavn
     - Vælg `utf8mb4_general_ci` som collation
     - Klik "Opret"
2. Importér database struktur og data
   - Find `Kubelab.sql` i projektets rod
   - I phpMyAdmin, vælg den nye `Kubelab` database
   - Gå til "Importér" fanen
   - Vælg `Kubelab.sql` filen
   - Klik "Udfør"

### Projekt Setup
1. Klon projektet og installer dependencies
   ```bash
   git clone <projekt-url>
   cd backend
   npm install
   ```

### Start Projektet
2. Start backend: `npm run dev` i `/backend`
3. Åbn frontend i browser: `/frontend/pages/index.html`

### Test Brugere
4. Log ind med en af følgende test brugere:
   ### Admin bruger:
   - Email: admin@live.dk
   - Password: admin
   
   ### Standard bruger:
   - Email: user@live.dk
   - Password: user

## Projektstruktur
### Frontend (`/frontend`)
- `/assets` - Statiske filer (CSS, JS, Icons)
- `/pages` - HTML sider
- `/templates` - Genbrugelige templates

### Backend (`/backend`)
- `/routes` - API endpoints
- `/config` - Database og server konfiguration
- `/middleware` - Authentication og validering
- `/utils` - Hj��lpefunktioner

### Database
- MySQL database med følgende tabeller:
  - `Users` - Brugerdata og teams
  - `Teams` - Team information
  - `Projects` - Projekt konfigurationer
  - `Templates` - YAML templates
  - `Services` - Tilgængelige services
  - `Roles` - Brugerrettigheder

## Kernekoncepter

### Database Setup
- MySQL som primær database
- Automatisk backup system
- Relationel struktur mellem users, teams og projekter
- YAML configs gemmes i database

### Templates
- Foruddefinerede Docker stacks
- Kan indeholde multiple services
- Bruges som basis for nye projekter
- Konfigureres gennem brugervenlig formular

### Projekter
- Oprettes fra templates
- Kører som Docker stacks
- Har unik subdomain
- Tilhører én specifik bruger

### Teams
- Administrativ gruppering af brugere
- Styres af admin
- Har udløbsdato

## Hovedfunktioner
1. **Projekt Management**
   - Vælg template
   - Start projekt
   - Stop projekt
   - Slet projekt

2. **Template System**
   - For undervisere:
     - Opret templates
     - Administrer templates
   - For studerende:
     - Vælg mellem eksisterende templates
     - Start projekt fra template

## API Endpoints
### Vigtigste endpoints:
- `POST /api/auth/login` - Login
- `GET /api/projects` - List projekter
- `POST /api/projects` - Opret projekt
- `GET /api/templates` - List templates
- `GET /api/teams` - List teams

## Sikkerhed
- Login påkrævet
- JWT authentication
- Role-based access
- Sikre passwords

## Best Practices
1. Vælg den rigtige template til dit behov
2. Husk at stoppe projekter der ikke bruges
3. Kontakt administrator ved problemer

## Fejlfinding
- Kontakt administrator hvis projektet ikke virker
- Tjek at projektet er startet
- Prøv at genstarte projektet