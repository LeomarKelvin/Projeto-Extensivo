const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Importa o controller inteiro como um único objeto
const lojaDashboardController = require('../controllers/lojaDashboardController');

// Usa as funções a partir do objeto do controller
router.get('/stats', authMiddleware, lojaDashboardController.getDashboardStats);
router.get('/vendas', authMiddleware, lojaDashboardController.getSalesChartData);
router.get('/pedidos-recentes', authMiddleware, lojaDashboardController.getRecentOrders);
router.get('/produtos', authMiddleware, lojaDashboardController.getProdutosDaLoja);
router.get('/produtos-mais-vendidos', authMiddleware, lojaDashboardController.getProdutosMaisVendidos);
router.get('/avaliacoes-recentes', authMiddleware, lojaDashboardController.getAvaliacoesRecentes);

module.exports = router;