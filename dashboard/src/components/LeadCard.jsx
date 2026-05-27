import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Target, Sparkles, MessageSquare, RefreshCw } from 'lucide-react';

export default function LeadCard({ 
  lead, 
  colId, 
  colColor, 
  onClick, 
  onDragStart
}) {
  const isHot = lead.nivel_urgencia === 'Alta' || getLeadColumn(lead) === 'pronto';
  const glowShadow = isHot ? `0 0 15px ${colColor}88` : 'none';

  return (
    <motion.div 
      key={lead.id}
      draggable
      onDragStart={(e) => onDragStart(e, lead, colId)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, boxShadow: glowShadow }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onClick(lead)}
      whileHover={{ scale: 1.02 }}
      className="glass-card"
      style={{ 
        padding: '16px', 
        cursor: 'pointer', 
        position: 'relative', 
        borderLeft: `4px solid ${colColor}`, 
        background: 'rgba(255,255,255,0.03)',
        transition: 'background 0.3s',
        wordBreak: 'break-word',
        animation: isHot ? 'pulse 2s infinite' : 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'white' }}>{lead.nome || 'Sem Nome'}</div>
      </div>
      
      {/* Score Progress Bar */}
      {lead.score_qualificacao !== undefined && lead.score_qualificacao !== null && (
        <div style={{ marginBottom: '12px' }} title="Score de Qualificação">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>
            <span>Score Qualificação</span>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{lead.score_qualificacao}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${lead.score_qualificacao}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ 
                height: '100%', 
                background: `linear-gradient(90deg, ${lead.score_qualificacao > 70 ? '#10b981' : lead.score_qualificacao > 40 ? '#f59e0b' : '#ef4444'}, var(--primary))`
              }}
            />
          </div>
        </div>
      )}
      
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Phone size={14}/> {lead.telefone}
      </div>
      
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {lead.produto_interesse && <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd' }}>{lead.produto_interesse}</span>}
        {lead.orcamento && <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>{lead.orcamento}</span>}
        {lead.perfil_psicologico && lead.perfil_psicologico !== 'Não Identificado' && <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d' }}>🧠 Perfil {lead.perfil_psicologico}</span>}
        {lead.nivel_urgencia && lead.nivel_urgencia !== 'Baixa' && <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>⏳ Urgência {lead.nivel_urgencia}</span>}
      </div>

    </motion.div>
  );
}
