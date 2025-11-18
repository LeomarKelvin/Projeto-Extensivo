import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jrskruadcwuytvjeqybh.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetAdminPassword() {
  try {
    console.log('🔄 Buscando usuário admin...')
    
    // Buscar o perfil admin para obter o user_id
    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('user_id, email')
      .eq('email', 'admin@pedai.com')
      .single()

    if (perfilError || !perfil) {
      console.error('❌ Perfil admin não encontrado:', perfilError)
      process.exit(1)
    }

    console.log('✅ Perfil encontrado:', perfil.user_id)

    // Atualizar a senha do usuário
    const { data: userData, error: updateError } = await supabase.auth.admin.updateUserById(
      perfil.user_id,
      { 
        password: 'admin123',
        email_confirm: true
      }
    )

    if (updateError) {
      console.error('❌ Erro ao atualizar senha:', updateError)
      process.exit(1)
    }

    console.log('✅ Senha do admin atualizada com sucesso!')
    console.log('📧 Email: admin@pedai.com')
    console.log('🔑 Nova senha: admin123')
    console.log('🎯 Tipo: admin')
    console.log('\n✨ Agora você pode fazer login no sistema!')
  } catch (error) {
    console.error('❌ Erro geral:', error)
    process.exit(1)
  }
}

resetAdminPassword()
