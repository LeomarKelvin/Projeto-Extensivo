import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import lojasRoutes from './routes/lojas.js';
import pedidosRoutes from './routes/pedidos.js';
import perfilRoutes from './routes/perfil.js';
import lojaDashboardRoutes from './routes/lojaDashboard.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/lojas', lojasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/loja-dashboard', lojaDashboardRoutes);

app.get('/api', (req, res) => {
  res.send(`API do PedeAí está no ar!`);
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});