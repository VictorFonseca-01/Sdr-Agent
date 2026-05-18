import json

file_path = r'c:\Users\vfonseca\Projetos\Sdr-Agent\n8n_workflow_etapa4.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Update Mock IA code
for node in data['nodes']:
    if node['name'] == 'Mock IA':
        new_code = """let msg = $('Normalizar Payload').first().json.mensagem.toLowerCase();
let regiao = null;
if (msg.includes('zona sul')) regiao = 'Zona Sul';
if (msg.includes('zona norte')) regiao = 'Zona Norte';
if (msg.includes('centro')) regiao = 'Centro';

const mockJson = {
  "resposta_para_usuario": "Perfeito, obrigado pelas informações. Você já tem uma região de interesse?",
  "dados_extraidos": {
    "regiao_interesse": regiao,
    "tipo_imovel": null,
    "renda_mensal": "8000",
    "valor_entrada": "30000",
    "prazo_compra": null,
    "interesse_financiamento": true
  },
  "status_funil": "morno",
  "campos_faltantes": ["regiao_interesse", "tipo_imovel", "prazo_compra"],
  "deve_encaminhar_gerente": false
};

if (regiao) {
   mockJson.resposta_para_usuario = `Ótimo, anotei que você prefere a região ${regiao}. E qual o tipo de imóvel (casa, apartamento)?`;
   mockJson.campos_faltantes = ["tipo_imovel", "prazo_compra"];
}

if (msg.includes('falar com atendente') || msg.includes('gerente')) {
   mockJson.deve_encaminhar_gerente = true;
   mockJson.resposta_para_usuario = "Com certeza, estou transferindo você para o nosso gerente de vendas.";
}

if (msg.includes('comprar') || msg.includes('investir')) {
   mockJson.status_funil = "quente";
   mockJson.resposta_para_usuario = "Excelente! Como você já está pronto para investir, vou avisar um dos nossos gerentes para te apresentar as melhores opções.";
}

// Log simples para depuração
console.log("[MOCK IA] Executado. Região extraída:", regiao);

return {
  message: {
    content: JSON.stringify(mockJson, null, 2)
  }
};"""
        node['parameters']['jsCode'] = new_code

# 2. Add Bypass node
bypass_node = {
    "parameters": {},
    "name": "Bypass (Sem Alerta)",
    "type": "n8n-nodes-base.noOp",
    "typeVersion": 1,
    "position": [ 4048, 1268 ],
    "id": "abc123bypass"
}
data['nodes'].append(bypass_node)

# 3. Connect IF node False branch to Bypass
if "Precisa de Gerente?" in data['connections']:
    # connections is { "main": [ [True branch], [False branch] ] }
    if len(data['connections']["Precisa de Gerente?"]["main"]) == 1:
        data['connections']["Precisa de Gerente?"]["main"].append([])
    data['connections']["Precisa de Gerente?"]["main"][1] = [
        {
            "node": "Bypass (Sem Alerta)",
            "type": "main",
            "index": 0
        }
    ]

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
