import { Router } from 'express';
import { buscarPerfil, atualizarPerfil } from '../controllers/perfilController.js';
import { authMiddleware } from '../middleware/authMiddleware.js'; // Nosso novo middleware

const router = Router();

// Todas as rotas aqui dentro usarão o middleware de autenticação
router.use(authMiddleware);

router.get('/', buscarPerfil);       // Rota para buscar o perfil
router.post('/update', atualizarPerfil); // Rota para atualizar o perfil

export default router;