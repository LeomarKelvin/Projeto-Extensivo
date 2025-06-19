// Arquivo: backend/src/config/supabaseClient.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// =========== INÍCIO DO BLOCO DE DEBUG ===========
console.log('--- VERIFICANDO VARIÁVEIS DE AMBIENTE ---');
console.log('URL do Supabase lida:', supabaseUrl ? `...${supabaseUrl.slice(-6)}` : '!!! NÃO ENCONTRADA !!!');
console.log('Chave Anon lida:   ', supabaseAnonKey ? `...${supabaseAnonKey.slice(-6)}` : '!!! NÃO ENCONTRADA !!!');
console.log('-----------------------------------------');
// =========== FIM DO BLOCO DE DEBUG ===========

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error('As variáveis de ambiente do Supabase (URL, ANON_KEY, SERVICE_ROLE_KEY) não foram definidas.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = { supabase, supabaseAdmin };