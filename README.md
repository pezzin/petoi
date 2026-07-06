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

## API Endpoints

### Messaggi (dal robot)

**Invia un messaggio:**
```bash
curl -X POST https://petoi.onrender.com/api/messages \
  -H "Content-Type: application/json" \
  -d '{"text": "Sto analizzando l ambiente...", "source": "robot"}'
```

**Leggi messaggi:**
```bash
curl https://petoi.onrender.com/api/messages
```

**Parametri:**
- `text` (obbligatorio) - Il messaggio da mostrare
- `source` (opzionale) - Fonte del messaggio (default: "external")

**Cancella tutti i messaggi:**
```bash
curl -X DELETE https://petoi.onrender.com/api/messages
```

### Dati sensori

**Invia dato sensore:**
```bash
curl -X POST https://petoi.onrender.com/api/data \
  -H "Content-Type: application/json" \
  -d '{"sensor": "ultrasonic", "value": "25.5"}'
```

### Health check
```bash
curl https://petoi.onrender.com/health
```

### Sfondi (scenografia)

**Cambia sfondo:**
```bash
curl -X POST https://petoi.onrender.com/api/background \
  -H "Content-Type: application/json" \
  -d '{"background": "space"}'
```

**Sfondi disponibili:** `default`, `sea`, `mountain`, `space`

**Leggi sfondo corrente:**
```bash
curl https://petoi.onrender.com/api/background
```

**Pagina sfondi:** `/backgrounds` - Interfaccia visuale per cambiare sfondo
