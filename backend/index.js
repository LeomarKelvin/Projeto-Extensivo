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
app.post('/api/pedidos', async (req, res) => {
    // ==== 1) Captura o JWT enviado no header "Authorization" ====
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não encontrado.' });
    }
    const token = authHeader.split(' ')[1];

    // ==== 2) Cria um cliente Supabase “autenticado” para essa requisição ====
    // (usa o mesmo URL e KEY, mas injeta o JWT nos headers globais)
    const supabaseUser = createClient(supabaseUrl, supabaseKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    });

    // ==== 3) Seu código original de inserção de pedido passa a usar supabaseUser ====
    const { user_id, total_price, items } = req.body;

    // 3.a) Insere o pedido na tabela "pedidos"
    const { data: pedidoData, error: pedidoError } = await supabaseUser
        .from('pedidos')
        .insert([{ user_id, total_price, status: 'Pendente' }])
        .select()      // agora em v2 é preciso chamar .select() para retornar dados
        .single();

    if (pedidoError) {
        console.error('Erro ao criar pedido:', pedidoError.message);
        return res.status(400).json({ error: pedidoError.message });
    }

    // 3.b) Insere os itens na tabela "pedido_itens"
    const pedidoId = pedidoData.id;
    const itensParaInserir = items.map(item => ({
        pedido_id: pedidoId,
        nome_produto: item.nome,
        quantidade: item.quantidade,
        preco_unidade: item.preco
    }));
    const { error: itensError } = await supabaseUser
        .from('pedido_itens')
        .insert(itensParaInserir);

    if (itensError) {
        console.error('Erro ao inserir itens:', itensError.message);
        return res.status(400).json({ error: itensError.message });
    }

    // ==== 4) Retorna sucesso ao front ====
    res.status(200).json({ message: 'Pedido realizado com sucesso!', pedido_id: pedidoId });
});


// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor PedeAí rodando em http://localhost:${port}`);
});