-- PedeAí Database Schema

-- 1. Tabela de perfis (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS perfis (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  nome_completo VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('cliente', 'loja', 'entregador', 'admin')),
  telefone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id),
  UNIQUE(email)
);

-- 2. Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id BIGSERIAL PRIMARY KEY,
  nome_categoria VARCHAR(100) NOT NULL UNIQUE,
  icone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de lojas
CREATE TABLE IF NOT EXISTS lojas (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  perfil_id BIGINT REFERENCES perfis(id) ON DELETE SET NULL,
  nome_loja VARCHAR(255) NOT NULL,
  municipio VARCHAR(100) NOT NULL,
  categoria VARCHAR(100),
  endereco TEXT,
  telefone VARCHAR(20),
  url_imagem TEXT,
  avaliacao DECIMAL(2,1) DEFAULT 0.0,
  tempo_entrega_min INTEGER DEFAULT 30,
  pedido_minimo DECIMAL(10,2) DEFAULT 0.00,
  taxa_entrega DECIMAL(10,2) DEFAULT 5.00,
  aberta BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id BIGSERIAL PRIMARY KEY,
  loja_id BIGINT REFERENCES lojas(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(100),
  imagem_url TEXT,
  disponivel BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id BIGSERIAL PRIMARY KEY,
  perfil_id BIGINT REFERENCES perfis(id) ON DELETE SET NULL,
  loja_id BIGINT REFERENCES lojas(id) ON DELETE SET NULL NOT NULL,
  endereco_entrega TEXT NOT NULL,
  observacoes TEXT,
  forma_pagamento VARCHAR(50) DEFAULT 'dinheiro' CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao')),
  troco_para DECIMAL(10,2),
  taxa_entrega DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  subtotal DECIMAL(10,2),
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'preparando', 'pronto', 'em_entrega', 'entregue', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS pedido_itens (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT REFERENCES pedidos(id) ON DELETE CASCADE NOT NULL,
  produto_id BIGINT REFERENCES produtos(id) ON DELETE SET NULL,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario DECIMAL(10,2) NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabela de avaliações
CREATE TABLE IF NOT EXISTS avaliacoes (
  id BIGSERIAL PRIMARY KEY,
  loja_id BIGINT REFERENCES lojas(id) ON DELETE CASCADE NOT NULL,
  perfil_id BIGINT REFERENCES perfis(id) ON DELETE CASCADE NOT NULL,
  pedido_id BIGINT REFERENCES pedidos(id) ON DELETE SET NULL,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabela de endereços salvos (para clientes autenticados)
CREATE TABLE IF NOT EXISTS enderecos (
  id BIGSERIAL PRIMARY KEY,
  perfil_id BIGINT REFERENCES perfis(id) ON DELETE CASCADE NOT NULL,
  titulo VARCHAR(100),
  rua VARCHAR(255) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  bairro VARCHAR(100) NOT NULL,
  complemento VARCHAR(255),
  referencia VARCHAR(255),
  padrao BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes para melhorar performance
CREATE INDEX IF NOT EXISTS idx_perfis_user_id ON perfis(user_id);
CREATE INDEX IF NOT EXISTS idx_perfis_tipo ON perfis(tipo);
CREATE INDEX IF NOT EXISTS idx_lojas_municipio ON lojas(municipio);
CREATE INDEX IF NOT EXISTS idx_lojas_categoria ON lojas(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_loja_id ON produtos(loja_id);
CREATE INDEX IF NOT EXISTS idx_produtos_disponivel ON produtos(disponivel);
CREATE INDEX IF NOT EXISTS idx_pedidos_perfil_id ON pedidos(perfil_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_loja_id ON pedidos(loja_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido_id ON pedido_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_perfil_id ON enderecos(perfil_id);

-- Funções para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_perfis_updated_at BEFORE UPDATE ON perfis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lojas_updated_at BEFORE UPDATE ON lojas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enderecos_updated_at BEFORE UPDATE ON enderecos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
