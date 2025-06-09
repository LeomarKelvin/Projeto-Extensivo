import { Router } from 'express';
import { buscarPedidosDoUsuario, criarPedido } from '../controllers/pedidoController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', buscarPedidosDoUsuario); // Rota para buscar pedidos
router.post('/', criarPedido);          // Rota para criar um novo pedido

export default router;