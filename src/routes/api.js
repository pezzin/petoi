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

module.exports = router;
