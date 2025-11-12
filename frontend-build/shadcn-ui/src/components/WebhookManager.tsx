import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Plus, Trash2, Edit2, Save, X, Eye, TestTube, CheckCircle, XCircle } from 'lucide-react';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret_key?: string;
  created_at: string;
}

interface WebhookLog {
  id: string;
  event_type: string;
  response_status?: number;
  error_message?: string;
  created_at: string;
}

export const WebhookManager: React.FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingLogsId, setViewingLogsId] = useState<string | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });
  const [editWebhook, setEditWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });

  const availableEvents = [
    { value: 'stage_changed', label: 'Mudança de Estágio' },
    { value: 'lead_won', label: 'Lead Ganho' },
    { value: 'lead_lost', label: 'Lead Perdido' },
  ];

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = () => {
    // Mock data - substituir por chamada à API
    const mockWebhooks: Webhook[] = [];
    setWebhooks(mockWebhooks);
  };

  const loadLogs = (webhookId: string) => {
    // Mock data - substituir por chamada à API
    const mockLogs: WebhookLog[] = [];
    setLogs(mockLogs);
  };

  const handleAddWebhook = () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim() || newWebhook.events.length === 0) {
      alert('Preencha todos os campos e selecione pelo menos um evento');
      return;
    }
    
    const webhook: Webhook = {
      id: Date.now().toString(),
      name: newWebhook.name,
      url: newWebhook.url,
      events: newWebhook.events,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    
    setWebhooks([...webhooks, webhook]);
    setNewWebhook({ name: '', url: '', events: [] });
    setIsAdding(false);
    
    // TODO: Chamar API para criar webhook
    // const response = await api.post('/api/webhooks', webhook);
    // alert(`Webhook criado! Secret Key: ${response.data.secret_key}`);
  };

  const handleEditWebhook = (webhook: Webhook) => {
    setEditingId(webhook.id);
    setEditWebhook({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
    });
  };

  const handleSaveEdit = (id: string) => {
    setWebhooks(webhooks.map(w =>
      w.id === id ? { ...w, ...editWebhook } : w
    ));
    setEditingId(null);
    
    // TODO: Chamar API para atualizar webhook
    // await api.put(`/api/webhooks/${id}`, editWebhook);
  };

  const handleDeleteWebhook = (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este webhook?')) {
      setWebhooks(webhooks.filter(w => w.id !== id));
      
      // TODO: Chamar API para deletar webhook
      // await api.delete(`/api/webhooks/${id}`);
    }
  };

  const handleToggleActive = (id: string) => {
    setWebhooks(webhooks.map(w =>
      w.id === id ? { ...w, is_active: !w.is_active } : w
    ));
    
    // TODO: Chamar API para atualizar status
    // await api.put(`/api/webhooks/${id}`, { is_active: !webhook.is_active });
  };

  const handleTestWebhook = async (id: string) => {
    // TODO: Chamar API para testar webhook
    // const response = await api.post(`/api/webhooks/${id}/test`);
    // alert(response.data.message);
    alert('Webhook testado! Verifique os logs para ver o resultado.');
  };

  const handleViewLogs = (id: string) => {
    setViewingLogsId(id);
    loadLogs(id);
  };

  const toggleEvent = (events: string[], event: string, setEvents: (events: string[]) => void) => {
    if (events.includes(event)) {
      setEvents(events.filter(e => e !== event));
    } else {
      setEvents([...events, event]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gerenciar Webhooks</CardTitle>
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {webhooks.length === 0 && !isAdding && (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum webhook configurado</p>
                <p className="text-sm mt-2">Clique em "Adicionar Webhook" para começar</p>
              </div>
            )}
            
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="border rounded-lg p-4">
                {editingId === webhook.id ? (
                  <div className="space-y-3">
                    <Input
                      placeholder="Nome do webhook"
                      value={editWebhook.name}
                      onChange={(e) => setEditWebhook({ ...editWebhook, name: e.target.value })}
                    />
                    <Input
                      placeholder="URL do webhook"
                      value={editWebhook.url}
                      onChange={(e) => setEditWebhook({ ...editWebhook, url: e.target.value })}
                    />
                    <div>
                      <label className="block text-sm font-medium mb-2">Eventos:</label>
                      <div className="space-y-2">
                        {availableEvents.map(event => (
                          <label key={event.value} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editWebhook.events.includes(event.value)}
                              onChange={() => toggleEvent(
                                editWebhook.events,
                                event.value,
                                (events) => setEditWebhook({ ...editWebhook, events })
                              )}
                            />
                            <span className="text-sm">{event.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleSaveEdit(webhook.id)} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                      <Button onClick={() => setEditingId(null)} size="sm" variant="outline">
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium">{webhook.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{webhook.url}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          webhook.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {webhook.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {webhook.events.map(event => (
                        <span key={event} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {availableEvents.find(e => e.value === event)?.label}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={() => handleToggleActive(webhook.id)} size="sm" variant="outline">
                        {webhook.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button onClick={() => handleTestWebhook(webhook.id)} size="sm" variant="outline">
                        <TestTube className="w-4 h-4 mr-2" />
                        Testar
                      </Button>
                      <Button onClick={() => handleViewLogs(webhook.id)} size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Logs
                      </Button>
                      <Button onClick={() => handleEditWebhook(webhook)} size="sm" variant="outline">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => handleDeleteWebhook(webhook.id)} size="sm" variant="outline">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {isAdding && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-medium mb-3">Novo Webhook</h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Nome do webhook (ex: Notificar no Slack)"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  />
                  <Input
                    placeholder="URL do webhook (ex: https://hooks.slack.com/...)"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Eventos para disparar:</label>
                    <div className="space-y-2">
                      {availableEvents.map(event => (
                        <label key={event.value} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newWebhook.events.includes(event.value)}
                            onChange={() => toggleEvent(
                              newWebhook.events,
                              event.value,
                              (events) => setNewWebhook({ ...newWebhook, events })
                            )}
                          />
                          <span className="text-sm">{event.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddWebhook} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Criar Webhook
                    </Button>
                    <Button onClick={() => setIsAdding(false)} size="sm" variant="outline">
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">📡 Como funcionam os Webhooks:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Webhooks enviam notificações HTTP POST para a URL configurada</li>
              <li>• Cada webhook recebe uma chave secreta para validação (HMAC SHA256)</li>
              <li>• Você pode testar o webhook antes de ativá-lo</li>
              <li>• Todos os disparos são registrados nos logs para auditoria</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {viewingLogsId && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Logs do Webhook</CardTitle>
              <Button onClick={() => setViewingLogsId(null)} size="sm" variant="outline">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Nenhum log encontrado</p>
            ) : (
              <div className="space-y-2">
                {logs.map(log => (
                  <div key={log.id} className="border rounded p-3 text-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{log.event_type}</span>
                      <div className="flex items-center gap-2">
                        {log.response_status ? (
                          log.response_status >= 200 && log.response_status < 300 ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-gray-500">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    {log.response_status && (
                      <p className="text-gray-600">Status: {log.response_status}</p>
                    )}
                    {log.error_message && (
                      <p className="text-red-600">Erro: {log.error_message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};