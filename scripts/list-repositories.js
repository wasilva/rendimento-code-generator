/**
 * Script para listar repositórios do Azure DevOps
 * Usado para descobrir o ID correto do repositório
 */

require('dotenv').config();
const azdev = require('azure-devops-node-api');

async function listRepositories() {
  try {
    const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
    const token = process.env.AZURE_DEVOPS_TOKEN;
    const project = process.env.AZURE_DEVOPS_PROJECT;

    if (!orgUrl || !token || !project) {
      console.error('❌ Variáveis de ambiente necessárias:');
      console.error('   AZURE_DEVOPS_ORG_URL');
      console.error('   AZURE_DEVOPS_TOKEN');
      console.error('   AZURE_DEVOPS_PROJECT');
      process.exit(1);
    }

    console.log('🔍 Conectando ao Azure DevOps...');
    console.log(`   Organização: ${orgUrl}`);
    console.log(`   Projeto: ${project}`);

    // Create authentication handler
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    
    // Initialize connection
    const connection = new azdev.WebApi(orgUrl, authHandler);
    
    // Get Git API
    const gitApi = await connection.getGitApi();
    
    // List repositories
    console.log('\n📂 Listando repositórios...');
    const repositories = await gitApi.getRepositories(project);
    
    if (!repositories || repositories.length === 0) {
      console.log('❌ Nenhum repositório encontrado no projeto');
      return;
    }

    console.log(`\n✅ Encontrados ${repositories.length} repositório(s):\n`);
    
    repositories.forEach((repo, index) => {
      console.log(`${index + 1}. ${repo.name}`);
      console.log(`   ID: ${repo.id}`);
      console.log(`   URL: ${repo.webUrl}`);
      console.log(`   Branch padrão: ${repo.defaultBranch}`);
      console.log(`   Tamanho: ${repo.size} bytes`);
      console.log('');
    });

    // Suggest configuration
    if (repositories.length > 0) {
      const mainRepo = repositories[0];
      console.log('💡 Configuração sugerida para .env:');
      console.log(`AZURE_DEVOPS_REPOSITORY_ID=${mainRepo.id}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro ao listar repositórios:', error.message);
    
    if (error.message.includes('unauthorized')) {
      console.error('\n💡 Dicas para resolver:');
      console.error('   1. Verifique se o token tem permissões de leitura para repositórios Git');
      console.error('   2. Verifique se o token não expirou');
      console.error('   3. Verifique se a URL da organização está correta');
    }
  }
}

// Execute if called directly
if (require.main === module) {
  listRepositories();
}

module.exports = { listRepositories };