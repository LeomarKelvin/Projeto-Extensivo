const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jrskruadcwuytvjeqybh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyc2tydWFkY3d1eXR2amVxeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIyNzg5MywiZXhwIjoyMDY0ODAzODkzfQ.SQqgGs7mEPPZ7dmS7NjPXUvsDPRHa-UZSY09SZntrAc'
);

async function setup() {
  console.log('🚀 Configurando banco de dados...\n');
  
  // Etapa 1: Criar lojas de exemplo (populando direto)
  console.log('📋 Criando lojas...');
  
  const lojas = [
    {
      nome_loja: 'Pizzaria Sabor da Hora',
      municipio: 'Alagoa Nova',
      categoria: 'Restaurantes',
      endereco: 'Rua Principal, 123',
      telefone: '(83) 98888-1111'
    },
    {
      nome_loja: 'Supermercado Central',
      municipio: 'Alagoa Nova',
      categoria: 'Mercados',
      endereco: 'Av. Central, 456',
      telefone: '(83) 98888-2222'
    },
    {
      nome_loja: 'Farmácia Saúde',
      municipio: 'Esperança',
      categoria: 'Farmácias',
      endereco: 'Rua da Saúde, 789',
      telefone: '(83) 98888-3333'
    },
    {
      nome_loja: 'Padaria Pão Quente',
      municipio: 'Lagoa Seca',
      categoria: 'Padarias',
      endereco: 'Praça Central, 321',
      telefone: '(83) 98888-4444'
    }
  ];
  
  const { data, error } = await supabase
    .from('lojas')
    .insert(lojas)
    .select();
  
  if (error) {
    console.log('❌ Erro ao criar lojas:',error.message);
    console.log('Detalhes:', JSON.stringify(error, null, 2));
  } else {
    console.log(`✅ ${data.length} lojas criadas!`);
    data.forEach(l => console.log(`  - ${l.nome_loja} (${l.municipio})`));
  }
}

setup();
