# Kubelab - Underviser Guide

## Kom i gang
### Systemkrav
- Node.js på din computer
- Git til at hente projektet
- Docker Desktop (husk at starte det)
- MySQL (database)

### Installation
1. Klon projektet og installer dependencies
    Åbn terminal og skriv:
    git clone https://github.com/lassebisgaard/kubelab.git
    cd backend
    npm install

### Initial Setup
1. Find filen `.env.example` i roden af projektet
2. Lav en kopi af den og placer den i backend mappen som `.env`
3. Erstat værdierne i backend/.env med disse:
    - DB_PASSWORD = root (eller dit MySQL password hvis det er anderledes)
    - JWT_SECRET = kubelab_development_secret_key_2024
    - PORTAINER_USERNAME = Lasse2024
    - PORTAINER_PASSWORD = Gulelefant7
    - Resten af værdierne kan blive som de er

### Database Setup
- Opret en ny database kaldet `Kubelab` i MySQL
- 2. Åbn phpMyAdmin
- 3. Klik "Ny" i venstre side
- 4. Skriv `Kubelab` og klik "Opret"
- 5. Vælg den nye `Kubelab` database i menuen til venstre
- 6. Klik på "Importér" i toppen
- 7. Find filen `Kubelab.sql` i projektets rod
- 8. Klik "Start" eller "Go" for at importere databasen

2. Start backend:
    Skriv i terminal:
    node server.js (husk at starte i backend mappen)

3. Åbn frontend i browser: `localhost:3000/pages/index.html`

### API Dokumentation
- Swagger dokumentationen kan findes på: `localhost:3000/api-docs`
- Her kan du se og teste alle API endpoints
- Dokumentationen opdateres automatisk når du ændrer i koden

### Test Konti
Du kan logge ind med:
    ### Admin bruger:
    - Email: admin@live.dk
    - Password: admin
    
    ### Standard bruger:
    - Email: user@live.dk
    - Password: user

## System Arkitektur
### Frontend (`/frontend`)
- `/assets` - Statiske filer (CSS, JS, Icons)
- `/pages` - HTML sider
- `/templates` - Genbrugelige templates

### Backend (`/backend`)
- `/routes` - API endpoints
- `/config` - Database og server konfiguration
- `/middleware` - Authentication og validering
- `/utils` - Hjælpefunktioner
- `.env` - Miljøvariabler
- `/config/swagger.js` - API dokumentation konfiguration

### Database Struktur
- MySQL database med følgende tabeller:
    - `Users` - Brugerdata og teams
    - `Teams` - Team information
    - `Projects` - Projekt konfigurationer
    - `Templates` - YAML templates
    - `Services` - Tilgængelige services
    - `Roles` - Brugerrettigheder

## Funktionalitet
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

## Administration
### Projekt Management
- Overvåg aktive projekter
- Start/stop projekter
- Slet inaktive projekter

### Template System
- Opret nye templates
- Administrer eksisterende templates
- Tilføj/fjern services

### Bruger Administration
- Opret/slet teams
- Administrer team medlemmer
- Håndter brugerrettigheder

## Fejlfinding
- Tjek at `.env` filen er korrekt konfigureret
- Verificer database forbindelse
- Kontroller Docker status
- Tjek server logs for fejl
- Genstart services ved behov