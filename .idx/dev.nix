# .idx/dev.nix - Configuração Final Robusta para Subpasta
{ pkgs, ... }: {
  # Canal estável do Nix
  channel = "stable-23.11";

  # Pacotes necessários
  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.npm
  ];

  # Variáveis de ambiente
  env = {};

  idx = {
    extensions = [
      "esbenp.prettier-vscode"
      "dbaeumer.vscode-eslint"
    ];

    workspace = {
      onCreate = {
        # Ação: Instalação é feita na subpasta
        npm-install = "cd pedai-nextjs && npm install"; 
      };
      onStart = {
        # Removemos o onStart desnecessário para evitar conflito
      };
    };

    previews = {
      enable = true;
      previews = {
        web = {
          # MUDANÇA CRÍTICA: Forçando o shell a entrar na pasta antes de rodar o Next.js
          command = ["sh" "-c" "cd pedai-nextjs && npm run dev -- --port $PORT --hostname 0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
