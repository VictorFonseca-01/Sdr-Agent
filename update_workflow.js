const fs = require('fs');

const data = JSON.parse(fs.readFileSync('n8n_workflow_atual.json', 'utf8'));

const nodes = data.nodes;
const connections = data.connections;

// 1. Update "Atualizar Lead (Supabase)"
for (let n of nodes) {
    if (n.name === 'Atualizar Lead (Supabase)') {
        const fields = n.parameters.fieldsUi.fieldValues;
        n.parameters.fieldsUi.fieldValues = fields.filter(f => f.fieldId !== 'historico_mensagens');
    }
}

// 2. Add "Salvar Mensagem do Cliente"
const node_insert_client = {
  "parameters": {
    "operation": "insert",
    "tableId": "lead_messages",
    "fieldsUi": {
      "fieldValues": [
        {
          "fieldId": "lead_id",
          "fieldValue": "={{ $('Juntar Fluxos').first().json.id }}"
        },
        {
          "fieldId": "tenant_id",
          "fieldValue": "={{ $('Juntar Fluxos').first().json.tenant_id }}"
        },
        {
          "fieldId": "sender_type",
          "fieldValue": "lead"
        },
        {
          "fieldId": "content",
          "fieldValue": "={{ $('Normalizar Payload').first().json.mensagem }}"
        }
      ]
    }
  },
  "name": "Salvar Mensagem do Cliente",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1,
  "position": [
    8650,
    3248
  ],
  "id": "node-salvar-msg-cliente",
  "credentials": {
    "supabaseApi": {
      "id": "3Hp4m3KaX23RwFHq",
      "name": "Supabase account 2"
    }
  }
};

// 3. Add "Buscar Histórico de Mensagens"
const node_get_history = {
  "parameters": {
    "operation": "getAll",
    "tableId": "lead_messages",
    "returnAll": true,
    "filters": {
      "conditions": [
        {
          "keyName": "lead_id",
          "condition": "eq",
          "keyValue": "={{ $('Juntar Fluxos').first().json.id }}"
        }
      ]
    },
    "sort": {
      "values": [
        {
          "key": "created_at",
          "direction": "ASC"
        }
      ]
    }
  },
  "name": "Buscar Histórico de Mensagens",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1,
  "position": [
    8750,
    3248
  ],
  "id": "node-buscar-historico",
  "alwaysOutputData": true,
  "credentials": {
    "supabaseApi": {
      "id": "3Hp4m3KaX23RwFHq",
      "name": "Supabase account 2"
    }
  }
};

// 4. Update "Preparar Contexto IA"
for (let n of nodes) {
    if (n.name === 'Preparar Contexto IA') {
        n.position = [8850, 3248];
        n.parameters.jsCode = `let payload = $('Normalizar Payload').first().json;
let lead = $('Juntar Fluxos').first().json; 

let mensagens_bd = $('Buscar Histórico de Mensagens').all() || [];

let historyText = mensagens_bd.map(msg => {
    let remetente = msg.json.sender_type === 'lead' ? 'Cliente' : 'SDR';
    return \`\${remetente}: \${msg.json.content}\`;
}).join("\\n");

if (!historyText) historyText = "Nenhuma interação anterior.";

let missingFields = [];
if (!lead.regiao_interesse) missingFields.push("regiao_interesse");
if (!lead.tipo_imovel) missingFields.push("tipo_imovel");
if (!lead.renda_mensal) missingFields.push("renda_mensal");
if (!lead.valor_entrada) missingFields.push("valor_entrada");
if (!lead.prazo_compra) missingFields.push("prazo_compra");

return {
  telefone: payload.telefone,
  lead_id: lead.id,
  nome: lead.nome || payload.nome,
  mensagem_atual: payload.mensagem,
  historico_texto: historyText,
  status_atual: lead.status_funil || 'frio',
  campos_faltantes: missingFields.join(", "),
  lead_completo: lead
};`;
    }
}

// 5. Add "Salvar Resposta da IA"
const node_insert_ia = {
  "parameters": {
    "operation": "insert",
    "tableId": "lead_messages",
    "fieldsUi": {
      "fieldValues": [
        {
          "fieldId": "lead_id",
          "fieldValue": "={{ $json.lead_id }}"
        },
        {
          "fieldId": "tenant_id",
          "fieldValue": "={{ $('Buscar Histórico de Mensagens').first().json.tenant_id }}"
        },
        {
          "fieldId": "sender_type",
          "fieldValue": "sdr_ia"
        },
        {
          "fieldId": "content",
          "fieldValue": "={{ $json.resposta_para_usuario }}"
        }
      ]
    }
  },
  "name": "Salvar Resposta da IA",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1,
  "position": [
    9850,
    3248
  ],
  "id": "node-salvar-resposta-ia",
  "credentials": {
    "supabaseApi": {
      "id": "3Hp4m3KaX23RwFHq",
      "name": "Supabase account 2"
    }
  }
};

nodes.push(node_insert_client, node_get_history, node_insert_ia);

// Update Juntar Fluxos connections
connections['Juntar Fluxos'] = {
  "main": [
    [
      {
        "node": "Salvar Mensagem do Cliente",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

connections['Salvar Mensagem do Cliente'] = {
  "main": [
    [
      {
        "node": "Buscar Histórico de Mensagens",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

connections['Buscar Histórico de Mensagens'] = {
  "main": [
    [
      {
        "node": "Preparar Contexto IA",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

// Update Processar Resposta JSON connections
connections['Processar Resposta JSON'] = {
  "main": [
    [
      {
        "node": "Salvar Resposta da IA",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

connections['Salvar Resposta da IA'] = {
  "main": [
    [
      {
        "node": "Atualizar Lead (Supabase)",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

// write to n8n_workflow_fase4.json
fs.writeFileSync('n8n_workflow_fase4.json', JSON.stringify(data, null, 2), 'utf8');

// Also overwrite n8n_workflow_atual.json with the new version so the user can see it right away
fs.writeFileSync('n8n_workflow_atual.json', JSON.stringify(data, null, 2), 'utf8');
