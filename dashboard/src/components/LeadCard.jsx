import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Target, Sparkles, MessageSquare, RefreshCw } from 'lucide-react';

export default function LeadCard({ 
  lead, 
  colId, 
  colColor, 
  onClick, 
  onDragStart,
  onOpenWhatsApp,
  isCompact
}) {
  console.log('LeadCard isCompact:', isCompact, lead.nome);
  const isHot = lead.nivel_urgencia === 'Alta' || colId === 'pronto';
  const glowShadow = isHot ? `0 0 15px ${colColor}88` : 'none';

  const formatTimeInStage = (updatedAtStr, createdAtStr) => {
    const dateStr = updatedAtStr || createdAtStr;
    if (!dateStr) return { text: '', isStale: false };
    
    const updatedTime = new Date(dateStr);
    const now = new Date();
    const diffMs = now - updatedTime;
    
    if (isNaN(diffMs) || diffMs < 0) return { text: '', isStale: false };
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return { text: `${diffMins}m`, isStale: false };
    } else if (diffHours < 24) {
      return { text: `${diffHours}h`, isStale: false };
    } else {
      return { text: `${diffDays}d`, isStale: diffDays >= 2 };
    }
  };

  const { text: timeInStage, isStale } = formatTimeInStage(lead.updated_at, lead.created_at);

  return (
    <motion.div 
      key={lead.id}
      draggable
      onDragStart={(e) => onDragStart(e, lead, colId)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onClick(lead)}
      whileHover={{ scale: 1.02 }}
      className="glass-card"
      style={{ 
        padding: isCompact ? '10px 12px' : '16px', 
        cursor: 'pointer', 
        position: 'relative', 
        borderLeft: `4px solid ${colColor}`, 
        transition: 'background 0.3s',
        wordBreak: 'break-word'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCompact ? '6px' : '8px' }}>
        <div style={{ fontWeight: '700', fontSize: isCompact ? '0.95rem' : '1.05rem', color: 'var(--text-main)' }}>{lead.nome || 'Sem Nome'}</div>
        {isCompact && lead.score_qualificacao !== undefined && lead.score_qualificacao !== null && (
          <span style={{ 
            color: 'var(--primary)', 
            fontWeight: 'bold', 
            fontSize: '0.75rem', 
            background: 'rgba(59, 130, 246, 0.1)', 
            padding: '2px 6px', 
            borderRadius: '6px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            {lead.score_qualificacao}%
          </span>
        )}
      </div>
      
      {/* Score Progress Bar */}
      {!isCompact && lead.score_qualificacao !== undefined && lead.score_qualificacao !== null && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>
            <span className="tooltip-container" style={{ borderBottom: '1px dotted var(--text-muted)' }}>
              Score Qualificação
              <div className="tooltip-box">
                A IA calcula este score (0 a 100%) analisando o nível de detalhamento do lead sobre: orçamento, urgência, perfil de decisão e necessidades do imóvel.
              </div>
            </span>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{lead.score_qualificacao}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${lead.score_qualificacao}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ 
                height: '100%', 
                background: lead.score_qualificacao > 70 ? 'var(--status-pronto)' : lead.score_qualificacao > 40 ? 'var(--status-quente)' : 'var(--status-perdido)'
              }}
            />
          </div>
        </div>
      )}
      
      {!isCompact && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Phone size={14}/> {lead.telefone}
        </div>
      )}
      
      {!isCompact ? (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {lead.produto_interesse && <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>{lead.produto_interesse}</span>}
          {lead.orcamento && <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--status-pronto)', color: 'var(--status-pronto)' }}>{lead.orcamento}</span>}
          {lead.perfil_psicologico && lead.perfil_psicologico !== 'Não Identificado' && <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(217, 119, 6, 0.1)', color: 'var(--secondary)' }}>🧠 {lead.perfil_psicologico}</span>}
          {lead.nivel_urgencia && lead.nivel_urgencia !== 'Baixa' && <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--status-perdido)' }}>⏳ Urgência {lead.nivel_urgencia}</span>}
        </div>
      ) : (
        (lead.nivel_urgencia === 'Alta' || lead.produto_interesse) && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {lead.produto_interesse && <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>{lead.produto_interesse}</span>}
            {lead.nivel_urgencia === 'Alta' && <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--status-perdido)', fontWeight: 'bold' }}>⏳ Alta</span>}
          </div>
        )
      )}

      {/* Footer metadata & actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: isCompact ? '6px' : '12px',
        paddingTop: isCompact ? '6px' : '10px',
        borderTop: '1px solid var(--border-color)'
      }}>
        {timeInStage && (
          <span style={{ 
            fontSize: '0.75rem', 
            color: isStale ? 'var(--status-perdido)' : 'var(--text-muted)', 
            fontWeight: isStale ? '600' : 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            ⏱️ {isStale ? `Parado há ${timeInStage}` : `Na etapa há ${timeInStage}`}
          </span>
        )}
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onOpenWhatsApp && onOpenWhatsApp(lead.telefone, lead.nome);
          }}
          title="Abrir WhatsApp"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isCompact ? '24px' : '28px',
            height: isCompact ? '24px' : '28px',
            borderRadius: '50%',
            background: 'rgba(37, 211, 102, 0.1)',
            border: '1px solid rgba(37, 211, 102, 0.3)',
            color: '#25D366',
            cursor: 'pointer',
            transition: 'all 0.2s',
            padding: '0',
            marginLeft: 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(37, 211, 102, 0.2)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(37, 211, 102, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg viewBox="0 0 24 24" width={isCompact ? '12' : '14'} height={isCompact ? '12' : '14'} fill="currentColor">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-15.659c-.144-.32-.295-.327-.431-.333-.111-.005-.239-.005-.367-.005-.128 0-.336.048-.512.24-.176.192-.672.656-.672 1.6 0 .944.688 1.856.784 1.984.096.128 1.325 2.137 3.257 2.971 1.61.693 2.179.713 2.955.642.715-.065 2.192-.896 2.496-1.76.304-.864.304-1.6.213-1.76-.091-.16-.336-.256-.672-.416s-1.984-.976-2.288-1.088c-.304-.112-.528-.168-.752.168-.224.336-.864 1.088-1.056 1.312-.192.224-.384.256-.72.096-.336-.16-1.42-.524-2.704-1.672-1.003-.892-1.68-1.997-1.872-2.32-.192-.32-.02-.493.14-.653.144-.144.32-.376.48-.564.16-.188.213-.32.32-.532.107-.212.053-.396-.027-.556z"/>
          </svg>
        </button>
      </div>

    </motion.div>
  );
}
