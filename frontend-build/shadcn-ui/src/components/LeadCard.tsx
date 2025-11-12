import React from 'react';
import { Lead } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Mail, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  RotateCcw,
  Calendar,
  Clock
} from 'lucide-react';
import { LeadTagManager } from './LeadTagManager';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  onMarkWon?: (leadId: string) => void;
  onMarkLost?: (leadId: string) => void;
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
  isDragging?: boolean;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onEdit,
  onDelete,
  onMarkWon,
  onMarkLost,
  onUpdateLead,
  isDragging = false
}) => {
  const isArchived = lead.status === 'won' || lead.status === 'lost';

  const handleUnarchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateLead(lead.id, { status: 'active' });
  };

  const handleUpdateTags = (tags: string[]) => {
    onUpdateLead(lead.id, { tags });
  };

  return (
    <Card 
      className={`
        cursor-pointer transition-all hover:shadow-md
        ${isDragging ? 'opacity-50 rotate-2' : ''}
        ${isArchived ? 'bg-gray-50 border-gray-300' : ''}
      `}
      onClick={() => onEdit(lead)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-sm line-clamp-1">{lead.name}</h3>
            {lead.origin && (
              <p className="text-xs text-gray-500 mt-1">
                📍 {lead.origin}
              </p>
            )}
          </div>
          {isArchived && (
            <Badge 
              variant={lead.status === 'won' ? 'default' : 'destructive'}
              className="ml-2"
            >
              {lead.status === 'won' ? '✓ Ganho' : '✗ Perdido'}
            </Badge>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-1">
          <div className="flex items-center text-xs text-gray-600">
            <Phone className="h-3 w-3 mr-1" />
            <span>{lead.phone}</span>
          </div>
          {lead.email && (
            <div className="flex items-center text-xs text-gray-600">
              <Mail className="h-3 w-3 mr-1" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="space-y-1 pt-2 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Cadastro: {format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            <span>Alteração: {format(new Date(lead.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
          </div>
        </div>

        {/* Tags Display */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lead.tags.map((tag, index) => (
              <Badge key={`${lead.id}-tag-${index}`} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Tag Manager */}
        <div onClick={(e) => e.stopPropagation()}>
          <LeadTagManager
            tags={lead.tags || []}
            onTagsChange={handleUpdateTags}
            compact={true}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(lead);
              }}
              className="h-8 px-2"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Tem certeza que deseja excluir este lead?')) {
                  onDelete(lead.id);
                }
              }}
              className="h-8 px-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {!isArchived ? (
            <div className="flex space-x-1">
              {onMarkWon && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkWon(lead.id);
                  }}
                  className="h-8 px-2 text-green-600 hover:text-green-700"
                  title="Marcar como ganho"
                >
                  <CheckCircle className="h-3 w-3" />
                </Button>
              )}
              {onMarkLost && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkLost(lead.id);
                  }}
                  className="h-8 px-2 text-red-600 hover:text-red-700"
                  title="Marcar como perdido"
                >
                  <XCircle className="h-3 w-3" />
                </Button>
              )}
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnarchive}
              className="h-8 px-2 text-blue-600 hover:text-blue-700"
              title="Retornar ao funil"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              <span className="text-xs">Reativar</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};