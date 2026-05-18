import json

file_path = r'c:\Users\vfonseca\Projetos\Sdr-Agent\n8n_workflow_etapa4.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Update Normalizar Payload with WHATSAPP_ENDPOINT
for node in data['nodes']:
    if node['name'] == 'Normalizar Payload':
        values = node['parameters']['values']['string']
        
        # Update existing WHATSAPP_API_URL
        for v in values:
            if v['name'] == 'WHATSAPP_API_URL':
                v['value'] = 'https://httpbin.org'
        
        # Add WHATSAPP_ENDPOINT
        if not any(v['name'] == 'WHATSAPP_ENDPOINT' for v in values):
            values.append({"name": "WHATSAPP_ENDPOINT", "value": "/post"})

# 2. Update the two HTTP Request nodes to use the dynamic endpoint
for node in data['nodes']:
    if node['name'] in ['Enviar WhatsApp Cliente', 'Enviar WhatsApp Gerente']:
        node['parameters']['url'] = "={{ $('Normalizar Payload').first().json.WHATSAPP_API_URL }}{{ $('Normalizar Payload').first().json.WHATSAPP_ENDPOINT }}"

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
