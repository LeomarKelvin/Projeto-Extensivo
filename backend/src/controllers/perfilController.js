const supabase = require('../config/supabaseClient');

const register = async (req, res) => {
    const { email, password, role, nome_completo, nome_loja } = req.body;
    try {
        if (!email || !password || !role || !nome_completo) {
            return res.status(400).json({ error: 'Nome, email, senha e tipo de usuário são obrigatórios.' });
        }
        
        // ===== CORREÇÃO AQUI =====
        // Agora salvamos o nome_completo e o role nos metadados do usuário
        const { data: { user }, error } = await supabase.auth.signUp({
            email, 
            password, 
            options: { 
                data: { 
                    role: role,
                    nome_completo: nome_completo 
                } 
            }
        });

        if (error) throw error;
        if (!user) throw new Error('Usuário não foi criado.');

        if (role === 'loja') {
            if (!nome_loja) return res.status(400).json({ error: 'O nome da loja é obrigatório.' });
            const { error: lojaError } = await supabase.from('lojas').insert([{ owner_id: user.id, nome: nome_loja, responsavel_user_id: user.id }]);
            if (lojaError) throw lojaError;
        }
        res.status(201).json({ message: 'Usuário registrado com sucesso!', user });
    } catch (error) {
        res.status(500).json({ error: 'Falha ao registrar usuário: ' + error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { user, session } = data;
        
        // ===== CORREÇÃO AQUI =====
        // Agora incluímos o nome_completo na resposta para o frontend
        const response = {
            message: "Login bem-sucedido!",
            token: session.access_token,
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.user_metadata.role,
                nome_completo: user.user_metadata.nome_completo // Enviando o nome
            },
            redirectTo: user.user_metadata.role === 'loja' ? '/loja-frontend/Dashboard.html' : '/frontend/Clientes/Inicio.html'
        };
        res.status(200).json(response);
    } catch (error) {
        res.status(401).json({ error: 'Credenciais inválidas: ' + error.message });
    }
};

const getProfile = async (req, res) => {
    res.status(200).json(req.user);
};

const updateProfile = async (req, res) => {
    const { data, error } = await supabase.auth.updateUser(req.body);
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json({ message: 'Perfil atualizado com sucesso!', user: data });
};

module.exports = { register, login, getProfile, updateProfile };