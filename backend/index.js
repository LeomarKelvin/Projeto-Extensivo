const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Suas chaves do Supabase
const supabaseUrl = 'https://jrskruadcwuytvjeqybh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyc2tydWFkY3d1eXR2amVxeWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMjc4OTMsImV4cCI6MjA2NDgwMzg5M30.JzNlpPJ7jAONIpUK92zg-6YLPK6WRRfhotYiMu6KFjs';
const supabase = createClient(supabaseUrl, supabaseKey);


// ROTA PARA BUSCAR LOJAS
app.get('/api/lojas', async (req, res) => {
    const { data, error } = await supabase.from('lojas').select('*');
    if (error) { return res.status(500).json({ error: error.message }); }
    res.json(data);
});

// ROTA PARA REGISTRAR USUÁRIO
app.post('/api/register', async (req, res) => {
    const { nome, email, password, role, store_name, store_category } = req.body;

    if (!email || !password || !nome || !role) {
        return res.status(400).json({ error: 'Dados incompletos.' });
    }

    // 1. Cria o usuário primeiro
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: nome, role: role } }
    });
    if (authError) return res.status(400).json({ error: authError.message });
    if (!authData.user) return res.status(500).json({ error: 'Usuário não foi criado.' });
    
    // 2. SE o usuário for uma loja, cria a loja no banco de dados
    if (role === 'store') {
        const { error: storeError } = await supabase
            .from('lojas')
            .insert({ 
                nome: store_name, 
                categoria: store_category, 
                owner_id: authData.user.id // Vincula o usuário recém-criado como dono
            });

        if (storeError) {
            // O ideal seria apagar o usuário que foi criado, mas vamos manter simples
            console.error("Erro ao criar loja para o novo usuário:", storeError.message);
            return res.status(400).json({ error: 'Usuário foi criado, mas houve um erro ao registrar a loja.' });
        }
    }
    
    res.status(200).json({ message: "Cadastro realizado com sucesso!", user: authData.user });
});

// ROTA PARA FAZER LOGIN
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { return res.status(401).json({ error: 'E-mail ou senha inválidos.' }); }
    res.status(200).json({ message: "Login realizado com sucesso!", data });
});

// ROTA PARA CRIAR PEDIDOS
app.post('/api/pedidos', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) throw new Error('Nenhum token fornecido.');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError) throw userError;
        const { loja_id, total_price, items } = req.body;
        const { data: pedidoData, error: pedidoError } = await supabase.from('pedidos').insert([{ user_id: user.id, loja_id, total_price, status: 'Pendente' }]).select().single();
        if (pedidoError) throw pedidoError;
        const pedidoId = pedidoData.id;
        const itensParaInserir = items.map(item => ({ pedido_id: pedidoId, nome_produto: item.nome, quantidade: item.quantidade, preco_unidade: item.preco }));
        const { error: itensError } = await supabase.from('pedido_itens').insert(itensParaInserir);
        if (itensError) throw itensError;
        res.status(200).json({ message: 'Pedido realizado com sucesso!', pedido_id: pedidoId });
    } catch (error) {
        res.status(400).json({ error: "Falha ao processar o pedido: " + error.message });
    }
});

// --- NOVA ROTA PARA BUSCAR O HISTÓRICO DE PEDIDOS DO USUÁRIO ---
app.get('/api/meus-pedidos', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) throw new Error('Nenhum token fornecido.');

        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) throw new Error('Token inválido.');

        const { status } = req.query;

        let query = supabase
            .from('pedidos')
            .select(`id,created_at,total_price,status,pedido_itens(nome_produto,quantidade,preco_unidade)`)
            .eq('user_id', user.id);

        // Lógica de filtro atualizada
        if (status && status !== 'Todos os pedidos') {
            // Se o filtro for 'Pendente', busca 'Pendente' E 'Em preparo'
            if (status === 'Pendente') {
                query = query.in('status', ['Pendente', 'Em preparo']);
            } else {
                query = query.eq('status', status);
            }
        }

        const { data: pedidos, error: pedidosError } = await query.order('created_at', { ascending: false });
        if (pedidosError) throw pedidosError;

        res.status(200).json(pedidos);

    } catch (error) {
        res.status(400).json({ error: 'Falha ao buscar pedidos: ' + error.message });
    }
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor PedeAí rodando em http://localhost:${port}`);
});