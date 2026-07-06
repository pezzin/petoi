const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/status', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.get('/data', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM petoi_data ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/data', async (req, res) => {
  const { sensor, value } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO petoi_data (sensor, value) VALUES ($1, $2) RETURNING *',
      [sensor, value]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/messages', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/messages', async (req, res) => {
  const { text, source } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }
  try {
    const result = await db.query(
      'INSERT INTO messages (text, source) VALUES ($1, $2) RETURNING *',
      [text, source || 'external']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/messages/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM messages WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/messages', async (req, res) => {
  try {
    await db.query('DELETE FROM messages');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/background', async (req, res) => {
  try {
    const result = await db.query('SELECT value FROM settings WHERE key = $1', ['background']);
    res.json({ background: result.rows[0]?.value || 'dracula' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/background', async (req, res) => {
  const { background } = req.body;
  const validBackgrounds = ['dracula', 'frankestein', 'piramidi', 'vangogh'];
  
  if (!validBackgrounds.includes(background)) {
    return res.status(400).json({ error: 'Invalid background. Use: ' + validBackgrounds.join(', ') });
  }
  
  try {
    await db.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      ['background', background]
    );
    res.json({ success: true, background });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
