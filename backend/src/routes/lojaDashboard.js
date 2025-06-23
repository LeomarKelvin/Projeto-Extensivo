// backend/src/routes/lojaDashboard.js (VERSÃO FINAL)
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const lojaDashboardController = require('../controllers/lojaDashboardController');

router.get('/stats', authMiddleware, lojaDashboardController.getDashboardStats);
router.get('/vendas', authMiddleware, lojaDashboardController.getSalesChartData);
router.get('/pedidos-recentes', authMiddleware, lojaDashboardController.getRecentOrders);
router.get('/produtos', authMiddleware, lojaDashboardController.getProdutosDaLoja);
router.get('/produtos-mais-vendidos', authMiddleware, lojaDashboardController.getProdutosMaisVendidos);
router.get('/avaliacoes-recentes', authMiddleware, lojaDashboardController.getAvaliacoesRecentes);

router.get('/categorias', authMiddleware, lojaDashboardController.obterCategorias);
router.post('/categorias', authMiddleware, lojaDashboardController.adicionarCategoria);
router.delete('/categorias/:id', authMiddleware, lojaDashboardController.excluirCategoria);

router.post('/produtos', authMiddleware, lojaDashboardController.adicionarProduto);
router.put('/produtos/:id', authMiddleware, lojaDashboardController.editarProduto);
router.delete('/produtos/:id', authMiddleware, lojaDashboardController.deletarProduto);

module.exports = router;