const { supabase } = require('../config/supabaseClient');

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido ou mal formatado.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return res.status(403).json({ error: 'Token inválido ou expirado.' });
        }

        // CORREÇÃO: Garante que estamos buscando da tabela "perfis" com 'p' minúsculo.
        const { data: perfil, error: perfilError } = await supabase
            .from('perfis')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (perfilError || !perfil) {
            return res.status(404).json({ error: 'Perfil associado ao token não encontrado.' });
        }

        req.user = user;
        req.perfil = perfil;
        next();

    } catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao autenticar.' });
    }
}

module.exports = authMiddleware;