function showToast(title, message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastTitle || !toastMessage || !toastIcon) {
        console.error('Elementos do Toast não foram encontrados no HTML.');
        return;
    }

    toastTitle.innerText = title;
    toastMessage.innerText = message;

    if (type === 'error') {
        toastIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        `;
    } else { // 'success'
        toastIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
`;
    }

    toast.classList.remove('hidden');
    // Força a animação a rodar de novo
    toast.classList.remove('slide-in');
    void toast.offsetWidth; // truque para reiniciar a animação
    toast.classList.add('slide-in');


    // Esconde automaticamente depois de 3 segundos
    setTimeout(() => {
        hideToast();
    }, 3000);
}

function hideToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.add('hidden');
    }
}