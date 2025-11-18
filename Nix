# .idx/dev.nix - Configuração para Next.js no Firebase Studio
{ pkgs, ... }: {
  # Qual canal do Nix usar (estável é melhor)
  channel = "stable-23.11";

  # Pacotes que precisam ser instalados no computador da nuvem
  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.npm
  ];

  # Variáveis de ambiente
  env = {};

  # Configuração do ícone e busca
  idx = {
    extensions = [
      # Extensões úteis para VS Code
      "esbenp.prettier-vscode"
      "dbaeumer.vscode-eslint"
    ];

    # O que fazer quando o ambiente abrir pela primeira vez
    workspace = {
      onCreate = {
        # Instalar as dependências (substitui o npm install manual)
        npm-install = "npm install";
      };
      onStart = {
        # Sempre que abrir, garantir que está tudo pronto
        watch-build = "npm run dev";
      };
    };

    # Configuração do Preview (a janelinha do site)
    previews = {
      enable = true;
      previews = {
        web = {
          # Comando para rodar o servidor
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
