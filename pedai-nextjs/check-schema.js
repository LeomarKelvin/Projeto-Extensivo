const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jrskruadcwuytvjeqybh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyc2tydWFkY3d1eXR2amVxeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIyNzg5MywiZXhwIjoyMDY0ODAzODkzfQ.SQqgGs7mEPPZ7dmS7NjPXUvsDPRHa-UZSY09SZntrAc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('=== VERIFICANDO SCHEMA ===\n');
  
  const tables = ['categorias', 'lojas', 'produtos', 'perfis', 'pedidos', 'avaliacoes', 'pedido_itens'];
  
  for (const table of tables) {
    console.log(`📋 ${table}`);
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.log(`   ❌ ${error.message}`);
    } else {
      console.log(`   ✅ ${count || 0} rows`);
      if (data && data.length > 0) {
        console.log(`   Colunas: ${Object.keys(data[0]).join(', ')}`);
      }
    }
  }
}

checkSchema().catch(console.error);
