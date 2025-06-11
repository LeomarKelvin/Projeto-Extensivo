const express = require('express');
const router = express.Router();
const lojaDashboardController = require('../controllers/lojaDashboardController');
const authMiddleware = require('../middleware/authMiddleware');

// Rota GET para /api/dashboard/loja/stats
// É protegida pelo authMiddleware, garantindo que apenas um usuário logado pode acessá-la.
router.get('/stats', authMiddleware, lojaDashboardController.getDashboardStats);

module.exports = router;