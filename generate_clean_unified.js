const fs = require('fs');
const main = JSON.parse(fs.readFileSync('n8n_workflow_atual.json', 'utf8'));

const id = () => Math.random().toString(36).substring(2, 10) + '-' + Math.random().toString(36).substring(2, 6);

const webhookVendedor = {
  id: id(),
  name: 'Webhook Notificar Vendedor',
  type: 'n8n-nodes-base.webhook',
  typeVersion: 1,
  position: [42100, 13100],
  parameters: { path: 'notificar-vendedor', options: { respondWithCors: true }, httpMethod: 'POST' }
};

const lerLeadVendedor = {
  id: id(),
  name: 'Ler Lead Supabase (Vendedor)',
  type: 'n8n-nodes-base.supabase',
  typeVersion: 1,
  position: [42300, 13100],
  parameters: {
    operation: 'getAll',
    tableId: 'leads',
    matchType: 'any',
    filters: {
      conditions: [{ keyName: 'id', condition: 'eq', keyValue: '={{ $json.body.lead_id }}' }]
    }
  },
  credentials: { supabaseApi: { id: 'oG43E1W2Y6E3TItu', name: 'Supabase account' } }
};

const whatsappGerente = {
  id: id(),
  name: 'WhatsApp Gerente',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.1,
  position: [42500, 13100],
  parameters: {
    method: 'POST',
    url: '={{ $json.evolution_url || "http://localhost:8080" }}/message/sendText/wpp',
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={ "number": "5534998393527", "text": "🚨 *Atenção Gerente!* O Vendedor solicitou que você qualifique o lead manualmente!\\n\\n👤 *Lead:* {{ $json.nome || \\"Sem Nome\\" }}\\n📱 *Telefone:* {{ $json.telefone }}\\n💬 *Mensagem Original:* {{ $json.mensagem_original || \\"N/A\\" }}\\n\\nEntre no Dashboard para ver mais detalhes!" }',
    options: {}
  },
  credentials: { httpHeaderAuth: { id: 'Y8WwZlU9aWnB0d9u', name: 'Evolution API (Header Auth)' } }
};

main.nodes.push(webhookVendedor, lerLeadVendedor, whatsappGerente);
main.connections['Webhook Notificar Vendedor'] = { main: [[{ node: 'Ler Lead Supabase (Vendedor)', type: 'main', index: 0 }]] };
main.connections['Ler Lead Supabase (Vendedor)'] = { main: [[{ node: 'WhatsApp Gerente', type: 'main', index: 0 }]] };

fs.writeFileSync('n8n_workflow_unificado.json', JSON.stringify(main, null, 2));
console.log('Unificado limpo gerado com sucesso!');
