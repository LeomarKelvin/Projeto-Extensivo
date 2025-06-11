const express = require('express');
const router = express.Router();
// CORREÇÃO: Importando a função com o nome novo 'buscarPedidos'
const { criarPedido, buscarPedidos } = require('../controllers/pedidoController');
const authMiddleware = require('../middleware/authMiddleware');

// Esta rota para criar o pedido já estava correta.
router.post('/', authMiddleware, criarPedido);

// CORREÇÃO: Usando a função com o nome novo 'buscarPedidos'
router.get('/', authMiddleware, buscarPedidos);

module.exports = router;