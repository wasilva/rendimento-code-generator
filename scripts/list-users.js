/**
 * Script para listar usuários do projeto Azure DevOps
 */

require('dotenv').config();
const azdev = require('azure-devops-node-api');

async function listUsers() {
  try {
    const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
    const token = process.env.AZURE_DEVOPS_TOKEN;
    const project = process.env.AZURE_DEVOPS_PROJECT;

    console.log('👥 Listando usuários do projeto Azure DevOps...');
    console.log(`   Organização: ${orgUrl}`);
    console.log(`   Projeto: ${project}`);

    // Create authentication handler
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    
    // Initialize connection
    const connection = new azdev.WebApi(orgUrl, authHandler);
    
    // Get Core API for project members
    const coreApi = await connection.getCoreApi();
    
    // Get project teams
    console.log('\n🏢 Listando times do projeto...');
    const teams = await coreApi.getTeams(project);
    
    if (teams && teams.length > 0) {
      console.log(`✅ Encontrados ${teams.length} time(s):`);
      
      for (const team of teams) {
        console.log(`\n📋 Time: ${team.name}`);
        console.log(`   ID: ${team.id}`);
        
        try {
          // Get team members
          const members = await coreApi.getTeamMembersWithExtendedProperties(project, team.id);
          
          if (members && members.length > 0) {
            console.log(`   👥 Membros (${members.length}):`);
            members.forEach((member, index) => {
              console.log(`      ${index + 1}. ${member.identity.displayName}`);
              console.log(`         Email: ${member.identity.uniqueName}`);
              console.log(`         ID: ${member.identity.id}`);
            });
          } else {
            console.log('   👥 Nenhum membro encontrado');
          }
        } catch (error) {
          console.log(`   ❌ Erro ao listar membros: ${error.message}`);
        }
      }
      
      // Suggest valid reviewers
      console.log('\n💡 Emails válidos para revisores:');
      for (const team of teams) {
        try {
          const members = await coreApi.getTeamMembersWithExtendedProperties(project, team.id);
          if (members && members.length > 0) {
            members.forEach(member => {
              if (member.identity.uniqueName && member.identity.uniqueName.includes('@')) {
                console.log(`   - ${member.identity.uniqueName} (${member.identity.displayName})`);
              }
            });
          }
        } catch (error) {
          // Ignore errors for individual teams
        }
      }
      
    } else {
      console.log('❌ Nenhum time encontrado no projeto');
    }

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error.message);
    
    if (error.message.includes('unauthorized')) {
      console.error('\n💡 Problema de autorização:');
      console.error('   1. Verifique se o token tem permissões de leitura para o projeto');
      console.error('   2. Verifique se o token não expirou');
    }
  }
}

// Execute if called directly
if (require.main === module) {
  listUsers();
}

module.exports = { listUsers };