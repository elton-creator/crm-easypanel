import React, { useState, useMemo } from 'react';
import { Lead, Funnel } from '@/lib/mockData';
import { LeadCard } from './LeadCard';
import { LeadModal } from './LeadModal';
import LeadFilters, { FilterState } from './LeadFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Archive } from 'lucide-react';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface KanbanBoardProps {
  leads: Lead[];
  archivedLeads: Lead[];
  showArchived: boolean;
  onShowArchivedChange: (show: boolean) => void;
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
  onDeleteLead: (leadId: string) => void;
  onMoveLeadToStage: (leadId: string, stageId: string) => void;
  onMarkWon: (leadId: string) => void;
  onMarkLost: (leadId: string) => void;
  selectedFunnel?: Funnel;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  archivedLeads,
  showArchived,
  onShowArchivedChange,
  onUpdateLead,
  onDeleteLead,
  onMoveLeadToStage,
  onMarkWon,
  onMarkLost,
  selectedFunnel
}) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    origin: 'all',
    createdFrom: undefined,
    createdTo: undefined,
    updatedFrom: undefined,
    updatedTo: undefined
  });

  const stages = selectedFunnel?.stages || [];

  // Aplicar filtros
  const filteredLeads = useMemo(() => {
    let result = leads;

    // Filtro de busca por texto
    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(lead => 
        lead.name.toLowerCase().includes(term) ||
        lead.phone.toLowerCase().includes(term) ||
        (lead.email && lead.email.toLowerCase().includes(term))
      );
    }

    // Filtro por origem
    if (filters.origin && filters.origin !== 'all') {
      result = result.filter(lead => lead.origin === filters.origin);
    }

    // Filtro por data de entrada
    if (filters.createdFrom || filters.createdTo) {
      result = result.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        const from = filters.createdFrom ? startOfDay(filters.createdFrom) : new Date(0);
        const to = filters.createdTo ? endOfDay(filters.createdTo) : new Date();
        
        return isWithinInterval(leadDate, { start: from, end: to });
      });
    }

    // Filtro por data de alteração
    if (filters.updatedFrom || filters.updatedTo) {
      result = result.filter(lead => {
        const leadDate = new Date(lead.updatedAt);
        const from = filters.updatedFrom ? startOfDay(filters.updatedFrom) : new Date(0);
        const to = filters.updatedTo ? endOfDay(filters.updatedTo) : new Date();
        
        return isWithinInterval(leadDate, { start: from, end: to });
      });
    }

    return result;
  }, [leads, filters]);

  const filteredArchivedLeads = useMemo(() => {
    let result = archivedLeads;

    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(lead => 
        lead.name.toLowerCase().includes(term) ||
        lead.phone.toLowerCase().includes(term) ||
        (lead.email && lead.email.toLowerCase().includes(term))
      );
    }

    if (filters.origin && filters.origin !== 'all') {
      result = result.filter(lead => lead.origin === filters.origin);
    }

    if (filters.createdFrom || filters.createdTo) {
      result = result.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        const from = filters.createdFrom ? startOfDay(filters.createdFrom) : new Date(0);
        const to = filters.createdTo ? endOfDay(filters.createdTo) : new Date();
        
        return isWithinInterval(leadDate, { start: from, end: to });
      });
    }

    if (filters.updatedFrom || filters.updatedTo) {
      result = result.filter(lead => {
        const leadDate = new Date(lead.updatedAt);
        const from = filters.updatedFrom ? startOfDay(filters.updatedFrom) : new Date(0);
        const to = filters.updatedTo ? endOfDay(filters.updatedTo) : new Date();
        
        return isWithinInterval(leadDate, { start: from, end: to });
      });
    }

    return result;
  }, [archivedLeads, filters]);

  const getLeadsForStage = (stageId: string) => {
    return filteredLeads.filter(lead => lead.stageId === stageId);
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedLead && draggedLead.stageId !== stageId) {
      onMoveLeadToStage(draggedLead.id, stageId);
    }
    setDraggedLead(null);
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
  };

  if (!selectedFunnel) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nenhum funil selecionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <LeadFilters onFilterChange={setFilters} />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">{selectedFunnel.name}</h2>
          <Badge variant="secondary">
            {filteredLeads.length} leads
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="show-archived"
            checked={showArchived}
            onCheckedChange={onShowArchivedChange}
          />
          <Label htmlFor="show-archived" className="flex items-center space-x-1 whitespace-nowrap">
            <Archive className="h-4 w-4" />
            <span>Arquivados ({filteredArchivedLeads.length})</span>
          </Label>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {/* Active Stages */}
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <span>{stage.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {getLeadsForStage(stage.id).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 min-h-[200px]">
                  {getLeadsForStage(stage.id).map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onDragEnd={handleDragEnd}
                    >
                      <LeadCard
                        lead={lead}
                        onEdit={setSelectedLead}
                        onDelete={onDeleteLead}
                        onMarkWon={onMarkWon}
                        onMarkLost={onMarkLost}
                        onUpdateLead={onUpdateLead}
                        isDragging={draggedLead?.id === lead.id}
                      />
                    </div>
                  ))}
                  
                  {getLeadsForStage(stage.id).length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      <p className="text-sm">Nenhum lead neste estágio</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Archived Column */}
        {showArchived && (
          <div className="flex-shrink-0 w-80">
            <Card className="h-full bg-gray-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Archive className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Arquivados</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {filteredArchivedLeads.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 min-h-[200px]">
                  {filteredArchivedLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onEdit={setSelectedLead}
                      onDelete={onDeleteLead}
                      onMarkWon={onMarkWon}
                      onMarkLost={onMarkLost}
                      onUpdateLead={onUpdateLead}
                    />
                  ))}
                  
                  {filteredArchivedLeads.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      <p className="text-sm">Nenhum lead arquivado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Lead Modal */}
      <LeadModal
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onSave={onUpdateLead}
        onMarkWon={onMarkWon}
        onMarkLost={onMarkLost}
      />
    </div>
  );
};