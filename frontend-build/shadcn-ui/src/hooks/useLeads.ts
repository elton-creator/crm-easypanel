import { useState, useEffect } from 'react';
import { Lead } from '@/lib/mockData';

export function useLeads(clientId?: string) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [archivedLeads, setArchivedLeads] = useState<Lead[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    loadLeads();
  }, [clientId]);

  const loadLeads = () => {
    try {
      const stored = localStorage.getItem('crm_leads');
      if (stored) {
        const allLeads: Lead[] = JSON.parse(stored);
        const userLeads = clientId 
          ? allLeads.filter(lead => lead.clientId === clientId)
          : allLeads;

        const active = userLeads.filter(lead => lead.status === 'active');
        const archived = userLeads.filter(lead => lead.status === 'won' || lead.status === 'lost');

        setLeads(active);
        setArchivedLeads(archived);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
    }
  };

  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const stored = localStorage.getItem('crm_leads');
    const allLeads = stored ? JSON.parse(stored) : [];
    const updated = [...allLeads, newLead];
    localStorage.setItem('crm_leads', JSON.stringify(updated));

    setLeads([...leads, newLead]);
  };

  const updateLead = (leadId: string, updates: Partial<Lead>) => {
    const stored = localStorage.getItem('crm_leads');
    if (!stored) return;

    const allLeads: Lead[] = JSON.parse(stored);
    const updated = allLeads.map(lead =>
      lead.id === leadId
        ? { ...lead, ...updates, updatedAt: new Date().toISOString() }
        : lead
    );

    localStorage.setItem('crm_leads', JSON.stringify(updated));
    loadLeads();
  };

  const deleteLead = (leadId: string) => {
    const stored = localStorage.getItem('crm_leads');
    if (!stored) return;

    const allLeads: Lead[] = JSON.parse(stored);
    const updated = allLeads.filter(lead => lead.id !== leadId);

    localStorage.setItem('crm_leads', JSON.stringify(updated));
    loadLeads();
  };

  const moveLeadToStage = (leadId: string, stageId: string) => {
    updateLead(leadId, { stageId, updatedAt: new Date().toISOString() });
  };

  const markLeadStatus = (leadId: string, status: 'won' | 'lost') => {
    updateLead(leadId, { status, updatedAt: new Date().toISOString() });
  };

  return {
    leads,
    archivedLeads,
    showArchived,
    setShowArchived,
    addLead,
    updateLead,
    deleteLead,
    moveLeadToStage,
    markLeadStatus
  };
}