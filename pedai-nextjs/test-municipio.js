const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jrskruadcwuytvjeqybh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyc2tydWFkY3d1eXR2amVxeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIyNzg5MywiZXhwIjoyMDY0ODAzODkzfQ.SQqgGs7mEPPZ7dmS7NjPXUvsDPRHa-UZSY09SZntrAc'
);

async function test() {
  console.log('🔍 Testando consulta SEM filtro de municipio...\n');
  
  const { data, error } = await supabase
    .from('lojas')
    .select('id, nome_loja, categoria')
    .limit(3);
  
  if (error) {
    console.error('❌ Erro:', error);
  } else {
    console.log('✅ Lojas encontradas:', data.length);
    console.log('Colunas retornadas:', Object.keys(data[0] || {}).join(', '));
    data.forEach(l => console.log(`   - ${l.nome_loja}`));
  }
  
  console.log('\n🔍 Testando consulta COM municipio no SELECT...\n');
  
  const { data: data2, error: error2 } = await supabase
    .from('lojas')
    .select('id, nome_loja, municipio')
    .limit(3);
  
  if (error2) {
    console.error('❌ Erro:', error2);
    console.log('\n⚠️ A coluna municipio existe no banco, mas o cache da API ainda não atualizou!');
    console.log('Solução: Aguarde 1-2 minutos ou recarregue o schema cache no Supabase Dashboard');
  } else {
    console.log('✅ Lojas com município:', data2.length);
    data2.forEach(l => console.log(`   - ${l.nome_loja} (${l.municipio})`));
  }
}

test();
