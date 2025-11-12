import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface Funnel {
  id: string;
  name: string;
  clientId: string;
  stages: Stage[];
}

const STORAGE_KEY = 'crm_funnels';

const colorOptions = [
  { value: 'bg-blue-500', label: 'Azul' },
  { value: 'bg-yellow-500', label: 'Amarelo' },
  { value: 'bg-orange-500', label: 'Laranja' },
  { value: 'bg-green-500', label: 'Verde' },
  { value: 'bg-red-500', label: 'Vermelho' },
  { value: 'bg-purple-500', label: 'Roxo' },
  { value: 'bg-pink-500', label: 'Rosa' },
  { value: 'bg-indigo-500', label: 'Índigo' },
];

export default function FunnelManager() {
  const { user } = useAuth();
  const [funnels, setFunnels] = useState<Funnel[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const allFunnels = JSON.parse(stored);
        return allFunnels.filter((f: Funnel) => f.clientId === user?.id);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFunnel, setEditingFunnel] = useState<Funnel | null>(null);
  const [funnelName, setFunnelName] = useState('');
  const [stages, setStages] = useState<Stage[]>([
    { id: '1', name: 'Novo Lead', color: 'bg-blue-500', order: 1 },
    { id: '2', name: 'Em Contato', color: 'bg-yellow-500', order: 2 },
    { id: '3', name: 'Negociação', color: 'bg-orange-500', order: 3 },
    { id: '4', name: 'Fechamento', color: 'bg-green-500', order: 4 },
  ]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let allFunnels: Funnel[] = [];
    
    if (stored) {
      try {
        allFunnels = JSON.parse(stored);
      } catch {
        allFunnels = [];
      }
    }

    // Atualizar apenas os funis do cliente atual
    const otherFunnels = allFunnels.filter((f: Funnel) => f.clientId !== user?.id);
    const updatedFunnels = [...otherFunnels, ...funnels];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFunnels));
  }, [funnels, user?.id]);

  const handleAddStage = () => {
    const newStage: Stage = {
      id: String(Date.now()),
      name: `Etapa ${stages.length + 1}`,
      color: 'bg-gray-500',
      order: stages.length + 1,
    };
    setStages([...stages, newStage]);
  };

  const handleRemoveStage = (stageId: string) => {
    if (stages.length <= 2) {
      alert('O funil deve ter no mínimo 2 etapas');
      return;
    }
    setStages(stages.filter(s => s.id !== stageId));
  };

  const handleUpdateStage = (stageId: string, field: 'name' | 'color', value: string) => {
    setStages(stages.map(s => 
      s.id === stageId ? { ...s, [field]: value } : s
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!funnelName.trim()) {
      alert('Digite um nome para o funil');
      return;
    }

    if (stages.length < 2) {
      alert('O funil deve ter no mínimo 2 etapas');
      return;
    }

    if (editingFunnel) {
      setFunnels(funnels.map(f =>
        f.id === editingFunnel.id
          ? { ...f, name: funnelName, stages: stages.map((s, idx) => ({ ...s, order: idx + 1 })) }
          : f
      ));
    } else {
      const newFunnel: Funnel = {
        id: String(Date.now()),
        name: funnelName,
        clientId: user?.id || '',
        stages: stages.map((s, idx) => ({ ...s, order: idx + 1 })),
      };
      setFunnels([...funnels, newFunnel]);
    }

    handleCloseDialog();
  };

  const handleEdit = (funnel: Funnel) => {
    setEditingFunnel(funnel);
    setFunnelName(funnel.name);
    setStages(funnel.stages);
    setIsDialogOpen(true);
  };

  const handleDelete = (funnelId: string) => {
    if (confirm('Tem certeza que deseja excluir este funil?')) {
      setFunnels(funnels.filter(f => f.id !== funnelId));
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingFunnel(null);
    setFunnelName('');
    setStages([
      { id: '1', name: 'Novo Lead', color: 'bg-blue-500', order: 1 },
      { id: '2', name: 'Em Contato', color: 'bg-yellow-500', order: 2 },
      { id: '3', name: 'Negociação', color: 'bg-orange-500', order: 3 },
      { id: '4', name: 'Fechamento', color: 'bg-green-500', order: 4 },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Meus Funis de Vendas</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingFunnel(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Funil
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFunnel ? 'Editar Funil' : 'Criar Novo Funil'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="funnelName">Nome do Funil *</Label>
                <Input
                  id="funnelName"
                  value={funnelName}
                  onChange={(e) => setFunnelName(e.target.value)}
                  placeholder="Ex: Funil de Vendas Principal"
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Etapas do Funil</Label>
                  <Button type="button" size="sm" onClick={handleAddStage}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Etapa
                  </Button>
                </div>

                <div className="space-y-3">
                  {stages.map((stage, index) => (
                    <div key={stage.id} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          value={stage.name}
                          onChange={(e) => handleUpdateStage(stage.id, 'name', e.target.value)}
                          placeholder={`Etapa ${index + 1}`}
                        />
                        <select
                          value={stage.color}
                          onChange={(e) => handleUpdateStage(stage.id, 'color', e.target.value)}
                          className="px-3 py-2 border rounded-md"
                        >
                          {colorOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveStage(stage.id)}
                        disabled={stages.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  * O funil deve ter no mínimo 2 etapas
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingFunnel ? 'Salvar Alterações' : 'Criar Funil'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {funnels.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <p>Nenhum funil criado ainda.</p>
            <p className="text-sm mt-2">Clique em "Novo Funil" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {funnels.map((funnel) => (
            <Card key={funnel.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{funnel.name}</CardTitle>
                    <p className="text-sm text-gray-500">{funnel.stages.length} etapas</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(funnel)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(funnel.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {funnel.stages.map((stage) => (
                    <div
                      key={stage.id}
                      className={`px-3 py-1 rounded-full text-white text-sm ${stage.color}`}
                    >
                      {stage.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}