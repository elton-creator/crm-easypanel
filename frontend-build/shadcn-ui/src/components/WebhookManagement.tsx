import React, { useState, useEffect } from 'react';
import { Webhook, mockWebhooks, Funnel, mockFunnels } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Webhook as WebhookIcon, Trash2, Edit, TestTube } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const WebhookManagement: React.FC = () => {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    funnelId: 'all',
    events: [] as string[],
    active: true
  });

  useEffect(() => {
    // Carregar webhooks do localStorage ou usar mock data
    const storedWebhooks = localStorage.getItem('crm_webhooks');
    const allWebhooks = storedWebhooks ? JSON.parse(storedWebhooks) : mockWebhooks;
    
    // Filtrar webhooks do cliente atual
    const clientWebhooks = user?.role === 'admin' 
      ? allWebhooks 
      : allWebhooks.filter((webhook: Webhook) => webhook.clientId === user?.id);
    
    setWebhooks(clientWebhooks);

    // Carregar funis
    const storedFunnels = localStorage.getItem('crm_funnels');
    const allFunnels = storedFunnels ? JSON.parse(storedFunnels) : mockFunnels;
    
    const clientFunnels = user?.role === 'admin' 
      ? allFunnels 
      : allFunnels.filter((funnel: Funnel) => funnel.clientId === user?.id);
    
    setFunnels(clientFunnels);
  }, [user]);

  const handleAddWebhook = () => {
    const newWebhook: Webhook = {
      id: Date.now().toString(),
      clientId: user?.id || '',
      funnelId: formData.funnelId === 'all' ? undefined : formData.funnelId,
      url: formData.url,
      events: formData.events as ('lead_created' | 'lead_updated' | 'stage_changed' | 'lead_won' | 'lead_lost')[],
      active: formData.active,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    const allWebhooks = JSON.parse(localStorage.getItem('crm_webhooks') || JSON.stringify(mockWebhooks));
    const updatedWebhooks = [...allWebhooks, newWebhook];
    localStorage.setItem('crm_webhooks', JSON.stringify(updatedWebhooks));
    
    setWebhooks(prev => [...prev, newWebhook]);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditWebhook = () => {
    if (!selectedWebhook) return;
    
    const updatedWebhook = {
      ...selectedWebhook,
      url: formData.url,
      funnelId: formData.funnelId === 'all' ? undefined : formData.funnelId,
      events: formData.events as ('lead_created' | 'lead_updated' | 'stage_changed' | 'lead_won' | 'lead_lost')[],
      active: formData.active
    };
    
    const allWebhooks = JSON.parse(localStorage.getItem('crm_webhooks') || JSON.stringify(mockWebhooks));
    const updatedAllWebhooks = allWebhooks.map((webhook: Webhook) => 
      webhook.id === selectedWebhook.id ? updatedWebhook : webhook
    );
    localStorage.setItem('crm_webhooks', JSON.stringify(updatedAllWebhooks));
    
    setWebhooks(prev => prev.map(webhook => 
      webhook.id === selectedWebhook.id ? updatedWebhook : webhook
    ));
    
    resetForm();
    setIsEditDialogOpen(false);
    setSelectedWebhook(null);
  };

  const openEditDialog = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setFormData({
      url: webhook.url,
      funnelId: webhook.funnelId || 'all',
      events: webhook.events,
      active: webhook.active
    });
    setIsEditDialogOpen(true);
  };

  const deleteWebhook = (webhookId: string) => {
    if (confirm('Tem certeza que deseja excluir este webhook?')) {
      const allWebhooks = JSON.parse(localStorage.getItem('crm_webhooks') || JSON.stringify(mockWebhooks));
      const updatedAllWebhooks = allWebhooks.filter((webhook: Webhook) => webhook.id !== webhookId);
      localStorage.setItem('crm_webhooks', JSON.stringify(updatedAllWebhooks));
      
      setWebhooks(prev => prev.filter(webhook => webhook.id !== webhookId));
    }
  };

  const toggleWebhook = (webhookId: string, active: boolean) => {
    const allWebhooks = JSON.parse(localStorage.getItem('crm_webhooks') || JSON.stringify(mockWebhooks));
    const updatedAllWebhooks = allWebhooks.map((webhook: Webhook) => 
      webhook.id === webhookId ? { ...webhook, active } : webhook
    );
    localStorage.setItem('crm_webhooks', JSON.stringify(updatedAllWebhooks));
    
    setWebhooks(prev => prev.map(webhook => 
      webhook.id === webhookId ? { ...webhook, active } : webhook
    ));
  };

  const testWebhook = async (webhook: Webhook) => {
    const testPayload = {
      evento: 'test',
      cliente_id: webhook.clientId,
      funil_id: webhook.funnelId || '1',
      lead_id: 'test_lead_123',
      estagio_anterior: 'Novo Lead',
      estagio_atual: 'Em Contato',
      status: 'active',
      dados: {
        nome: 'Lead de Teste',
        telefone: '(11) 99999-9999',
        email: 'teste@email.com',
        origem: 'Teste Webhook'
      },
      timestamp: new Date().toISOString()
    };

    try {
      // Simular envio do webhook (em produção seria uma requisição real)
      console.log('Enviando webhook de teste para:', webhook.url);
      console.log('Payload:', testPayload);
      
      alert(`Webhook de teste enviado para: ${webhook.url}\n\nVerifique o console do navegador para ver o payload que seria enviado.`);
    } catch (error) {
      alert('Erro ao testar webhook: ' + error);
    }
  };

  const resetForm = () => {
    setFormData({
      url: '',
      funnelId: 'all',
      events: [],
      active: true
    });
  };

  const handleEventChange = (event: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      events: checked 
        ? [...prev.events, event]
        : prev.events.filter(e => e !== event)
    }));
  };

  const getFunnelName = (funnelId?: string) => {
    if (!funnelId) return 'Todos os funis';
    const funnel = funnels.find(f => f.id === funnelId);
    return funnel?.name || 'Funil não encontrado';
  };

  const eventLabels = {
    lead_created: 'Lead Criado',
    lead_updated: 'Lead Atualizado',
    stage_changed: 'Mudança de Estágio',
    lead_won: 'Lead Ganho',
    lead_lost: 'Lead Perdido'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhooks</h2>
          <p className="text-gray-600">Configure URLs para receber notificações automáticas</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Webhook
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <WebhookIcon className="h-5 w-5" />
            <span>Webhooks Configurados</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {webhooks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Funil</TableHead>
                  <TableHead>Eventos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-mono text-sm max-w-xs truncate">
                      {webhook.url}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getFunnelName(webhook.funnelId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {eventLabels[event]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={webhook.active}
                          onCheckedChange={(checked) => toggleWebhook(webhook.id, checked)}
                        />
                        <span className="text-sm">
                          {webhook.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(webhook.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testWebhook(webhook)}
                          title="Testar webhook"
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(webhook)}
                          title="Editar webhook"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteWebhook(webhook.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Excluir webhook"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <WebhookIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum webhook configurado</p>
              <p className="text-sm">Adicione um webhook para receber notificações automáticas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentação */}
      <Card>
        <CardHeader>
          <CardTitle>Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Eventos Disponíveis:</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              <li><strong>Lead Criado:</strong> Disparado quando um novo lead é capturado</li>
              <li><strong>Lead Atualizado:</strong> Disparado quando dados do lead são modificados</li>
              <li><strong>Mudança de Estágio:</strong> Disparado quando lead muda de estágio no funil</li>
              <li><strong>Lead Ganho:</strong> Disparado quando lead é marcado como ganho</li>
              <li><strong>Lead Perdido:</strong> Disparado quando lead é marcado como perdido</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Exemplo de Payload:</h4>
            <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
{`{
  "evento": "stage_changed",
  "cliente_id": "${user?.id || 'cliente_id'}",
  "funil_id": "1",
  "lead_id": "123",
  "estagio_anterior": "Novo Lead",
  "estagio_atual": "Em Contato",
  "status": "active",
  "dados": {
    "nome": "João Silva",
    "telefone": "(11) 99999-9999",
    "email": "joao@email.com",
    "origem": "Google Ads"
  },
  "timestamp": "2024-11-02T10:30:00Z"
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Add Webhook Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL do Webhook *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://seusite.com/webhook/leads"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="funnel">Funil (opcional)</Label>
              <Select value={formData.funnelId} onValueChange={(value) => setFormData(prev => ({ ...prev, funnelId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funil ou deixe vazio para todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funis</SelectItem>
                  {funnels.map((funnel) => (
                    <SelectItem key={funnel.id} value={funnel.id}>
                      {funnel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Eventos para Notificar *</Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(eventLabels).map(([event, label]) => (
                  <div key={event} className="flex items-center space-x-2">
                    <Checkbox
                      id={event}
                      checked={formData.events.includes(event)}
                      onCheckedChange={(checked) => handleEventChange(event, checked as boolean)}
                    />
                    <Label htmlFor={event} className="text-sm">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="active">Webhook ativo</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddWebhook}
                disabled={!formData.url || formData.events.length === 0}
              >
                Criar Webhook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Webhook Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editUrl">URL do Webhook *</Label>
              <Input
                id="editUrl"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://seusite.com/webhook/leads"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editFunnel">Funil (opcional)</Label>
              <Select value={formData.funnelId} onValueChange={(value) => setFormData(prev => ({ ...prev, funnelId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funil ou deixe vazio para todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funis</SelectItem>
                  {funnels.map((funnel) => (
                    <SelectItem key={funnel.id} value={funnel.id}>
                      {funnel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Eventos para Notificar *</Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(eventLabels).map(([event, label]) => (
                  <div key={event} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${event}`}
                      checked={formData.events.includes(event)}
                      onCheckedChange={(checked) => handleEventChange(event, checked as boolean)}
                    />
                    <Label htmlFor={`edit-${event}`} className="text-sm">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="editActive"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="editActive">Webhook ativo</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedWebhook(null);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleEditWebhook}
                disabled={!formData.url || formData.events.length === 0}
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};