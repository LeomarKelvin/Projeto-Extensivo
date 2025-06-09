import { fetchPedidosDaLoja, updatePedidoStatus } from '../api/lojaApi.js';

function getStatusClass(status) {
    switch (status) {
        case 'Entregue': return 'bg-green-100 text-green-800';
        case 'Pendente': return 'bg-yellow-100 text-yellow-800';
        case 'Cancelado': return 'bg-red-100 text-red-800';
        case 'Em preparo': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function criarLinhaPedido(pedido) {
    const dataPedido = new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const nomeCliente = pedido.profiles ? pedido.profiles.nome_completo : 'Cliente Anônimo';

    return `
    <tr class="bg-white border-b">
        <td class="px-6 py-4 font-medium text-gray-900">#${pedido.id}</td>
        <td class="px-6 py-4">${dataPedido}</td>
        <td class="px-6 py-4">${nomeCliente}</td>
        <td class="px-6 py-4">R$ ${pedido.total.toFixed(2).replace('.', ',')}</td>
        <td class="px-6 py-4">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(pedido.status)}">
                ${pedido.status}
            </span>
        </td>
        <td class="px-6 py-4 text-right">
            <select class="status-select border border-gray-300 rounded-md p-1" data-pedido-id="${pedido.id}">
                <option value="Pendente" ${pedido.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                <option value="Em preparo" ${pedido.status === 'Em preparo' ? 'selected' : ''}>Em preparo</option>
                <option value="A caminho" ${pedido.status === 'A caminho' ? 'selected' : ''}>A caminho</option>
                <option value="Entregue" ${pedido.status === 'Entregue' ? 'selected' : ''}>Entregue</option>
                <option value="Cancelado" ${pedido.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
            </select>
        </td>
    </tr>
    `;
}

async function carregarPedidos() {
    const tbody = document.getElementById('pedidos-tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Carregando pedidos...</td></tr>';
    const pedidos = await fetchPedidosDaLoja();
    
    if (pedidos && pedidos.length > 0) {
        tbody.innerHTML = '';
        pedidos.forEach(pedido => {
            tbody.innerHTML += criarLinhaPedido(pedido);
        });
        adicionarEventosStatus();
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Nenhum pedido encontrado.</td></tr>';
    }
}

function adicionarEventosStatus() {
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const pedidoId = e.target.dataset.pedidoId;
            const novoStatus = e.target.value;
            
            const result = await updatePedidoStatus(pedidoId, novoStatus);
            if(result && result.message) {
                //alert(result.message);
                carregarPedidos(); // Recarrega a lista para mostrar a mudança
            } else {
                alert('Erro ao atualizar status.');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', carregarPedidos);