import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

async function registerPizzaria() {
  const baseUrl = 'http://localhost:5000'
  
  const userData = {
    email: 'pizzaria@saborarte.com',
    password: 'pizzaria123',
    nome: 'José da Silva',
    tipo: 'loja',
    municipio: 'alagoa-nova',
    nome_loja: 'Pizzaria Sabor & Arte'
  }
  
  console.log('🍕 Registrando nova pizzaria...')
  console.log('Email:', userData.email)
  console.log('Município:', userData.municipio)
  
  try {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Erro no registro:', data)
      throw new Error(data.error || 'Erro desconhecido')
    }
    
    console.log('✅ Conta criada com sucesso!')
    console.log('User ID:', data.user?.id)
    console.log('Perfil ID:', data.perfil?.id)
    console.log('Loja ID:', data.loja?.id)
    
    return data
  } catch (error) {
    console.error('💥 Erro fatal:', error)
    throw error
  }
}

registerPizzaria()
  .then(() => {
    console.log('\n🎉 Pizzaria registrada! Agora é só adicionar os produtos.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Falhou:', error.message)
    process.exit(1)
  })
