const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/perfilController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/', authMiddleware, getProfile);
router.put('/', authMiddleware, updateProfile);

module.exports = router;