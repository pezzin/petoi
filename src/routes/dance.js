const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/robots', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, status, last_seen, current_action
      FROM robots ORDER BY id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/action', async (req, res) => {
  const { id } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }
  
  try {
    await db.query(
      'UPDATE robots SET status = $1, last_seen = NOW() WHERE id = $2',
      ['online', id]
    );
    
    const result = await db.query(
      'SELECT current_action FROM robots WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Robot not found' });
    }
    
    res.json({ action: result.rows[0].current_action || 'idle' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/set-action', async (req, res) => {
  const { robots, action } = req.body;
  
  if (!robots || !Array.isArray(robots) || robots.length === 0) {
    return res.status(400).json({ error: 'robots array is required' });
  }
  
  if (!action) {
    return res.status(400).json({ error: 'action is required' });
  }
  
  try {
    for (const robotId of robots) {
      await db.query(
        'UPDATE robots SET current_action = $1 WHERE id = $2',
        [action, robotId]
      );
    }
    res.json({ success: true, robots, action });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/set-action/all', async (req, res) => {
  const { action } = req.body;
  
  if (!action) {
    return res.status(400).json({ error: 'action is required' });
  }
  
  try {
    await db.query('UPDATE robots SET current_action = $1', [action]);
    res.json({ success: true, action });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/set-actions', async (req, res) => {
  const { actions } = req.body;
  
  if (!actions || typeof actions !== 'object') {
    return res.status(400).json({ error: 'actions object is required (e.g. {"petoi-1": "sit", "petoi-2": "stand"})' });
  }
  
  try {
    for (const [robotId, action] of Object.entries(actions)) {
      await db.query(
        'UPDATE robots SET current_action = $1 WHERE id = $2',
        [action, robotId]
      );
    }
    res.json({ success: true, actions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/clear-actions', async (req, res) => {
  try {
    await db.query("UPDATE robots SET current_action = 'idle'");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/choreography/list', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT key, value FROM settings WHERE key LIKE 'choreo_%'
    `);
    const choreos = {};
    result.rows.forEach(row => {
      const name = row.key.replace('choreo_', '');
      choreos[name] = JSON.parse(row.value);
    });
    res.json(choreos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/choreography/:name', async (req, res) => {
  const { name } = req.params;
  const { steps } = req.body;
  
  if (!steps || !Array.isArray(steps)) {
    return res.status(400).json({ error: 'steps array is required' });
  }
  
  try {
    await db.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2) 
       ON CONFLICT (key) DO UPDATE SET value = $2`,
      [`choreo_${name}`, JSON.stringify(steps)]
    );
    res.json({ success: true, name, steps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/choreography/:name', async (req, res) => {
  const { name } = req.params;
  
  try {
    await db.query('DELETE FROM settings WHERE key = $1', [`choreo_${name}`]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
