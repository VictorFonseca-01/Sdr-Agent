const fs = require('fs');
const path = 'Dashboard/src/pages/Leads.jsx';

let code = fs.readFileSync(path, 'utf8');

const newUI = `
      {/* Kanban Board */}
      <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', minHeight: '60vh' }}>
        {['frio', 'morno', 'quente', 'pronto', 'perdido'].map(colId => {
          // Apenas mostra a coluna de perdidos se o filtro não for específico das outras
          if (colId === 'perdido' && filterStatus !== 'all' && filterStatus !== 'perdido') return null;

          const colTitle = colId === 'frio' ? 'Novos / Frios' : 
                           colId === 'morno' ? 'Em Qualificação' : 
                           colId === 'quente' ? 'Quentes' : 
                           colId === 'pronto' ? 'Prontos para Venda' : 'Perdidos';
          
          const colColor = colId === 'frio' ? 'var(--text-muted)' : 
                           colId === 'morno' ? '#0ea5e9' : 
                           colId === 'quente' ? '#f59e0b' : 
                           colId === 'pronto' ? '#10b981' : '#ef4444';

          const colLeads = filteredLeads.filter(l => {
            const isLost = isLeadLost(l);
            if (colId === 'perdido') return isLost;
            if (isLost) return false;
            if (colId === 'pronto') return l.status_funil?.toLowerCase().includes('pronto') || l.temperatura?.toLowerCase().includes('pronto');
            if (colId === 'quente') return l.temperatura?.toLowerCase() === 'quente' || l.temperatura?.toLowerCase() === 'hot';
            if (colId === 'morno') return l.temperatura?.toLowerCase() === 'morno' || l.temperatura?.toLowerCase() === 'warm';
            return !l.temperatura || l.temperatura?.toLowerCase() === 'frio' || l.temperatura?.toLowerCase() === 'cold';
          });

          if (colId === 'perdido' && colLeads.length === 0) return null; // Esconde a coluna de perdidos se estiver vazia

          return (
            <div key={colId} style={{ flex: '0 0 350px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: colColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {colTitle}
                </h3>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{colLeads.length}</span>
              </div>
              
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1, maxHeight: '70vh' }}>
                <AnimatePresence>
                  {colLeads.map(lead => (
                    <motion.div 
                      key={lead.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => toggleExpand(lead.id)}
                      className="glass-card"
                      style={{ 
                        padding: '16px', 
                        cursor: 'pointer', 
                        position: 'relative', 
                        borderLeft: \`4px solid \${colColor}\`, 
                        background: expandedLeads[lead.id] ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                        boxShadow: expandedLeads[lead.id] ? \`0 0 15px \${colColor}33\` : 'none',
                        transition: 'all 0.3s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>{lead.nome || 'Sem Nome'}</div>
                        {lead.score_qualificacao && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            {lead.score_qualificacao}%
                          </div>
                        )}
                      </div>
                      
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14}/> {lead.telefone}
                      </div>
                      
                      {/* Tags */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: expandedLeads[lead.id] ? '16px' : '0' }}>
                        {lead.produto_interesse && <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd' }}>{lead.produto_interesse}</span>}
                        {lead.orcamento && <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>{lead.orcamento}</span>}
                      </div>

                      {/* Expanded Details */}
                      {expandedLeads[lead.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '20px', cursor: 'default' }}
                        >
                          <div>
                            <div style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                              <Sparkles size={16}/> Resumo SDR (IA)
                            </div>
                            <div style={{ color: 'var(--text-main)', lineHeight: '1.5', fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                              {lead.resumo_sdr || 'Ainda sem resumo. O SDR IA gerará um após a primeira qualificação.'}
                            </div>
                          </div>
                          
                          {/* Timeline / Messages */}
                          <div>
                            <div style={{ color: '#0ea5e9', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                              <MessageSquare size={16}/> Histórico de Interações
                            </div>
                            <div style={{ 
                              maxHeight: '300px', 
                              overflowY: 'auto', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: '10px', 
                              padding: '12px',
                              background: 'rgba(0,0,0,0.3)',
                              borderRadius: '8px',
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                              {!leadTimelines[lead.id] ? (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                                  <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto', marginBottom: '8px' }} />
                                  Carregando histórico...
                                </div>
                              ) : leadTimelines[lead.id].length === 0 ? (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                                  Nenhuma interação registrada.
                                </div>
                              ) : (
                                leadTimelines[lead.id].map((item, i) => {
                                  if (item.type === 'event') {
                                    return (
                                      <div key={'evt-'+i} style={{ fontSize: '0.75rem', padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: 'var(--text-muted)', textAlign: 'center', margin: '4px 0' }}>
                                        {item.description} - {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                      </div>
                                    );
                                  }
                                  
                                  const isClient = item.sender === 'client' || item.sender === 'user' || item.sender === 'lead';
                                  return (
                                    <div key={'msg-'+i} style={{ 
                                      alignSelf: isClient ? 'flex-end' : 'flex-start',
                                      background: isClient ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                      color: 'white',
                                      padding: '10px 14px',
                                      borderRadius: '12px',
                                      borderBottomRightRadius: isClient ? '2px' : '12px',
                                      borderBottomLeftRadius: !isClient ? '2px' : '12px',
                                      maxWidth: '90%',
                                      fontSize: '0.9rem',
                                      lineHeight: '1.4',
                                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                    }}>
                                      {item.content}
                                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginTop: '6px', textAlign: isClient ? 'right' : 'left' }}>
                                        {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        {!isClient && ' • SDR IA'}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button 
                              onClick={() => toggleExpand(lead.id)}
                              className="glass-card" 
                              style={{ padding: '10px', fontSize: '0.85rem', flex: 1, color: 'white', cursor: 'pointer' }}
                            >
                              Recolher
                            </button>
                            <button 
                              onClick={() => openWhatsApp(lead.telefone, lead.nome)}
                              className="btn-primary" 
                              style={{ padding: '10px', fontSize: '0.85rem', flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                            >
                              <Phone size={16} /> Abrir WhatsApp
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {colLeads.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border-glass)', borderRadius: '8px' }}>
                    Nenhum lead nesta etapa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
`;

// Extract before {/* Leads Table */}
const parts = code.split('{/* Leads Table */}');
if (parts.length > 1) {
  // We want to discard everything after {/* Leads Table */} and replace it with our newUI
  // But wait, there are closing tags. Let's see the end of the file.
  // The file ends with:
  //       </div>
  //     </div>
  //   );
  // }
  
  const before = parts[0];
  const finalCode = before + newUI + '\n    </div>\n  );\n}';
  
  fs.writeFileSync(path, finalCode);
  console.log('Successfully updated Leads.jsx with Kanban board!');
} else {
  console.log('Error: Could not split file.');
}
