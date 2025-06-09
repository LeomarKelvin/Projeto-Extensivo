import { Router } from 'express';
import { buscarPedidosDaLoja, atualizarStatusPedido } from '../controllers/lojaDashboardController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/pedidos', buscarPedidosDaLoja);
router.post('/pedidos/update-status', atualizarStatusPedido);

export default router;