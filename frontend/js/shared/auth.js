
// PASSO 1: Importa a função 'createClient' diretamente da biblioteca do Supabase.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ATENÇÃO: Verifique se suas chaves do Supabase estão corretas aqui.
const SUPABASE_URL = 'https://jrskruadcwuytvjeqybh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyc2tydWFkY3d1eXR2amVxeWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMjc4OTMsImV4cCI6MjA2NDgwMzg5M30.JzNlpPJ7jAONIpUK92zg-6YLPK6WRRfhotYiMu6KFjs';

// PASSO 2: Agora usamos a função 'createClient' diretamente para criar nossa conexão.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Verifica a sessão atual do usuário.
 * @returns {Promise<import('@supabase/supabase-js').User | null>} O objeto do usuário se estiver logado, ou nulo.
 */
export async function getUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        return session.user;
    }
    return null;
}

/**
 * Função para fazer logout.
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Erro ao fazer logout:', error);
    } else {
        // Redireciona para a página inicial após o logout
        window.location.href = '/frontend/Inicio.html';
    }
}