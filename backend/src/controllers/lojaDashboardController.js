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
    const perfilId = req.perfil.id;

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

        // Busca os 5 pedidos mais recentes, incluindo o nome do cliente
        const { data: pedidos, error: pedidosError } = await supabase
            .from('pedidos')
            .select(`
                id,
                created_at,
                valor_total,
                status,
                cliente:perfis ( nome_completo ) 
            `)
            .eq('loja_id', lojaId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (pedidosError) throw pedidosError;

        res.status(200).json(pedidos);

    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar pedidos recentes: ' + error.message });
    }
};

const getProdutosDaLoja = async (req, res) => {
    const perfilId = req.perfil.id;

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

        // Busca todos os produtos da loja, ordenados por nome
        const { data: produtos, error: produtosError } = await supabase
            .from('produtos')
            .select('*')
            .eq('loja_id', lojaId)
            .order('nome', { ascending: true });

        if (produtosError) throw produtosError;

        res.status(200).json(produtos);

    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar produtos da loja: ' + error.message });
    }
};

// Exportando AMBAS as funções
module.exports = {
    getDashboardStats,
    getSalesChartData,
    getRecentOrders,
    getProdutosDaLoja,
};