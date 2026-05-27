import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Phone, Target, Sparkles, Send, RefreshCw, Briefcase, Calendar } from 'lucide-react';

export default function SlideOutPanel({ lead, timeline, onClose, onOpenWhatsApp, onNotifySeller }) {
  const [notifying, setNotifying] = useState(false);

  if (!lead) return null;

  const handleNotify = async () => {
    setNotifying(true);
    await onNotifySeller(lead);
    setNotifying(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '500px',
          height: '100vh',
          background: 'rgba(10, 10, 12, 0.95)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid var(--border-glass)',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '8px' }}>
              {lead.nome || 'Lead Sem Nome'}
            </h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={14} /> {lead.telefone}
              </span>
              {lead.score_qualificacao && (
                <span style={{ fontSize: '0.8rem', background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                  Score: {lead.score_qualificacao}%
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Ações Rápidas */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => onOpenWhatsApp(lead.telefone, lead.nome)}
              className="btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
            >
              <Phone size={18} /> Chamar no WhatsApp
            </button>
            <button 
              onClick={handleNotify}
              disabled={notifying}
              style={{ 
                flex: 1, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', 
                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600'
              }}
            >
              {notifying ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
              Mandar p/ Vendedor
            </button>
          </div>

          {/* Dados Estruturados */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={14} /> Produto/Interesse
              </div>
              <div style={{ fontWeight: 'bold', color: 'white' }}>{lead.produto_interesse || 'Não informado'}</div>
            </div>
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={14} /> Orçamento
              </div>
              <div style={{ fontWeight: 'bold', color: '#10b981' }}>{lead.orcamento || 'Não informado'}</div>
            </div>
          </div>

          {/* Perfil e Urgência */}
          <div className="glass-card" style={{ padding: '20px' }}>
             <h3 style={{ fontSize: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
               <Sparkles size={18} /> Análise IA
             </h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Perfil Psicológico:</span>
                  <span style={{ fontWeight: 'bold', color: '#fcd34d' }}>{lead.perfil_psicologico || 'Analisando...'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Urgência:</span>
                  <span style={{ fontWeight: 'bold', color: lead.nivel_urgencia === 'Alta' ? '#ef4444' : '#fca5a5' }}>{lead.nivel_urgencia || 'Não definida'}</span>
                </div>
                {lead.tom_recomendado_ia && (
                  <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                    <strong>Abordagem Recomendada:</strong> {lead.tom_recomendado_ia}
                  </div>
                )}
             </div>
          </div>

          {/* Resumo SDR */}
          <div className="glass-card" style={{ padding: '20px' }}>
             <h3 style={{ fontSize: '1rem', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
               <Target size={18} /> Resumo do Atendimento
             </h3>
             <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
               {lead.resumo_sdr || 'Nenhum resumo disponível no momento. O SDR gerará um após a primeira interação completada.'}
             </p>
          </div>

          {/* Timeline de Mensagens */}
          <div>
            <h3 style={{ fontSize: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <MessageSquare size={18} /> Histórico de Chat
            </h3>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              padding: '16px',
              background: 'rgba(0,0,0,0.4)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {!timeline ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto', marginBottom: '8px' }} />
                  Carregando chat...
                </div>
              ) : timeline.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  Nenhuma mensagem.
                </div>
              ) : (
                timeline.map((item, i) => {
                  if (item.type === 'event') {
                    return (
                      <div key={'evt-'+i} style={{ fontSize: '0.75rem', padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: 'var(--text-muted)', textAlign: 'center', margin: '8px 0' }}>
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
                      padding: '12px 16px',
                      borderRadius: '16px',
                      borderBottomRightRadius: isClient ? '4px' : '16px',
                      borderBottomLeftRadius: !isClient ? '4px' : '16px',
                      maxWidth: '90%',
                      fontSize: '0.95rem',
                      lineHeight: '1.4',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                    }}>
                      {item.content}
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginTop: '8px', textAlign: isClient ? 'right' : 'left' }}>
                        {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {!isClient && ' • SDR IA'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
        </div>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          background: 'rgba(0,0,0,0.6)',
          zIndex: 999
        }}
      />
    </AnimatePresence>
  );
}
