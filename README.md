# Redimento Code Generator

Uma ferramenta de geração automática de código que integra com Azure DevOps para automatizar o desenvolvimento baseado em work items.

## 🚀 Funcionalidades

- **Integração Azure DevOps**: Recebe work items via webhook
- **Geração Automática de Branches**: Cria branches seguindo padrão `feat/{id}_{nome}`
- **Desenvolvimento Automatizado**: Utiliza IA (Gemini) para gerar código baseado nos requisitos
- **Pull Request Automático**: Cria PRs automaticamente após desenvolvimento

## 🛠️ Stack Tecnológico

- **Runtime**: Node.js (LTS)
- **Linguagem**: TypeScript
- **Framework**: Express.js
- **IA**: Google Gemini API
- **Integração**: Azure DevOps REST API
- **Git**: simple-git
- **Testes**: Jest + fast-check (Property-Based Testing)

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- npm ou yarn
- Token de acesso pessoal do Azure DevOps
- Chave de API do Google Gemini
- Git configurado

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd redimento-code-generator
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Execute os testes:
```bash
npm test
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 📚 Comandos Disponíveis

### Desenvolvimento
```bash
npm install          # Instalar dependências
npm run dev         # Servidor de desenvolvimento
npm run build       # Build para produção
npm run start       # Iniciar aplicação
```

### Testes
```bash
npm test            # Executar todos os testes
npm run test:watch  # Testes em modo watch
npm run test:coverage # Cobertura de testes
```

### Qualidade de Código
```bash
npm run lint        # Verificar linting
npm run lint:fix    # Corrigir problemas de linting
npm run format      # Formatar código com Prettier
```

## 🏗️ Estrutura do Projeto

```
redimento-code-generator/
├── src/                     # Código fonte principal
│   ├── controllers/         # Controladores da API
│   ├── services/           # Lógica de negócio
│   │   ├── azure/          # Integração Azure DevOps
│   │   ├── gemini/         # Integração Gemini AI
│   │   └── git/            # Operações Git
│   ├── models/             # Modelos de dados
│   ├── middleware/         # Middlewares Express
│   ├── utils/              # Utilitários gerais
│   ├── config/             # Configurações
│   └── app.ts              # Aplicação principal
├── tests/                  # Testes automatizados
├── docs/                   # Documentação
└── scripts/                # Scripts de automação
```

## 🔐 Configuração

### Azure DevOps

1. Crie um Personal Access Token com as seguintes permissões:
   - Work Items: Read & Write
   - Code: Read & Write
   - Pull Requests: Read & Write

2. Configure o webhook no Azure DevOps para apontar para seu endpoint

### Google Gemini

1. Obtenha uma chave de API do Google AI Studio
2. Configure a chave no arquivo `.env`

## 🚦 Status do Projeto:

Este projeto está em desenvolvimento ativo. Consulte o arquivo `tasks.md` para ver o progresso atual da implementação.

## 📖 Documentação

### Guias de Execução
- [🚀 Quick Start](docs/QUICK_START.md) - Setup em 5 minutos
- [📋 Guia Completo de Execução](docs/GUIA_EXECUCAO.md) - Instruções detalhadas
- [⚙️ Configuração Azure DevOps](docs/CONFIGURACAO_AZURE_DEVOPS.md) - Setup Azure DevOps

### Documentação Técnica
- [Requisitos](.kiro/specs/redimento-code-generator/requirements.md)
- [Design](.kiro/specs/redimento-code-generator/design.md)
- [Tasks](.kiro/specs/redimento-code-generator/tasks.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Equipe

Desenvolvido pela equipe Redimento para automatizar e acelerar o processo de desenvolvimento.