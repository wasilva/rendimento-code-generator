/**
 * Script para inicializar o repositório Azure DevOps
 * Cria um commit inicial para que o repositório tenha pelo menos uma branch
 */

require('dotenv').config();
const azdev = require('azure-devops-node-api');

async function initializeRepository() {
  try {
    const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
    const token = process.env.AZURE_DEVOPS_TOKEN;
    const project = process.env.AZURE_DEVOPS_PROJECT;
    const repositoryId = process.env.AZURE_DEVOPS_REPOSITORY_ID;

    console.log('🚀 Inicializando repositório Azure DevOps...');
    console.log(`   Organização: ${orgUrl}`);
    console.log(`   Projeto: ${project}`);
    console.log(`   Repositório: ${repositoryId}`);

    // Create authentication handler
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    
    // Initialize connection
    const connection = new azdev.WebApi(orgUrl, authHandler);
    
    // Get Git API
    const gitApi = await connection.getGitApi();
    
    // Check if repository already has branches
    console.log('\n🔍 Verificando branches existentes...');
    try {
      const branches = await gitApi.getBranches(repositoryId, project);
      if (branches && branches.length > 0) {
        console.log(`✅ Repositório já tem ${branches.length} branch(es):`);
        branches.forEach(branch => {
          console.log(`   - ${branch.name}`);
        });
        console.log('\n✅ Repositório já está inicializado!');
        return;
      }
    } catch (error) {
      if (!error.message.includes('Cannot find any branches')) {
        throw error;
      }
      console.log('📝 Repositório vazio - criando commit inicial...');
    }

    // Create initial commit
    console.log('\n📝 Criando commit inicial...');
    
    // Get repository info
    const repo = await gitApi.getRepository(repositoryId, project);
    
    // Create initial file content
    const readmeContent = `# ${repo.name}

Este é o repositório do projeto ${repo.name}.

## Sobre

Este repositório foi inicializado automaticamente pelo Redimento Code Generator.

## Estrutura

- \`src/\` - Código fonte
- \`docs/\` - Documentação
- \`tests/\` - Testes

## Como usar

1. Clone o repositório
2. Instale as dependências
3. Execute o projeto

---
*Gerado automaticamente em ${new Date().toISOString()}*
`;

    // Create the initial commit
    const pushData = {
      refUpdates: [
        {
          name: 'refs/heads/main',
          oldObjectId: '0000000000000000000000000000000000000000'
        }
      ],
      commits: [
        {
          comment: 'Initial commit - Repository initialization',
          changes: [
            {
              changeType: 'add',
              item: {
                path: '/README.md'
              },
              newContent: {
                content: readmeContent,
                contentType: 'rawtext'
              }
            }
          ]
        }
      ]
    };

    const pushResult = await gitApi.createPush(pushData, repositoryId, project);
    
    if (pushResult && pushResult.commits && pushResult.commits.length > 0) {
      console.log('✅ Commit inicial criado com sucesso!');
      console.log(`   Commit ID: ${pushResult.commits[0].commitId}`);
      console.log(`   Branch: main`);
      console.log(`   Arquivo: README.md`);
      
      // Verify the branch was created
      console.log('\n🔍 Verificando branches após inicialização...');
      const newBranches = await gitApi.getBranches(repositoryId, project);
      console.log(`✅ Agora o repositório tem ${newBranches.length} branch(es):`);
      newBranches.forEach(branch => {
        console.log(`   - ${branch.name}`);
      });
      
      console.log('\n🎉 Repositório inicializado com sucesso!');
      console.log('💡 Agora você pode criar pull requests normalmente.');
      
    } else {
      throw new Error('Falha ao criar commit inicial');
    }

  } catch (error) {
    console.error('❌ Erro ao inicializar repositório:', error.message);
    
    if (error.message.includes('unauthorized')) {
      console.error('\n💡 Problema de autorização:');
      console.error('   1. Verifique se o token tem permissões "Code (read & write)"');
      console.error('   2. Verifique se o token não expirou');
    } else if (error.message.includes('not found')) {
      console.error('\n💡 Recurso não encontrado:');
      console.error('   1. Verifique se o repositório ID está correto');
      console.error('   2. Verifique se o projeto existe');
    } else {
      console.error('\n💡 Erro detalhado:', error.stack);
    }
  }
}

// Execute if called directly
if (require.main === module) {
  initializeRepository();
}

module.exports = { initializeRepository };