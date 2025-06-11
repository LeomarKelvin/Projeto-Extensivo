const express = require('express');
const router = express.Router();
const lojaDashboardController = require('../controllers/lojaDashboardController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, lojaDashboardController.getDashboardStats);
router.get('/vendas', authMiddleware, lojaDashboardController.getSalesChartData);
router.get('/pedidos-recentes', authMiddleware, lojaDashboardController.getRecentOrders);
router.get('/produtos', authMiddleware, lojaDashboardController.getProdutosDaLoja);


module.exports = router;