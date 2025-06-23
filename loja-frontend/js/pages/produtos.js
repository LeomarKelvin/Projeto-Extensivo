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
    const handleAdicionarProduto = async (event) => {
        event.preventDefault();

        const formData = new FormData();
        const form = event.target;

        // Função para encontrar um campo pelo texto do seu label.
        // Isso nos protege caso os IDs dos campos não estejam definidos no HTML.
        const findInputByLabel = (labelText) => {
            const labels = Array.from(form.querySelectorAll('label'));
            const label = labels.find(l => l.textContent.trim().includes(labelText));
            return label ? (label.parentElement.querySelector('input, select, textarea') || label.nextElementSibling?.querySelector('input')) : null;
        };

        // Coletando TODOS os campos do seu formulário, incluindo os que eu havia removido por engano.
        formData.append('nome', findInputByLabel('Nome do Produto')?.value || '');
        formData.append('preco', findInputByLabel('Preço (R$)')?.value || '');
        formData.append('preco_promocional', findInputByLabel('Preço Promocional')?.value || '');
        formData.append('categoria', findInputByLabel('Categoria')?.value || '');
        formData.append('sku', findInputByLabel('Código do Produto')?.value || '');
        formData.append('tags', findInputByLabel('Tags')?.value || '');
        formData.append('descricao', findInputByLabel('Descrição')?.value || '');
        
        // Coletando o estado dos toggles (ativo/inativo, promoção)
        const statusToggle = findInputByLabel('Status');
        formData.append('disponivel', statusToggle ? statusToggle.checked : false);
        const promocaoToggle = findInputByLabel('Promoção');
        formData.append('em_promocao', promocaoToggle ? promocaoToggle.checked : false);

        // Coletando os campos de Informações Adicionais
        formData.append('tempo_preparo', findInputByLabel('Tempo de Preparo')?.value || '');
        formData.append('disponibilidade_horario', findInputByLabel('Disponibilidade')?.value || '');
        
        // Anexando o arquivo de imagem
        if (fileInput.files.length > 0) {
            formData.append('imagem', fileInput.files[0]);
        }

        const result = await addProduct(formData);

        if (result.error) {
            alert(`Erro ao salvar: ${result.error.message}`);
        } else {
            alert('Produto salvo com sucesso!');
            document.getElementById('productDetailModal').classList.add('hidden');
            await carregarProdutos(); // Sua função para recarregar a lista.
        }
    };

    if (formAdicionarProduto) {
        formAdicionarProduto.addEventListener('submit', handleAdicionarProduto);
    }

    carregarProdutos();
});

// Este código seria adicionado ao seu arquivo produtos.js

// --- CONTROLE DO MODAL DE CATEGORIAS ---
const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
const categoryModal = document.getElementById('categoryManagerModal');
const closeCategoryModalBtn = document.getElementById('closeCategoryModal');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const newCategoryInput = document.getElementById('newCategoryName');
const categoryList = document.getElementById('categoryList');

// Função para abrir o modal de categorias
if (manageCategoriesBtn && categoryModal) {
    manageCategoriesBtn.addEventListener('click', () => {
        categoryModal.classList.remove('hidden');
        // Futuramente, aqui chamaríamos a função para carregar as categorias da API
        // loadCategories(); 
    });
}

// Função para fechar o modal de categorias
if (closeCategoryModalBtn && categoryModal) {
    closeCategoryModalBtn.addEventListener('click', () => {
        categoryModal.classList.add('hidden');
    });
}

// Função para adicionar uma nova categoria (simulação)
if (addCategoryBtn && newCategoryInput && categoryList) {
    addCategoryBtn.addEventListener('click', () => {
        const categoryName = newCategoryInput.value.trim();
        if (categoryName === '') {
            alert('Por favor, digite um nome para a categoria.');
            return;
        }
        
        // Simulação: Adiciona o item na lista da tela
        const newListItem = document.createElement('li');
        newListItem.className = 'flex justify-between items-center bg-gray-100 p-2 rounded-md';
        newListItem.innerHTML = `
            <span>${categoryName}</span>
            <button class="text-gray-400 hover:text-red-500"><i class="fas fa-trash-alt"></i></button>
        `;
        categoryList.appendChild(newListItem);
        
        // Limpa o campo de input
        newCategoryInput.value = '';

        // Futuramente, aqui chamaríamos a API para salvar a nova categoria no banco
        // await api_addCategory(categoryName);
        console.log(`Simulação: Categoria "${categoryName}" adicionada.`);
    });
}