const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario e senha sao obrigatorios.' });
  }

  const result = await pool.query(
    'SELECT id, username, password_hash FROM admins WHERE username = $1 LIMIT 1',
    [String(username).trim()]
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ message: 'Credenciais invalidas.' });
  }

  const admin = result.rows[0];
  const passwordMatches = await bcrypt.compare(password, admin.password_hash);

  if (!passwordMatches) {
    return res.status(401).json({ message: 'Credenciais invalidas.' });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return res.json({
    token,
    admin: {
      id: admin.id,
      username: admin.username,
    },
  });
}

function me(req, res) {
  return res.json({
    admin: req.admin,
  });
}

module.exports = {
  login,
  me,
};
