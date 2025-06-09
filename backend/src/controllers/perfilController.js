import { supabase } from '../config/supabaseClient.js';

// Função para buscar o perfil de um usuário logado
export const buscarPerfil = async (req, res) => {
  // O Express já nos entrega o objeto 'user' na requisição graças ao middleware de autenticação
  const user = req.user;

  try {
    // Buscamos na tabela 'profiles' onde o 'id' é igual ao do usuário autenticado
    const { data: profile, error } = await supabase
      .from('profiles') // Supõe-se que você tenha uma tabela 'profiles' linkada aos usuários
      .select('*')
      .eq('id', user.id)
      .single(); // .single() para pegar apenas um resultado, não um array

    if (error && error.code !== 'PGRST116') { // Ignora erro se o perfil não for encontrado
      throw error;
    }

    if (!profile) {
      // Se não houver perfil, retorna os dados básicos do usuário da tabela 'auth.users'
      return res.status(200).json({
        id: user.id,
        email: user.email,
        // Adicione outros campos padrão se necessário
      });
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Função para atualizar o perfil de um usuário logado
export const atualizarPerfil = async (req, res) => {
  const user = req.user;
  const { nome_completo, telefone } = req.body; // Pega os dados que o usuário enviou

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        nome_completo: nome_completo,
        telefone: telefone,
        updated_at: new Date(),
      })
      .eq('id', user.id) // Garante que ele só pode atualizar o próprio perfil
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({ message: 'Perfil atualizado com sucesso!', profile: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};