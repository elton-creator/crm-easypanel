import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Origin {
  id: string;
  clientId: string;
  name: string;
  color: string;
  isDefault: boolean;
}

export default function OriginManager() {
  const { user } = useAuth();
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#3b82f6' });

  useEffect(() => {
    loadOrigins();
  }, [user?.id]);

  const loadOrigins = () => {
    try {
      const stored = localStorage.getItem('crm_origins');
      if (stored) {
        const allOrigins = JSON.parse(stored);
        const userOrigins = allOrigins.filter((o: Origin) => o.clientId === user?.id);
        setOrigins(userOrigins);
      } else {
        // Criar origens padrão na primeira vez
        createDefaultOrigins();
      }
    } catch (error) {
      console.error('Error loading origins:', error);
    }
  };

  const createDefaultOrigins = () => {
    const defaultOrigins: Origin[] = [
      {
        id: `origin-${Date.now()}-1`,
        clientId: user?.id || '',
        name: 'Google Ads',
        color: '#4285f4',
        isDefault: true
      },
      {
        id: `origin-${Date.now()}-2`,
        clientId: user?.id || '',
        name: 'Meta Ads',
        color: '#1877f2',
        isDefault: true
      },
      {
        id: `origin-${Date.now()}-3`,
        clientId: user?.id || '',
        name: 'Indicação',
        color: '#10b981',
        isDefault: true
      },
      {
        id: `origin-${Date.now()}-4`,
        clientId: user?.id || '',
        name: 'Não Rastreado',
        color: '#6b7280',
        isDefault: true
      },
      {
        id: `origin-${Date.now()}-5`,
        clientId: user?.id || '',
        name: 'Outras Origens',
        color: '#8b5cf6',
        isDefault: true
      }
    ];

    const stored = localStorage.getItem('crm_origins');
    const allOrigins = stored ? JSON.parse(stored) : [];
    const updated = [...allOrigins, ...defaultOrigins];
    localStorage.setItem('crm_origins', JSON.stringify(updated));
    setOrigins(defaultOrigins);
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      alert('Nome da origem é obrigatório');
      return;
    }

    const newOrigin: Origin = {
      id: `origin-${Date.now()}`,
      clientId: user?.id || '',
      name: formData.name,
      color: formData.color,
      isDefault: false
    };

    const stored = localStorage.getItem('crm_origins');
    const allOrigins = stored ? JSON.parse(stored) : [];
    const updated = [...allOrigins, newOrigin];
    localStorage.setItem('crm_origins', JSON.stringify(updated));

    setOrigins([...origins, newOrigin]);
    setFormData({ name: '', color: '#3b82f6' });
  };

  const handleEdit = (origin: Origin) => {
    setEditingId(origin.id);
    setFormData({ name: origin.name, color: origin.color });
  };

  const handleUpdate = () => {
    if (!formData.name.trim()) {
      alert('Nome da origem é obrigatório');
      return;
    }

    const stored = localStorage.getItem('crm_origins');
    const allOrigins = stored ? JSON.parse(stored) : [];
    const updated = allOrigins.map((o: Origin) =>
      o.id === editingId
        ? { ...o, name: formData.name, color: formData.color }
        : o
    );
    localStorage.setItem('crm_origins', JSON.stringify(updated));

    setOrigins(origins.map(o =>
      o.id === editingId
        ? { ...o, name: formData.name, color: formData.color }
        : o
    ));

    setEditingId(null);
    setFormData({ name: '', color: '#3b82f6' });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta origem?')) return;

    const stored = localStorage.getItem('crm_origins');
    const allOrigins = stored ? JSON.parse(stored) : [];
    const updated = allOrigins.filter((o: Origin) => o.id !== id);
    localStorage.setItem('crm_origins', JSON.stringify(updated));

    setOrigins(origins.filter(o => o.id !== id));
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', color: '#3b82f6' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Origens de Leads</CardTitle>
          <p className="text-sm text-gray-500">
            Configure as origens de onde seus leads podem vir. Estas opções aparecerão no cadastro de leads.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulário de Criação/Edição */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-4">
              {editingId ? 'Editar Origem' : 'Nova Origem'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="name">Nome da Origem *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Instagram, WhatsApp, Site..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <div
                    className="flex-1 h-10 rounded-md border"
                    style={{ backgroundColor: formData.color }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {editingId ? (
                <>
                  <Button onClick={handleUpdate}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Origem
                </Button>
              )}
            </div>
          </div>

          {/* Lista de Origens */}
          <div>
            <h3 className="font-medium mb-4">Origens Cadastradas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {origins.map((origin) => (
                <Card key={origin.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: origin.color }}
                        />
                        <span className="font-medium">{origin.name}</span>
                      </div>
                      {origin.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Padrão
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(origin)}
                        className="flex-1"
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      {!origin.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(origin.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {origins.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma origem cadastrada ainda.</p>
                <p className="text-sm mt-1">Clique em "Adicionar Origem" para começar.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}