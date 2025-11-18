# .idx/dev.nix - Configuração Final Robusta para Subpasta
{ pkgs, ... }: {
  # Canal estável do Nix
  channel = "stable-23.11";

  # Pacotes necessários
  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.npm
  ];

  # MUDANÇA CRÍTICA: Define o diretório de trabalho para todos os comandos
  idx = {
    workspace = {
      root = "pedai-nextjs"; # <--- ISSO FORÇA A RAIZ DO PROJETO
      onCreate = {
        # Agora o npm install roda direto porque o root está definido
        npm-install = "npm install"; 
      };
    };

    previews = {
      enable = true;
      previews = {
        web = {
          # O comando é simples, pois o 'root' já está definido
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
    
    extensions = [
      "esbenp.prettier-vscode"
      "dbaeumer.vscode-eslint"
    ];
  };
  env = {};
}
