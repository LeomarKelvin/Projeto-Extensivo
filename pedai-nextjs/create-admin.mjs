import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jrskruadcwuytvjeqybh.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdmin() {
  try {
    // 1. Criar usuário na auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@pedai.com',
      password: 'admin123',
      email_confirm: true
    })

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError)
      process.exit(1)
    }

    console.log('✅ Usuário criado:', authData.user.id)

    // 2. Criar perfil admin (sem telefone)
    const { data: perfilData, error: perfilError } = await supabase
      .from('perfis')
      .insert({
        user_id: authData.user.id,
        email: 'admin@pedai.com',
        nome_completo: 'Administrador PedeAí',
        tipo: 'admin'
      })
      .select()
      .single()

    if (perfilError) {
      console.error('❌ Erro ao criar perfil:', perfilError)
      process.exit(1)
    }

    console.log('✅ Perfil admin criado:', perfilData.id)
    console.log('📧 Email: admin@pedai.com')
    console.log('🔑 Senha: admin123')
    console.log('🎯 Tipo: admin')
  } catch (error) {
    console.error('❌ Erro geral:', error)
    process.exit(1)
  }
}

createAdmin()
