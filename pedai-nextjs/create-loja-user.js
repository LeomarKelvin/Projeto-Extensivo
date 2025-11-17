const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createLojaUser() {
  console.log('🔧 Criando usuário lojista de teste...\n')
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'loja@pizzaria.com',
    password: 'senha123',
    email_confirm: true
  })
  
  if (authError) {
    console.error('❌ Erro ao criar usuário:', authError.message)
    return
  }
  
  console.log('✅ Usuário criado:', authData.user.id)
  
  // Create perfil
  const { data: perfil, error: perfilError } = await supabase
    .from('perfis')
    .insert({
      user_id: authData.user.id,
      tipo: 'loja',
      nome_completo: 'Pizzaria Sabor da Hora',
      telefone: '(83) 98888-1111'
    })
    .select()
    .single()
  
  if (perfilError) {
    console.error('❌ Erro ao criar perfil:', perfilError)
    return
  }
  
  console.log('✅ Perfil criado:', perfil.id)
  
  // Update loja with perfil_id
  const { error: updateError } = await supabase
    .from('lojas')
    .update({ perfil_id: perfil.id, user_id: authData.user.id })
    .eq('id', 1)
  
  if (updateError) {
    console.error('❌ Erro ao vincular loja:', updateError)
    return
  }
  
  console.log('✅ Loja vinculada ao perfil!\n')
  console.log('📧 Email: loja@pizzaria.com')
  console.log('🔑 Senha: senha123')
}

createLojaUser().catch(console.error)
