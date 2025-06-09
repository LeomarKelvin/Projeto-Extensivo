const express = require('express');
const router = express.Router();
const { buscarLojas } = require('../controllers/lojaController');

router.get('/', buscarLojas);

module.exports = router;