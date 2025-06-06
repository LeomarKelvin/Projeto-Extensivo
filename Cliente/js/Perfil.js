document.addEventListener('DOMContentLoaded', function () {

        const tabs = document.querySelectorAll('.tab');

    // Selecionamos todas as seções de conteúdo. Para isso, vamos adicionar uma classe comum a elas.
    // Vá no seu Perfil.html e adicione a classe 'tab-content' a cada uma das seções <section> que devem ser controladas pelas abas.
    // Ex: <section id="dados-pessoais" class="tab-content fade-in">...</section>
    const contents = document.querySelectorAll('.tab-content');

    // 2. ADICIONANDO O "OUVINTE DE EVENTOS" (EVENT LISTENER)
    // Usamos forEach para passar por cada botão de aba que encontramos.
    tabs.forEach(tab => {
        // Para cada botão 'tab', adicionamos um "ouvinte" que espera por um clique.
        tab.addEventListener('click', function () {

            // 3. A LÓGICA DO QUE ACONTECE NO CLIQUE

            // a) Remove a classe 'active' de TODOS os botões. Isso garante que só o clicado ficará ativo.
            tabs.forEach(item => item.classList.remove('active'));

            // b) Adiciona a classe 'active' APENAS no botão que foi clicado (o 'this' se refere ao elemento que sofreu o clique).
            this.classList.add('active');

            // c) Esconde TODOS os conteúdos.
            contents.forEach(content => content.style.display = 'none');

            // d) Mostra o conteúdo correto.
            // Pegamos o 'id' do conteúdo que queremos mostrar a partir de um atributo que vamos criar no botão.
            // Vá no seu Perfil.html e adicione o atributo 'data-target' em cada botão de aba.
            // Ex: <button class="tab active" data-target="#dados-pessoais">Dados Pessoais</button>
            //     <button class="tab" data-target="#enderecos">Endereços</button>
            const targetId = this.getAttribute('data-target');
            const targetContent = document.querySelector(targetId);

            if (targetContent) {
                targetContent.style.display = 'block';
            }
        });
    });

    // Para garantir que a primeira aba já comece ativa ao carregar a página
    // Vamos simular um clique na primeira aba da lista.
    if (tabs.length > 0) {
        tabs[0].click();
    }
});