-- Buscar ID da loja recém-criada
SELECT id, nome_loja, municipio, aprovada 
FROM lojas 
WHERE nome_loja = 'Pizzaria Sabor & Arte'
LIMIT 1;

-- Depois de pegar o ID acima, substitua XXX pelo ID retornado e execute:

-- Aprovar a loja
UPDATE lojas 
SET aprovada = true,
    descricao = 'As melhores pizzas artesanais de Alagoa Nova! Massa fina e crocante, ingredientes frescos e sabor incomparável.',
    categoria = 'pizzaria'
WHERE nome_loja = 'Pizzaria Sabor & Arte';

-- Adicionar produtos (substitua XXX pelo ID da loja)
INSERT INTO produtos (loja_id, nome, descricao, preco, disponivel) VALUES
(XXX, 'Pizza Margherita', 'Molho de tomate, muçarela, manjericão fresco e azeite', 35.00, true),
(XXX, 'Pizza Calabresa', 'Molho de tomate, muçarela, calabresa fatiada e cebola', 38.00, true),
(XXX, 'Pizza Portuguesa', 'Molho de tomate, muçarela, presunto, ovos, cebola, azeitona e orégano', 42.00, true),
(XXX, 'Pizza Quatro Queijos', 'Muçarela, provolone, parmesão e catupiry', 45.00, true),
(XXX, 'Pizza Frango com Catupiry', 'Frango desfiado, catupiry, milho e mussarela', 40.00, true),
(XXX, 'Pizza Bacon', 'Molho de tomate, muçarela, bacon crocante e cebola', 40.00, true),
(XXX, 'Refrigerante 2L', 'Coca-Cola, Guaraná ou Fanta', 10.00, true),
(XXX, 'Suco Natural 500ml', 'Laranja, limão ou maracujá', 8.00, true);

-- Recarregar cache
NOTIFY pgrst, 'reload schema';

-- Verificar
SELECT COUNT(*) as total_produtos FROM produtos WHERE loja_id = XXX;
