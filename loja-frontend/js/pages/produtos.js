document.addEventListener('DOMContentLoaded', function () {
    // --- LÓGICA DO LAYOUT (SIDEBAR, ETC.) ---
    feather.replace();

    const sidebar = document.getElementById('sidebar');
    const content = document.querySelector('.main-content-wrapper') || document.getElementById('content');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    if (sidebarToggle && sidebar && content) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('show');
        });
    }

    // --- LÓGICA DE VISUALIZAÇÃO (GRID/LISTA) ---
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const gridView = document.getElementById('gridView');
    const listView = document.getElementById('listView');

    if (gridViewBtn && listViewBtn && gridView && listView) {
        gridViewBtn.addEventListener('click', function () {
            gridView.classList.remove('hidden');
            if(listView) listView.classList.add('hidden');
            gridViewBtn.classList.add('bg-gray-100');
            listViewBtn.classList.remove('bg-gray-100');
        });

        listViewBtn.addEventListener('click', function () {
            if(gridView) gridView.classList.add('hidden');
            listView.classList.remove('hidden');
            gridViewBtn.classList.remove('bg-gray-100');
            listViewBtn.classList.add('bg-gray-100');
        });
    }
    
    // --- CONTROLE DE TODOS OS MODAIS DA PÁGINA ---
    function setupModal(btnId, modalId, closeSelectors) {
        const btn = document.getElementById(btnId);
        const modal = document.getElementById(modalId);
        
        if (btn && modal) {
            const closeBtns = modal.querySelectorAll(closeSelectors);
            const show = () => modal.classList.remove('hidden');
            const hide = () => modal.classList.add('hidden');

            btn.addEventListener('click', show);
            closeBtns.forEach(cb => cb.addEventListener('click', hide));
            
            modal.addEventListener('click', (event) => {
                if (event.target === modal) hide();
            });
        }
    }

    setupModal('addProductBtn', 'productDetailModal', '#closeProductModal, .btn-cancelar');
    setupModal('importExportBtn', 'importExportModal', '#closeImportExportModal');

    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');

    if (dropzone && fileInput && imagePreviewContainer) {
        dropzone.addEventListener('click', () => fileInput.click());

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.add('border-yellow-500'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.remove('border-yellow-500'), false);
        });

        dropzone.addEventListener('drop', (e) => {
            handleFiles(e.dataTransfer.files);
        }, false);

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });

        function handleFiles(files) {
            for (const file of files) {
                if (!file.type.startsWith('image/')) continue;

                const reader = new FileReader();
                reader.onload = function (e) {
                    const div = document.createElement('div');
                    div.className = 'relative w-24 h-24 m-1'; // Estilo para a miniatura
                    div.innerHTML = `
                        <img src="${e.target.result}" class="w-full h-full object-cover rounded-md">
                        <button type="button" class="remove-btn absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-lg font-bold leading-none">&times;</button>
                    `;
                    imagePreviewContainer.appendChild(div);

                    div.querySelector('.remove-btn').addEventListener('click', function () {
                        div.remove();
                    });
                };
                reader.readAsDataURL(file);
            }
        }
    }

    // --- LÓGICA DE DADOS (API) ---
    const produtosTabelaBody = document.querySelector('#listView tbody');
    const formAdicionarProduto = document.querySelector('#productDetailModal form');
    const API_BASE_URL = 'http://localhost:3000/api/dashboard/loja';
    const token = localStorage.getItem('token');

    if (!produtosTabelaBody || !formAdicionarProduto) {
        console.error("Não foi possível encontrar a tabela (#listView tbody) ou o formulário (#productDetailModal form).");
        return;
    }

    const renderizarLinhaProduto = (produto) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50';
        tr.innerHTML = `
            <td class="p-4">
                <img src="${produto.imagem_url || 'https://via.placeholder.com/80'}" alt="${produto.nome}" class="w-16 h-16 object-cover rounded-md">
            </td>
            <td class="p-4 font-medium text-gray-800">
                ${produto.nome}
            </td>
            <td class="p-4 text-gray-600">
                ${produto.categoria || 'N/A'}
            </td>
            <td class="p-4 font-semibold">
                R$ ${parseFloat(produto.preco).toFixed(2)}
            </td>
            <td class="p-4">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${produto.disponivel ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${produto.disponivel ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td class="p-4 text-right">
                <button class="text-blue-600 hover:text-blue-800 mr-2 btn-editar" data-produto-id="${produto.id}">
                    Editar
                </button>
                <button class="text-red-600 hover:text-red-700 btn-deletar" data-produto-id="${produto.id}">
                    Excluir
                </button>
            </td>
        `;
        return tr;
    };

    // Função para carregar os produtos
    const carregarProdutos = async () => {
        if (!token) {
            produtosTabelaBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center">Não autenticado.</td></tr>';
            return;
        }
        produtosTabelaBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center">Carregando...</td></tr>';
        try {
            const response = await fetch(`${API_BASE_URL}/produtos`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Falha ao buscar produtos');
            const produtos = await response.json();
            produtosTabelaBody.innerHTML = '';

            if (produtos.length === 0) {
                produtosTabelaBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center">Nenhum produto cadastrado.</td></tr>';
            } else {
                produtos.forEach(produto => {
                    const linhaProduto = renderizarLinhaProduto(produto);
                    produtosTabelaBody.appendChild(linhaProduto);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            produtosTabelaBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Erro ao carregar produtos.</td></tr>`;
        }
    };

    // Função para lidar com o envio do formulário
    if (formAdicionarProduto) {
        formAdicionarProduto.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Coleta todos os dados do formulário usando as novas IDs
            const dadosProduto = {
                nome: document.getElementById('produtoNome').value,
                descricao: document.getElementById('produtoDescricao').value,
                preco: document.getElementById('produtoPreco').value,
                categoria: document.getElementById('produtoCategoria').value,
                url_imagem: document.getElementById('produtoImagemURL').value
                // NOTA: preço promocional e outros serão adicionados no futuro, quando o backend estiver pronto
            };

            console.log('Enviando para o backend:', dadosProduto);

            try {
                const response = await fetch(`${API_BASE_URL}/produtos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(dadosProduto)
                });
                if (!response.ok) {
                    const erro = await response.json();
                    throw new Error(erro.error || 'Falha ao adicionar o produto.');
                }
                
                formAdicionarProduto.reset();
                hideModal();
                await carregarProdutos();
                alert('Produto adicionado com sucesso!');
            } catch (error) {
                console.error('Erro ao adicionar produto:', error);
                alert(`Erro: ${error.message}`);
            }
        });
    }

    carregarProdutos();
});