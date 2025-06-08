document.addEventListener('DOMContentLoaded', function() {
    // Segurança: Garante que o usuário está logado
    const user = getUser();
    if (!user) {
        // Se não tiver usuário, redireciona para o login.
        window.location.href = 'login.html';
        return; 
    }

    // --- LÓGICA DOS FILTROS ---
    const filterTabs = document.querySelectorAll('.tab'); // Pega todos os botões de filtro
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove a classe 'active' de todas as abas
            filterTabs.forEach(t => t.classList.remove('active', 'bg-gray-900', 'text-white'));
            
            // Adiciona a classe 'active' apenas na aba clicada
            this.classList.add('active', 'bg-gray-900', 'text-white');
            
            // Pega o texto do botão (ex: 'Em andamento')
            const statusFiltro = this.getAttribute('data-status');
            // Busca os pedidos com o filtro selecionado
            buscarMeusPedidos(statusFiltro);
        });
    });
    
    // Busca "Todos os pedidos" ao carregar a página pela primeira vez
    buscarMeusPedidos('Todos os pedidos');
});


async function buscarMeusPedidos(statusFiltro = 'Todos os pedidos') {
    const container = document.getElementById('pedidos-container');
    const session = getSession();

    if (!container || !session) return;
    
    container.innerHTML = '<p class="text-center text-gray-500 py-10">Buscando seus pedidos...</p>';

    try {
        // Constrói a URL com o filtro de status
        const response = await fetch(`http://localhost:3000/api/meus-pedidos?status=${encodeURIComponent(statusFiltro)}`, {
            headers: {
                'Authorization': `Bearer ${session.access_token}`
            }
        });
        
        const pedidos = await response.json();

        if (!response.ok) { throw new Error(pedidos.error || 'Erro desconhecido'); }

        container.innerHTML = ''; // Limpa a mensagem de "carregando"

        if (pedidos.length === 0) {
            container.innerHTML = '<div class="text-center p-10 bg-white rounded-xl shadow-md"><p class="text-gray-500">Nenhum pedido encontrado para este filtro.</p><a href="Lojas.html" class="btn-primary mt-4 inline-block px-6 py-2 rounded-lg">Começar a comprar</a></div>';
            return;
        }

        pedidos.forEach(pedido => {
            const dataPedido = new Date(pedido.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
            const itensHTML = pedido.pedido_itens.map(item => `
                <div class="flex justify-between text-sm text-gray-700">
                    <span>${item.quantidade}x ${item.nome_produto}</span>
                    <span>R$ ${(item.preco_unidade * item.quantidade).toFixed(2).replace('.', ',')}</span>
                </div>
            `).join('');

            // Adiciona uma classe de cor baseada no status
            let statusClass = 'bg-gray-100 text-gray-800';
            if (pedido.status === 'Pendente' || pedido.status === 'Em preparo') { statusClass = 'bg-yellow-100 text-yellow-800'; } 
            else if (pedido.status === 'Entregue') { statusClass = 'bg-green-100 text-green-800'; }
            else if (pedido.status === 'Cancelado') { statusClass = 'bg-red-100 text-red-800'; }

            container.innerHTML += `
                <div class="bg-white rounded-xl shadow-md p-6 mb-6">
                   <div class="flex flex-wrap justify-between items-center border-b border-gray-200 pb-4 mb-4 gap-2">
                       <div>
                          <p class="font-bold text-lg text-gray-800">Pedido #${String(pedido.id).padStart(4, '0')}</p>
                          <p class="text-sm text-gray-500">Feito em: ${dataPedido}</p>
                       </div>
                       <span class="text-sm font-medium px-3 py-1 rounded-full ${statusClass}">${pedido.status}</span>
                   </div>
                   <div class="space-y-2 mb-4">
                        <h4 class="font-semibold text-gray-700 mb-2">Itens:</h4>
                        ${itensHTML}
                   </div>
                   <div class="flex justify-end items-center mt-4 pt-4 border-t border-gray-200">
                       <span class="font-bold text-lg mr-4">Total: R$ ${pedido.total_price.toFixed(2).replace('.', ',')}</span>
                       <button class="btn-primary px-4 py-2 rounded-lg text-sm font-medium">Ver detalhes</button>
                   </div>
                </div>`;
        });

    } catch (error) {
        container.innerHTML = '<p class="text-center text-red-500">Falha ao carregar seus pedidos.</p>';
        console.error('Erro ao buscar pedidos:', error);
    }
}