const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jrskruadcwuytvjeqybh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyc2tydWFkY3d1eXR2amVxeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIyNzg5MywiZXhwIjoyMDY0ODAzODkzfQ.SQqgGs7mEPPZ7dmS7NjPXUvsDPRHa-UZSY09SZntrAc'
);

async function populate() {
  console.log('🔄 Populando categorias...\n');
  
  const categorias = [
    { nome_categoria: 'Restaurantes', icone: '🍽️' },
    { nome_categoria: 'Mercados', icone: '🛒' },
    { nome_categoria: 'Farmácias', icone: '💊' },
    { nome_categoria: 'Padarias', icone: '🥖' },
    { nome_categoria: 'Bebidas', icone: '🥤' },
    { nome_categoria: 'Outros', icone: '📦' }
  ];
  
  const { data, error } = await supabase
    .from('categorias')
    .insert(categorias)
    .select();
  
  if (error) {
    console.log('❌ Erro ao inserir categorias:', error.message);
    console.log('Detalhes:', error);
  } else {
    console.log(`✅ ${data.length} categorias inseridas!`);
    console.log('Categorias:', data.map(c => c.nome_categoria).join(', '));
  }
}

populate();
