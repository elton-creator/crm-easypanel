import React, { useState } from 'react';
import { Button } from './ui/button';
import { Trophy, XCircle, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Textarea } from './ui/textarea';

interface LeadActionsProps {
  leadId: string;
  leadName: string;
  finalStatus?: 'won' | 'lost' | 'active';
  onStatusChange: (status: 'won' | 'lost' | 'active') => void;
}

export const LeadActions: React.FC<LeadActionsProps> = ({
  leadId,
  leadName,
  finalStatus = 'active',
  onStatusChange,
}) => {
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [lostReason, setLostReason] = useState('');

  const handleMarkAsWon = () => {
    if (window.confirm(`Marcar "${leadName}" como GANHO?`)) {
      onStatusChange('won');
      // TODO: Chamar API
      // await api.post(`/api/leads/${leadId}/won`);
    }
  };

  const handleMarkAsLost = () => {
    setShowLostDialog(true);
  };

  const confirmMarkAsLost = () => {
    if (!lostReason.trim()) {
      alert('Por favor, informe o motivo da perda');
      return;
    }
    
    onStatusChange('lost');
    setShowLostDialog(false);
    setLostReason('');
    
    // TODO: Chamar API
    // await api.post(`/api/leads/${leadId}/lost`, { reason: lostReason });
  };

  const handleReopen = () => {
    if (window.confirm(`Reabrir lead "${leadName}"?`)) {
      onStatusChange('active');
      // TODO: Chamar API
      // await api.post(`/api/leads/${leadId}/reopen`);
    }
  };

  if (finalStatus === 'won') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full">
          <Trophy className="w-4 h-4" />
          <span className="text-sm font-medium">Lead Ganho</span>
        </div>
        <Button onClick={handleReopen} size="sm" variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reabrir
        </Button>
      </div>
    );
  }

  if (finalStatus === 'lost') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full">
          <XCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Lead Perdido</span>
        </div>
        <Button onClick={handleReopen} size="sm" variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reabrir
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={handleMarkAsWon} size="sm" className="bg-green-600 hover:bg-green-700">
          <Trophy className="w-4 h-4 mr-2" />
          Marcar como Ganho
        </Button>
        <Button onClick={handleMarkAsLost} size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
          <XCircle className="w-4 h-4 mr-2" />
          Marcar como Perdido
        </Button>
      </div>

      <Dialog open={showLostDialog} onOpenChange={setShowLostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar Lead como Perdido</DialogTitle>
            <DialogDescription>
              Por favor, informe o motivo da perda do lead "{leadName}".
              Esta informação será registrada para análise futura.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Ex: Preço muito alto, escolheu concorrente, não tinha orçamento..."
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLostDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmMarkAsLost} className="bg-red-600 hover:bg-red-700">
              Confirmar Perda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};