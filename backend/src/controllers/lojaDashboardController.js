const { supabase } = require('../config/supabaseClient');


const getDashboardStats = async (req, res) => {
    const perfilId = req.perfil.id;
    try {
        const { data: lojaData, error: lojaError } = await supabase
            .from('lojas')
            .select('id, nota_avaliacao')
            .eq('perfil_id', perfilId)
            .single();

        if (lojaError || !lojaData) {
            return res.status(404).json({ error: 'Nenhuma loja encontrada para este perfil.' });
        }
        const lojaId = lojaData.id;

        const { data: pedidos, error: pedidosError } = await supabase
            .from('pedidos')
            .select('valor_total, user_id, status')
            .eq('loja_id', lojaId);

        if (pedidosError) throw pedidosError;

        const totalPedidos = pedidos.length;
        const faturamento = pedidos
            .filter(p => p.status === 'Entregue')
            .reduce((acc, pedido) => acc + (pedido.valor_total || 0), 0);
        const novosClientes = new Set(pedidos.map(p => p.user_id)).size;
        const avaliacaoMedia = lojaData.nota_avaliacao || 0;

        res.status(200).json({
            totalPedidos,
            faturamento,
            novosClientes,
            avaliacaoMedia
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar estatísticas: ' + error.message });
    }
};

// Função para o gráfico de vendas (Corrigida)
const getSalesChartData = async (req, res) => {
    const perfilId = req.perfil.id;
    const period = req.query.period || '7d';

    try {
        const { data: lojaData, error: lojaError } = await supabase
            .from('lojas')
            .select('id')
            .eq('perfil_id', perfilId)
            .single();

        if (lojaError || !lojaData) {
            return res.status(404).json({ error: 'Nenhuma loja encontrada para este perfil.' });
        }
        const lojaId = lojaData.id;

        const hoje = new Date();
        let dataInicio = new Date();

        switch (period) {
            case 'today':
                dataInicio.setHours(0, 0, 0, 0);
                break;
            case '30d':
                dataInicio.setDate(hoje.getDate() - 30);
                break;
            case '7d':
            default:
                dataInicio.setDate(hoje.getDate() - 7);
                break;
        }

        const { data: pedidos, error: pedidosError } = await supabase
            .from('pedidos')
            .select('valor_total, created_at')
            .eq('loja_id', lojaId)
            .eq('status', 'Entregue')
            .gte('created_at', dataInicio.toISOString());

        if (pedidosError) throw pedidosError;

        const vendasPorDia = {};
        const numeroDeDias = period === 'today' ? 1 : (period === '30d' ? 30 : 7);

        for (let i = numeroDeDias - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(hoje.getDate() - i);
            const diaFormatado = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            vendasPorDia[diaFormatado] = 0;
        }

        pedidos.forEach(pedido => {
            const dataPedido = new Date(pedido.created_at);
            const diaFormatado = dataPedido.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            if (vendasPorDia.hasOwnProperty(diaFormatado)) {
                vendasPorDia[diaFormatado] += (pedido.valor_total || 0);
            }
        });

        const labels = Object.keys(vendasPorDia);
        const data = Object.values(vendasPorDia);

        res.status(200).json({ labels, data });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados do gráfico: ' + error.message });
    }
};

const getRecentOrders = async (req, res) => {
    const lojaId = req.user.id;

    try {
        // Consulta corrigida para corresponder à sua tabela
        const { data, error } = await supabase
            .from('pedidos')
            .select(`
                id,
                created_at,
                valor_total,
                status,
                perfis ( nome_completo ) 
            `)
            .eq('loja_id', lojaId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Erro na consulta de pedidos recentes do Supabase:', error);
            throw error;
        }

        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({
            error: 'Erro interno do servidor ao buscar pedidos recentes.',
            details: error.message
        });
    }
};

const getProdutosMaisVendidos = async (req, res) => {
    // Este é o ID da autenticação, do tipo UUID
    const lojaAuthId = req.user.id;

    try {
        // Passo 1: Encontrar o ID numérico do perfil usando o UUID da autenticação.
        const { data: perfil, error: perfilError } = await supabase
            .from('perfis')
            .select('id')
            .eq('user_id', lojaAuthId)
            .single();

        if (perfilError) throw new Error('Erro ao buscar perfil da loja.');
        if (!perfil) return res.status(404).json({ error: 'Perfil da loja não encontrado.' });

        const perfilId = perfil.id; // ID numérico do perfil

        // Passo 2: Usar o ID do perfil para encontrar o ID numérico da loja.
        const { data: loja, error: lojaError } = await supabase
            .from('lojas')
            .select('id')
            .eq('perfil_id', perfilId)
            .single();

        if (lojaError) throw new Error('Erro ao buscar dados da loja.');
        if (!loja) return res.status(404).json({ error: 'Loja não encontrada para este perfil.' });

        const lojaNumericId = loja.id; // ID numérico final da loja

        // Passo 3: Usar o ID numérico da loja para buscar os pedidos.
        const { data: pedidos, error: pedidosError } = await supabase
            .from('pedidos')
            .select('id')
            .eq('loja_id', lojaNumericId)
            .eq('status', 'Entregue');

        if (pedidosError) throw new Error('Erro ao buscar pedidos da loja.');
        if (!pedidos || pedidos.length === 0) {
            return res.status(200).json([]); // Nenhum pedido entregue, retorna lista vazia.
        }

        const pedidoIds = pedidos.map(p => p.id);

        // Passo 4: Buscar todos os itens desses pedidos
        const { data: itens, error: itensError } = await supabase
            .from('pedido_itens')
            .select('nome_produto, quantidade')
            .in('pedido_id', pedidoIds);

        if (itensError) throw new Error('Erro ao buscar itens dos pedidos.');

        // Passo 5: Contar os produtos em JavaScript (esta parte continua igual)
        const salesCount = {};
        for (const item of itens) {
            salesCount[item.nome_produto] = (salesCount[item.nome_produto] || 0) + item.quantidade;
        }

        // Passo 6: Formatar e ordenar os resultados
        const sortedProducts = Object.entries(salesCount)
            .map(([nome, total]) => ({ nome_produto: nome, total_vendido: total }))
            .sort((a, b) => b.total_vendido - a.total_vendido);

        const top5Products = sortedProducts.slice(0, 5);

        res.status(200).json(top5Products);

    } catch (error) {
        console.error('Erro ao calcular produtos mais vendidos:', error.message);
        res.status(500).json({ error: 'Erro interno ao processar a requisição.' });
    }
};

const getAvaliacoesRecentes = async (req, res) => {
    // O ID do usuário logado (loja) é um UUID
    const lojaAuthId = req.user.id;

    try {
        // Passo 1: Encontrar o ID numérico do perfil da loja
        const { data: perfil, error: perfilError } = await supabase
            .from('perfis')
            .select('id')
            .eq('user_id', lojaAuthId)
            .single();

        if (perfilError) throw new Error(`Erro ao buscar perfil da loja: ${perfilError.message}`);
        if (!perfil) return res.status(404).json({ error: 'Perfil da loja não encontrado.' });

        const perfilId = perfil.id;

        // Passo 2: Encontrar o ID numérico da loja
        const { data: loja, error: lojaError } = await supabase
            .from('lojas')
            .select('id')
            .eq('perfil_id', perfilId)
            .single();

        if (lojaError) throw new Error(`Erro ao buscar dados da loja: ${lojaError.message}`);
        if (!loja) return res.status(404).json({ error: 'Loja não encontrada para este perfil.' });

        const lojaNumericId = loja.id;

        // Passo 3: Buscar as últimas 3 avaliações da loja
        const { data: avaliacoes, error: avaliacoesError } = await supabase
            .from('avaliacoes')
            .select('*')
            .eq('loja_id', lojaNumericId)
            .order('created_at', { ascending: false })
            .limit(3);

        if (avaliacoesError) throw new Error(`Erro ao buscar avaliações: ${avaliacoesError.message}`);
        if (avaliacoes.length === 0) {
            return res.status(200).json([]);
        }

        // Passo 4: Coletar os IDs dos clientes que fizeram as avaliações
        const clienteUserIds = avaliacoes.map(a => a.user_id);

        // Passo 5: Buscar os perfis (nomes) desses clientes
        const { data: perfis, error: perfisError } = await supabase
            .from('perfis')
            .select('user_id, nome_completo')
            .in('user_id', clienteUserIds);

        if (perfisError) throw new Error(`Erro ao buscar perfis dos clientes: ${perfisError.message}`);

        // Passo 6: Criar um mapa para facilitar a busca (id -> nome)
        const perfisMap = new Map(perfis.map(p => [p.user_id, p]));

        // Passo 7: Juntar as avaliações com os nomes dos clientes
        const resultadoFinal = avaliacoes.map(avaliacao => ({
            ...avaliacao,
            cliente: perfisMap.get(avaliacao.user_id) || { nome_completo: 'Cliente Anônimo' }
        }));

        res.status(200).json(resultadoFinal);

    } catch (error) {
        console.error('Erro no controller de avaliações:', error.message);
        res.status(500).json({ error: 'Erro interno ao processar a requisição.' });
    }
};

const getProdutosDaLoja = async (req, res) => {
    const { loja_id } = req; // Usando o loja_id injetado pelo authMiddleware
    try {
        // Ajuste para buscar o nome da categoria junto com o produto
        const { data, error } = await supabase
            .from('produtos')
            .select(`*, categorias(nome_categoria)`)
            .eq('loja_id', loja_id)
            .order('nome', { ascending: true });
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar produtos.", error: error.message });
    }
};

const adicionarProduto = async (req, res) => {
    const { loja_id } = req;
    const { nome, descricao, preco, categoria_id } = req.body; 
    try {
        let imagem_url = null;
        if (req.file) {
            // Sua lógica de upload de imagem
        }
        const { data, error } = await supabase.from('produtos').insert([{ nome, descricao, preco, loja_id, categoria_id: parseInt(categoria_id) || null, imagem_url }]).select();
        if (error) throw error;
        res.status(201).json({ message: "Produto adicionado com sucesso!", produto: data });
    } catch (error) {
        res.status(500).json({ message: "Erro ao adicionar produto.", error: error.message });
    }
};

const editarProduto = async (req, res) => {
    const { loja_id } = req;
    const { id } = req.params;
    const { nome, descricao, preco, categoria_id } = req.body;
    try {
        const { data, error } = await supabase.from('produtos').update({ nome, descricao, preco, categoria_id: parseInt(categoria_id) || null }).match({ id, loja_id }).select().single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: "Erro ao editar produto.", error: error.message });
    }
};

const deletarProduto = async (req, res) => {
    const { loja_id } = req;
    const { id } = req.params;
    try {
        const { error } = await supabase.from('produtos').delete().match({ id, loja_id });
        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Erro ao deletar produto.", error: error.message });
    }
};

// --- FUNÇÕES DE CATEGORIAS (Novas) ---

const obterCategorias = async (req, res) => {
    const { loja_id } = req;
    try {
        const { data, error } = await supabase.from('categorias').select('id, nome_categoria').eq('loja_id', loja_id).order('nome_categoria');
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar categorias.", error: error.message });
    }
};

const adicionarCategoria = async (req, res) => {
    const { loja_id } = req;
    const { nome_categoria } = req.body;
    if (!nome_categoria) return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
    try {
        const { data, error } = await supabase.from('categorias').insert([{ nome_categoria: nome_categoria.trim(), loja_id }]).select().single();
        if (error) throw error;
        res.status(201).json({ message: 'Categoria criada com sucesso!', categoria: data });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ message: 'Essa categoria já existe.' });
        res.status(500).json({ message: 'Erro ao criar categoria.', error: error.message });
    }
};

const excluirCategoria = async (req, res) => {
    const { loja_id } = req;
    const { id } = req.params;
    try {
        await supabase.from('produtos').update({ categoria_id: null }).eq('categoria_id', id).eq('loja_id', loja_id);
        const { error } = await supabase.from('categorias').delete().match({ id: id, loja_id: loja_id });
        if (error) throw error;
        res.status(200).json({ message: 'Categoria excluída com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir categoria.', error: error.message });
    }
};

// Exportando AMBAS as funções
module.exports = {
    getDashboardStats,
    getSalesChartData,
    getRecentOrders,
    getProdutosDaLoja,
    getProdutosMaisVendidos,
    getAvaliacoesRecentes,
    adicionarProduto,
    editarProduto,
    deletarProduto,
    obterCategorias,
    adicionarCategoria,
    excluirCategoria
};