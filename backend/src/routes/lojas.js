import { Router } from 'express';
import { buscarLojas } from '../controllers/lojaController.js';

const router = Router();

router.get('/', buscarLojas);

export default router;