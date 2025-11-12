import React, { useState, useEffect } from 'react';
import { Lead, Funnel } from '@/lib/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LeadTagManager } from './LeadTagManager';
import { CheckCircle, XCircle, Save } from 'lucide-react';
import { IMaskInput } from 'react-imask';
import { useAuth } from '@/contexts/AuthContext';

interface LeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadId: string, updates: Partial<Lead>) => void;
  onMarkWon?: (leadId: string) => void;
  onMarkLost?: (leadId: string) => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSave,
  onMarkWon,
  onMarkLost
}) => {
  const { user } = useAuth();
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    whatsapp: '',
    address: '',
    city: '',
    state: '',
    country: '',
    origin: '',
    gclid: '',
    fbclid: '',
    utms: '',
    ip: '',
    notes: '',
    funnelId: '',
    stageId: '',
    tags: [] as string[]
  });

  useEffect(() => {
    loadFunnels();
  }, [user?.id]);

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        whatsapp: lead.whatsapp || '',
        address: lead.address || '',
        city: lead.city || '',
        state: lead.state || '',
        country: lead.country || '',
        origin: lead.origin || '',
        gclid: lead.gclid || '',
        fbclid: lead.fbclid || '',
        utms: lead.utms || '',
        ip: lead.ip || '',
        notes: lead.notes || '',
        funnelId: lead.funnelId || '',
        stageId: lead.stageId || '',
        tags: lead.tags || []
      });
    }
  }, [lead]);

  const loadFunnels = () => {
    try {
      const stored = localStorage.getItem('crm_funnels');
      if (stored) {
        const allFunnels = JSON.parse(stored);
        const userFunnels = allFunnels.filter((f: Funnel) => f.clientId === user?.id);
        setFunnels(userFunnels);
      }
    } catch (error) {
      console.error('Error loading funnels:', error);
    }
  };

  const selectedFunnel = funnels.find(f => f.id === formData.funnelId);

  const handleFunnelChange = (funnelId: string) => {
    const funnel = funnels.find(f => f.id === funnelId);
    setFormData({
      ...formData,
      funnelId,
      stageId: funnel?.stages[0]?.id || ''
    });
  };

  const handleSave = () => {
    if (!lead) return;

    const updates: Partial<Lead> = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      whatsapp: formData.whatsapp || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      country: formData.country || undefined,
      origin: formData.origin || undefined,
      gclid: formData.gclid || undefined,
      fbclid: formData.fbclid || undefined,
      utms: formData.utms || undefined,
      ip: formData.ip || undefined,
      notes: formData.notes || undefined,
      funnelId: formData.funnelId,
      stageId: formData.stageId,
      tags: formData.tags.length > 0 ? formData.tags : undefined
    };

    onSave(lead.id, updates);
    onClose();
  };

  const handleMarkWon = () => {
    if (lead && onMarkWon) {
      onMarkWon(lead.id);
      onClose();
    }
  };

  const handleMarkLost = () => {
    if (lead && onMarkLost) {
      onMarkLost(lead.id);
      onClose();
    }
  };

  if (!lead) return null;

  const isArchived = lead.status === 'won' || lead.status === 'lost';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Editar Lead</span>
            {isArchived && (
              <Badge variant={lead.status === 'won' ? 'default' : 'destructive'}>
                {lead.status === 'won' ? '✓ Ganho' : '✗ Perdido'}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Funil e Estágio */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="funnel">Funil *</Label>
              <Select value={formData.funnelId} onValueChange={handleFunnelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funil" />
                </SelectTrigger>
                <SelectContent>
                  {funnels.map((funnel) => (
                    <SelectItem key={funnel.id} value={funnel.id}>
                      {funnel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Estágio *</Label>
              <Select value={formData.stageId} onValueChange={(value) => setFormData({ ...formData, stageId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estágio" />
                </SelectTrigger>
                <SelectContent>
                  {selectedFunnel?.stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-700">Informações Básicas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="João da Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone/Celular *</Label>
                <IMaskInput
                  mask="(00) 00000-0000"
                  value={formData.phone}
                  onAccept={(value) => setFormData({ ...formData, phone: value })}
                  placeholder="(11) 99999-8888"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="joao@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <IMaskInput
                  mask="(00) 00000-0000"
                  value={formData.whatsapp}
                  onAccept={(value) => setFormData({ ...formData, whatsapp: value })}
                  placeholder="(11) 99999-8888"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-700">Endereço</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua Exemplo, 123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Brasil"
                />
              </div>
            </div>
          </div>

          {/* Origem e Rastreamento */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-700">Origem e Rastreamento</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origin">Origem</Label>
                <Input
                  id="origin"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  placeholder="Google Ads, Facebook, Site..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ip">IP</Label>
                <Input
                  id="ip"
                  value={formData.ip}
                  onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                  placeholder="192.168.1.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gclid">GCLID (Google)</Label>
                <Input
                  id="gclid"
                  value={formData.gclid}
                  onChange={(e) => setFormData({ ...formData, gclid: e.target.value })}
                  placeholder="EAIaIQob..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fbclid">FBCLID (Facebook)</Label>
                <Input
                  id="fbclid"
                  value={formData.fbclid}
                  onChange={(e) => setFormData({ ...formData, fbclid: e.target.value })}
                  placeholder="IwAR..."
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="utms">UTMs</Label>
                <Input
                  id="utms"
                  value={formData.utms}
                  onChange={(e) => setFormData({ ...formData, utms: e.target.value })}
                  placeholder="utm_source=google&utm_campaign=promo"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Anotações sobre o lead..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <LeadTagManager
              leadId={lead.id}
              currentTags={formData.tags}
              onUpdateTags={(tags) => setFormData({ ...formData, tags })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <div className="flex space-x-2">
              {!isArchived && onMarkWon && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMarkWon}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marcar como Ganho
                </Button>
              )}
              {!isArchived && onMarkLost && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMarkLost}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Marcar como Perdido
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};