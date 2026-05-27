import React from 'react';
import LeadCard from './LeadCard';
import { AnimatePresence } from 'framer-motion';

export default function KanbanBoard({ 
  cols, 
  filteredLeads, 
  handleDragOver, 
  handleDrop, 
  handleDragStart, 
  expandedLeads, 
  toggleExpand, 
  leadTimelines, 
  openWhatsApp,
  getLeadColumn,
  onSelectLead,
  sortBy = 'auto',
  onOpenWhatsApp,
  isCompact
}) {
  return (
    <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', flex: 1, minHeight: 0 }}>
      {cols.map(col => {
        const colLeads = filteredLeads.filter(l => getLeadColumn(l) === col.id);

        const getUrgencyWeight = (urgency) => {
          if (urgency === 'Alta') return 3;
          if (urgency === 'Média') return 2;
          return 1;
        };

        const sortedLeads = [...colLeads].sort((a, b) => {
          if (sortBy === 'score') {
            return (b.score_qualificacao || 0) - (a.score_qualificacao || 0);
          } else if (sortBy === 'recent') {
            const dateA = new Date(a.updated_at || a.created_at || 0);
            const dateB = new Date(b.updated_at || b.created_at || 0);
            return dateB - dateA;
          } else {
            const wA = getUrgencyWeight(a.nivel_urgencia);
            const wB = getUrgencyWeight(b.nivel_urgencia);
            if (wA !== wB) return wB - wA;
            return (b.score_qualificacao || 0) - (a.score_qualificacao || 0);
          }
        });

        if (col.id === 'perdido' && colLeads.length === 0) return null;

        return (
          <div 
            key={col.id} 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            style={{ 
              flex: '1 1 0',
              minWidth: '250px',
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '12px', 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: col.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {col.title}
              </h3>
              <span style={{ background: 'var(--bg-body)', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{colLeads.length}</span>
            </div>
            
            <div className="hide-scrollbar" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
              <AnimatePresence>
                {sortedLeads.map(lead => (
                  <LeadCard 
                    key={lead.id}
                    lead={lead}
                    colId={col.id}
                    colColor={col.color}
                    onClick={onSelectLead}
                    onDragStart={handleDragStart}
                    onOpenWhatsApp={onOpenWhatsApp}
                    isCompact={isCompact}
                  />
                ))}
              </AnimatePresence>
              {colLeads.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  Nenhum lead nesta etapa
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
