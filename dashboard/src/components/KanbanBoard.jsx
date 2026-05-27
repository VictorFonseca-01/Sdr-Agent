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
  onSelectLead
}) {
  return (
    <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', flex: 1, minHeight: 0 }}>
      {cols.map(col => {
        const colLeads = filteredLeads.filter(l => getLeadColumn(l) === col.id);

        if (col.id === 'perdido' && colLeads.length === 0) return null;

        return (
          <div 
            key={col.id} 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            style={{ 
              flex: '0 0 350px',
              width: '350px',
              minWidth: '350px',
              maxWidth: '350px',
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--border-glass)', 
              borderRadius: '12px', 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: col.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {col.title}
              </h3>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{colLeads.length}</span>
            </div>
            
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
              <AnimatePresence>
                {colLeads.map(lead => (
                  <LeadCard 
                    key={lead.id}
                    lead={lead}
                    colId={col.id}
                    colColor={col.color}
                    onClick={onSelectLead}
                    onDragStart={handleDragStart}
                  />
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
  );
}
