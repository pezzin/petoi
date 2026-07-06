const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/robots', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.*, 
        (SELECT COUNT(*) FROM commands WHERE robot_id = r.id AND executed = FALSE) as pending_commands
      FROM robots r ORDER BY r.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/robot/:id/command', async (req, res) => {
  const { id } = req.params;
  
  try {
    await db.query(
      'UPDATE robots SET status = $1, last_seen = NOW() WHERE id = $2',
      ['online', id]
    );
    
    const result = await db.query(
      'SELECT * FROM commands WHERE robot_id = $1 AND executed = FALSE ORDER BY created_at ASC LIMIT 1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.json({ command: null });
    }
    
    const cmd = result.rows[0];
    await db.query('UPDATE commands SET executed = TRUE WHERE id = $1', [cmd.id]);
    
    res.json({
      command: cmd.command,
      params: cmd.params,
      command_id: cmd.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/robot/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, current_command } = req.body;
  
  try {
    await db.query(
      'UPDATE robots SET status = $1, last_seen = NOW(), current_command = $2 WHERE id = $3',
      [status || 'online', current_command || null, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/command', async (req, res) => {
  const { robots, command, params } = req.body;
  
  if (!robots || !Array.isArray(robots) || robots.length === 0) {
    return res.status(400).json({ error: 'robots array is required' });
  }
  
  if (!command) {
    return res.status(400).json({ error: 'command is required' });
  }
  
  try {
    const inserted = [];
    for (const robotId of robots) {
      const result = await db.query(
        'INSERT INTO commands (robot_id, command, params) VALUES ($1, $2, $3) RETURNING *',
        [robotId, command, params || null]
      );
      inserted.push(result.rows[0]);
    }
    res.json({ success: true, commands: inserted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/command/all', async (req, res) => {
  const { command, params } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'command is required' });
  }
  
  try {
    const robots = await db.query('SELECT id FROM robots');
    const inserted = [];
    
    for (const robot of robots.rows) {
      const result = await db.query(
        'INSERT INTO commands (robot_id, command, params) VALUES ($1, $2, $3) RETURNING *',
        [robot.id, command, params || null]
      );
      inserted.push(result.rows[0]);
    }
    res.json({ success: true, commands: inserted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/commands', async (req, res) => {
  try {
    await db.query('DELETE FROM commands WHERE executed = FALSE');
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

router.post('/choreography/:name/execute', async (req, res) => {
  const { name } = req.params;
  
  try {
    const result = await db.query(
      'SELECT value FROM settings WHERE key = $1',
      [`choreo_${name}`]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Choreography not found' });
    }
    
    const steps = JSON.parse(result.rows[0].value);
    res.json({ success: true, message: 'Choreography queued', steps });
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
