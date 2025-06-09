const express = require('express');
const router = express.Router();
const { buscarPedidosDaLoja, atualizarStatusPedido } = require('../controllers/lojaDashboardController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/pedidos', buscarPedidosDaLoja);
router.put('/pedidos/:id', atualizarStatusPedido);

module.exports = router;