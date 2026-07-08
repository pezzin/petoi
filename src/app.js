require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./config/database');
const { requireAuth } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const danceRoutes = require('./routes/dance');
const streamRoutes = require('./routes/stream');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'petoi-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true
  }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use('/', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/dance', danceRoutes);
app.use('/api/stream', streamRoutes);

app.get('/', requireAuth, (req, res) => {
  res.render('dashboard');
});

app.get('/backgrounds', requireAuth, (req, res) => {
  res.render('backgrounds');
});

app.get('/sfondo', (req, res) => {
  res.render('sfondo');
});

app.get('/dance', requireAuth, (req, res) => {
  res.render('dance');
});

app.get('/stream', (req, res) => {
  res.render('stream');
});

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

async function initDatabase() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS petoi_data (
        id SERIAL PRIMARY KEY,
        sensor VARCHAR(100),
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        source VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS robots (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(100),
        status VARCHAR(50) DEFAULT 'offline',
        last_seen TIMESTAMP,
        current_action VARCHAR(100) DEFAULT 'idle'
      )
    `);
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'robots' AND column_name = 'current_action') THEN
          ALTER TABLE robots ADD COLUMN current_action VARCHAR(100) DEFAULT 'idle';
        END IF;
      END $$;
    `);
    await db.query(`
      INSERT INTO settings (key, value) VALUES ('background', 'dracula')
      ON CONFLICT (key) DO NOTHING
    `);
    await db.query(`
      INSERT INTO settings (key, value) VALUES ('poll_interval', '5000')
      ON CONFLICT (key) DO NOTHING
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS commands_config (
        action VARCHAR(50) PRIMARY KEY,
        command VARCHAR(100) NOT NULL,
        display_name VARCHAR(100)
      )
    `);
    
    const defaultCommands = [
      { action: 'khi', command: 'khi', display: 'Greeting' },
      { action: 'kjmp', command: 'kjmp', display: 'Jump' },
      { action: 'kpshup', command: 'kpshup', display: 'Pushup' },
      { action: 'sit', command: 'sit', display: 'Sit' },
      { action: 'stand', command: 'stand', display: 'Stand' },
      { action: 'walk', command: 'walk', display: 'Walk Forward' },
      { action: 'back', command: 'back', display: 'Walk Backward' },
      { action: 'left', command: 'left', display: 'Turn Left' },
      { action: 'right', command: 'right', display: 'Turn Right' },
      { action: 'pee', command: 'pee', display: 'Pee' },
      { action: 'stretch', command: 'stretch', display: 'Stretch' },
      { action: 'check', command: 'check', display: 'Check Around' },
      { action: 'zero', command: 'zero', display: 'Zero Position' }
    ];
    
    for (const cmd of defaultCommands) {
      await db.query(`
        INSERT INTO commands_config (action, command, display_name) VALUES ($1, $2, $3)
        ON CONFLICT (action) DO NOTHING
      `, [cmd.action, cmd.command, cmd.display]);
    }
    
    const robotNames = [
      { id: '2410', name: '2410' },
      { id: '2411', name: '2411' },
      { id: '418C', name: '418C' },
      { id: '3204', name: '3204' }
    ];
    
    for (const robot of robotNames) {
      await db.query(`
        INSERT INTO robots (id, name, status, current_action) VALUES ($1, $2, 'offline', 'idle')
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
      `, [robot.id, robot.name]);
    }
    
    await db.query(`
      INSERT INTO settings (key, value) VALUES ('team_1', 'Team 1')
      ON CONFLICT (key) DO NOTHING
    `);
    await db.query(`
      INSERT INTO settings (key, value) VALUES ('team_2', 'Team 2')
      ON CONFLICT (key) DO NOTHING
    `);
    
    console.log('Database initialized');
  } catch (err) {
    console.error('Database init error:', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDatabase();
});
