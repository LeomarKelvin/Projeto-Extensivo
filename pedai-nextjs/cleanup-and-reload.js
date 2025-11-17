const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jrskruadcwuytvjeqybh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyc2tydWFkY3d1eXR2amVxeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIyNzg5MywiZXhwIjoyMDY0ODAzODkzfQ.SQqgGs7mEPPZ7dmS7NjPXUvsDPRHa-UZSY09SZntrAc'
);

async function cleanup() {
  console.log('🧹 Removendo lojas com dados null...\n');
  
  const { data, error } = await supabase
    .from('lojas')
    .delete()
    .is('nome_loja', null);
  
  if (error) {
    console.error('❌ Erro:', error);
  } else {
    console.log('✅ Lojas null removidas!\n');
  }
  
  console.log('📊 Testando filtro por município...\n');
  
  const { data: lojas, error: erro } = await supabase
    .from('lojas')
    .select('*')
    .eq('municipio', 'Alagoa Nova');
  
  if (erro) {
    console.error('❌ Erro ao filtrar:', erro);
  } else {
    console.log(`✅ ${lojas.length} lojas em Alagoa Nova:`);
    lojas.forEach(l => console.log(`   - ${l.nome_loja}`));
  }
}

cleanup();
