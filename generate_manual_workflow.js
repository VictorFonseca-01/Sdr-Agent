const fs = require('fs');
const path = require('path');

const originalFile = 'n8n_workflow_atual.json';
const newFile = 'n8n_acoes_manuais.json';

const origin = JSON.parse(fs.readFileSync(originalFile, 'utf8'));

// Generate unique IDs
const id = () => Math.random().toString(36).substring(2, 10) + '-' + Math.random().toString(36).substring(2, 6);

const webhookIA = {
  id: id(),
  name: "Webhook Qualificar IA",
  type: "n8n-nodes-base.webhook",
  typeVersion: 1,
  position: [100, 200],
  parameters: { path: "qualificar-ia", options: {} }
};

const webhookVendedor = {
  id: id(),
  name: "Webhook Notificar Vendedor",
  type: "n8n-nodes-base.webhook",
  typeVersion: 1,
  position: [100, 500],
  parameters: { path: "notificar-vendedor", options: {} }
};

const supabaseLerIA = {
  id: id(),
  name: "Ler Lead Supabase (IA)",
  type: "n8n-nodes-base.supabase",
  typeVersion: 1,
  position: [300, 200],
  credentials: origin.nodes.find(n => n.type.includes('supabase'))?.credentials || {},
  parameters: {
    operation: "getAll",
    tableId: "leads",
    returnAll: false,
    limit: 1,
    filters: {
      conditions: [{ keyName: "id", keyValue: "={{ $json.body.lead_id }}", operation: "equals" }]
    }
  }
};

const supabaseLerVendedor = {
  id: id(),
  name: "Ler Lead Supabase (Vendedor)",
  type: "n8n-nodes-base.supabase",
  typeVersion: 1,
  position: [300, 500],
  credentials: origin.nodes.find(n => n.type.includes('supabase'))?.credentials || {},
  parameters: {
    operation: "getAll",
    tableId: "leads",
    returnAll: false,
    limit: 1,
    filters: {
      conditions: [{ keyName: "id", keyValue: "={{ $json.body.lead_id }}", operation: "equals" }]
    }
  }
};

const geminiMsgNode = {
  id: id(),
  name: "Gerar Msg Proativa",
  type: "@n8n/n8n-nodes-langchain.googleGeminiChatModel",
  typeVersion: 1,
  position: [500, 200],
  credentials: origin.nodes.find(n => n.type.includes('googleGemini'))?.credentials || {},
  parameters: {
    model: "models/gemini-1.5-flash",
    messages: {
      messageValues: [
        {
          type: "user",
          message: "O lead {{ $json.nome }} deixou o número. Mande uma mensagem curta de WhatsApp (1 parágrafo) super amigável e natural, puxando assunto para entender melhor o interesse dele em: {{ $json.produto_interesse || 'imóveis' }}. Se ele tiver perfil {{ $json.perfil_psicologico }}, adapte. Aja como um humano."
        }
      ]
    }
  }
};

const envWhatsAppIA = {
  ...origin.nodes.find(n => n.name === 'Enviar WhatsApp Gerente' || n.name.includes('Evolution')),
  id: id(),
  name: "WhatsApp Lead (IA)",
  position: [700, 200]
};
envWhatsAppIA.parameters.bodyParameters = {
  parameters: [
    { name: "number", value: "={{ $('Ler Lead Supabase (IA)').first().json.telefone }}" },
    { name: "text", value: "={{ $json.message?.content || $json.text || $json.output }}" }
  ]
};

const envWhatsAppVendedor = {
  ...origin.nodes.find(n => n.name === 'Enviar WhatsApp Gerente' || n.name.includes('Evolution')),
  id: id(),
  name: "WhatsApp Gerente",
  position: [500, 500]
};
envWhatsAppVendedor.parameters.bodyParameters = {
  parameters: [
    { name: "number", value: "={{ $('Normalizar Payload').first().json.GERENTE_PHONE || '5511999999999' }}" }, // Fallback if no normalizer
    { name: "text", value: "🚨 *Novo Lead Pronto para Venda!* 🚨\n\nNome: {{ $json.nome }}\nTelefone: {{ $json.telefone }}\nInteresse: {{ $json.produto_interesse }}\n\n*Perfil:* {{ $json.perfil_psicologico }}\n*Urgência:* {{ $json.nivel_urgencia }}\n\n📲 *Clique para chamar:* wa.me/{{ $json.telefone }}" }
  ]
};

const newWorkflow = {
  meta: { instanceId: origin.meta?.instanceId },
  nodes: [
    webhookIA, webhookVendedor, supabaseLerIA, supabaseLerVendedor, geminiMsgNode, envWhatsAppIA, envWhatsAppVendedor
  ],
  connections: {
    "Webhook Qualificar IA": {
      "main": [
        [
          { node: "Ler Lead Supabase (IA)", type: "main", index: 0 }
        ]
      ]
    },
    "Ler Lead Supabase (IA)": {
      "main": [
        [
          { node: "Gerar Msg Proativa", type: "main", index: 0 }
        ]
      ]
    },
    "Gerar Msg Proativa": {
      "main": [
        [
          { node: "WhatsApp Lead (IA)", type: "main", index: 0 }
        ]
      ]
    },
    "Webhook Notificar Vendedor": {
      "main": [
        [
          { node: "Ler Lead Supabase (Vendedor)", type: "main", index: 0 }
        ]
      ]
    },
    "Ler Lead Supabase (Vendedor)": {
      "main": [
        [
          { node: "WhatsApp Gerente", type: "main", index: 0 }
        ]
      ]
    }
  }
};

fs.writeFileSync(newFile, JSON.stringify(newWorkflow, null, 2));
console.log('n8n_acoes_manuais.json gerado com sucesso!');
