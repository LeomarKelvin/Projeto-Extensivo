const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

const lojasRoutes = require('./routes/lojas');
const pedidosRoutes = require('./routes/pedidos');
const perfilRoutes = require('./routes/perfil');
const lojaDashboardRoutes = require('./routes/lojaDashboard');

app.use(cors());
app.use(express.json());

app.use('/api/lojas', lojasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/dashboard', lojaDashboardRoutes);

app.listen(port, () => {
    console.log(`Servidor PedeAí rodando em http://localhost:${port}`);
});