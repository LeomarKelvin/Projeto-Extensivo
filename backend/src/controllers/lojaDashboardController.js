const supabase = require('../config/supabaseClient');

const buscarPedidosDaLoja = async (req, res) => {
    const user = req.user;
    try {
        const { data: loja, error: lojaError } = await supabase.from('lojas').select('id').eq('owner_id', user.id).single();
        if (lojaError || !loja) throw new Error('Você não está associado a nenhuma loja.');
        const { data: pedidos, error: pedidosError } = await supabase.from('pedidos').select(`id, created_at, total, status, cliente:user_id ( id, nome_completo, email, telefone )`).eq('loja_id', loja.id).order('created_at', { ascending: false });
        if (pedidosError) throw pedidosError;
        res.status(200).json(pedidos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const atualizarStatusPedido = async (req, res) => {
    const { pedido_id, novo_status } = req.body;
    if (!pedido_id || !novo_status) return res.status(400).json({ error: 'ID do pedido e novo status são obrigatórios.' });
    try {
        const { data, error } = await supabase.from('pedidos').update({ status: novo_status }).eq('id', pedido_id).select();
        if (error) throw error;
        res.status(200).json({ message: 'Status do pedido atualizado com sucesso!', pedido: data });
    } catch (error) {
        res.status(500).json({ error: 'Falha ao atualizar status do pedido: ' + error.message });
    }
};

module.exports = { buscarPedidosDaLoja, atualizarStatusPedido };