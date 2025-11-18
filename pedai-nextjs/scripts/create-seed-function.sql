-- Criar função SQL para popular dados
CREATE OR REPLACE FUNCTION seed_pizzaria()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  perfil_id_var INT;
  loja_id_var INT;
  result json;
BEGIN
  -- 1. Criar perfil
  INSERT INTO perfis (email, nome, telefone, tipo, municipio)
  VALUES ('pizzaria@saborarte.com', 'José da Silva', '(83) 99999-8888', 'loja', 'alagoa-nova')
  ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome
  RETURNING id INTO perfil_id_var;
  
  -- Se deu conflict, pegar o ID
  IF perfil_id_var IS NULL THEN
    SELECT id INTO perfil_id_var FROM perfis WHERE email = 'pizzaria@saborarte.com';
  END IF;
  
  -- 2. Criar loja
  INSERT INTO lojas (
    perfil_id, nome_loja, categoria, descricao, telefone, endereco, 
    municipio, aprovada, taxa_entrega, tempo_entrega_min, tempo_entrega_max, pedido_minimo
  )
  VALUES (
    perfil_id_var, 'Pizzaria Sabor & Arte', 'pizzaria', 
    'As melhores pizzas artesanais de Alagoa Nova! Massa fina e crocante, ingredientes frescos e sabor incomparável.',
    '(83) 99999-8888', 'Rua das Pizzas, 123',
    'alagoa-nova', true, 5.00, 30, 45, 20.00
  )
  ON CONFLICT (nome_loja) DO UPDATE SET descricao = EXCLUDED.descricao
  RETURNING id INTO loja_id_var;
  
  -- Se deu conflict, pegar o ID
  IF loja_id_var IS NULL THEN
    SELECT id INTO loja_id_var FROM lojas WHERE nome_loja = 'Pizzaria Sabor & Arte';
  END IF;
  
  -- Deletar produtos antigos
  DELETE FROM produtos WHERE loja_id = loja_id_var;
  
  -- 3. Criar produtos
  INSERT INTO produtos (loja_id, nome, descricao, preco, categoria, disponivel) VALUES
  (loja_id_var, 'Pizza Margherita', 'Molho de tomate, muçarela, manjericão fresco e azeite', 35.00, 'Pizzas Tradicionais', true),
  (loja_id_var, 'Pizza Calabresa', 'Molho de tomate, muçarela, calabresa fatiada e cebola', 38.00, 'Pizzas Tradicionais', true),
  (loja_id_var, 'Pizza Portuguesa', 'Molho de tomate, muçarela, presunto, ovos, cebola, azeitona e orégano', 42.00, 'Pizzas Tradicionais', true),
  (loja_id_var, 'Pizza Quatro Queijos', 'Muçarela, provolone, parmesão e catupiry', 45.00, 'Pizzas Especiais', true),
  (loja_id_var, 'Pizza Frango com Catupiry', 'Frango desfiado, catupiry, milho e mussarela', 40.00, 'Pizzas Especiais', true),
  (loja_id_var, 'Pizza Bacon', 'Molho de tomate, muçarela, bacon crocante e cebola', 40.00, 'Pizzas Especiais', true),
  (loja_id_var, 'Refrigerante 2L', 'Coca-Cola, Guaraná ou Fanta', 10.00, 'Bebidas', true),
  (loja_id_var, 'Suco Natural 500ml', 'Laranja, limão ou maracujá', 8.00, 'Bebidas', true);
  
  result := json_build_object(
    'success', true,
    'perfil_id', perfil_id_var,
    'loja_id', loja_id_var,
    'message', 'Pizzaria criada com sucesso!'
  );
  
  RETURN result;
END;
$$;
