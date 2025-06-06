const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

// Cria o meu servidor
const app = express();
const port = 3000; // O servidor vai rodar na porta 3000

// Permite que o frontend (que roda em outra porta) converse com este backend
app.use(cors());

// --- CONEXÃO COM O SUPABASE ---
// Para encontrar suas chaves:
// 1. Vá para o site do Supabase e entre no seu projeto "pede-ai".
// 2. No menu da esquerda, clique no ícone de engrenagem (Project Settings).
// 3. Clique em "API".
// 4. Você verá o "Project URL" e as "Project API Keys". Use a chave que está na seção "anon" "public".

const supabaseUrl = 'https://jrskruadcwuytvjeqybh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyc2tydWFkY3d1eXR2amVxeWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMjc4OTMsImV4cCI6MjA2NDgwMzg5M30.JzNlpPJ7jAONIpUK92zg-6YLPK6WRRfhotYiMu6KFjs';

// Cria o cliente de conexão com o Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Quando o frontend chamar por '/api/lojas', este código será executado
app.get('/api/lojas', async (req, res) => {
    console.log("Recebida requisição para /api/lojas"); // Adicionamos um log para ver no terminal

    // Usamos o Supabase para selecionar TUDO (*) da tabela 'lojas'
    const { data, error } = await supabase
        .from('lojas')
        .select('*');

    if (error) {
        // Se der erro, informamos no console do backend e mandamos uma mensagem de erro para o frontend
        console.error('Erro ao buscar lojas:', error);
        return res.status(500).json({ error: 'Erro ao buscar lojas.' });
    }
    
    // Se der tudo certo, enviamos os dados (a lista de lojas) como resposta
    console.log("Enviando dados das lojas:", data);
    res.json(data);
});

// Inicia o nosso servidor e o faz "escutar" por requisições na porta 3000
app.listen(port, () => {
    console.log(`Servidor PedeAí rodando em http://localhost:${port}`);
    console.log("Aguardando conexões do frontend...");
});