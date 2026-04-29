require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const ensureSchema = require('./src/db/ensureSchema');
const adminAuthRoutes = require('./src/routes/adminAuthRoutes');
const adminTrackingRoutes = require('./src/routes/adminTrackingRoutes');
const publicTrackingRoutes = require('./src/routes/publicTrackingRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  return res.redirect('/rastrear.html');
});

app.get('/admin', (req, res) => {
  return res.redirect('/admin/index.html');
});

app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/trackings', adminTrackingRoutes);
app.use('/api/trackings', publicTrackingRoutes);

app.use((error, req, res, next) => {
  console.error(error);

  if (error.code === '23505') {
    return res.status(409).json({ message: 'Registro duplicado.' });
  }

  return res.status(500).json({ message: 'Erro interno do servidor.' });
});

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET nao foi definido no ambiente.');
  }

  await ensureSchema();

  app.listen(PORT, () => {
    console.log(`Servidor iniciado em http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Falha ao iniciar a aplicacao:', error);
  process.exit(1);
});
