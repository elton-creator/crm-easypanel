import { useState, useEffect } from 'react';
import { Lead, mockLeads, Webhook, mockWebhooks, mockStages } from '@/lib/mockData';

type WebhookEvent = 'lead_created' | 'lead_updated' | 'stage_changed' | 'lead_won' | 'lead_lost';

interface WebhookPayload {
  evento: string;
  cliente_id: string;
  funil_id: string;
  lead_id: string;
  estagio_anterior?: string;
  estagio_atual: string;
  status: string;
  dados: {
    nome: string;
    telefone: string;
    email?: string;
    origem?: string;
    notas?: string;
    whatsapp?: string;
    cidade?: string;
    endereco?: string;
  };
  timestamp: string;
}

export const useLeads = (clientId?: string) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    // Load leads from localStorage or use mock data
    const storedLeads = localStorage.getItem('crm_leads');
    let allLeads = storedLeads ? JSON.parse(storedLeads) : mockLeads;
    
    // Filter by client if specified
    if (clientId) {
      allLeads = allLeads.filter((lead: Lead) => lead.clientId === clientId);
    }
    
    setLeads(allLeads);
  }, [clientId]);

  const saveLeads = (updatedLeads: Lead[]) => {
    setLeads(updatedLeads);
    localStorage.setItem('crm_leads', JSON.stringify(updatedLeads));
  };

  const triggerWebhook = async (event: WebhookEvent, lead: Lead, previousStageId?: string) => {
    try {
      // Carregar webhooks
      const storedWebhooks = localStorage.getItem('crm_webhooks');
      const allWebhooks: Webhook[] = storedWebhooks ? JSON.parse(storedWebhooks) : mockWebhooks;
      
      // Filtrar webhooks relevantes
      const relevantWebhooks = allWebhooks.filter(webhook => 
        webhook.active &&
        webhook.clientId === lead.clientId &&
        webhook.events.includes(event) &&
        (!webhook.funnelId || webhook.funnelId === lead.funnelId)
      );

      // Preparar payload
      const getCurrentStageName = (stageId: string) => {
        const stage = mockStages.find(s => s.id === stageId);
        return stage?.name || 'Estágio desconhecido';
      };

      const payload: WebhookPayload = {
        evento: event,
        cliente_id: lead.clientId,
        funil_id: lead.funnelId,
        lead_id: lead.id,
        estagio_anterior: previousStageId ? getCurrentStageName(previousStageId) : undefined,
        estagio_atual: getCurrentStageName(lead.stageId),
        status: lead.status,
        dados: {
          nome: lead.name,
          telefone: lead.phone,
          email: lead.email,
          origem: lead.origin,
          notas: lead.notes,
          whatsapp: lead.whatsapp,
          cidade: lead.city,
          endereco: lead.address
        },
        timestamp: new Date().toISOString()
      };

      // Simular envio dos webhooks (em produção seria requisições HTTP reais)
      for (const webhook of relevantWebhooks) {
        console.log(`🔔 Webhook disparado para: ${webhook.url}`);
        console.log('📦 Payload:', payload);
        
        // Em produção, aqui seria:
        // await fetch(webhook.url, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(payload)
        // });
      }

      if (relevantWebhooks.length > 0) {
        console.log(`✅ ${relevantWebhooks.length} webhook(s) disparado(s) para o evento: ${event}`);
      }
    } catch (error) {
      console.error('❌ Erro ao disparar webhook:', error);
    }
  };

  const addLead = (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newLead: Lead = {
      ...lead,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const allLeads = JSON.parse(localStorage.getItem('crm_leads') || JSON.stringify(mockLeads));
    const updatedLeads = [...allLeads, newLead];
    localStorage.setItem('crm_leads', JSON.stringify(updatedLeads));
    
    if (!clientId || lead.clientId === clientId) {
      setLeads(prev => [...prev, newLead]);
    }

    // Disparar webhook de lead criado
    triggerWebhook('lead_created', newLead);
  };

  const updateLead = (leadId: string, updates: Partial<Lead>) => {
    const allLeads = JSON.parse(localStorage.getItem('crm_leads') || JSON.stringify(mockLeads));
    const oldLead = allLeads.find((lead: Lead) => lead.id === leadId);
    
    const updatedLeads = allLeads.map((lead: Lead) =>
      lead.id === leadId
        ? { ...lead, ...updates, updatedAt: new Date().toISOString() }
        : lead
    );
    
    localStorage.setItem('crm_leads', JSON.stringify(updatedLeads));
    
    const updatedLead = updatedLeads.find((lead: Lead) => lead.id === leadId);
    
    setLeads(prev => prev.map(lead =>
      lead.id === leadId
        ? { ...lead, ...updates, updatedAt: new Date().toISOString() }
        : lead
    ));

    // Disparar webhook de lead atualizado
    if (updatedLead) {
      triggerWebhook('lead_updated', updatedLead);
    }
  };

  const deleteLead = (leadId: string) => {
    const allLeads = JSON.parse(localStorage.getItem('crm_leads') || JSON.stringify(mockLeads));
    const updatedLeads = allLeads.filter((lead: Lead) => lead.id !== leadId);
    localStorage.setItem('crm_leads', JSON.stringify(updatedLeads));
    
    setLeads(prev => prev.filter(lead => lead.id !== leadId));
  };

  const moveLeadToStage = (leadId: string, newStageId: string) => {
    const allLeads = JSON.parse(localStorage.getItem('crm_leads') || JSON.stringify(mockLeads));
    const oldLead = allLeads.find((lead: Lead) => lead.id === leadId);
    const previousStageId = oldLead?.stageId;
    
    const updatedLeads = allLeads.map((lead: Lead) =>
      lead.id === leadId
        ? { ...lead, stageId: newStageId, updatedAt: new Date().toISOString() }
        : lead
    );
    
    localStorage.setItem('crm_leads', JSON.stringify(updatedLeads));
    
    const updatedLead = updatedLeads.find((lead: Lead) => lead.id === leadId);
    
    setLeads(prev => prev.map(lead =>
      lead.id === leadId
        ? { ...lead, stageId: newStageId, updatedAt: new Date().toISOString() }
        : lead
    ));

    // Disparar webhook de mudança de estágio
    if (updatedLead && previousStageId !== newStageId) {
      triggerWebhook('stage_changed', updatedLead, previousStageId);
    }
  };

  const markLeadStatus = (leadId: string, status: 'won' | 'lost') => {
    const allLeads = JSON.parse(localStorage.getItem('crm_leads') || JSON.stringify(mockLeads));
    const updatedLeads = allLeads.map((lead: Lead) =>
      lead.id === leadId
        ? { ...lead, status, updatedAt: new Date().toISOString() }
        : lead
    );
    
    localStorage.setItem('crm_leads', JSON.stringify(updatedLeads));
    
    const updatedLead = updatedLeads.find((lead: Lead) => lead.id === leadId);
    
    setLeads(prev => prev.map(lead =>
      lead.id === leadId
        ? { ...lead, status, updatedAt: new Date().toISOString() }
        : lead
    ));

    // Disparar webhook específico para ganho ou perda
    if (updatedLead) {
      const event = status === 'won' ? 'lead_won' : 'lead_lost';
      triggerWebhook(event, updatedLead);
    }
  };

  const getActiveLeads = () => leads.filter(lead => lead.status === 'active');
  const getArchivedLeads = () => leads.filter(lead => lead.status === 'won' || lead.status === 'lost');

  return {
    leads: showArchived ? leads : getActiveLeads(),
    archivedLeads: getArchivedLeads(),
    showArchived,
    setShowArchived,
    addLead,
    updateLead,
    deleteLead,
    moveLeadToStage,
    markLeadStatus
  };
};