const { supabase, supabaseAdmin } = require('../config/supabaseClient');

async function criarPerfil(req, res) {
    const { email, password, nome, tipo, nome_loja } = req.body;

    if (!email || !password || !nome || !tipo) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (tipo.toLowerCase() === 'loja' && !nome_loja) {
        return res.status(400).json({ error: 'O nome da loja é obrigatório para o tipo de perfil Loja.' });
    }

    // Etapa 1: Cria o usuário na autenticação
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                // O metadata pode ter o nome que quisermos, mas nome_completo é mais descritivo
                nome_completo: nome 
            }
        }
    });

    if (authError) {
        return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
        return res.status(500).json({ error: 'Não foi possível criar o usuário na autenticação.' });
    }
    const userId = authData.user.id;

    try {
        // --- Etapa 2: Inserir o perfil na tabela 'perfis' ---
        const { data: perfilData, error: perfilError } = await supabaseAdmin
            .from('perfis')
            .insert({ 
                user_id: userId, 
                email, 
                nome_completo: nome, // CORREÇÃO 1: Usando a coluna correta 'nome_completo'
                tipo: tipo.toLowerCase() 
            })
            .select()
            .single();
        
        if (perfilError) throw perfilError;

        // --- Etapa 3: Se o usuário for do tipo 'loja', criar a loja ---
        if (perfilData.tipo === 'loja') {
            // CORREÇÃO 2: Usando a coluna correta 'nome_loja'
            const { error: lojaError } = await supabaseAdmin
                .from('lojas')
                .insert({
                    nome_loja: nome_loja,
                    user_id: userId,
                    perfil_id: perfilData.id
                });

            if (lojaError) throw lojaError;
        }

        res.status(201).json({ message: 'Usuário e Loja cadastrados com sucesso!', data: authData });

    } catch (error) {
        console.error('Erro no processo de criação de perfil/loja:', error);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        res.status(500).json({ error: 'Ocorreu um erro crítico ao registrar seu perfil. O usuário foi removido.' });
    }
}


// As funções 'login' e 'getPerfil' não precisam de alteração
async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

    try {
        const { data: sessionData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) return res.status(401).json({ error: "E-mail ou senha inválidos." });

        const { data: perfilData, error: perfilError } = await supabase
            .from('perfis').select('*').eq('user_id', sessionData.user.id).single();
        if (perfilError || !perfilData) return res.status(404).json({ error: 'Perfil do usuário não encontrado.' });

        res.status(200).json({
            message: 'Login bem-sucedido!',
            user: sessionData.user,
            session: sessionData.session,
            perfil: perfilData
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}

async function getPerfil(req, res) {
    const userId = req.user.id;
    if (!userId) return res.status(400).json({ error: 'ID do usuário não fornecido.' });

    try {
        const { data, error } = await supabase.from('perfis').select('*').eq('user_id', userId).single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar perfil.' });
    }
}

module.exports = {
    criarPerfil,
    login,
    getPerfil,
};