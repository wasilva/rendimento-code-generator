# Guia de Contribuição - Redimento Code Generator

Bem-vindo ao projeto Redimento Code Generator! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Código](#padrões-de-código)
- [Processo de Development](#processo-de-development)
- [Testes](#testes)
- [Documentação](#documentação)
- [Pull Requests](#pull-requests)
- [Reportar Issues](#reportar-issues)
- [Código de Conduta](#código-de-conduta)

## 🤝 Como Contribuir

Existem várias maneiras de contribuir com o projeto:

### 🐛 Reportar Bugs
- Use o template de issue para bugs
- Inclua passos para reproduzir
- Forneça logs e informações do ambiente

### 💡 Sugerir Melhorias
- Use o template de issue para features
- Descreva o problema que resolve
- Proponha uma solução detalhada

### 📝 Melhorar Documentação
- Corrija erros de digitação
- Adicione exemplos práticos
- Traduza documentação

### 🔧 Contribuir com Código
- Implemente novas funcionalidades
- Corrija bugs existentes
- Melhore performance
- Adicione testes

## 🛠️ Configuração do Ambiente

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/seu-usuario/redimento-code-generator.git
cd redimento-code-generator

# Adicione o repositório original como upstream
git remote add upstream https://github.com/organizacao/redimento-code-generator.git
```

### 2. Instalação

```bash
# Instale dependências
npm install

# Copie arquivo de configuração
cp .env.example .env.development

# Configure suas variáveis de ambiente
# (veja CONFIGURACAO_AZURE_DEVOPS.md e CONFIGURACAO_GEMINI_API.md)
```

### 3. Verificação

```bash
# Execute testes
npm test

# Verifique linting
npm run lint

# Execute build
npm run build

# Inicie em modo desenvolvimento
npm run dev
```

## 📏 Padrões de Código

### Estrutura de Arquivos

```
src/
├── controllers/     # Controladores HTTP
├── services/       # Lógica de negócio
├── models/         # Interfaces e tipos
├── middleware/     # Middlewares Express
├── utils/          # Utilitários gerais
├── config/         # Configurações
└── app.ts          # Aplicação principal
```

### Convenções de Nomenclatura

#### Arquivos e Diretórios
```bash
# Arquivos TypeScript
userService.ts          # camelCase
WorkItemProcessor.ts    # PascalCase para classes
index.ts               # barrel exports

# Diretórios
azure-devops/          # kebab-case
workItem/             # camelCase para conceitos únicos
```

#### Código TypeScript
```typescript
// Classes: PascalCase
class WorkItemProcessor {
  // Métodos e propriedades: camelCase
  processWorkItem(workItem: IWorkItem): Promise<void> {}
  
  // Propriedades privadas: underscore prefix
  private _config: IConfig;
}

// Interfaces: PascalCase com prefixo I
interface IWorkItem {
  id: number;
  title: string;
}

// Enums: PascalCase
enum WorkItemType {
  USER_STORY = 'User Story',
  TASK = 'Task',
  BUG = 'Bug'
}

// Constantes: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;

// Funções: camelCase
function processWorkItem(item: IWorkItem): void {}
const generateCode = async (prompt: string): Promise<string> => {};
```

### ESLint e Prettier

O projeto usa configurações padronizadas:

```json
// .eslintrc.js
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Comentários e Documentação

```typescript
/**
 * Processa um work item do Azure DevOps e gera código automaticamente.
 * 
 * @param workItem - Work item a ser processado
 * @param config - Configuração do repositório alvo
 * @returns Resultado do processamento incluindo branch criada e arquivos gerados
 * 
 * @example
 * ```typescript
 * const result = await processWorkItem(workItem, config);
 * console.log(`Branch criada: ${result.branchName}`);
 * ```
 * 
 * @throws {WorkItemValidationError} Quando work item não tem dados suficientes
 * @throws {GitOperationError} Quando operações Git falham
 */
async function processWorkItem(
  workItem: IWorkItem,
  config: IRepositoryConfig
): Promise<IProcessingResult> {
  // Validar entrada
  if (!workItem.id || !workItem.title) {
    throw new WorkItemValidationError('Work item deve ter ID e título');
  }

  // TODO: Implementar cache de resultados
  // FIXME: Melhorar tratamento de erro para timeouts
  
  try {
    // Lógica principal...
  } catch (error) {
    // Log estruturado para debugging
    logger.error('Falha ao processar work item', {
      workItemId: workItem.id,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
```

## 🔄 Processo de Development

### 1. Workflow Git

```bash
# Sempre trabalhe em uma branch feature
git checkout -b feature/nome-da-funcionalidade

# Mantenha sua branch atualizada
git fetch upstream
git rebase upstream/main

# Commits pequenos e focados
git add .
git commit -m "feat: adiciona validação de work item"

# Push para seu fork
git push origin feature/nome-da-funcionalidade
```

### 2. Convenção de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Tipos de commit
feat:     # Nova funcionalidade
fix:      # Correção de bug
docs:     # Mudanças na documentação
style:    # Formatação, sem mudança de lógica
refactor: # Refatoração de código
test:     # Adicionar ou modificar testes
chore:    # Tarefas de manutenção

# Exemplos
git commit -m "feat: adiciona suporte a work items do tipo Epic"
git commit -m "fix: corrige validação de webhook signature"
git commit -m "docs: atualiza guia de configuração do Azure DevOps"
git commit -m "test: adiciona testes de propriedade para GitService"
git commit -m "refactor: extrai lógica de retry para service separado"
```

### 3. Branches

```bash
# Branch principal
main                    # Código estável em produção

# Branches de feature
feature/user-auth      # Nova funcionalidade
feature/epic-support   # Suporte a Epics
feature/cache-layer    # Camada de cache

# Branches de correção
fix/webhook-validation # Correção de bug
fix/memory-leak       # Correção de vazamento de memória

# Branches de release
release/v1.1.0        # Preparação de release
```

## 🧪 Testes

### Estrutura de Testes

```
tests/
├── unit/              # Testes unitários
│   ├── services/      # Testes de services
│   ├── controllers/   # Testes de controllers
│   └── utils/         # Testes de utilitários
├── integration/       # Testes de integração
├── fixtures/          # Dados de teste
└── setup.ts          # Configuração global
```

### Tipos de Testes

#### 1. Testes Unitários
```typescript
// tests/unit/services/workItem/WorkItemService.test.ts
import { WorkItemService } from '../../../../src/services/workItem/WorkItemService';

describe('WorkItemService', () => {
  let service: WorkItemService;

  beforeEach(() => {
    service = new WorkItemService();
  });

  describe('processWorkItem', () => {
    it('should process User Story work items correctly', async () => {
      // Arrange
      const workItem = createMockUserStory();
      
      // Act
      const result = await service.processWorkItem(workItem);
      
      // Assert
      expect(result.branchName).toMatch(/^feat\/\d+_/);
      expect(result.status).toBe('completed');
    });

    it('should throw error for invalid work item', async () => {
      // Arrange
      const invalidWorkItem = { id: null, title: '' };
      
      // Act & Assert
      await expect(service.processWorkItem(invalidWorkItem))
        .rejects.toThrow(WorkItemValidationError);
    });
  });
});
```

#### 2. Testes de Propriedade
```typescript
// tests/unit/services/workItem/WorkItemService.property.test.ts
import fc from 'fast-check';
import { WorkItemService } from '../../../../src/services/workItem/WorkItemService';

describe('WorkItemService Property Tests', () => {
  const service = new WorkItemService();

  it('should maintain work item ID consistency', () => {
    // **Feature: redimento-code-generator, Property 1: Work item ID preservation**
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 999999 }),
      fc.string({ minLength: 1, maxLength: 100 }),
      async (workItemId, title) => {
        const workItem = {
          id: workItemId,
          title: title,
          type: 'User Story',
          state: 'Active'
        };

        const result = await service.processWorkItem(workItem);
        
        // Propriedade: ID do work item deve ser preservado
        expect(result.workItemId).toBe(workItemId);
      }
    ));
  });
});
```

#### 3. Testes de Integração
```typescript
// tests/integration/webhook.integration.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('Webhook Integration', () => {
  it('should process complete workflow from webhook to PR', async () => {
    // Simular webhook do Azure DevOps
    const webhookPayload = createValidWebhookPayload();
    
    const response = await request(app)
      .post('/webhook/workitem')
      .set('X-Hub-Signature-256', generateValidSignature(webhookPayload))
      .send(webhookPayload)
      .expect(200);

    expect(response.body.success).toBe(true);
    
    // Verificar se branch foi criada
    // Verificar se código foi gerado
    // Verificar se PR foi criado
  });
});
```

### Executar Testes

```bash
# Todos os testes
npm test

# Testes específicos
npm test -- --testPathPattern=WorkItemService

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch

# Apenas testes de propriedade
npm test -- --testNamePattern="Property"
```

### Cobertura de Testes

Mantenha cobertura mínima de:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

```bash
# Verificar cobertura
npm run test:coverage

# Abrir relatório HTML
open coverage/lcov-report/index.html
```

## 📚 Documentação

### Tipos de Documentação

#### 1. Código (JSDoc)
```typescript
/**
 * Gera código TypeScript baseado em um work item.
 * 
 * @param workItem - Work item contendo requisitos
 * @param template - Template de código a ser usado
 * @param options - Opções de geração
 * @returns Código gerado e metadados
 * 
 * @example
 * ```typescript
 * const code = await generateCode(workItem, template, {
 *   language: 'typescript',
 *   includeTests: true
 * });
 * ```
 */
```

#### 2. README e Guias
- Use Markdown para documentação
- Inclua exemplos práticos
- Mantenha atualizado com mudanças

#### 3. Comentários de Código
```typescript
// Explicar "por que", não "o que"
// ❌ Ruim
const result = data.filter(item => item.active); // Filtra itens ativos

// ✅ Bom  
// Apenas work items ativos podem ser processados automaticamente
const activeWorkItems = data.filter(item => item.active);
```

### Atualizar Documentação

```bash
# Gerar documentação da API
npm run docs:generate

# Verificar links quebrados
npm run docs:check

# Servir documentação localmente
npm run docs:serve
```

## 🔄 Pull Requests

### Antes de Criar PR

```bash
# Checklist pré-PR
npm run lint          # ✅ Sem erros de linting
npm test             # ✅ Todos os testes passando
npm run build        # ✅ Build sem erros
npm run docs:check   # ✅ Documentação atualizada
```

### Template de PR

```markdown
## Descrição
Breve descrição das mudanças realizadas.

## Tipo de Mudança
- [ ] Bug fix (mudança que corrige um problema)
- [ ] Nova funcionalidade (mudança que adiciona funcionalidade)
- [ ] Breaking change (mudança que quebra compatibilidade)
- [ ] Documentação (mudança apenas na documentação)

## Como Testar
1. Passos para testar as mudanças
2. Comandos específicos para executar
3. Resultados esperados

## Checklist
- [ ] Código segue padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Todos os testes passam
- [ ] Build está funcionando

## Issues Relacionadas
Fixes #123
Closes #456
```

### Processo de Review

1. **Automated Checks**: CI/CD executa testes e linting
2. **Code Review**: Pelo menos 1 aprovação necessária
3. **Manual Testing**: Tester verifica funcionalidade
4. **Merge**: Squash and merge para main

### Critérios de Aprovação

- ✅ Todos os checks automatizados passando
- ✅ Código revisado e aprovado
- ✅ Documentação atualizada
- ✅ Testes adequados incluídos
- ✅ Sem conflitos de merge

## 🐛 Reportar Issues

### Template de Bug Report

```markdown
## Descrição do Bug
Descrição clara e concisa do problema.

## Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Execute '...'
4. Veja o erro

## Comportamento Esperado
Descrição do que deveria acontecer.

## Comportamento Atual
Descrição do que está acontecendo.

## Screenshots/Logs
Se aplicável, adicione screenshots ou logs.

## Ambiente
- OS: [e.g. Windows 10, macOS 12.0]
- Node.js: [e.g. 18.17.0]
- npm: [e.g. 9.6.7]
- Versão do projeto: [e.g. 1.0.0]

## Contexto Adicional
Qualquer outra informação relevante.
```

### Template de Feature Request

```markdown
## Problema/Necessidade
Descrição clara do problema que esta feature resolveria.

## Solução Proposta
Descrição da solução que você gostaria de ver.

## Alternativas Consideradas
Outras soluções que você considerou.

## Contexto Adicional
Screenshots, mockups, ou qualquer contexto adicional.

## Impacto
- [ ] Melhoria de performance
- [ ] Nova funcionalidade
- [ ] Melhoria de UX
- [ ] Correção de problema existente
```

## 📋 Código de Conduta

### Nossos Compromissos

- **Inclusão**: Ambiente acolhedor para todos
- **Respeito**: Tratamento respeitoso independente de diferenças
- **Colaboração**: Trabalho em equipe construtivo
- **Profissionalismo**: Comunicação profissional e focada

### Comportamentos Esperados

- ✅ Usar linguagem acolhedora e inclusiva
- ✅ Respeitar diferentes pontos de vista
- ✅ Aceitar críticas construtivas
- ✅ Focar no que é melhor para a comunidade
- ✅ Mostrar empatia com outros membros

### Comportamentos Inaceitáveis

- ❌ Linguagem ou imagens sexualizadas
- ❌ Trolling, insultos ou comentários depreciativos
- ❌ Assédio público ou privado
- ❌ Publicar informações privadas sem permissão
- ❌ Conduta inadequada em contexto profissional

### Aplicação

Instâncias de comportamento inaceitável podem ser reportadas para [email@empresa.com]. Todas as reclamações serão revisadas e investigadas.

## 🎯 Próximos Passos

Após ler este guia:

1. **Configure seu ambiente** seguindo as instruções
2. **Escolha uma issue** marcada como "good first issue"
3. **Crie sua branch** e comece a contribuir
4. **Peça ajuda** se precisar - estamos aqui para ajudar!

## 📞 Suporte

- **Issues**: Para bugs e feature requests
- **Discussions**: Para perguntas e discussões gerais
- **Email**: [dev-team@empresa.com] para questões privadas
- **Slack**: #redimento-dev para chat em tempo real

---

**Obrigado por contribuir com o Redimento Code Generator!** 🚀

*Última atualização: Janeiro 2024*
*Versão do documento: 1.0*