document.addEventListener('DOMContentLoaded', function () {
    buscarLojas();
});

async function buscarLojas() {
    const containerLojas = document.getElementById('lojas-container');

    try {
        const response = await fetch('http://localhost:3000/api/lojas');
        const lojas = await response.json();

        containerLojas.innerHTML = '';

        if (lojas.length === 0) {
            containerLojas.innerHTML = '<p>Nenhuma loja encontrada no momento.</p>';
            return;
        }

        lojas.forEach(loja => {
            // No futuro, dados como avaliação, distância e tempo virão do banco de dados também.
            // Por enquanto, vou deixar valores fixos para manter o design.
            const rating = 4.8;
            const distance = "2.5 km";
            const deliveryTime = "25-35 min";

            containerLojas.innerHTML += `
                <div class="store-card bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300">
                    <div class="relative">
                        <img src="${loja.url_imagem || 'https://placehold.co/400x200'}" alt="Imagem da ${loja.nome}" class="w-full h-40 object-cover">
                        <span class="badge absolute top-3 right-3 bg-primary text-secondary">Destaque</span>
                    </div>
                    <div class="p-4">
                        <div class="flex items-start">
                            <div class="store-logo bg-gray-300 mr-3 -mt-8 relative z-10 flex items-center justify-center border-4 border-white">
                                <img src="${loja.url_imagem || 'https://placehold.co/60'}" class="w-full h-full object-cover rounded-full">
                            </div>
                            <div class="flex-grow">
                                <h3 class="text-lg font-semibold text-gray-800">${loja.nome}</h3>
                                <div class="flex items-center mt-1">
                                    <div class="rating-stars flex text-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                    </div>
                                    <span class="text-sm text-gray-600 ml-1">${rating}</span>
                                </div>
                            </div>
                        </div>

                        <div class="mt-3">
                            <div class="flex items-center text-sm text-gray-600 mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                ${distance} de distância
                            </div>
                            <div class="flex items-center text-sm text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                ${deliveryTime} • Entrega: R$ 5,99
                            </div>
                        </div>

                        <div class="mt-4 flex flex-wrap gap-2">
                            <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">${loja.categoria}</span>
                        </div>
                        
                        <div class="mt-4 flex justify-between items-center">
                            <span class="text-green-600 font-medium text-sm"></span>
                            <button onclick="adicionarAoCarrinho('${loja.nome} (Teste)', 15.00, '${loja.id}')" class="btn-primary px-4 py-2 rounded-lg text-sm font-medium">
                                 Adicionar Item Teste
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error('Falha ao buscar lojas:', error);
        containerLojas.innerHTML = '<p class="text-red-500">Não foi possível carregar as lojas. Verifique se o servidor backend está rodando.</p>';
    }
}