import { supabase } from '../config/supabaseClient.js';

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso não autorizado. Token não fornecido.' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) {
    return res.status(401).json({ error: 'Token inválido.' });
  }

  req.user = user; // Anexa o objeto do usuário na requisição
  next(); // Passa para a próxima função (o nosso controller)
};