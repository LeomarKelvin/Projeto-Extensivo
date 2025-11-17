const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jrskruadcwuytvjeqybh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyc2tydWFkY3d1eXR2amVxeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIyNzg5MywiZXhwIjoyMDY0ODAzODkzfQ.SQqgGs7mEPPZ7dmS7NjPXUvsDPRHa-UZSY09SZntrAc'
);

async function populateDatabase() {
  console.log('🚀 Iniciando população do banco de dados...\n');

  // 1. CRIAR LOJAS
  console.log('📍 Criando lojas para os 3 municípios...\n');
  
  const lojas = [
    // ALAGOA NOVA
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
    
    // ESPERANÇA
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
    
    // LAGOA SECA
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

  const { data: lojasData, error: lojasError } = await supabase
    .from('lojas')
    .insert(lojas)
    .select();

  if (lojasError) {
    console.error('❌ Erro ao criar lojas:', lojasError);
    return;
  }

  console.log(`✅ ${lojasData.length} lojas criadas com sucesso!\n`);
  lojasData.forEach(l => console.log(`   - ${l.nome_loja} (${l.municipio})`));

  // 2. CRIAR CATEGORIAS DE PRODUTOS PARA CADA LOJA
  console.log('\n📂 Criando categorias de produtos...\n');
  
  const categorias = [];
  
  lojasData.forEach(loja => {
    if (loja.categoria === 'Restaurantes') {
      categorias.push(
        { nome_categoria: 'Pratos Principais', loja_id: loja.id },
        { nome_categoria: 'Bebidas', loja_id: loja.id },
        { nome_categoria: 'Sobremesas', loja_id: loja.id }
      );
    } else if (loja.categoria === 'Mercados') {
      categorias.push(
        { nome_categoria: 'Alimentos', loja_id: loja.id },
        { nome_categoria: 'Bebidas', loja_id: loja.id },
        { nome_categoria: 'Limpeza', loja_id: loja.id }
      );
    } else if (loja.categoria === 'Farmácias') {
      categorias.push(
        { nome_categoria: 'Medicamentos', loja_id: loja.id },
        { nome_categoria: 'Higiene', loja_id: loja.id },
        { nome_categoria: 'Beleza', loja_id: loja.id }
      );
    } else if (loja.categoria === 'Padarias') {
      categorias.push(
        { nome_categoria: 'Pães', loja_id: loja.id },
        { nome_categoria: 'Bolos', loja_id: loja.id },
        { nome_categoria: 'Salgados', loja_id: loja.id }
      );
    } else if (loja.categoria === 'Bebidas') {
      categorias.push(
        { nome_categoria: 'Cervejas', loja_id: loja.id },
        { nome_categoria: 'Refrigerantes', loja_id: loja.id },
        { nome_categoria: 'Vinhos', loja_id: loja.id }
      );
    }
  });

  const { data: categoriasData, error: categoriasError } = await supabase
    .from('categorias')
    .insert(categorias)
    .select();

  if (categoriasError) {
    console.error('❌ Erro ao criar categorias:', categoriasError);
    return;
  }

  console.log(`✅ ${categoriasData.length} categorias criadas!\n`);

  // 3. CRIAR PRODUTOS
  console.log('🛍️ Criando produtos...\n');
  
  const produtos = [];

  // Pizzaria Sabor da Hora (Alagoa Nova)
  const pizzariaId = lojasData.find(l => l.nome_loja === 'Pizzaria Sabor da Hora').id;
  produtos.push(
    { nome: 'Pizza Margherita', descricao: 'Molho, mussarela, tomate e manjericão', preco: 35.00, loja_id: pizzariaId, imagem_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300' },
    { nome: 'Pizza Calabresa', descricao: 'Molho, mussarela, calabresa e cebola', preco: 38.00, loja_id: pizzariaId, imagem_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300' },
    { nome: 'Coca-Cola 2L', descricao: 'Refrigerante Coca-Cola 2 litros', preco: 10.00, loja_id: pizzariaId }
  );

  // Hamburgueria do Chef (Esperança)
  const hamburgueriaId = lojasData.find(l => l.nome_loja === 'Hamburgueria do Chef').id;
  produtos.push(
    { nome: 'X-Burger Clássico', descricao: 'Hambúrguer artesanal 180g, queijo, alface, tomate', preco: 25.00, loja_id: hamburgueriaId, imagem_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300' },
    { nome: 'X-Bacon', descricao: 'Hambúrguer 180g, bacon crocante, queijo cheddar', preco: 28.00, loja_id: hamburgueriaId, imagem_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300' },
    { nome: 'Batata Frita', descricao: 'Porção de batatas fritas crocantes', preco: 12.00, loja_id: hamburgueriaId }
  );

  // Churrascaria Boi na Brasa (Lagoa Seca)
  const churrascariaId = lojasData.find(l => l.nome_loja === 'Churrascaria Boi na Brasa').id;
  produtos.push(
    { nome: 'Picanha 500g', descricao: 'Picanha nobre grelhada no ponto', preco: 65.00, loja_id: churrascariaId, imagem_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300' },
    { nome: 'Costela BBQ', descricao: 'Costela bovina ao molho barbecue', preco: 55.00, loja_id: churrascariaId },
    { nome: 'Farofa da Casa', descricao: 'Farofa especial com bacon e banana', preco: 15.00, loja_id: churrascariaId }
  );

  // Mercadinho São José (Alagoa Nova)
  const mercadinhoId = lojasData.find(l => l.nome_loja === 'Mercadinho São José').id;
  produtos.push(
    { nome: 'Arroz 5kg', descricao: 'Arroz tipo 1 pacote 5kg', preco: 28.00, loja_id: mercadinhoId },
    { nome: 'Feijão 1kg', descricao: 'Feijão carioca pacote 1kg', preco: 8.50, loja_id: mercadinhoId },
    { nome: 'Óleo de Soja 900ml', descricao: 'Óleo de soja garrafa 900ml', preco: 7.00, loja_id: mercadinhoId }
  );

  // Padaria Pão Quente (Esperança)
  const padariaId = lojasData.find(l => l.nome_loja === 'Padaria Pão Quente').id;
  produtos.push(
    { nome: 'Pão Francês', descricao: 'Pão francês tradicional - unidade', preco: 0.50, loja_id: padariaId, imagem_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300' },
    { nome: 'Bolo de Chocolate', descricao: 'Fatia de bolo de chocolate caseiro', preco: 6.00, loja_id: padariaId },
    { nome: 'Coxinha', descricao: 'Salgado de frango - unidade', preco: 4.50, loja_id: padariaId }
  );

  const { data: produtosData, error: produtosError } = await supabase
    .from('produtos')
    .insert(produtos)
    .select();

  if (produtosError) {
    console.error('❌ Erro ao criar produtos:', produtosError);
    console.error('Detalhes:', JSON.stringify(produtosError, null, 2));
    return;
  }

  console.log(`✅ ${produtosData.length} produtos criados!\n`);

  // RESUMO FINAL
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ POPULAÇÃO CONCLUÍDA COM SUCESSO!\n');
  console.log(`📊 Resumo:`);
  console.log(`   • ${lojasData.length} lojas`);
  console.log(`   • ${categoriasData.length} categorias de produtos`);
  console.log(`   • ${produtosData.length} produtos`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

populateDatabase();
