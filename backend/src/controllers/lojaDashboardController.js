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

const getProdutosDaLoja = async (req, res) => {
    // O ID da loja é pego do usuário autenticado pelo middleware
    const lojaId = req.user.id;

    try {
        const { data, error } = await supabase
            .from('produtos')
            .select(`
                id,
                nome,
                descricao,
                preco,
                disponivel,
                imagem_url
            `)
            .eq('loja_id', lojaId) // Filtra pela ID da loja logada
            .order('nome', { ascending: true }); // Ordena os produtos por nome

        if (error) {
            throw error;
        }

        res.status(200).json(data);

    } catch (error) {
        console.error('Erro ao buscar produtos da loja:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar produtos.' });
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

// Exportando AMBAS as funções
module.exports = {
    getDashboardStats,
    getSalesChartData,
    getRecentOrders,
    getProdutosDaLoja,
    getProdutosMaisVendidos
};