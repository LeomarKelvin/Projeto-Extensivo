# .idx/dev.nix - Configuração Corrigida para Subpasta
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
        # MUDANÇA AQUI: Entra na pasta pedai-nextjs antes de instalar
        npm-install = "cd pedai-nextjs && npm install"; 
      };
      onStart = {
        # MUDANÇA AQUI: Entra na pasta antes de rodar
        watch-build = "cd pedai-nextjs && npm run dev";
      };
    };

    previews = {
      enable = true;
      previews = {
        web = {
          # Comando para rodar o servidor
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
          # MUDANÇA AQUI: Diz para o preview olhar dentro da pasta correta
          cwd = "pedai-nextjs";
        };
      };
    };
  };
}
