import { supabase } from '../shared/auth.js';

const API_URL = 'http://localhost:3000/api';

// Função para buscar os dados do perfil no backend
export async function fetchPerfil() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  try {
    const response = await fetch(`${API_URL}/perfil`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    if (!response.ok) throw new Error('Falha ao buscar perfil.');
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return null;
  }
}

// Função para enviar os dados atualizados para o backend
export async function updatePerfil(profileData) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  try {
    const response = await fetch(`${API_URL}/perfil/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) throw new Error('Falha ao atualizar perfil.');
    return await response.json();
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return { error: error.message };
  }
}