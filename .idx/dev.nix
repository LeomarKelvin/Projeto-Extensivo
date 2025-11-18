# .idx/dev.nix - Configuração para Next.js em subpasta
{ pkgs, ... }: {
  channel = "stable-23.11";

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
      # Força a instalação das dependências na subpasta pedai-nextjs
      onCreate = {
        npm-install = "cd pedai-nextjs && npm install";
      };
      # Comandos onStart não são necessários e podem gerar conflitos
    };

    previews = {
      enable = true;
      previews = {
        web = {
          # Executa o servidor Next.js APÓS entrar na subpasta
          command = ["sh" "-c" "cd pedai-nextjs && npm run dev -- --port $PORT --hostname 0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
  env = {};
}
