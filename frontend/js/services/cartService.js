const CART_KEY = 'pedeai_cart'; // A chave para salvar o carrinho no localStorage

/**
 * Pega o carrinho atual do localStorage.
 * @returns {Array} O array de itens do carrinho.
 */
export function getCart() {
  const cartJson = localStorage.getItem(CART_KEY);
  return cartJson ? JSON.parse(cartJson) : [];
}

/**
 * Salva o carrinho no localStorage.
 * @param {Array} cart O array de itens do carrinho para salvar.
 */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/**
 * Adiciona um item ao carrinho ou incrementa sua quantidade.
 * @param {object} item O item a ser adicionado (ex: { id, nome, preco, quantidade }).
 */
export function addItemToCart(item) {
  const cart = getCart();
  const existingItem = cart.find(cartItem => cartItem.id === item.id);

  if (existingItem) {
    existingItem.quantidade += item.quantidade || 1;
  } else {
    cart.push({ ...item, quantidade: item.quantidade || 1 });
  }
  
  saveCart(cart);
}

/**
 * Remove um item do carrinho.
 * @param {string} itemId O ID do item a ser removido.
 */
export function removeItemFromCart(itemId) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== itemId);
  saveCart(cart);
}

/**
 * Atualiza a quantidade de um item específico.
 * @param {string} itemId O ID do item.
 * @param {number} quantidade A nova quantidade.
 */
export function updateItemQuantity(itemId, quantidade) {
  const cart = getCart();
  const itemToUpdate = cart.find(item => item.id === itemId);

  if (itemToUpdate) {
    itemToUpdate.quantidade = Number(quantidade);
    if (itemToUpdate.quantidade <= 0) {
      // Se a quantidade for 0 ou menor, remove o item
      removeItemFromCart(itemId);
    } else {
      saveCart(cart);
    }
  }
}

/**
 * Limpa completamente o carrinho.
 */
export function clearCart() {
  localStorage.removeItem(CART_KEY);
}

/**
 * Calcula o subtotal do carrinho.
 * @returns {number} O valor subtotal.
 */
export function getSubtotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}