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
const PORT = process.env.PORT || 3000;

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

app.get('/', (req, res) => {
  res.send('API do PedeAí funcionando!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});