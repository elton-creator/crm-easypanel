import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Lead, Funnel } from '@/lib/mockData';
import { IMaskInput } from 'react-imask';

interface Origin {
  id: string;
  clientId: string;
  name: string;
  color: string;
}

interface LeadManagerProps {
  onLeadCreated: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export default function LeadManager({ onLeadCreated }: LeadManagerProps) {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    whatsapp: '',
    address: '',
    city: '',
    state: '',
    country: 'Brasil',
    origin: '',
    gclid: '',
    fbclid: '',
    utms: '',
    ip: '',
    notes: '',
    tags: '',
  });

  useEffect(() => {
    loadFunnels();
    loadOrigins();
  }, [user?.id]);

  const loadFunnels = () => {
    try {
      const stored = localStorage.getItem('crm_funnels');
      if (stored) {
        const allFunnels = JSON.parse(stored);
        const userFunnels = allFunnels.filter((f: Funnel) => f.clientId === user?.id);
        setFunnels(userFunnels);
        
        if (userFunnels.length > 0) {
          setSelectedFunnel(userFunnels[0].id);
          setSelectedStage(userFunnels[0].stages[0]?.id || '');
        }
      }
    } catch (error) {
      console.error('Error loading funnels:', error);
    }
  };

  const loadOrigins = () => {
    try {
      const stored = localStorage.getItem('crm_origins');
      if (stored) {
        const allOrigins = JSON.parse(stored);
        const userOrigins = allOrigins.filter((o: Origin) => o.clientId === user?.id);
        setOrigins(userOrigins);
      }
    } catch (error) {
      console.error('Error loading origins:', error);
    }
  };

  const handleFunnelChange = (funnelId: string) => {
    setSelectedFunnel(funnelId);
    const funnel = funnels.find(f => f.id === funnelId);
    if (funnel && funnel.stages.length > 0) {
      setSelectedStage(funnel.stages[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFunnel || !selectedStage) {
      alert('Selecione um funil e uma etapa');
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Nome e telefone são obrigatórios');
      return;
    }

    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const newLead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> = {
      clientId: user?.id || '',
      funnelId: selectedFunnel,
      stageId: selectedStage,
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
      status: 'active',
      tags: tags.length > 0 ? tags : undefined,
    };

    onLeadCreated(newLead);
    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      name: '',
      phone: '',
      email: '',
      whatsapp: '',
      address: '',
      city: '',
      state: '',
      country: 'Brasil',
      origin: '',
      gclid: '',
      fbclid: '',
      utms: '',
      ip: '',
      notes: '',
      tags: '',
    });
  };

  const selectedFunnelData = funnels.find(f => f.id === selectedFunnel);

  if (funnels.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ Você precisa criar pelo menos um funil antes de adicionar leads.
        </p>
        <p className="text-sm text-yellow-700 mt-1">
          Vá para a aba "Meus Funis" e crie seu primeiro funil.
        </p>
      </div>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção de Funil e Etapa */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="funnel">Funil *</Label>
              <Select value={selectedFunnel} onValueChange={handleFunnelChange}>
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
              <Label htmlFor="stage">Etapa Inicial *</Label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {selectedFunnelData?.stages.map((stage) => (
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
                  required
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
                  required
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
                <Select value={formData.origin} onValueChange={(value) => setFormData({ ...formData, origin: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {origins.map((origin) => (
                      <SelectItem key={origin.id} value={origin.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: origin.color }}
                          />
                          {origin.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          {/* Observações e Tags */}
          <div className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="VIP, Urgente, Interessado"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}