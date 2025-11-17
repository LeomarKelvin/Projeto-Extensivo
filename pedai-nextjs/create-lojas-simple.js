const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jrskruadcwuytvjeqybh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyc2tydWFkY3d1eXR2amVxeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIyNzg5MywiZXhwIjoyMDY0ODAzODkzfQ.SQqgGs7mEPPZ7dmS7NjPXUvsDPRHa-UZSY09SZntrAc'
);

async function create() {
  console.log('📋 Tentando criar loja...\n');
  
  // Tentar com campos mínimos
  const loja = {
    nome_loja: 'Pizzaria Sabor da Hora',
    municipio: 'Alagoa Nova',
    categoria: 'Restaurantes'
  };
  
  const { data, error } = await supabase
    .from('lojas')
    .insert(loja)
    .select();
  
  if (error) {
    console.log('❌ Erro:', error.message);
    console.log('Code:', error.code);
    console.log('\nDetalhes completos:');
    console.log(JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Loja criada!');
    console.log('Colunas retornadas:', Object.keys(data[0]).join(', '));
    console.log('Dados:', data[0]);
  }
}

create();
