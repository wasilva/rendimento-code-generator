const https = require('https');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

async function testAzureConnection() {
  console.log('🔍 Testando conexão com Azure DevOps...\n');
  
  // Verificar configurações
  const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
  const token = process.env.AZURE_DEVOPS_TOKEN;
  const project = process.env.AZURE_DEVOPS_PROJECT;
  
  console.log('📋 Configurações:');
  console.log(`   Organização: ${orgUrl}`);
  console.log(`   Projeto: ${project}`);
  console.log(`   Token: ${token ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log('');

  if (!orgUrl || !token || !project) {
    console.error('❌ Configurações incompletas!');
    console.log('Verifique se as seguintes variáveis estão no .env:');
    console.log('- AZURE_DEVOPS_ORG_URL');
    console.log('- AZURE_DEVOPS_TOKEN');
    console.log('- AZURE_DEVOPS_PROJECT');
    return;
  }

  // Extrair organização da URL
  const orgMatch = orgUrl.match(/dev\.azure\.com\/([^\/]+)/);
  if (!orgMatch) {
    console.error('❌ URL da organização inválida');
    return;
  }
  
  const organization = orgMatch[1];
  
  // Testar conexão com API do Azure DevOps
  const apiUrl = `https://dev.azure.com/${organization}/${project}/_apis/projects/${project}?api-version=6.0`;
  
  console.log('🧪 Testando conexão com API...');
  console.log(`   URL: ${apiUrl}`);
  
  try {
    const response = await makeRequest(apiUrl, token);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      console.log('   ✅ Conexão bem-sucedida!');
      console.log(`   📁 Projeto: ${data.name}`);
      console.log(`   🆔 ID: ${data.id}`);
      console.log(`   📝 Descrição: ${data.description || 'Sem descrição'}`);
      console.log('');
      
      // Testar endpoint de work items
      console.log('🧪 Testando endpoint de work items...');
      const wiqlUrl = `https://dev.azure.com/${organization}/${project}/_apis/wit/wiql?api-version=6.0`;
      
      const wiqlQuery = {
        query: "SELECT [System.Id], [System.Title] FROM WorkItems WHERE [System.TeamProject] = @project ORDER BY [System.Id] DESC"
      };
      
      const wiqlResponse = await makeRequest(wiqlUrl, token, 'POST', JSON.stringify(wiqlQuery));
      
      if (wiqlResponse.statusCode === 200) {
        const wiqlData = JSON.parse(wiqlResponse.body);
        console.log(`   ✅ Sucesso! Encontrados ${wiqlData.workItems?.length || 0} work items`);
        
        if (wiqlData.workItems && wiqlData.workItems.length > 0) {
          console.log(`   📋 Último work item: ID ${wiqlData.workItems[0].id}`);
        }
      } else {
        console.log(`   ⚠️  Erro ao buscar work items: ${wiqlResponse.statusCode}`);
      }
      
      console.log('');
      console.log('🎉 Azure DevOps está configurado e funcionando!');
      console.log('');
      console.log('📝 Próximos passos:');
      console.log('   1. Iniciar o servidor: npm run dev');
      console.log('   2. Configurar webhook no Azure DevOps');
      console.log('   3. Testar criando um work item');
      
    } else {
      console.error(`❌ Erro na conexão: HTTP ${response.statusCode}`);
      console.error(`   Resposta: ${response.body}`);
      
      if (response.statusCode === 401) {
        console.log('');
        console.log('🔧 Token inválido ou expirado. Verifique:');
        console.log('   1. Se o token ainda é válido');
        console.log('   2. Se tem as permissões corretas');
        console.log('   3. Se a organização está correta');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.log('');
    console.log('🔧 Possíveis soluções:');
    console.log('   1. Verificar conectividade com a internet');
    console.log('   2. Verificar se a URL da organização está correta');
    console.log('   3. Verificar se o token tem as permissões necessárias');
  }
}

function makeRequest(url, token, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${token}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Redimento-Code-Generator/1.0.0'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

// Executar teste
testAzureConnection().catch(console.error);