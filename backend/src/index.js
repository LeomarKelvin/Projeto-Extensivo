require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importação das rotas
const perfilRoutes = require('./routes/perfil');
const lojasRoutes = require('./routes/lojas');
const pedidosRoutes = require('./routes/pedidos');
const lojaDashboardRoutes = require('./routes/lojaDashboard');

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

app.use('/api/perfil', perfilRoutes);
app.use('/api/lojas', lojasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/dashboard/loja', lojaDashboardRoutes);

app.use('/frontend', express.static(path.join(__dirname, '../../frontend')));
app.use('/loja-frontend', express.static(path.join(__dirname, '../../loja-frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/Clientes/Inicio.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em 0.0.0.0:${PORT}`);
});