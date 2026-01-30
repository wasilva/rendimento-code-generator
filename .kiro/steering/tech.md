# Stack Tecnológico

## Tecnologias Principais
- **Runtime**: Node.js (versão LTS recomendada)
- **Linguagem**: TypeScript para type safety
- **Framework**: Express.js para API REST
- **IA**: Google Gemini API para geração de código
- **Integração**: Azure DevOps REST API

## Dependências Principais
```json
{
  "express": "^4.x",
  "@google/generative-ai": "^0.x",
  "azure-devops-node-api": "^12.x",
  "simple-git": "^3.x",
  "typescript": "^5.x"
}
```

## Estrutura de Build
- **Build System**: TypeScript Compiler (tsc)
- **Package Manager**: npm
- **Linting**: ESLint + Prettier
- **Testing**: Jest

## Comandos Comuns

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

## Configuração de Ambiente
- **Variáveis de Ambiente**: `.env` para configurações locais
- **Azure DevOps**: Token de acesso pessoal necessário
- **Gemini API**: Chave de API do Google Cloud
- **Git**: Configuração de usuário para commits automáticos