import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function callSeedFunction() {
  console.log('🍕 Chamando função de seed...')
  
  const { data, error } = await supabase.rpc('seed_pizzaria')
  
  if (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
  
  console.log('✅ Resultado:', data)
  console.log('🎉 Pizzaria criada com sucesso!')
}

callSeedFunction()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })
