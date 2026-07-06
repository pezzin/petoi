# PETOI Webapp

Webapp per la visualizzazione di messaggi dal robot PETOI e controllo della scenografia durante la Summer School.

## Funzionalità

- **Messaggi dal robot**: Visualizza in tempo reale i messaggi inviati dal robot
- **Sfondi dinamici**: Cambia lo sfondo della pagina per la scenografia
- **Autenticazione**: Accesso protetto da password
- **API REST**: Endpoints per integrare il robot

---

## Setup Locale

### Prerequisiti
- Node.js 18+
- PostgreSQL (o usa Render)

### Installazione

```bash
# Clona il repo
git clone https://github.com/pezzin/petoi.git
cd petoi

# Installa dipendenze
npm install

# Copia e configura le variabili d'ambiente
cp .env.example .env
```

### Variabili d'ambiente (.env)

```
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=una-stringa-random-lunga
APP_PASSWORD=la-tua-password-condivisa
PORT=3000
```

### Avvia

```bash
npm run dev
```

Apri http://localhost:3000

---

## Deploy su Render

### 1. Crea il database

1. Vai su https://dashboard.render.com
2. Clicca "New" → "PostgreSQL"
3. Scegli un nome e la regione
4. Clicca "Create Database"
5. Copia l'**Internal Database URL**

### 2. Crea il Web Service

1. Clicca "New" → "Web Service"
2. Collega il tuo repo GitHub
3. Configura:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Aggiungi le variabili d'ambiente:
   - `DATABASE_URL` - Internal Database URL del database
   - `SESSION_SECRET` - Una stringa random (es. `abc123xyz789`)
   - `APP_PASSWORD` - La password per accedere
5. Clicca "Create Web Service"

### 3. Verifica

Vai su `https://tuo-sito.onrender.com/health` - dovresti vedere:
```json
{"status":"healthy","database":"connected"}
```

---

## Pagine Web

| Pagina | Descrizione |
|--------|-------------|
| `/login` | Pagina di login |
| `/` | Dashboard con messaggi |
| `/backgrounds` | Selettore sfondi |
| `/sfondo` | Pagina scenografia (fullscreen) |
| `/health` | Health check |

---

## API Endpoints

### Base URL
```
https://tuo-sito.onrender.com/api
```

---

### Messaggi

#### Invia un messaggio

Il messaggio appare in grande nella dashboard, perfetto per mostrare cosa sta "pensando" il robot.

```bash
curl -X POST https://tuo-sito.onrender.com/api/messages \
  -H "Content-Type: application/json" \
  -d '{"text": "Sto analizzando l ambiente...", "source": "robot"}'
```

**Parametri:**
| Campo | Tipo | Obbligatorio | Descrizione |
|-------|------|--------------|-------------|
| `text` | string | Sì | Il messaggio da mostrare |
| `source` | string | No | Fonte del messaggio (default: "external") |

**Risposta:**
```json
{
  "id": 1,
  "text": "Sto analizzando l ambiente...",
  "source": "robot",
  "created_at": "2025-07-06T10:30:00.000Z"
}
```

#### Leggi tutti i messaggi

```bash
curl https://tuo-sito.onrender.com/api/messages
```

#### Cancella un messaggio

```bash
curl -X DELETE https://tuo-sito.onrender.com/api/messages/1
```

#### Cancella tutti i messaggi

```bash
curl -X DELETE https://tuo-sito.onrender.com/api/messages
```

---

### Sfondi

Usa questo endpoint per cambiare lo sfondo della pagina `/sfondo` come scenografia durante la demo.

#### Cambia sfondo

```bash
curl -X POST https://tuo-sito.onrender.com/api/background \
  -H "Content-Type: application/json" \
  -d '{"background": "piramidi"}'
```

**Sfondi disponibili:**
| Valore | Descrizione |
|--------|-------------|
| `dracula` | Tema gotico |
| `frankestein` | Tema mostruoso |
| `piramidi` | Tema egizio |
| `vangogh` | Tema artistico |

#### Leggi sfondo corrente

```bash
curl https://tuo-sito.onrender.com/api/background
```

**Risposta:**
```json
{
  "background": "piramidi"
}
```

---

### Dati Sensori

Per salvare e leggere dati dai sensori del robot.

#### Invia dato sensore

```bash
curl -X POST https://tuo-sito.onrender.com/api/data \
  -H "Content-Type: application/json" \
  -d '{"sensor": "ultrasonic", "value": "25.5"}'
```

#### Leggi dati

```bash
curl https://tuo-sito.onrender.com/api/data
```

---

### Health Check

```bash
curl https://tuo-sito.onrender.com/health
```

---

## Esempi di Integrazione

### Da Python (es. Raspberry Pi / robot)

```python
import requests

BASE_URL = "https://tuo-sito.onrender.com"

# Invia messaggio
requests.post(f"{BASE_URL}/api/messages", json={
    "text": "Rilevato ostacolo a 30cm",
    "source": "petoi"
})

# Cambia sfondo
requests.post(f"{BASE_URL}/api/background", json={
    "background": "space"
})
```

### Da Node.js

```javascript
const BASE_URL = "https://tuo-sito.onrender.com";

// Invia messaggio
await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        text: "Sto eseguendo il comando",
        source: "petoi"
    })
});
```

### Da Arduino / ESP32 (con WiFiClient)

```cpp
#include <WiFiClient.h>
#include <ArduinoJson.h>

void sendMessage(String text) {
  WiFiClient client;
  if (client.connect("tuo-sito.onrender.com", 80)) {
    StaticJsonDocument<200> doc;
    doc["text"] = text;
    doc["source"] = "petoi";
    
    String body;
    serializeJson(doc, body);
    
    client.println("POST /api/messages HTTP/1.1");
    client.println("Host: tuo-sito.onrender.com");
    client.println("Content-Type: application/json");
    client.print("Content-Length: ");
    client.println(body.length());
    client.println();
    client.println(body);
    client.stop();
  }
}
```

---

## Istruzioni per Altri Team

Per replicare questo sistema:

### Opzione A: Fork del progetto

1. Forka il repo su GitHub
2. Segui le istruzioni di "Deploy su Render"
3. Personalizza password e sfondi

### Opzione B: Solo gli endpoint necessari

Se avete già un progetto Node.js, aggiungete:

**1. Tabella database:**
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  source VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT
);

INSERT INTO settings (key, value) VALUES ('background', 'default');
```

**2. Endpoint minimi:**
```javascript
// GET /api/messages
router.get('/messages', async (req, res) => {
  const result = await db.query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 50');
  res.json(result.rows);
});

// POST /api/messages
router.post('/messages', async (req, res) => {
  const { text, source } = req.body;
  const result = await db.query(
    'INSERT INTO messages (text, source) VALUES ($1, $2) RETURNING *',
    [text, source || 'external']
  );
  res.json(result.rows[0]);
});

// POST /api/background
router.post('/background', async (req, res) => {
  const { background } = req.body;
  await db.query(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
    ['background', background]
  );
  res.json({ success: true });
});
```

---

## Struttura Progetto

```
petoi/
├── src/
│   ├── app.js              # Entry point Express
│   ├── config/
│   │   └── database.js     # Connessione PostgreSQL
│   ├── middleware/
│   │   └── auth.js         # Autenticazione
│   └── routes/
│       ├── auth.js         # Login/logout
│       └── api.js          # API REST
├── views/
│   ├── login.ejs           # Pagina login
│   ├── dashboard.ejs       # Dashboard
│   └── backgrounds.ejs     # Selettore sfondi
├── public/
│   ├── css/style.css       # Stili
│   ├── js/app.js           # Frontend logic
│   └── favicon.svg         # Favicon
├── .env.example            # Template variabili
├── package.json
└── README.md
```

---

## Troubleshooting

### La sessione non funziona / torna al login

Assicurati che `SESSION_SECRET` sia impostato su Render.

### Il database non si connette

1. Verifica che `DATABASE_URL` sia corretto
2. Su Render, usa l'**Internal Database URL** (non External)
3. Controlla `/health` per vedere lo stato

### Gli sfondi non cambiano

La dashboard aggiorna ogni 2 secondi. Assicurati che il valore sia valido: `default`, `sea`, `mountain`, `space`.

---

## Tecnologie

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Frontend**: EJS, CSS vanilla
- **Deploy**: Render.com

---

## Licenza

MIT - Free to use for educational purposes.
