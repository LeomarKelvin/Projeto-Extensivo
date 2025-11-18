import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedPizzaria() {
  console.log('🍕 Criando pizzaria de teste...')

  // 1. Criar perfil de usuário
  const { data: perfil, error: perfilError } = await supabase
    .from('perfis')
    .insert({
      email: 'pizzaria@saborarte.com',
      nome: 'José da Silva',
      telefone: '(83) 99999-8888',
      tipo: 'loja',
      municipio: 'alagoa-nova'
    })
    .select()
    .single()

  if (perfilError) {
    console.error('❌ Erro ao criar perfil:', perfilError.message)
    // Se já existe, buscar
    const { data: perfilExistente } = await supabase
      .from('perfis')
      .select()
      .eq('email', 'pizzaria@saborarte.com')
      .single()
    
    if (!perfilExistente) {
      throw perfilError
    }
    console.log('ℹ️ Perfil já existe, usando existente')
  } else {
    console.log('✅ Perfil criado com sucesso')
  }

  const perfilId = perfil?.id || (await supabase
    .from('perfis')
    .select('id')
    .eq('email', 'pizzaria@saborarte.com')
    .single()).data?.id

  // 2. Criar loja
  const { data: loja, error: lojaError } = await supabase
    .from('lojas')
    .insert({
      perfil_id: perfilId,
      nome_loja: 'Pizzaria Sabor & Arte',
      categoria: 'pizzaria',
      descricao: 'As melhores pizzas artesanais de Alagoa Nova! Massa fina e crocante, ingredientes frescos e sabor incomparável.',
      telefone: '(83) 99999-8888',
      endereco: 'Rua das Pizzas, 123',
      municipio: 'alagoa-nova',
      aprovada: true,
      taxa_entrega: 5.00,
      tempo_entrega_min: 30,
      tempo_entrega_max: 45,
      pedido_minimo: 20.00
    })
    .select()
    .single()

  if (lojaError) {
    console.error('❌ Erro ao criar loja:', lojaError.message)
    // Se já existe, buscar
    const { data: lojaExistente } = await supabase
      .from('lojas')
      .select()
      .eq('nome_loja', 'Pizzaria Sabor & Arte')
      .single()
    
    if (!lojaExistente) {
      throw lojaError
    }
    console.log('ℹ️ Loja já existe, usando existente')
  } else {
    console.log('✅ Loja criada com sucesso')
  }

  const lojaId = loja?.id || (await supabase
    .from('lojas')
    .select('id')
    .eq('nome_loja', 'Pizzaria Sabor & Arte')
    .single()).data?.id

  // 3. Criar produtos
  const produtos = [
    {
      loja_id: lojaId,
      nome: 'Pizza Margherita',
      descricao: 'Molho de tomate, muçarela, manjericão fresco e azeite',
      preco: 35.00,
      categoria: 'Pizzas Tradicionais',
      disponivel: true
    },
    {
      loja_id: lojaId,
      nome: 'Pizza Calabresa',
      descricao: 'Molho de tomate, muçarela, calabresa fatiada e cebola',
      preco: 38.00,
      categoria: 'Pizzas Tradicionais',
      disponivel: true
    },
    {
      loja_id: lojaId,
      nome: 'Pizza Portuguesa',
      descricao: 'Molho de tomate, muçarela, presunto, ovos, cebola, azeitona e orégano',
      preco: 42.00,
      categoria: 'Pizzas Tradicionais',
      disponivel: true
    },
    {
      loja_id: lojaId,
      nome: 'Pizza Quatro Queijos',
      descricao: 'Muçarela, provolone, parmesão e catupiry',
      preco: 45.00,
      categoria: 'Pizzas Especiais',
      disponivel: true
    },
    {
      loja_id: lojaId,
      nome: 'Pizza Frango com Catupiry',
      descricao: 'Frango desfiado, catupiry, milho e mussarela',
      preco: 40.00,
      categoria: 'Pizzas Especiais',
      disponivel: true
    },
    {
      loja_id: lojaId,
      nome: 'Pizza Bacon',
      descricao: 'Molho de tomate, muçarela, bacon crocante e cebola',
      preco: 40.00,
      categoria: 'Pizzas Especiais',
      disponivel: true
    },
    {
      loja_id: lojaId,
      nome: 'Refrigerante 2L',
      descricao: 'Coca-Cola, Guaraná ou Fanta',
      preco: 10.00,
      categoria: 'Bebidas',
      disponivel: true
    },
    {
      loja_id: lojaId,
      nome: 'Suco Natural 500ml',
      descricao: 'Laranja, limão ou maracujá',
      preco: 8.00,
      categoria: 'Bebidas',
      disponivel: true
    }
  ]

  console.log('🍕 Criando produtos...')
  
  // Deletar produtos existentes primeiro
  await supabase.from('produtos').delete().eq('loja_id', lojaId)
  
  const { error: produtosError } = await supabase
    .from('produtos')
    .insert(produtos)

  if (produtosError) {
    console.error('❌ Erro ao criar produtos:', produtosError.message)
    throw produtosError
  }

  console.log('✅ 8 produtos criados com sucesso!')
  console.log('')
  console.log('🎉 Pizzaria Sabor & Arte criada com sucesso!')
  console.log(`📍 Município: alagoa-nova`)
  console.log(`🆔 ID da loja: ${lojaId}`)
  console.log(`🍕 6 pizzas + 2 bebidas cadastradas`)
}

seedPizzaria()
  .then(() => {
    console.log('✨ Seed concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })
