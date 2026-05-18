import json
import uuid

file_path = r'c:\Users\vfonseca\Projetos\Sdr-Agent\n8n_workflow_etapa4.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Update Normalizar Payload
for node in data['nodes']:
    if node['name'] == 'Normalizar Payload':
        # Add AMBIENTE variable
        values = node['parameters']['values']['string']
        if not any(v['name'] == 'AMBIENTE' for v in values):
            values.insert(0, {
                "name": "AMBIENTE",
                "value": "teste"
            })

# 2. Update Webhook Entrada
for node in data['nodes']:
    if node['name'] == 'Webhook Entrada':
        node['parameters']['responseMode'] = 'responseNode'

# 3. Update Precisa de Gerente? (IF Node)
for node in data['nodes']:
    if node['name'] == 'Precisa de Gerente?':
        # Fix the conditions to look directly at the source nodes instead of $json
        node['parameters']['conditions']['boolean'][0]['value1'] = "={{ $('Processar Resposta JSON').first().json.deve_encaminhar_gerente }}"
        node['parameters']['conditions']['string'][0]['value1'] = "={{ $('Atualizar Lead (Supabase)').first().json.status_funil }}"
        node['parameters']['conditions']['string'][1]['value1'] = "={{ $('Atualizar Lead (Supabase)').first().json.status_funil }}"

# 4. Remove 'Resposta Final' and replace with 'Preparar Resposta Cliente'
resposta_final_id = None
for node in data['nodes']:
    if node['name'] == 'Resposta Final':
        resposta_final_id = node['id']
        break

if resposta_final_id:
    data['nodes'] = [n for n in data['nodes'] if n['name'] != 'Resposta Final']

preparar_node = {
    "parameters": {
        "jsCode": """const ambiente = $('Normalizar Payload').first().json.AMBIENTE || 'producao';
const resposta = $('Processar Resposta JSON').first().json.resposta_para_usuario;
const status_funil = $('Atualizar Lead (Supabase)').first().json.status_funil;
const ia_mode = $('Normalizar Payload').first().json.IA_MODE;

let result = {
  resposta_para_usuario: resposta,
  status: status_funil
};

if (ambiente === 'teste') {
  result.debug_ia_usada = ia_mode;
  result.debug_status_funil = status_funil;
}

return result;"""
    },
    "name": "Preparar Resposta Cliente",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [ 3648, 1088 ],
    "id": str(uuid.uuid4())
}

# 5. Add Respond to Webhook node
respond_node = {
    "parameters": {
        "options": {}
    },
    "name": "Respond to Webhook",
    "type": "n8n-nodes-base.respondToWebhook",
    "typeVersion": 1,
    "position": [ 3848, 1088 ],
    "id": str(uuid.uuid4())
}

data['nodes'].extend([preparar_node, respond_node])

# Shift downstream nodes right to make space visually
for node in data['nodes']:
    if node['name'] in ['Precisa de Gerente?', 'Notificar Gerente (Mock)', 'Bypass (Sem Alerta)']:
        node['position'][0] += 200

# 6. Re-wire connections
# Remove old connections related to Resposta Final
if 'Resposta Final' in data['connections']:
    del data['connections']['Resposta Final']

# Atualizar Lead -> Preparar Resposta Cliente
if 'Atualizar Lead (Supabase)' in data['connections']:
    data['connections']['Atualizar Lead (Supabase)']['main'][0] = [{
        "node": "Preparar Resposta Cliente",
        "type": "main",
        "index": 0
    }]

# Preparar Resposta Cliente -> Respond to Webhook
data['connections']['Preparar Resposta Cliente'] = {
    "main": [
        [{
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
        }]
    ]
}

# Respond to Webhook -> Precisa de Gerente?
data['connections']['Respond to Webhook'] = {
    "main": [
        [{
            "node": "Precisa de Gerente?",
            "type": "main",
            "index": 0
        }]
    ]
}

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
