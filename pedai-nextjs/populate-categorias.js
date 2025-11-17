const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jrskruadcwuytvjeqybh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyc2tydWFkY3d1eXR2amVxeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIyNzg5MywiZXhwIjoyMDY0ODAzODkzfQ.SQqgGs7mEPPZ7dmS7NjPXUvsDPRHa-UZSY09SZntrAc'
);

async function populate() {
  console.log('🔄 Populando categorias...\n');
  
  const categorias = [
    { nome_categoria: 'Restaurantes' },
    { nome_categoria: 'Mercados' },
    { nome_categoria: 'Farmácias' },
    { nome_categoria: 'Padarias' },
    { nome_categoria: 'Bebidas' },
    { nome_categoria: 'Outros' }
  ];
  
  const { data, error } = await supabase
    .from('categorias')
    .insert(categorias)
    .select();
  
  if (error) {
    console.log('❌ Erro:', error.message);
  } else {
    console.log(`✅ ${data.length} categorias inseridas!`);
    data.forEach(c => console.log(`  - ${c.nome_categoria} (ID: ${c.id})`));
  }
}

populate();
