#!/usr/bin/env node

/**
 * Script para testar a conexão com Azure DevOps
 * Executa: node scripts/test-azure-connection.js
 */

const dotenv = require('dotenv');
const { createAzureDevOpsServiceFromEnv } = require('../dist/src/services/azure/azureDevOpsService');

// Carregar variáveis de ambiente
dotenv.config();

async function testAzureDevOpsConnection() {
  console.log('🔍 Testando conexão com Azure DevOps...\n');
  
  try {
    // Verificar variáveis de ambiente
    console.log('📋 Configurações:');
    console.log(`   Organização: ${process.env.AZURE_DEVOPS_ORG_URL}`);
    console.log(`   Projeto: ${process.env.AZURE_DEVOPS_PROJECT}`);
    console.log(`   Token: ${process.env.AZURE_DEVOPS_TOKEN ? '✅ Configurado' : '❌ Não configurado'}`);
    console.log('');

    if (!process.env.AZURE_DEVOPS_TOKEN) {
      throw new Error('Token do Azure DevOps não configurado');
    }

    // Criar serviço
    const azureService = createAzureDevOpsServiceFromEnv();
    
    // Teste 1: Buscar campos de work item
    console.log('🧪 Teste 1: Buscando campos de work item...');
    const fields = await azureService.getWorkItemFields('User Story');
    console.log(`   ✅ Sucesso! Encontrados ${fields.length} campos disponíveis`);
    console.log('');

    // Teste 2: Tentar buscar um work item (se existir)
    console.log('🧪 Teste 2: Testando busca de work item...');
    try {
      // Tentar buscar work item ID 1 (geralmente existe)
      const workItem = await azureService.getWorkItem(1);
      console.log(`   ✅ Sucesso! Work item encontrado: "${workItem.fields['System.Title'] || 'Sem título'}"`);
    } catch (error) {
      if (error.message.includes('not found')) {
        console.log('   ⚠️  Work item ID 1 não encontrado (normal se projeto for novo)');
      } else {
        throw error;
      }
    }
    console.log('');

    console.log('🎉 Conexão com Azure DevOps funcionando perfeitamente!');
    console.log('');
    console.log('📝 Próximos passos:');
    console.log('   1. Configure o webhook no Azure DevOps');
    console.log('   2. Teste criando um work item');
    console.log('   3. Verifique se o webhook está sendo recebido');

  } catch (error) {
    console.error('❌ Erro na conexão com Azure DevOps:');
    console.error(`   ${error.message}`);
    console.log('');
    console.log('🔧 Possíveis soluções:');
    console.log('   1. Verificar se o token ainda é válido');
    console.log('   2. Verificar permissões do token (Work Items: Read & Write)');
    console.log('   3. Verificar se a organização/projeto estão corretos');
    console.log('   4. Verificar conectividade com a internet');
    
    process.exit(1);
  }
}

// Executar teste
testAzureDevOpsConnection();