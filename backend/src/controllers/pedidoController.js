import { supabase } from '../config/supabaseClient.js';

// Função para buscar os pedidos de um usuário específico
export const buscarPedidosDoUsuario = async (req, res) => {
  // A MÁGICA DA AUTENTICAÇÃO ACONTECE AQUI
  // O token (crachá) do usuário é enviado pelo frontend no cabeçalho (header)
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Nenhum token fornecido. Acesso não autorizado.' });
  }

  try {
    // Usamos o token para descobrir quem é o usuário no Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    // Agora que sabemos quem é o usuário, buscamos os pedidos dele
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos') // O nome da sua tabela de pedidos
      .select('*') // Você pode ser mais específico aqui, ex: 'id, created_at, total, status, loja_id (*)'
      .eq('user_id', user.id); // Filtra apenas os pedidos cujo 'user_id' é igual ao do usuário logado

    if (pedidosError) {
      throw pedidosError;
    }

    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const criarPedido = async (req, res) => {
    const user = req.user;
    const { items, total, loja_id } = req.body; // Pega os itens, o total e o id da loja

    if (!items || items.length === 0 || !total || !loja_id) {
        return res.status(400).json({ error: 'Dados do pedido incompletos.' });
    }

    try {
        // 1. Insere o pedido principal na tabela 'pedidos'
        const { data: novoPedido, error: pedidoError } = await supabase
            .from('pedidos')
            .insert({
                user_id: user.id,
                total: total,
                status: 'Pendente', // Status inicial do pedido
                loja_id: loja_id
            })
            .select()
            .single();

        if (pedidoError) {
            throw pedidoError;
        }

        // 2. Prepara os itens do pedido para inserir na tabela 'pedido_itens'
        const itensParaInserir = items.map(item => ({
            pedido_id: novoPedido.id, // O ID do pedido que acabamos de criar
            produto_id: item.id, // O ID do produto
            quantidade: item.quantidade,
            preco_unitario: item.preco
        }));

        // 3. Insere todos os itens de uma vez
        const { error: itensError } = await supabase
            .from('pedido_itens')
            .insert(itensParaInserir);

        if (itensError) {
            // Se der erro ao inserir os itens, é uma boa prática deletar o pedido principal que foi criado
            await supabase.from('pedidos').delete().eq('id', novoPedido.id);
            throw itensError;
        }

        res.status(201).json({ message: 'Pedido criado com sucesso!', pedido: novoPedido });

    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({ error: 'Falha ao criar o pedido.' });
    }
};

// Aqui você pode adicionar outras funções no futuro, como criar um novo pedido
// export const criarPedido = async (req, res) => { ... };