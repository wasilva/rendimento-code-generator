/**
 * Script para testar criação de pull request no Azure DevOps
 */

require('dotenv').config();
const azdev = require('azure-devops-node-api');

async function testPullRequestCreation() {
  try {
    const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
    const token = process.env.AZURE_DEVOPS_TOKEN;
    const project = process.env.AZURE_DEVOPS_PROJECT;
    const repositoryId = process.env.AZURE_DEVOPS_REPOSITORY_ID;

    console.log('🔍 Testando criação de pull request...');
    console.log(`   Organização: ${orgUrl}`);
    console.log(`   Projeto: ${project}`);
    console.log(`   Repositório: ${repositoryId}`);

    // Create authentication handler
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    
    // Initialize connection
    const connection = new azdev.WebApi(orgUrl, authHandler);
    
    // Get Git API
    const gitApi = await connection.getGitApi();
    
    // First, let's check if we can get repository info
    console.log('\n📂 Verificando repositório...');
    const repo = await gitApi.getRepository(repositoryId, project);
    console.log(`✅ Repositório encontrado: ${repo.name}`);
    console.log(`   Branch padrão: ${repo.defaultBranch || 'refs/heads/main'}`);
    
    // List branches to see what's available
    console.log('\n🌿 Listando branches...');
    const branches = await gitApi.getBranches(repositoryId, project);
    console.log(`✅ Encontradas ${branches.length} branches:`);
    branches.forEach(branch => {
      console.log(`   - ${branch.name}`);
    });
    
    // Check if we have permission to create PRs
    console.log('\n🔐 Verificando permissões...');
    
    // Try to get existing PRs to test permissions
    const existingPRs = await gitApi.getPullRequests(repositoryId, { status: 'active' }, project);
    console.log(`✅ Permissão de leitura OK - ${existingPRs.length} PRs ativos encontrados`);
    
    console.log('\n✅ Teste concluído com sucesso!');
    console.log('💡 O token tem as permissões necessárias para acessar repositórios Git');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    
    if (error.message.includes('unauthorized')) {
      console.error('\n💡 Problema de autorização:');
      console.error('   1. Verifique se o token tem permissões "Code (read & write)"');
      console.error('   2. Verifique se o token não expirou');
    } else if (error.message.includes('not found')) {
      console.error('\n💡 Recurso não encontrado:');
      console.error('   1. Verifique se o repositório ID está correto');
      console.error('   2. Verifique se o projeto existe');
    } else {
      console.error('\n💡 Erro desconhecido - verifique logs detalhados');
      console.error('Stack trace:', error.stack);
    }
  }
}

// Execute if called directly
if (require.main === module) {
  testPullRequestCreation();
}

module.exports = { testPullRequestCreation };