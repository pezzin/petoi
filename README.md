# PETOI Webapp

Webapp per il controllo del robot PETOI durante la Summer School.

## Setup

1. Clona il repo
2. Copia `.env.example` in `.env` e configura le variabili
3. Installa le dipendenze: `npm install`
4. Avvia: `npm run dev`

## Variabili d'ambiente

- `DATABASE_URL` - Connection string PostgreSQL (Render)
- `SESSION_SECRET` - Segreto per le sessioni
- `APP_PASSWORD` - Password condivisa per il login
- `PORT` - Porta del server (default: 3000)

## Struttura

```
src/
  app.js           - Entry point
  config/
    database.js    - Configurazione PostgreSQL
  middleware/
    auth.js        - Middleware autenticazione
  routes/
    auth.js        - Route login/logout
    api.js         - API REST
views/             - Template EJS
public/            - CSS, JS, assets
```

## Deploy su Render

1. Crea un nuovo Web Service su Render
2. Collega il repo GitHub
3. Build command: `npm install`
4. Start command: `npm start`
5. Aggiungi le variabili d'ambiente
