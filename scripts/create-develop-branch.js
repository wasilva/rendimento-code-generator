/**
 * Script para criar a branch develop no Azure DevOps
 */

require('dotenv').config();
const azdev = require('azure-devops-node-api');

async function createDevelopBranch() {
  try {
    const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
    const token = process.env.AZURE_DEVOPS_TOKEN;
    const project = process.env.AZURE_DEVOPS_PROJECT;
    const repositoryId = process.env.AZURE_DEVOPS_REPOSITORY_ID;

    console.log('🌿 Criando branch develop no Azure DevOps...');

    // Create authentication handler
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    
    // Initialize connection
    const connection = new azdev.WebApi(orgUrl, authHandler);
    
    // Get Git API
    const gitApi = await connection.getGitApi();
    
    // Get main branch reference
    console.log('📍 Obtendo referência da branch main...');
    const mainRef = await gitApi.getRefs(repositoryId, project, 'heads/main');
    
    if (!mainRef || mainRef.length === 0) {
      throw new Error('Branch main não encontrada');
    }
    
    const mainSha = mainRef[0].objectId;
    console.log(`✅ SHA da main: ${mainSha}`);
    
    // Check if develop branch already exists
    try {
      const developRef = await gitApi.getRefs(repositoryId, project, 'heads/develop');
      if (developRef && developRef.length > 0) {
        console.log('✅ Branch develop já existe!');
        return;
      }
    } catch (error) {
      // Branch doesn't exist, continue to create it
    }
    
    // Create develop branch
    console.log('🔨 Criando branch develop...');
    const newRef = {
      name: 'refs/heads/develop',
      oldObjectId: '0000000000000000000000000000000000000000',
      newObjectId: mainSha
    };
    
    const result = await gitApi.updateRefs([newRef], repositoryId, project);
    
    if (result && result.length > 0 && result[0].success) {
      console.log('✅ Branch develop criada com sucesso!');
      console.log(`   Nome: develop`);
      console.log(`   SHA: ${result[0].newObjectId}`);
    } else {
      throw new Error('Falha ao criar branch develop');
    }

  } catch (error) {
    console.error('❌ Erro ao criar branch develop:', error.message);
  }
}

// Execute if called directly
if (require.main === module) {
  createDevelopBranch();
}

module.exports = { createDevelopBranch };