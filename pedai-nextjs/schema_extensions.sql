-- PedeAí Schema Extensions for Admin Panel
-- Run this after the main schema.sql

-- Add new fields to existing tables
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN DEFAULT false;
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS bloqueado_motivo TEXT;
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS bloqueado_em TIMESTAMP WITH TIME ZONE;

ALTER TABLE lojas ADD COLUMN IF NOT EXISTS aprovada BOOLEAN DEFAULT false;
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS aprovada_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS aprovada_por BIGINT REFERENCES perfis(id) ON DELETE SET NULL;
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS horario_abertura TIME;
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS horario_fechamento TIME;
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS dias_funcionamento VARCHAR(100) DEFAULT 'seg,ter,qua,qui,sex,sab,dom';
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS raio_entrega_km DECIMAL(5,2) DEFAULT 5.0;
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS tempo_medio_preparo INTEGER DEFAULT 30;
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS comissao_plataforma DECIMAL(5,2) DEFAULT 10.00;

-- Tabela de configurações da plataforma
CREATE TABLE IF NOT EXISTS configuracoes_plataforma (
  id BIGSERIAL PRIMARY KEY,
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
  descricao TEXT,
  municipio VARCHAR(100),
  categoria VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de repasses financeiros
CREATE TABLE IF NOT EXISTS repasses_financeiros (
  id BIGSERIAL PRIMARY KEY,
  loja_id BIGINT REFERENCES lojas(id) ON DELETE CASCADE NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  total_pedidos INTEGER DEFAULT 0,
  valor_bruto DECIMAL(10,2) DEFAULT 0.00,
  comissao_plataforma DECIMAL(10,2) DEFAULT 0.00,
  taxas_entrega DECIMAL(10,2) DEFAULT 0.00,
  valor_liquido DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'pago', 'cancelado')),
  data_pagamento TIMESTAMP WITH TIME ZONE,
  comprovante_url TEXT,
  observacoes TEXT,
  criado_por BIGINT REFERENCES perfis(id) ON DELETE SET NULL,
  processado_por BIGINT REFERENCES perfis(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de auditoria
CREATE TABLE IF NOT EXISTS auditoria (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT REFERENCES perfis(id) ON DELETE SET NULL,
  usuario_email VARCHAR(255),
  usuario_nome VARCHAR(255),
  acao VARCHAR(100) NOT NULL,
  entidade VARCHAR(100) NOT NULL,
  entidade_id BIGINT,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de cupons de desconto
CREATE TABLE IF NOT EXISTS cupons (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('percentual', 'valor_fixo', 'frete_gratis')),
  valor DECIMAL(10,2) NOT NULL,
  valor_minimo_pedido DECIMAL(10,2) DEFAULT 0.00,
  uso_maximo INTEGER DEFAULT 1,
  uso_atual INTEGER DEFAULT 0,
  municipio VARCHAR(100),
  categoria VARCHAR(100),
  loja_id BIGINT REFERENCES lojas(id) ON DELETE CASCADE,
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE,
  ativo BOOLEAN DEFAULT true,
  criado_por BIGINT REFERENCES perfis(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de uso de cupons
CREATE TABLE IF NOT EXISTS cupons_uso (
  id BIGSERIAL PRIMARY KEY,
  cupom_id BIGINT REFERENCES cupons(id) ON DELETE CASCADE NOT NULL,
  pedido_id BIGINT REFERENCES pedidos(id) ON DELETE CASCADE NOT NULL,
  perfil_id BIGINT REFERENCES perfis(id) ON DELETE SET NULL,
  valor_desconto DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes adicionais para performance
CREATE INDEX IF NOT EXISTS idx_perfis_bloqueado ON perfis(bloqueado);
CREATE INDEX IF NOT EXISTS idx_lojas_aprovada ON lojas(aprovada);
CREATE INDEX IF NOT EXISTS idx_lojas_municipio_categoria ON lojas(municipio, categoria);
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes_plataforma(chave);
CREATE INDEX IF NOT EXISTS idx_configuracoes_municipio ON configuracoes_plataforma(municipio);
CREATE INDEX IF NOT EXISTS idx_repasses_loja_id ON repasses_financeiros(loja_id);
CREATE INDEX IF NOT EXISTS idx_repasses_status ON repasses_financeiros(status);
CREATE INDEX IF NOT EXISTS idx_repasses_periodo ON repasses_financeiros(periodo_inicio, periodo_fim);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidade ON auditoria(entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria(created_at);
CREATE INDEX IF NOT EXISTS idx_cupons_codigo ON cupons(codigo);
CREATE INDEX IF NOT EXISTS idx_cupons_ativo ON cupons(ativo);
CREATE INDEX IF NOT EXISTS idx_cupons_uso_cupom_id ON cupons_uso(cupom_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes_plataforma
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repasses_updated_at BEFORE UPDATE ON repasses_financeiros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cupons_updated_at BEFORE UPDATE ON cupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configurações padrão
INSERT INTO configuracoes_plataforma (chave, valor, tipo, descricao) VALUES
  ('taxa_entrega_padrao', '5.00', 'number', 'Taxa de entrega padrão em reais'),
  ('comissao_plataforma_padrao', '10.00', 'number', 'Comissão da plataforma em percentual'),
  ('pedido_minimo_padrao', '15.00', 'number', 'Valor mínimo de pedido em reais'),
  ('tempo_entrega_padrao', '45', 'number', 'Tempo estimado de entrega em minutos'),
  ('raio_entrega_padrao', '5.0', 'number', 'Raio de entrega padrão em km')
ON CONFLICT (chave) DO NOTHING;

-- Configurações por município
INSERT INTO configuracoes_plataforma (chave, valor, tipo, descricao, municipio) VALUES
  ('taxa_entrega', '4.00', 'number', 'Taxa de entrega', 'alagoa-nova'),
  ('taxa_entrega', '5.00', 'number', 'Taxa de entrega', 'esperanca'),
  ('taxa_entrega', '5.00', 'number', 'Taxa de entrega', 'lagoa-seca')
ON CONFLICT (chave) DO NOTHING;
