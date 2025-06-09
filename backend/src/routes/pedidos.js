const express = require('express');
const router = express.Router();
const { criarPedido, buscarMeusPedidos } = require('../controllers/pedidoController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, criarPedido);
router.get('/meus-pedidos', authMiddleware, buscarMeusPedidos);

module.exports = router;