import json
import uuid

# Caminhos dos arquivos
input_file = r'c:\Users\vfonseca\Projetos\Sdr-Agent\n8n_workflow_etapa4.json'
output_file = r'c:\Users\vfonseca\Projetos\Sdr-Agent\n8n_workflow_etapa5.json'

with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Atualizar o nó Mock IA com a nova lógica determinística
mock_ia_code = r"""// Normalizar Texto
const normalize = (text) => {
  if (!text) return "";
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const payload = $('Normalizar Payload').first().json;
const mensagemOriginal = payload.mensagem || "";
const msg = normalize(mensagemOriginal);

let score = 0;
let dadosExtraidos = {
  orcamento: null,
  prazo_compra: null,
  urgencia: "baixa",
  forma_pagamento: null,
  produto_interesse: null
};

// 1. Detectar Valores Monetários (Regex)
const moneyRegex = /(?:r\$|rs|\$)?\s?(\d+(?:[.,]\d+)*)\s?(mil|k|milhoes|m)?/gi;
const matchMoney = moneyRegex.exec(msg);
if (matchMoney) {
    let valorStr = matchMoney[1];
    // Se tiver ponto e vírgula, assume formato BR (ponto milhar, vírgula decimal)
    if (valorStr.includes('.') && valorStr.includes(',')) {
        valorStr = valorStr.replace(/\./g, '').replace(',', '.');
    } else if (valorStr.includes(',')) {
        valorStr = valorStr.replace(',', '.');
    } else if (valorStr.includes('.') && valorStr.length > 3 && valorStr.split('.').pop().length === 3) {
        // Provável ponto de milhar (ex: 50.000)
        valorStr = valorStr.replace(/\./g, '');
    }
    
    let valor = parseFloat(valorStr);
    let sufixo = matchMoney[2] ? matchMoney[2].toLowerCase() : '';
    if (sufixo === 'mil' || sufixo === 'k') valor *= 1000;
    if (sufixo === 'milhoes' || sufixo === 'm') valor *= 1000000;
    dadosExtraidos.orcamento = valor;
    score += 20; // Regra 2
} else if (msg.match(/tenho|possuo|disponho|orcamento|investir|entrada/)) {
    score += 20; // Regra 2 (Palavra-chave apenas)
}

// 2. Necessidade clara / Produto
if (msg.match(/comprar|adquirir|contratar|fechar|agendar|apartamento|casa|imovel|unidade/)) {
    score += 20; // Regra 3
    if (msg.includes('apartamento')) dadosExtraidos.produto_interesse = 'Apartamento';
    if (msg.includes('casa')) dadosExtraidos.produto_interesse = 'Casa';
}

// 3. Prazo / Urgência
if (msg.match(/hoje|agora|urgente|esta semana|este mes|imediatamente/)) {
    score += 20; // Regra 4
    dadosExtraidos.urgencia = "alta";
    if (msg.includes('mes')) dadosExtraidos.prazo_compra = "Este mês";
    if (msg.includes('semana')) dadosExtraidos.prazo_compra = "Esta semana";
}

// 4. Forma de Pagamento
if (msg.match(/financiado|financiamento|a vista|consorcio/)) {
    score += 20; // Regra 5
    if (msg.includes('financiamento')) dadosExtraidos.forma_pagamento = "Financiamento";
    if (msg.includes('a vista')) dadosExtraidos.forma_pagamento = "À vista";
}

// 5. Interesse Alto
if (msg.match(/quero comprar|tenho interesse|quero agendar/)) {
    score += 20; // Regra 6
}

score = Math.min(score, 100);

// Atribuição de Temperatura e Status
let temperatura = "Frio";
let status_funil = "Novo";

if (score >= 90) {
    temperatura = "Pronto para Vendas";
    status_funil = "Pronto para Vendas";
} else if (score >= 70) {
    temperatura = "Quente";
    status_funil = "Quente";
} else if (score >= 40) {
    temperatura = "Morno";
    status_funil = "Morno";
} else if (score > 0) {
    temperatura = "Frio";
    status_funil = "Coletando Informações";
}

const encaminhar = (score >= 80 && (temperatura === "Quente" || temperatura === "Pronto para Vendas"));

// Respostas Pré-definidas
let resposta = "Olá! Será um prazer ajudar. Pode me contar um pouco mais sobre o que você está procurando?";
if (status_funil === "Coletando Informações" || status_funil === "Morno") {
    resposta = "Perfeito. Para entender melhor o seu perfil, poderia informar sua faixa de investimento e em quanto tempo pretende tomar a decisão?";
} else if (status_funil === "Quente") {
    resposta = "Excelente. Com base nas informações fornecidas, seu perfil está alinhado. Vou encaminhar seus dados para um consultor especializado.";
} else if (status_funil === "Pronto para Vendas") {
    resposta = "Ótimo! Seu interesse foi identificado como prioritário e seu atendimento será encaminhado ao consultor responsável.";
}

// Resumo SDR
let resumo = `Lead interessado em ${dadosExtraidos.produto_interesse || 'imóvel'}.`;
if (dadosExtraidos.orcamento) resumo += ` Orçamento: R$ ${dadosExtraidos.orcamento.toLocaleString('pt-BR')}.`;
if (dadosExtraidos.prazo_compra) resumo += ` Prazo: ${dadosExtraidos.prazo_compra}.`;
if (dadosExtraidos.urgencia === "alta") resumo += ` Demonstra forte intenção e urgência.`;

const mockJson = {
    resposta_para_usuario: resposta,
    score_qualificacao: score,
    temperatura: temperatura,
    status_funil: status_funil,
    encaminhar_para_consultor: encaminhar,
    resumo_sdr: resumo,
    dados_extraidos: dadosExtraidos
};

return {
  message: {
    content: JSON.stringify(mockJson, null, 2)
  }
};"""

for node in data['nodes']:
    if node['name'] == 'Mock IA':
        node['parameters']['jsCode'] = mock_ia_code

# 2. Atualizar o nó Processar Resposta JSON
processar_code = r"""let responseText = $json.message.content;
let parsed = {};
try {
  let cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
  parsed = JSON.parse(cleaned);
} catch(e) {
  parsed = { 
    resposta_para_usuario: responseText, 
    dados_extraidos: {}, 
    status_funil: "qualificando", 
    deve_encaminhar_gerente: false,
    score_qualificacao: 0,
    temperatura: "Frio",
    resumo_sdr: ""
  };
}

let context = $('Preparar Contexto IA').first().json;
let historico = context.historico_array || [];

// Adiciona as novas mensagens ao histórico
historico.push({ role: "user", content: context.mensagem_atual });
historico.push({ role: "assistant", content: parsed.resposta_para_usuario });

let updateData = Object.assign({}, context.lead_completo);
updateData.historico_mensagens = historico;
updateData.status_funil = parsed.status_funil || updateData.status_funil;
updateData.score_qualificacao = parsed.score_qualificacao || 0;
updateData.temperatura = parsed.temperatura || 'Frio';
updateData.encaminhar_para_consultor = parsed.encaminhar_para_consultor || false;
updateData.resumo_sdr = parsed.resumo_sdr || "";

if (parsed.dados_extraidos) {
  if (parsed.dados_extraidos.regiao_interesse) updateData.regiao_interesse = parsed.dados_extraidos.regiao_interesse;
  if (parsed.dados_extraidos.tipo_imovel) updateData.tipo_imovel = parsed.dados_extraidos.tipo_imovel;
  if (parsed.dados_extraidos.renda_mensal) updateData.renda_mensal = parsed.dados_extraidos.renda_mensal;
  if (parsed.dados_extraidos.valor_entrada) updateData.valor_entrada = parsed.dados_extraidos.valor_entrada;
  if (parsed.dados_extraidos.prazo_compra) updateData.prazo_compra = parsed.dados_extraidos.prazo_compra;
  if (parsed.dados_extraidos.orcamento) updateData.valor_entrada = parsed.dados_extraidos.orcamento.toString();
}

return {
  id: context.lead_id,
  telefone: context.telefone,
  lead_id: context.lead_id,
  ia_mode: $('Normalizar Payload').first().json.IA_MODE,
  resposta_para_usuario: parsed.resposta_para_usuario,
  deve_encaminhar_gerente: parsed.encaminhar_para_consultor, // Mapeado para o novo critério
  updateData: updateData
};"""

for node in data['nodes']:
    if node['name'] == 'Processar Resposta JSON':
        node['parameters']['jsCode'] = processar_code

# 3. Atualizar o nó Atualizar Lead (Supabase) para incluir os novos campos
for node in data['nodes']:
    if node['name'] == 'Atualizar Lead (Supabase)':
        fieldValues = node['parameters']['fieldsUi']['fieldValues']
        new_fields = [
            {"fieldId": "score_qualificacao", "fieldValue": "={{$json.updateData.score_qualificacao}}"},
            {"fieldId": "temperatura", "fieldValue": "={{$json.updateData.temperatura}}"},
            {"fieldId": "encaminhar_para_consultor", "fieldValue": "={{$json.updateData.encaminhar_para_consultor}}"},
            {"fieldId": "resumo_sdr", "fieldValue": "={{$json.updateData.resumo_sdr}}"}
        ]
        for nf in new_fields:
            if not any(f['fieldId'] == nf['fieldId'] for f in fieldValues):
                fieldValues.append(nf)

# 4. Atualizar o nó Precisa de Gerente? (Critério de encaminhamento)
for node in data['nodes']:
    if node['name'] == 'Precisa de Gerente?':
        # Critério: score >= 80 E (Quente ou Pronto)
        # O nó IF original estava usando OR para as strings, vamos simplificar
        node['parameters']['conditions'] = {
            "boolean": [
                {
                    "value1": "={{ $('Processar Resposta JSON').first().json.updateData.score_qualificacao }}",
                    "operation": "largerEqual",
                    "value2": 80
                },
                {
                    "value1": "={{ $('Processar Resposta JSON').first().json.deve_encaminhar_gerente }}",
                    "value2": True
                }
            ]
        }
        node['parameters']['combineOperation'] = "any"

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Workflow Etapa 5 criado com sucesso em: {output_file}")
