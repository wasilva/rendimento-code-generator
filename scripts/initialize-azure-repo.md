# Como Inicializar o Repositório Azure DevOps

## Via Interface Web (Mais Fácil)

1. Acesse: https://dev.azure.com/qacoders-madeinweb/Rendimento/_git/Rendimento
2. Clique em "Initialize" ou "Add a README"
3. Isso criará a branch `main` com um commit inicial

## Via Linha de Comando

```bash
# Clone o repositório vazio
git clone https://dev.azure.com/qacoders-madeinweb/Rendimento/_git/Rendimento

# Entre no diretório
cd Rendimento

# Crie um arquivo README
echo "# Rendimento Project" > README.md

# Adicione e faça commit
git add README.md
git commit -m "Initial commit"

# Push para criar a branch main
git push origin main
```

## Verificar se funcionou

Após inicializar, execute novamente:
```bash
node scripts/test-pr-creation.js
```

Deve mostrar que encontrou pelo menos 1 branch (main).