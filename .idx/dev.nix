# .idx/dev.nix - Configuração para Next.js em subpasta (Final Fix)
{ pkgs, ... }: {
  channel = "stable-23.11";

  # Instala Node e NPM
  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.npm
  ];

  idx = {
    extensions = [
      "esbenp.prettier-vscode"
      "dbaeumer.vscode-eslint"
    ];

    workspace = {
      # 1. Comando de instalação: Entra na pasta e instala.
      onCreate = {
        npm-install = "cd pedai-nextjs && npm install";
      };
    };

    previews = {
      enable = true;
      previews = {
        web = {
          # 2. Comando de Preview: Usa 'sh -c' para forçar a mudança de pasta antes de rodar o servidor.
          command = ["sh" "-c" "cd pedai-nextjs && npm run dev -- --port $PORT --hostname 0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
  env = {};
}
