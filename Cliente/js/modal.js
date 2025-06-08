function showConfirmationModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    if (!modal) return;

    // Preenche o texto do modal
    modalTitle.textContent = title;
    modalMessage.textContent = message;

    // Mostra o modal
    modal.classList.remove('hidden');

    // Função para fechar o modal
    const closeModal = () => {
        modal.classList.add('hidden');
        // Remove os event listeners para não serem duplicados na próxima vez
        confirmBtn.replaceWith(confirmBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    };

    // Ação do botão "Sim"
    confirmBtn.addEventListener('click', () => {
        onConfirm(); // Executa a ação que queremos
        closeModal();
    });

    // Ação do botão "Não"
    cancelBtn.addEventListener('click', closeModal);
}