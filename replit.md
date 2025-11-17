# PedeAí - Plataforma de Delivery Multi-Municipal

## 📋 Visão Geral do Projeto

**Status**: ✅ **Migração CONCLUÍDA** - Next.js 14 fullstack MVP pronto

PedeAí é uma plataforma de delivery local que atende 3 municípios da Paraíba:
- Alagoa Nova (tema amarelo #FFD100)
- Esperança (tema azul ciano #00D4FF)  
- Lagoa Seca (tema verde #00FF85)

## 🎯 Migração Completa

Migração de Express + HTML/JS vanilla para **Next.js 14 fullstack** com:
- ✅ App Router com TypeScript
- ✅ Sistema multi-tenancy robusto
- ✅ Tailwind CSS
- ✅ Supabase com SSR (@supabase/ssr)
- ✅ Context API para state management
- ✅ Autenticação integrada
- ✅ API Routes para backend

## 📊 Features Implementadas

### ✅ 1. Estrutura Next.js 14
- App Router configurado
- TypeScript + Tailwind CSS
- Package.json e configs otimizados
- Middleware integrado

### ✅ 2. Sistema Multi-Tenancy
- Tipos TypeScript para configurações
- Configs para 3 municípios (taxas, cores, localização)
- Rotas dinâmicas /[municipio]/*
- Theming dinâmico com CSS variables
- Funções helper (getTenantConfig, isTenantValid, getTenantBySlug)

### ✅ 3. Componentes Compartilhados
- SimpleHeader: Navegação tenant-aware, menu mobile
- Footer: Links dinâmicos por município
- ClientLayout: Injeta CSS variables, gerencia theming
- CartButton: Botão flutuante com total do carrinho
- Logo: Adaptável por tenant
- LoginForm: Tabs Login/Cadastro, redirect por tipo de usuário

### ✅ 4. Autenticação
- Login e Cadastro integrados
- Suporte a 3 tipos de usuário (cliente, loja, entregador)
- API /api/auth/register
- Redirect automático por perfil (clientes → tenant home, lojas → /loja/dashboard)
- Proteção de rotas com middleware

### ✅ 5. Páginas do Cliente
- **Página inicial** (/{municipio}): Hero section + categorias
- **Página de lojas** (/{municipio}/lojas): Listagem com filtros, busca, categorias
- **Carrinho** (/{municipio}/carrinho): Resumo, endereço, checkout
- **Login** (/{municipio}/auth/login): Formulário tenant-aware

### ✅ 6. Carrinho de Compras
- CartContext com Context API
- LocalStorage para persistência
- Botão flutuante mostrando itens e total
- Validação de pedido mínimo
- Cálculo de taxa de entrega

### ✅ 7. Dashboard da Loja
- /loja/dashboard com estatísticas
- Proteção de autenticação
- Layout exclusivo para lojistas

### ✅ 8. API Routes
- **/api/auth/register**: Criar usuários (cliente, loja, entregador)
- **/api/lojas**: Listar lojas por município (tenant-filtered)
- **/api/pedidos**: 
  - GET: Listar pedidos do usuário
  - POST: Criar pedidos com validações

## 📋 Próximos Passos (Pós-MVP)
1. Página de produto individual com detalhes
2. Página de pedidos do cliente (histórico)
3. Gestão de produtos da loja (CRUD)
4. Upload de imagens (produtos, perfil)
5. Sistema de avaliações
6. Dashboard do entregador
7. Notificações em tempo real
8. **Melhorar tenant isolation** (adicionar `municipio` em `perfis`)

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
