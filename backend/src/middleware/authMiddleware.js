const supabase = require('../config/supabaseClient');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Nenhum token fornecido.' });
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Token inválido ou expirado.' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Falha na autenticação: ' + error.message });
    }
};

module.exports = authMiddleware;