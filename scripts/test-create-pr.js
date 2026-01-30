/**
 * Script para testar criação de pull request específico
 */

require('dotenv').config();
const azdev = require('azure-devops-node-api');

async function testCreatePR() {
  try {
    const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
    const token = process.env.AZURE_DEVOPS_TOKEN;
    const project = process.env.AZURE_DEVOPS_PROJECT;
    const repositoryId = process.env.AZURE_DEVOPS_REPOSITORY_ID;

    console.log('🔍 Testando criação de pull request específico...');

    // Create authentication handler
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    
    // Initialize connection
    const connection = new azdev.WebApi(orgUrl, authHandler);
    
    // Get Git API
    const gitApi = await connection.getGitApi();
    
    // Test PR creation data (similar to what our system generates)
    const prData = {
      sourceRefName: 'refs/heads/main',
      targetRefName: 'refs/heads/develop',
      title: 'Test PR - Cadastro de usuario',
      description: 'Pull request de teste para work item 11288',
      reviewers: [], // Empty for now to avoid reviewer issues
      workItemRefs: [{
        id: '11288',
        url: `${orgUrl}/_apis/wit/workItems/11288`
      }],
      labels: [],
      isDraft: false
    };

    console.log('📝 Dados do PR:', JSON.stringify(prData, null, 2));
    
    // Try to create the pull request
    console.log('🚀 Tentando criar pull request...');
    const result = await gitApi.createPullRequest(prData, repositoryId, project);
    
    if (result) {
      console.log('✅ Pull request criado com sucesso!');
      console.log(`   ID: ${result.pullRequestId}`);
      console.log(`   Título: ${result.title}`);
      console.log(`   URL: ${result.url}`);
    } else {
      console.log('❌ Falha ao criar pull request - resultado nulo');
    }

  } catch (error) {
    console.error('❌ Erro ao criar pull request:', error.message);
    
    if (error.message.includes('Location id')) {
      console.error('\n💡 Erro de Location ID:');
      console.error('   Este erro pode indicar que a API do Azure DevOps mudou');
      console.error('   ou que há um problema com as permissões do token');
    }
    
    if (error.statusCode) {
      console.error(`   Status Code: ${error.statusCode}`);
    }
    
    console.error('\n🔍 Detalhes do erro:', error);
  }
}

// Execute if called directly
if (require.main === module) {
  testCreatePR();
}

module.exports = { testCreatePR };