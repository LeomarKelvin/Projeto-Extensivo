const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jrskruadcwuytvjeqybh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyc2tydWFkY3d1eXR2amVxeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIyNzg5MywiZXhwIjoyMDY0ODAzODkzfQ.SQqgGs7mEPPZ7dmS7NjPXUvsDPRHa-UZSY09SZntrAc'
);

async function fix() {
  console.log('🧹 Limpando tudo e recriando dados limpos...\n');
  
  // Deletar tudo
  await supabase.from('produtos').delete().neq('id', 0);
  await supabase.from('categorias').delete().neq('id', 0);
  await supabase.from('lojas').delete().neq('id', 0);
  
  console.log('✅ Dados antigos removidos!\n');
  console.log('📍 Criando lojas limpas...\n');
  
  const lojas = [
    // ALAGOA NOVA (amarelo #FFD100)
    {
      nome_loja: 'Pizzaria Sabor da Hora',
      categoria: 'Restaurantes',
      municipio: 'Alagoa Nova',
      url_imagem: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
      nota_avaliacao: 4.5
    },
    {
      nome_loja: 'Mercadinho São José',
      categoria: 'Mercados',
      municipio: 'Alagoa Nova',
      url_imagem: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400',
      nota_avaliacao: 4.2
    },
    {
      nome_loja: 'Farmácia Popular',
      categoria: 'Farmácias',
      municipio: 'Alagoa Nova',
      url_imagem: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400',
      nota_avaliacao: 4.8
    },
    
    // ESPERANÇA (azul #00D4FF)
    {
      nome_loja: 'Hamburgueria do Chef',
      categoria: 'Restaurantes',
      municipio: 'Esperança',
      url_imagem: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      nota_avaliacao: 4.7
    },
    {
      nome_loja: 'Supermercado Economix',
      categoria: 'Mercados',
      municipio: 'Esperança',
      url_imagem: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=400',
      nota_avaliacao: 4.3
    },
    {
      nome_loja: 'Padaria Pão Quente',
      categoria: 'Padarias',
      municipio: 'Esperança',
      url_imagem: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
      nota_avaliacao: 4.6
    },
    
    // LAGOA SECA (verde #00FF85)
    {
      nome_loja: 'Churrascaria Boi na Brasa',
      categoria: 'Restaurantes',
      municipio: 'Lagoa Seca',
      url_imagem: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
      nota_avaliacao: 4.9
    },
    {
      nome_loja: 'Distribuidora de Bebidas Gelada',
      categoria: 'Bebidas',
      municipio: 'Lagoa Seca',
      url_imagem: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400',
      nota_avaliacao: 4.4
    },
    {
      nome_loja: 'Lanchonete da Praça',
      categoria: 'Restaurantes',
      municipio: 'Lagoa Seca',
      url_imagem: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400',
      nota_avaliacao: 4.1
    }
  ];

  const { data: lojasData, error } = await supabase
    .from('lojas')
    .insert(lojas)
    .select();

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log(`✅ ${lojasData.length} lojas criadas!\n`);
  
  // Criar produtos para algumas lojas
  console.log('🛍️ Criando produtos...\n');
  
  const pizzariaId = lojasData.find(l => l.nome_loja === 'Pizzaria Sabor da Hora').id;
  const hamburgueriaId = lojasData.find(l => l.nome_loja === 'Hamburgueria do Chef').id;
  const churrascariaId = lojasData.find(l => l.nome_loja === 'Churrascaria Boi na Brasa').id;
  
  const produtos = [
    // Pizzaria
    { nome: 'Pizza Margherita', descricao: 'Molho, mussarela, tomate e manjericão', preco: 35.00, loja_id: pizzariaId, imagem_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300' },
    { nome: 'Pizza Calabresa', descricao: 'Molho, mussarela, calabresa e cebola', preco: 38.00, loja_id: pizzariaId, imagem_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300' },
    { nome: 'Coca-Cola 2L', descricao: 'Refrigerante', preco: 10.00, loja_id: pizzariaId },
    
    // Hamburgueria
    { nome: 'X-Burger Clássico', descricao: 'Hambúrguer artesanal 180g, queijo, alface, tomate', preco: 25.00, loja_id: hamburgueriaId, imagem_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300' },
    { nome: 'X-Bacon', descricao: 'Hambúrguer 180g, bacon crocante, queijo cheddar', preco: 28.00, loja_id: hamburgueriaId },
    { nome: 'Batata Frita', descricao: 'Porção de batatas fritas', preco: 12.00, loja_id: hamburgueriaId },
    
    // Churrascaria
    { nome: 'Picanha 500g', descricao: 'Picanha nobre grelhada', preco: 65.00, loja_id: churrascariaId, imagem_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300' },
    { nome: 'Costela BBQ', descricao: 'Costela ao molho barbecue', preco: 55.00, loja_id: churrascariaId },
    { nome: 'Farofa da Casa', descricao: 'Farofa com bacon e banana', preco: 15.00, loja_id: churrascariaId }
  ];

  const { data: produtosData, error: prodError } = await supabase
    .from('produtos')
    .insert(produtos)
    .select();

  if (prodError) {
    console.error('❌ Erro ao criar produtos:', prodError);
    return;
  }

  console.log(`✅ ${produtosData.length} produtos criados!\n`);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ BANCO LIMPO E ATUALIZADO!\n');
  console.log('📊 Resumo Final:');
  console.log(`   • 9 lojas (3 por município)`);
  console.log(`   • 9 produtos`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

fix();
