const express = require('express');
const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session && req.session.loggedIn) {
    return res.redirect('/');
  }
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { password } = req.body;
  const validPassword = process.env.APP_PASSWORD || 'petoi2024';
  
  if (password === validPassword) {
    req.session.loggedIn = true;
    return res.redirect('/');
  }
  
  res.render('login', { error: 'Password non corretta' });
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;
