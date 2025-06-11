require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const perfilRoutes = require('./routes/perfil');
const lojasRoutes = require('./routes/lojas');
const pedidosRoutes = require('./routes/pedidos');
const lojaDashboardRoutes = require('./routes/lojaDashboard'); // Esta linha já deve existir

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/perfil', perfilRoutes);
app.use('/api/lojas', lojasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/dashboard/loja', lojaDashboardRoutes); // <-- ADICIONE ESTA LINHA

app.get('/', (req, res) => {
  res.send('API do PedeAí funcionando!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});