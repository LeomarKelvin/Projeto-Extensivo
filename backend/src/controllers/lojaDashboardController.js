const { supabase } = require('../config/supabaseClient');

const getDashboardStats = async (req, res) => {
    const perfilId = req.perfil.id;

    try {
        // Passo 1: Descobrir o ID da loja e buscar a nota de avaliação.
        const { data: lojaData, error: lojaError } = await supabase
            .from('lojas')
            .select('id, nota_avaliacao') // Agora a coluna 'nota_avaliacao' existe.
            .eq('perfil_id', perfilId)
            .single();

        if (lojaError || !lojaData) {
            return res.status(404).json({ error: 'Nenhuma loja encontrada para este perfil.' });
        }

        const lojaId = lojaData.id;

        // Passo 2: Buscar os pedidos da loja usando a coluna 'valor_total'.
        const { data: pedidos, error: pedidosError } = await supabase
            .from('pedidos')
            .select('valor_total, user_id, status') // Agora a coluna 'valor_total' existe.
            .eq('loja_id', lojaId);

        if (pedidosError) throw pedidosError;

        // Passo 3: Calcular as estatísticas.
        const totalPedidos = pedidos.length;
        const faturamento = pedidos
            .filter(p => p.status === 'Entregue')
            .reduce((acc, pedido) => acc + pedido.valor_total, 0); // Usando a coluna correta.
        const novosClientes = new Set(pedidos.map(p => p.user_id)).size;
        const avaliacaoMedia = lojaData.nota_avaliacao || 0;

        // Passo 4: Enviar a resposta.
        res.status(200).json({
            totalPedidos,
            faturamento,
            novosClientes,
            avaliacaoMedia
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas do dashboard:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getDashboardStats,
};