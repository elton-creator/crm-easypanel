import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ClientManagement } from '@/components/ClientManagement';
import { WebhookManagement } from '@/components/WebhookManagement';
import SystemSettings from '@/components/admin/SystemSettings';
import FunnelManager from '@/components/client/FunnelManager';
import LeadManager from '@/components/client/LeadManager';
import OriginManager from '@/components/client/OriginManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  Target, 
  DollarSign,
  Building2,
  Kanban,
  Code,
  Webhook,
  UserCheck,
  UserX,
  Settings,
  GitBranch,
  MapPin
} from 'lucide-react';
import { Funnel } from '@/lib/mockData';

interface ClientData {
  id: string;
  status: 'active' | 'inactive';
  subscriptionValue: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>('');
  const [funnels, setFunnels] = useState<Funnel[]>([]);

  const {
    leads,
    archivedLeads,
    showArchived,
    setShowArchived,
    addLead,
    updateLead,
    deleteLead,
    moveLeadToStage,
    markLeadStatus
  } = useLeads(user?.role === 'client' ? user.id : undefined);

  useEffect(() => {
    if (user?.role === 'client') {
      loadFunnels();
    }
  }, [user?.id]);

  const loadFunnels = () => {
    try {
      const stored = localStorage.getItem('crm_funnels');
      if (stored) {
        const allFunnels = JSON.parse(stored);
        const userFunnels = allFunnels.filter((f: Funnel) => f.clientId === user?.id);
        setFunnels(userFunnels);
        
        if (userFunnels.length > 0 && !selectedFunnelId) {
          setSelectedFunnelId(userFunnels[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading funnels:', error);
    }
  };

  // Atualizar funis quando houver mudanças
  useEffect(() => {
    const handleStorageChange = () => {
      loadFunnels();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filtrar leads pelo funil selecionado
  const filteredLeads = selectedFunnelId 
    ? leads.filter(lead => lead.funnelId === selectedFunnelId)
    : leads;

  const filteredArchivedLeads = selectedFunnelId
    ? archivedLeads.filter(lead => lead.funnelId === selectedFunnelId)
    : archivedLeads;

  const selectedFunnel = funnels.find(f => f.id === selectedFunnelId);

  // Estatísticas para clientes
  const clientStats = {
    totalLeads: filteredLeads.length,
    wonLeads: filteredArchivedLeads.filter(lead => lead.status === 'won').length,
    lostLeads: filteredArchivedLeads.filter(lead => lead.status === 'lost').length,
    conversionRate: filteredLeads.length > 0 ? Math.round((filteredArchivedLeads.filter(lead => lead.status === 'won').length / (filteredLeads.length + filteredArchivedLeads.length)) * 100) : 0
  };

  // Estatísticas para admin
  const getAdminStats = () => {
    try {
      const storedClients = localStorage.getItem('crm_clients');
      if (!storedClients) return { total: 0, active: 0, inactive: 0, totalRevenue: 0 };
      
      const clients: ClientData[] = JSON.parse(storedClients);
      const active = clients.filter((c: ClientData) => c.status === 'active');
      const inactive = clients.filter((c: ClientData) => c.status === 'inactive');
      const totalRevenue = active.reduce((sum: number, c: ClientData) => sum + (c.subscriptionValue || 0), 0);
      
      return {
        total: clients.length,
        active: active.length,
        inactive: inactive.length,
        totalRevenue
      };
    } catch {
      return { total: 0, active: 0, inactive: 0, totalRevenue: 0 };
    }
  };

  const adminStats = getAdminStats();

  const renderAdminStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{adminStats.total}</div>
          <p className="text-xs text-muted-foreground">
            Clientes cadastrados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{adminStats.active}</div>
          <p className="text-xs text-muted-foreground">
            Com acesso habilitado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes Inativos</CardTitle>
          <UserX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{adminStats.inactive}</div>
          <p className="text-xs text-muted-foreground">
            Com acesso bloqueado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            R$ {adminStats.totalRevenue.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Soma das assinaturas ativas
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderClientStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leads Ativos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clientStats.totalLeads}</div>
          <p className="text-xs text-muted-foreground">
            Em andamento no funil
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leads Ganhos</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{clientStats.wonLeads}</div>
          <p className="text-xs text-muted-foreground">
            Convertidos com sucesso
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clientStats.conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            Leads ganhos / total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leads Perdidos</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{clientStats.lostLeads}</div>
          <p className="text-xs text-muted-foreground">
            Não convertidos
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderIntegrationTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>API de Integração</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Endpoint para Captura de Leads</h3>
            <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
              POST https://seudominio.com/api/leads
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Exemplo de Payload JSON</h3>
            <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
{`{
  "token_validacao": "${user?.token || 'seu_token_aqui'}",
  "cliente_id": "${user?.id || 'id_do_cliente'}",
  "funil_id": "1",
  "nome": "João da Silva",
  "telefone": "(11) 99999-8888",
  "email": "joao@email.com",
  "origem": "Formulário WordPress",
  "gclid": "EAIaIQob...",
  "utms": "utm_source=google&utm_campaign=promo",
  "campos_extra": {"interesse":"Plano Premium"}
}`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium mb-2">Formulário HTML de Exemplo</h3>
            <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
{`<form method="POST" action="https://seudominio.com/api/leads">
  <input type="hidden" name="cliente_id" value="${user?.id || 'id_do_cliente'}">
  <input type="hidden" name="funil_id" value="1">
  <input type="hidden" name="token_validacao" value="${user?.token || 'seu_token'}">
  
  <input type="text" name="nome" placeholder="Nome" required>
  <input type="text" name="telefone" placeholder="Telefone" required>
  <input type="email" name="email" placeholder="E-mail">
  <button type="submit">Enviar</button>
</form>`}
            </pre>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Instruções:</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Use seu token de validação para autenticar as requisições</li>
              <li>• O cliente_id identifica sua conta no sistema</li>
              <li>• O funil_id determina em qual funil o lead será inserido</li>
              <li>• Campos nome e telefone são obrigatórios</li>
              <li>• Outros campos são opcionais mas recomendados</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (user?.role === 'admin') {
    return (
      <div className="space-y-6">
        {renderAdminStats()}

        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clients" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Gestão de Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            <ClientManagement />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderClientStats()}

      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban" className="flex items-center space-x-2">
            <Kanban className="h-4 w-4" />
            <span>Meus Leads</span>
          </TabsTrigger>
          <TabsTrigger value="funnels" className="flex items-center space-x-2">
            <GitBranch className="h-4 w-4" />
            <span>Meus Funis</span>
          </TabsTrigger>
          <TabsTrigger value="origins" className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Origens</span>
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center space-x-2">
            <Webhook className="h-4 w-4" />
            <span>Webhooks</span>
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex items-center space-x-2">
            <Code className="h-4 w-4" />
            <span>Integração</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-600">
                  Gerencie seus leads no funil de vendas
                </h3>
                <p className="text-sm text-gray-500">
                  Arraste e solte os leads entre os estágios para atualizar o status
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {funnels.length > 0 && (
                <select
                  value={selectedFunnelId}
                  onChange={(e) => setSelectedFunnelId(e.target.value)}
                  className="px-4 py-2 border rounded-md text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {funnels.map((funnel) => (
                    <option key={funnel.id} value={funnel.id}>
                      📊 {funnel.name}
                    </option>
                  ))}
                </select>
              )}
              <LeadManager onLeadCreated={addLead} />
            </div>
          </div>
          
          {funnels.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
              <p className="text-lg text-yellow-800 mb-2">
                ⚠️ Você ainda não tem nenhum funil criado
              </p>
              <p className="text-sm text-yellow-700">
                Vá para a aba "Meus Funis" e crie seu primeiro funil para começar a gerenciar leads.
              </p>
            </div>
          ) : (
            <KanbanBoard
              leads={filteredLeads}
              archivedLeads={filteredArchivedLeads}
              showArchived={showArchived}
              onShowArchivedChange={setShowArchived}
              onUpdateLead={updateLead}
              onDeleteLead={deleteLead}
              onMoveLeadToStage={moveLeadToStage}
              onMarkWon={(leadId) => markLeadStatus(leadId, 'won')}
              onMarkLost={(leadId) => markLeadStatus(leadId, 'lost')}
              selectedFunnel={selectedFunnel}
            />
          )}
        </TabsContent>

        <TabsContent value="funnels">
          <FunnelManager />
        </TabsContent>

        <TabsContent value="origins">
          <OriginManager />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhookManagement />
        </TabsContent>

        <TabsContent value="integration">
          {renderIntegrationTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}