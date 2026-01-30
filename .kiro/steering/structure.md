# Estrutura do Projeto

## Organização de Diretórios
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
│   ├── unit/               # Testes unitários
│   ├── integration/        # Testes de integração
│   └── fixtures/           # Dados de teste
├── docs/                   # Documentação
├── scripts/                # Scripts de automação
├── .env.example            # Exemplo de variáveis de ambiente
├── .gitignore              # Arquivos ignorados pelo Git
├── package.json            # Dependências e scripts
├── tsconfig.json           # Configuração TypeScript
├── jest.config.js          # Configuração de testes
└── README.md               # Documentação principal
```

## Convenções de Nomenclatura

### Arquivos e Diretórios
- **Arquivos**: camelCase para TypeScript (`userService.ts`)
- **Diretórios**: kebab-case (`azure-devops/`)
- **Testes**: sufixo `.test.ts` ou `.spec.ts`

### Código
- **Classes**: PascalCase (`WorkItemProcessor`)
- **Funções/Variáveis**: camelCase (`processWorkItem`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces**: PascalCase com prefixo `I` (`IWorkItem`)

## Padrões Arquiteturais

### Separação de Responsabilidades
- **Controllers**: Apenas manipulação de requisições HTTP
- **Services**: Lógica de negócio e integrações
- **Models**: Definição de tipos e interfaces
- **Utils**: Funções auxiliares reutilizáveis

### Fluxo de Dados
1. **Webhook** → Controller → Service → External APIs
2. **Validação** em cada camada
3. **Error Handling** centralizado
4. **Logging** estruturado

## Configuração de Módulos
- **Imports absolutos**: Usar paths do TypeScript
- **Barrel exports**: `index.ts` em cada diretório
- **Dependency Injection**: Para facilitar testes