const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', perfilController.criarPerfil);
router.post('/login', perfilController.login);
router.get('/', authMiddleware, perfilController.getPerfil);

module.exports = router;