# Notas de Segurança - PedeAí Next.js

## ⚠️ AÇÃO IMEDIATA NECESSÁRIA

A `SUPABASE_SERVICE_ROLE_KEY` que estava exposta no código precisa ser **rotacionada imediatamente**:

### Passos para Rotacionar a Chave:

1. **Acesse o Supabase Dashboard**:
   - Vá para: https://supabase.com/dashboard/project/jrskruadcwuytvjeqybh
   - Entre nas configurações (Settings) → API

2. **Revogue a chave antiga**:
   - A chave antiga começava com: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...`
   - Clique em "Reset service role key" ou "Revoke"

3. **Gere uma nova chave**:
   - O Supabase vai gerar automaticamente uma nova `service_role` key
   - **IMPORTANTE**: NÃO comite esta chave em nenhum arquivo!

4. **Adicione a nova chave como Secret no Replit**:
   - No Replit, vá em "Tools" → "Secrets"
   - Adicione: `SUPABASE_SERVICE_ROLE_KEY` = (nova chave)
   - O Next.js automaticamente vai usar essa variável de ambiente

### Por que isso é importante?

A `SUPABASE_SERVICE_ROLE_KEY` dá **acesso administrativo total** ao seu banco de dados, incluindo:
- Ler todos os dados (incluindo senhas, informações sensíveis)
- Modificar qualquer registro
- Deletar tabelas
- Ignorar políticas RLS (Row Level Security)

**NUNCA** compartilhe ou exponha esta chave!

## Boas Práticas de Segurança

### ✅ O que PODE ser público:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (chave anônima com permissões limitadas)

### ❌ O que NUNCA deve ser exposto:
- `SUPABASE_SERVICE_ROLE_KEY`
- Senhas de banco de dados
- Chaves de API privadas
- Tokens de autenticação

### Arquivos que NUNCA devem ser comitados:
- `.env`
- `.env.local`
- `.env.production`
- Qualquer arquivo com secrets ou chaves

### Como usar secrets no Replit:
1. Vá em Tools → Secrets
2. Adicione suas variáveis sensíveis
3. Elas ficam disponíveis em `process.env` automaticamente
4. Nunca são expostas no código-fonte

## Verificação de Segurança

Antes de cada deploy, verifique:
- [ ] Nenhum arquivo `.env` está sendo comitado
- [ ] Todas as chaves sensíveis estão em Secrets
- [ ] O `.gitignore` contém `.env*`
- [ ] Nenhuma chave está hardcoded no código

---

**Status Atual**: ⚠️ Aguardando rotação da SUPABASE_SERVICE_ROLE_KEY
