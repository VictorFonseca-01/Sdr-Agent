const fs = require('fs');

const wfStr = fs.readFileSync('n8n_workflow_atual.json', 'utf8');
const wf = JSON.parse(wfStr);

wf.nodes.forEach(n => {
  if (n.name === 'Criar Novo Lead') {
    n.parameters.operation = 'upsert';
    n.parameters.columns = 'telefone';
    console.log('Modified Criar Novo Lead to Upsert');
  }
});

fs.writeFileSync('n8n_workflow_atual_upsert.json', JSON.stringify(wf, null, 2));
console.log('Saved to n8n_workflow_atual_upsert.json');
