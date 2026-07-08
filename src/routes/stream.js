const express = require('express');
const router = express.Router();
const db = require('../config/database');

let latestImage = null;
let latestImageTime = null;

router.post('/image', async (req, res) => {
  const { id, image } = req.body;
  
  if (!image) {
    return res.status(400).json({ error: 'image is required (base64)' });
  }
  
  try {
    latestImage = image;
    latestImageTime = new Date();
    
    await db.query(
      `INSERT INTO settings (key, value) VALUES ('stream_image', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [image]
    );
    
    await db.query(
      `INSERT INTO settings (key, value) VALUES ('stream_time', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [latestImageTime.toISOString()]
    );
    
    if (id) {
      await db.query(
        'UPDATE robots SET last_seen = NOW() WHERE id = $1',
        [id]
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/image', async (req, res) => {
  try {
    const result = await db.query(
      "SELECT value FROM settings WHERE key = 'stream_image'"
    );
    
    const timeResult = await db.query(
      "SELECT value FROM settings WHERE key = 'stream_time'"
    );
    
    if (result.rows.length === 0 || !result.rows[0].value) {
      return res.json({ image: null, time: null });
    }
    
    res.json({ 
      image: result.rows[0].value,
      time: timeResult.rows[0]?.value || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
