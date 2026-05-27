const fs = require('fs');

const filePath = 'n8n_workflow_atual.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 1. Atualizar Normalizar Payload com o número do gerente
const normNode = data.nodes.find(n => n.name === 'Normalizar Payload');
if (normNode) {
  const params = normNode.parameters.values.string;
  const telField = params.find(p => p.name === 'GERENTE_TELEFONE');
  if (telField) {
    telField.value = '5562994121030';
  }
}

// 2. Renomear Notificar Gerente (Mock) para Preparar Alerta Gerente
const mockNode = data.nodes.find(n => n.name === 'Notificar Gerente (Mock)');
if (mockNode) {
  mockNode.name = 'Preparar Alerta Gerente';
  
  // Atualizar as conexões (quem apontava para o mock, agora aponta pro nome novo)
  data.connections['Precisa de Gerente?'].main[0] = data.connections['Precisa de Gerente?'].main[0].map(conn => {
    if (conn.node === 'Notificar Gerente (Mock)') {
      conn.node = 'Preparar Alerta Gerente';
    }
    return conn;
  });

  // Transferir as conexões que saiam do mock para o novo nome
  data.connections['Preparar Alerta Gerente'] = data.connections['Notificar Gerente (Mock)'];
  delete data.connections['Notificar Gerente (Mock)'];
}

// 2.5 Atualizar referências no nó "Enviar WhatsApp Gerente"
const wpNode = data.nodes.find(n => n.name === 'Enviar WhatsApp Gerente');
if (wpNode && wpNode.parameters.jsonBody) {
  wpNode.parameters.jsonBody = wpNode.parameters.jsonBody.replace(/Notificar Gerente \(Mock\)/g, 'Preparar Alerta Gerente');
}

// 3. Adicionar o nó de Enviar E-mail
const emailNode = {
  "parameters": {
    "fromEmail": "sdr-agent@seu-dominio.com",
    "toEmail": "gerente@seu-dominio.com",
    "subject": "={{ '🚨 Novo Lead Qualificado: ' + $('Atualizar Lead (Supabase)').first().json.nome }}",
    "text": "={{ $('Preparar Alerta Gerente').first().json.mock_whatsapp_gerente }}",
    "options": {}
  },
  "id": "e2f1b4c9-8d1e-42c1-bb11-8e9a11122233",
  "name": "Enviar Email Gerente",
  "type": "n8n-nodes-base.emailSend",
  "typeVersion": 2.1,
  "position": [
    11300,
    3232
  ]
};

data.nodes.push(emailNode);

// Ligar o Enviar WhatsApp Gerente no Enviar Email Gerente
if (!data.connections['Enviar WhatsApp Gerente']) {
  data.connections['Enviar WhatsApp Gerente'] = { "main": [[]] };
}
data.connections['Enviar WhatsApp Gerente'].main[0].push({
  "node": "Enviar Email Gerente",
  "type": "main",
  "index": 0
});

// Ligar Enviar Email Gerente ao fluxo seguinte
// Para onde o Enviar WhatsApp Gerente ou Preparar Alerta Gerente ia depois?
// Eles iam para Preparar Resposta Cliente. Vamos verificar se havia essa conexão.
// Na verdade, o Enviar WhatsApp Gerente não tinha conexões de saída.
// A lógica diz que depois de Notificar (ou bypass), ele ia para Preparar Resposta Cliente.
// Vamos ligar o Enviar Email Gerente ao Preparar Resposta Cliente.
data.connections['Enviar Email Gerente'] = {
  "main": [
    [
      {
        "node": "Preparar Resposta Cliente",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

// Como Bypass (Sem Alerta) se liga ao Preparar Resposta Cliente, faremos o mesmo para o Email.

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Workflow atualizado com sucesso!');
