const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jrskruadcwuytvjeqybh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyc2tydWFkY3d1eXR2amVxeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIyNzg5MywiZXhwIjoyMDY0ODAzODkzfQ.SQqgGs7mEPPZ7dmS7NjPXUvsDPRHa-UZSY09SZntrAc'
);

async function getColumns() {
  const tables = ['categorias', 'lojas', 'produtos', 'perfis'];
  
  for (const table of tables) {
    const { data } = await supabase.rpc('exec_sql', {
      query: `SELECT column_name, data_type, is_nullable 
              FROM information_schema.columns 
              WHERE table_name = '${table}' 
              ORDER BY ordinal_position;`
    });
    
    if (!data) {
      // Try inserting empty row to see error
      const { error } = await supabase.from(table).insert({}).select();
      console.log(`\n${table}:`, error?.message || 'unknown');
    }
  }
}

getColumns();
