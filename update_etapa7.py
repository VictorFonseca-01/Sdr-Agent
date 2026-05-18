import json
import uuid

file_path = r'c:\Users\vfonseca\Projetos\Sdr-Agent\n8n_workflow_etapa4.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Update Normalizar Payload
for node in data['nodes']:
    if node['name'] == 'Normalizar Payload':
        values = node['parameters']['values']['string']
        new_vars = [
            {"name": "WHATSAPP_API_URL", "value": "http://localhost:8080"},
            {"name": "WHATSAPP_API_TOKEN", "value": "preencher_depois"},
            {"name": "WHATSAPP_INSTANCE", "value": "adao-imoveis"},
            {"name": "GERENTE_TELEFONE", "value": "55XXXXXXXXXXX"}
        ]
        for nv in new_vars:
            if not any(v['name'] == nv['name'] for v in values):
                values.append(nv)

# Shift downstream nodes to the right to make space for "Enviar WhatsApp Cliente"
for node in data['nodes']:
    if node['name'] in ['Precisa de Gerente?', 'Notificar Gerente (Mock)', 'Bypass (Sem Alerta)']:
        node['position'][0] += 200

# 2. Add Enviar WhatsApp Cliente
cliente_node = {
    "parameters": {
        "method": "POST",
        "url": "={{ $('Normalizar Payload').first().json.WHATSAPP_API_URL }}/message/sendText/{{ $('Normalizar Payload').first().json.WHATSAPP_INSTANCE }}",
        "sendHeaders": True,
        "headerParameters": {
            "parameters": [
                {
                    "name": "apikey",
                    "value": "={{ $('Normalizar Payload').first().json.WHATSAPP_API_TOKEN }}"
                }
            ]
        },
        "sendBody": True,
        "specifyBody": "json",
        "jsonBody": "={\n  \"number\": \"{{ $('Normalizar Payload').first().json.telefone }}\",\n  \"options\": {\n    \"delay\": 1200,\n    \"presence\": \"composing\"\n  },\n  \"textMessage\": {\n    \"text\": {{ JSON.stringify($('Preparar Resposta Cliente').first().json.resposta_para_usuario) }}\n  }\n}",
        "options": {}
    },
    "id": str(uuid.uuid4()),
    "name": "Enviar WhatsApp Cliente",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.1,
    "position": [ 4048, 1088 ],
    "continueOnFail": True,
    "notesInFlow": True,
    "notes": "Tratamento de Erro ativado (Continue On Fail)"
}

# 3. Add Enviar WhatsApp Gerente
gerente_node = {
    "parameters": {
        "method": "POST",
        "url": "={{ $('Normalizar Payload').first().json.WHATSAPP_API_URL }}/message/sendText/{{ $('Normalizar Payload').first().json.WHATSAPP_INSTANCE }}",
        "sendHeaders": True,
        "headerParameters": {
            "parameters": [
                {
                    "name": "apikey",
                    "value": "={{ $('Normalizar Payload').first().json.WHATSAPP_API_TOKEN }}"
                }
            ]
        },
        "sendBody": True,
        "specifyBody": "json",
        "jsonBody": "={\n  \"number\": \"{{ $('Normalizar Payload').first().json.GERENTE_TELEFONE }}\",\n  \"options\": {\n    \"delay\": 1200,\n    \"presence\": \"composing\"\n  },\n  \"textMessage\": {\n    \"text\": {{ JSON.stringify($('Notificar Gerente (Mock)').first().json.mock_whatsapp_gerente) }}\n  }\n}",
        "options": {}
    },
    "id": str(uuid.uuid4()),
    "name": "Enviar WhatsApp Gerente",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.1,
    "position": [ 4448, 1184 ],
    "continueOnFail": True,
    "notesInFlow": True,
    "notes": "Tratamento de Erro ativado (Continue On Fail)"
}

data['nodes'].extend([cliente_node, gerente_node])

# 4. Re-wire connections
# Respond to Webhook -> Enviar WhatsApp Cliente
data['connections']['Respond to Webhook']['main'][0] = [{
    "node": "Enviar WhatsApp Cliente",
    "type": "main",
    "index": 0
}]

# Enviar WhatsApp Cliente -> Precisa de Gerente?
data['connections']["Enviar WhatsApp Cliente"] = {
    "main": [
        [{
            "node": "Precisa de Gerente?",
            "type": "main",
            "index": 0
        }]
    ]
}

# Notificar Gerente (Mock) -> Enviar WhatsApp Gerente
data['connections']["Notificar Gerente (Mock)"] = {
    "main": [
        [{
            "node": "Enviar WhatsApp Gerente",
            "type": "main",
            "index": 0
        }]
    ]
}

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
