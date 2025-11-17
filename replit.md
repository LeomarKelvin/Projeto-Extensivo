# PedeAí - Plataforma de Delivery Multi-Municipal

## 📋 Visão Geral do Projeto

**Status**: 🚧 Migração de Express/Vanilla JS → Next.js 14 em andamento

PedeAí é uma plataforma de delivery local que atende 3 municípios da Paraíba:
- Alagoa Nova (tema amarelo #FFD100)
- Esperança (tema azul ciano #00D4FF)  
- Alagoa Grande (tema verde #00FF85)

## 🎯 Objetivo da Migração

Migrar de Express + HTML/JS vanilla para **Next.js 14 fullstack** com:
- ✅ App Router com TypeScript
- ✅ Sistema multi-tenancy robusto
- ✅ Tailwind CSS
- 🔄 Supabase com SSR (@supabase/ssr)
- 🔄 Zustand para state management
- 🔄 Autenticação integrada
- 🔄 API Routes para backend

## 📊 Progresso da Migração

### ✅ Concluído
1. **Estrutura base Next.js 14** 
   - App Router configurado
   - TypeScript + Tailwind CSS
   - Package.json e configs otimizados
   
2. **Sistema Multi-Tenancy**
   - Tipos TypeScript para configurações
   - Configs para 3 municípios (taxas, cores, localização)
   - Páginas dinâmicas /[municipio]
   - Página /tenants com detalhes completos
   - Funções helper (getTenantConfig, isTenantValid)

3. **Clientes Supabase**
   - Client-side com @supabase/ssr
   - Server-side com cookies
   - Middleware para sessões

### 🔄 Em Progresso
- Resolução de problemas de conectividade Supabase
- Rotação de chaves de segurança (ver SECURITY.md)

### 📋 Próximos Passos
1. Middleware de tenant resolution
2. Sistema de autenticação (login/registro)
3. Componentes compartilhados (Header, Footer)
4. Migração de páginas do cliente
5. Migração de dashboards de loja
6. APIs Routes (lojas, pedidos, perfil)

## ⚠️ SEGURANÇA CRÍTICA

**AÇÃO NECESSÁRIA**: A SUPABASE_SERVICE_ROLE_KEY exposta precisa ser rotacionada!

Leia o arquivo **`pedai-nextjs/SECURITY.md`** para instruções completas de como:
1. Rotacionar a chave no Supabase Dashboard
2. Adicionar a nova chave como Secret no Replit
3. Manter práticas de segurança adequadas

## 🏗️ Estrutura do Projeto

```
pedai-nextjs/
├── app/
│   ├── layout.tsx              # Layout raiz
│   ├── page.tsx                # Home com seletor de municípios
│   ├── globals.css             # Estilos globais
│   ├── [municipio]/            # Rotas dinâmicas por município
│   │   ├── page.tsx
│   │   └── not-found.tsx
│   ├── tenants/                # Página de configs dos municípios
│   │   └── page.tsx
│   └── api/
│       └── test-supabase/      # Teste de conexão
│           └── route.ts
├── lib/
│   ├── types/
│   │   └── tenant.ts           # Tipos TypeScript
│   ├── tenantConfig/
│   │   └── index.ts            # Configs multi-tenancy
│   └── supabase/
│       ├── client.ts           # Cliente browser
│       ├── server.ts           # Cliente server
│       └── middleware.ts       # Sessões
├── middleware.ts               # Middleware Next.js
└── SECURITY.md                 # Notas de segurança
```

## 🗄️ Banco de Dados (Supabase)

**URL**: https://jrskruadcwuytvjeqybh.supabase.co

### Tabelas Principais
- `usuarios` - Clientes, lojistas, entregadores, admin
- `lojas` - Estabelecimentos por município
- `produtos` - Catálogo de produtos
- `pedidos` - Pedidos e tracking
- `categorias` - Categorias de produtos/lojas
- `avaliacoes` - Avaliações de lojas
- `enderecos` - Endereços de entrega

## 🎨 Design System

### Cores por Município
- **Alagoa Nova**: Primária #FFD100 (amarelo)
- **Esperança**: Primária #00D4FF (azul ciano)
- **Alagoa Grande**: Primária #00FF85 (verde)
- **Todas**: Secundária #1A1A1A (preto)

### Fonte
- Poppins (300, 400, 500, 600, 700, 800)

## 🚀 Como Rodar

```bash
cd pedai-nextjs
npm install
npm run dev
```

Acesse: http://localhost:5000

## 📦 Dependências Principais

- next: ^14.2.0
- react: ^18.3.0
- @supabase/ssr: ^0.7.0
- zustand: ^4.5.0 (planejado)
- tailwindcss: ^3.4.7

## 🔗 URLs Importantes

- **Home**: /
- **Municípios**: /[municipio] (alagoa-nova, esperanca, alagoa-grande)
- **Configs**: /tenants
- **API Test**: /api/test-supabase

## 👥 Personas Suportadas

1. **Cliente** - Faz pedidos
2. **Lojista** - Gerencia loja e produtos
3. **Entregador** - Realiza entregas
4. **Admin** - Administra plataforma

## 📝 Notas do Desenvolvedor

- Projeto criado inteiramente com IA (Gemini/ChatGPT) 
- Desenvolvedor sem experiência prévia em programação
- Migração para facilitar expansão multi-municipal
- Foco em manutenibilidade e escalabilidade

---

**Última atualização**: 17 de novembro de 2025  
**Versão**: 2.0.0-alpha (migração em andamento)
