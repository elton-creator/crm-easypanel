import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { mockClients, Client, Funnel, Stage } from '@/lib/mockData';
import { Plus, Edit, Trash2, Key, DollarSign } from 'lucide-react';

const STORAGE_KEY = 'crm_clients';
const FUNNELS_STORAGE_KEY = 'crm_funnels';

const defaultStages: Stage[] = [
  { id: '1', name: 'Novo Lead', color: 'bg-blue-500', order: 1 },
  { id: '2', name: 'Em Contato', color: 'bg-yellow-500', order: 2 },
  { id: '3', name: 'Negociação', color: 'bg-orange-500', order: 3 },
  { id: '4', name: 'Fechamento', color: 'bg-green-500', order: 4 },
];

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return mockClients;
      }
    }
    return mockClients;
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    responsibleName: '',
    email: '',
    password: '',
    activity: '',
    status: 'active' as 'active' | 'inactive',
    subscriptionValue: 0
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    
    const mockUsers = clients.map(client => ({
      id: client.id,
      name: client.responsibleName,
      email: client.email,
      password: client.password,
      role: 'client' as const,
      company: client.companyName,
      status: client.status,
      token: client.token,
      subscriptionValue: client.subscriptionValue
    }));
    localStorage.setItem('crm_mock_users', JSON.stringify([
      {
        id: '1',
        name: 'Admin',
        email: 'admin@crm.com',
        password: 'admin123',
        role: 'admin',
        status: 'active'
      },
      ...mockUsers
    ]));
  }, [clients]);

  const createDefaultFunnelForClient = (clientId: string) => {
    try {
      const stored = localStorage.getItem(FUNNELS_STORAGE_KEY);
      const allFunnels = stored ? JSON.parse(stored) : [];
      
      const defaultFunnel: Funnel = {
        id: `funnel_${Date.now()}`,
        name: 'Funil Principal',
        clientId: clientId,
        stages: defaultStages
      };
      
      const updatedFunnels = [...allFunnels, defaultFunnel];
      localStorage.setItem(FUNNELS_STORAGE_KEY, JSON.stringify(updatedFunnels));
    } catch (error) {
      console.error('Error creating default funnel:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingClient) {
      const updatedClients = clients.map(c => 
        c.id === editingClient.id 
          ? {
              ...c,
              companyName: formData.companyName,
              responsibleName: formData.responsibleName,
              email: formData.email,
              password: formData.password || c.password,
              activity: formData.activity,
              status: formData.status,
              subscriptionValue: formData.subscriptionValue
            }
          : c
      );
      setClients(updatedClients);
    } else {
      const newClient: Client = {
        id: String(Date.now()),
        companyName: formData.companyName,
        responsibleName: formData.responsibleName,
        email: formData.email,
        password: formData.password,
        activity: formData.activity,
        status: formData.status,
        token: `token_${Date.now()}`,
        subscriptionValue: formData.subscriptionValue,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setClients([...clients, newClient]);
      
      // Criar funil padrão para o novo cliente
      createDefaultFunnelForClient(newClient.id);
    }
    
    handleCloseDialog();
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      companyName: client.companyName,
      responsibleName: client.responsibleName,
      email: client.email,
      password: '',
      activity: client.activity,
      status: client.status,
      subscriptionValue: client.subscriptionValue
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      setClients(clients.filter(c => c.id !== id));
      
      // Remover funis do cliente
      try {
        const stored = localStorage.getItem(FUNNELS_STORAGE_KEY);
        if (stored) {
          const allFunnels = JSON.parse(stored);
          const updatedFunnels = allFunnels.filter((f: Funnel) => f.clientId !== id);
          localStorage.setItem(FUNNELS_STORAGE_KEY, JSON.stringify(updatedFunnels));
        }
      } catch (error) {
        console.error('Error deleting client funnels:', error);
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingClient(null);
    setFormData({
      companyName: '',
      responsibleName: '',
      email: '',
      password: '',
      activity: '',
      status: 'active',
      subscriptionValue: 0
    });
  };

  const toggleLoginStatus = (clientId: string) => {
    setClients(clients.map(c => {
      if (c.id === clientId) {
        const newStatus = c.status === 'active' ? 'inactive' : 'active';
        return { ...c, status: newStatus };
      }
      return c;
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Clientes</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingClient(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsibleName">Nome do Responsável *</Label>
                  <Input
                    id="responsibleName"
                    value={formData.responsibleName}
                    onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Senha {editingClient ? '(deixe em branco para manter)' : '*'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingClient}
                    placeholder={editingClient ? 'Digite para alterar' : 'Senha do cliente'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="activity">Atividade</Label>
                  <Input
                    id="activity"
                    value={formData.activity}
                    onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                    placeholder="Ex: E-commerce, Varejo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscriptionValue">Valor da Assinatura (R$) *</Label>
                  <Input
                    id="subscriptionValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.subscriptionValue}
                    onChange={(e) => setFormData({ ...formData, subscriptionValue: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status de Acesso</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="active">Ativo - Cliente pode fazer login</option>
                  <option value="inactive">Inativo - Acesso bloqueado</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingClient ? 'Salvar Alterações' : 'Criar Cliente'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{client.companyName}</CardTitle>
                  <p className="text-sm text-gray-500">{client.responsibleName}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(client)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(client.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> {client.email}</p>
                <p><strong>Atividade:</strong> {client.activity}</p>
                <p className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <strong>Assinatura:</strong> 
                  <span className="text-green-600 font-semibold">
                    R$ {client.subscriptionValue.toFixed(2)}
                  </span>
                </p>
                <p><strong>Token:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{client.token}</code></p>
                <p><strong>Criado em:</strong> {new Date(client.createdAt).toLocaleDateString('pt-BR')}</p>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Status de Acesso:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${client.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      {client.status === 'active' ? '✅ Ativo' : '🚫 Bloqueado'}
                    </span>
                    <Switch
                      checked={client.status === 'active'}
                      onCheckedChange={() => toggleLoginStatus(client.id)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}