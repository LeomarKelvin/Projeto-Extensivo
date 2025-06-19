const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// 1. Importamos o controller inteiro como um único objeto
const lojaDashboardController = require('../controllers/lojaDashboardController');

// 2. Usamos as funções a partir desse objeto
router.get('/stats', authMiddleware, lojaDashboardController.getDashboardStats);
router.get('/vendas', authMiddleware, lojaDashboardController.getSalesChartData);
router.get('/pedidos-recentes', authMiddleware, lojaDashboardController.getRecentOrders);
router.get('/produtos', authMiddleware, lojaDashboardController.getProdutosDaLoja);
router.get('/produtos-mais-vendidos', authMiddleware, lojaDashboardController.getProdutosMaisVendidos);

module.exports = router;