const supabase = require('../config/supabaseClient');

const criarPedido = async (req, res) => {
    const { items, total, loja_id } = req.body;
    const user = req.user;
    try {
        const { data: novoPedido, error: pedidoError } = await supabase.from('pedidos').insert({ user_id: user.id, total: total, status: 'Pendente', loja_id: loja_id }).select().single();
        if (pedidoError) throw pedidoError;
        const itensParaInserir = items.map(item => ({ pedido_id: novoPedido.id, produto_id: item.id, quantidade: item.quantidade, preco_unitario: item.preco }));
        const { error: itensError } = await supabase.from('pedido_itens').insert(itensParaInserir);
        if (itensError) {
            await supabase.from('pedidos').delete().eq('id', novoPedido.id);
            throw itensError;
        }
        res.status(201).json({ message: 'Pedido criado com sucesso!', pedido: novoPedido });
    } catch (error) {
        res.status(500).json({ error: 'Falha ao criar o pedido.' });
    }
};

const buscarPedidos = async (req, res) => {
    const user = req.user;
    const perfil = req.perfil; // Fornecido pelo nosso authMiddleware
    const { status } = req.query;
    try {
        // Corrigido: 'lojas(nome_fantasia)' para buscar o nome correto da loja
        let query = supabase.from('pedidos').select(`id, created_at, total, status, lojas ( nome_fantasia )`).order('created_at', { ascending: false });

        // Se o usuário não for admin, ele só vê os próprios pedidos
        if (perfil.tipo !== 'admin') {
            query = query.eq('user_id', user.id);
        }

        if (status && status !== 'Todos os pedidos') {
            query = query.eq('status', status);
        }
        const { data: pedidos, error: pedidosError } = await query;
        if (pedidosError) throw pedidosError;
        res.status(200).json(pedidos);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar os pedidos.' });
    }
};

module.exports = { criarPedido, buscarPedidos: buscarPedidos };