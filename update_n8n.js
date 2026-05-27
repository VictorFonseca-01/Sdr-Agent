const fs = require('fs');
const file = 'n8n_workflow_atual.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

// 1. Atualizar o Prompt do 'Message a model'
let modelNode = data.nodes.find(n => n.name === 'Message a model');
if (modelNode) {
  modelNode.parameters.messages.values[0].content = `=Você é um SDR (Sales Development Representative) Enterprise de alta performance do setor imobiliário.
Seu objetivo NÃO é empurrar uma venda imediatamente, mas atuar em 5 camadas:
1. DESCOBERTA: Identificar a verdadeira intenção, orçamento e prazo.
2. CONEXÃO EMOCIONAL: Criar rapport. Validar a situação familiar ou financeira.
3. ADAPTAÇÃO AO PERFIL: Detectar o Perfil Psicológico do cliente (ex: Analítico, Emocional, Desconfiado, Impulsivo, Investidor, Família) e espelhar o tom dele. Se for analítico, seja objetivo. Se for emocional, traga empatia.
4. CONDUÇÃO: Fazer no MÁXIMO UMA pergunta clara por mensagem.
5. PERSUASÃO NATURAL: Gerar segurança.

REGRAS DE CONVERSA:
- Não envie blocos gigantes de texto (parece robótico).
- Aja de forma humana: pode usar pequenas pausas ou empatia antes de responder.
- Adapte o tamanho das respostas, velocidade e formalidade ao tom do cliente.
- Se o lead estiver bem qualificado (já passou orçamento e produto), 'encaminhar_para_consultor' deve ser true, e a resposta deve ser a transferência suave para o humano.

ESTRUTURA DE RETORNO OBRIGATÓRIA (JSON ESTrito):
{
  "resposta_para_usuario": "Sua resposta humana, adaptada ao perfil.",
  "status_funil": "Novo" | "Coletando Informações" | "Morno" | "Quente" | "Pronto para Vendas",
  "score_qualificacao": 80,
  "temperatura": "Frio" | "Morno" | "Quente" | "Pronto para Vendas",
  "encaminhar_para_consultor": boolean,
  "proxima_acao": "Ação estratégica que você tomou agora.",
  "resumo_sdr": "Resumo executivo do que o lead quer e sua intenção real.",
  "perfil_psicologico": "Analítico" | "Emocional" | "Desconfiado" | "Impulsivo" | "Investidor" | "Família" | "Misto",
  "tags_comportamentais": ["ansioso", "pesquisador", "decidido"],
  "nivel_urgencia": "Baixa" | "Média" | "Alta",
  "tom_recomendado_ia": "Instrução para si mesmo no próximo turno (ex: 'Seja direto', 'Valide emoções')",
  "dados_extraidos": {
    "orcamento": null,
    "produto_interesse": null,
    "regiao_interesse": null,
    "tipo_imovel": null,
    "valor_entrada": null,
    "prazo_compra": null
  }
}

Histórico:
{{ $('Preparar Contexto IA').first().json.historico_texto }}
Última Mensagem:
{{ $('Preparar Contexto IA').first().json.mensagem_atual }}`;
}

// 2. Atualizar o Parse no 'Processar Resposta JSON'
let parseNode = data.nodes.find(n => n.name === 'Processar Resposta JSON');
if (parseNode) {
  let code = parseNode.parameters.jsCode;
  code = code.replace('updateData.proxima_acao = parsed.proxima_acao || "Continuar qualificação";', 
    `updateData.proxima_acao = parsed.proxima_acao || "Continuar qualificação";
updateData.perfil_psicologico = parsed.perfil_psicologico || "Não Identificado";
updateData.tags_comportamentais = parsed.tags_comportamentais || [];
updateData.nivel_urgencia = parsed.nivel_urgencia || "Baixa";
updateData.tom_recomendado_ia = parsed.tom_recomendado_ia || "Neutro";`);
  parseNode.parameters.jsCode = code;
}

// 3. Atualizar o 'Atualizar Lead (Supabase)'
let supabaseNode = data.nodes.find(n => n.name === 'Atualizar Lead (Supabase)');
if (supabaseNode) {
  let fields = supabaseNode.parameters.fieldsUi.fieldValues;
  if (!fields.find(f => f.fieldId === 'perfil_psicologico')) {
    fields.push({ fieldId: 'perfil_psicologico', fieldValue: '={{$json.updateData.perfil_psicologico}}' });
    fields.push({ fieldId: 'tags_comportamentais', fieldValue: '={{$json.updateData.tags_comportamentais}}' });
    fields.push({ fieldId: 'nivel_urgencia', fieldValue: '={{$json.updateData.nivel_urgencia}}' });
    fields.push({ fieldId: 'tom_recomendado_ia', fieldValue: '={{$json.updateData.tom_recomendado_ia}}' });
  }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('JSON do n8n atualizado para a versão Enterprise!');
