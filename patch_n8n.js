const fs = require('fs');

const data = JSON.parse(fs.readFileSync('n8n_workflow_atual.json', 'utf8'));

// Remove old webhooks
const webhooksToRemove = ['qualificar-ia', 'notificar-vendedor'];
data.nodes = data.nodes.filter(n => 
  !(webhooksToRemove.includes(n.webhookId)) && 
  !(n.name && n.name.startsWith('Buscar Lead Qualificar')) &&
  !(n.name && n.name.startsWith('Buscar Lead Vendedor')) &&
  !(n.name && n.name.startsWith('Responder Dashboard')) &&
  !(n.name && n.name.startsWith('Simular ')) &&
  !(n.name && n.name.startsWith('Disparar WhatsApp (Vendedor)')) &&
  !(n.name && n.name.startsWith('Logica IA'))
);

let baseX = 7552;
let baseY = 3248;
const webhookEntrada = data.nodes.find(n => n.name === 'Webhook Entrada');
if (webhookEntrada && webhookEntrada.position) {
  baseX = webhookEntrada.position[0];
  baseY = webhookEntrada.position[1];
}

const newNodes = [
  // IA
  {
    "parameters": { "httpMethod": "POST", "path": "qualificar-ia", "responseMode": "responseNode", "options": {} },
    "id": "webhook-qualificar-ia", "name": "Webhook Qualificar IA", "type": "n8n-nodes-base.webhook", "typeVersion": 1,
    "position": [baseX, baseY - 600], "webhookId": "qualificar-ia"
  },
  {
    "parameters": { "operation": "getAll", "tableId": "leads", "returnAll": true, "filters": { "conditions": [ { "keyName": "id", "condition": "eq", "keyValue": "={{ $json.body.lead_id }}" } ] } },
    "id": "buscar-lead-qualificar", "name": "Buscar Lead Qualificar", "type": "n8n-nodes-base.supabase", "typeVersion": 1,
    "position": [baseX + 200, baseY - 600],
    "credentials": { "supabaseApi": { "id": "3Hp4m3KaX23RwFHq", "name": "Supabase account 2" } }
  },
  {
    "parameters": {
      "jsCode": "let lead = $json;\nreturn [{\n  json: {\n    telefone: lead.telefone,\n    mensagem: \"SISTEMA_RETOMADA_SDR: Olá, o gerente me informou que você iniciou contato conosco mas a conversa não prosseguiu ou precisamos entender melhor o que você busca. Haja como o corretor IA, pergunte o que aconteceu, qual a localização preferida e como podemos ajudar agora. Mande uma mensagem empática e natural.\",\n    nome: lead.nome,\n    tenant_id: lead.tenant_id\n  }\n}];"
    },
    "id": "simular-payload", "name": "Simular Payload Retomada", "type": "n8n-nodes-base.code", "typeVersion": 2,
    "position": [baseX + 400, baseY - 600]
  },
  {
    "parameters": {
      "jsCode": "let payload = $('Simular Payload Retomada').first().json;\nlet lead = $('Buscar Lead Qualificar').first().json;\nreturn [{ json: lead }];"
    },
    "id": "simular-juntar", "name": "Simular Juntar Fluxos", "type": "n8n-nodes-base.code", "typeVersion": 2,
    "position": [baseX + 600, baseY - 600]
  },
  {
    "parameters": { "respondWith": "json", "responseBody": "{\"success\": true}", "options": {} },
    "id": "responder-qualificar", "name": "Responder Dashboard (IA)", "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1,
    "position": [baseX + 400, baseY - 400]
  },

  // Vendedor
  {
    "parameters": { "httpMethod": "POST", "path": "notificar-vendedor", "responseMode": "responseNode", "options": {} },
    "id": "webhook-vendedor", "name": "Webhook Vendedor", "type": "n8n-nodes-base.webhook", "typeVersion": 1,
    "position": [baseX, baseY + 400], "webhookId": "notificar-vendedor"
  },
  {
    "parameters": { "operation": "getAll", "tableId": "leads", "returnAll": true, "filters": { "conditions": [ { "keyName": "id", "condition": "eq", "keyValue": "={{ $json.body.lead_id }}" } ] } },
    "id": "buscar-lead-vendedor", "name": "Buscar Lead Vendedor", "type": "n8n-nodes-base.supabase", "typeVersion": 1,
    "position": [baseX + 200, baseY + 400],
    "credentials": { "supabaseApi": { "id": "3Hp4m3KaX23RwFHq", "name": "Supabase account 2" } }
  },
  {
    "parameters": { "method": "POST", "url": "SUA_URL_DO_EVOLUTION_API/message/sendText", "sendHeaders": true, "headerParameters": { "parameters": [ { "name": "apikey", "value": "SUA_API_KEY_AQUI" } ] }, "sendBody": true, "bodyParameters": { "parameters": [ { "name": "number", "value": "={{ $json.GERENTE_TELEFONE || \"5511999999999\" }}" }, { "name": "options", "value": "{\"delay\": 1200, \"presence\": \"composing\"}" }, { "name": "textMessage", "value": "{\"text\": \"Novo Lead Quente para Venda!\\nNome: {{$json.nome}}\\nTelefone: {{$json.telefone}}\\nInteresse: {{$json.produto_interesse}}\"}" } ] }, "options": {} },
    "id": "http-vendedor", "name": "Disparar WhatsApp (Vendedor)", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.1,
    "position": [baseX + 450, baseY + 400]
  },
  {
    "parameters": { "respondWith": "json", "responseBody": "{\"success\": true}", "options": {} },
    "id": "responder-vendedor", "name": "Responder Dashboard (Vend)", "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1,
    "position": [baseX + 650, baseY + 400]
  }
];

data.nodes.push(...newNodes);

if (!data.connections) data.connections = {};

data.connections['Webhook Qualificar IA'] = { main: [[ { node: 'Buscar Lead Qualificar', type: 'main', index: 0 } ]] };
data.connections['Buscar Lead Qualificar'] = { main: [[ { node: 'Simular Payload Retomada', type: 'main', index: 0 }, { node: 'Responder Dashboard (IA)', type: 'main', index: 0 } ]] };
data.connections['Simular Payload Retomada'] = { main: [[ { node: 'Simular Juntar Fluxos', type: 'main', index: 0 } ]] };

const buscarHistoricoId = data.nodes.find(n => n.name === 'Buscar Histórico de Mensagens')?.name;
if (buscarHistoricoId) {
  data.connections['Simular Juntar Fluxos'] = { main: [[ { node: buscarHistoricoId, type: 'main', index: 0 } ]] };
}

data.connections['Webhook Vendedor'] = { main: [[ { node: 'Buscar Lead Vendedor', type: 'main', index: 0 } ]] };
data.connections['Buscar Lead Vendedor'] = { main: [[ { node: 'Disparar WhatsApp (Vendedor)', type: 'main', index: 0 }, { node: 'Responder Dashboard (Vend)', type: 'main', index: 0 } ]] };

fs.writeFileSync('n8n_workflow_atual.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Done!');
