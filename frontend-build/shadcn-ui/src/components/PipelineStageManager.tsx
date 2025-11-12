import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Plus, Trash2, GripVertical, Edit2, Save, X } from 'lucide-react';

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  position: number;
  is_system: boolean;
}

export const PipelineStageManager: React.FC = () => {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStage, setNewStage] = useState({ name: '', color: 'blue' });
  const [editStage, setEditStage] = useState({ name: '', color: '' });

  const colors = [
    { name: 'Cinza', value: 'gray' },
    { name: 'Azul', value: 'blue' },
    { name: 'Verde', value: 'green' },
    { name: 'Amarelo', value: 'yellow' },
    { name: 'Laranja', value: 'orange' },
    { name: 'Vermelho', value: 'red' },
    { name: 'Roxo', value: 'purple' },
    { name: 'Rosa', value: 'pink' },
  ];

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = () => {
    // Mock data - substituir por chamada à API
    const mockStages: PipelineStage[] = [
      { id: '1', name: 'Novo', color: 'gray', position: 1, is_system: true },
      { id: '2', name: 'Contato', color: 'blue', position: 2, is_system: true },
      { id: '3', name: 'Qualificado', color: 'yellow', position: 3, is_system: true },
      { id: '4', name: 'Proposta', color: 'orange', position: 4, is_system: true },
      { id: '5', name: 'Negociação', color: 'purple', position: 5, is_system: true },
    ];
    setStages(mockStages);
  };

  const handleAddStage = () => {
    if (!newStage.name.trim()) return;
    
    const newStageObj: PipelineStage = {
      id: Date.now().toString(),
      name: newStage.name,
      color: newStage.color,
      position: stages.length + 1,
      is_system: false,
    };
    
    setStages([...stages, newStageObj]);
    setNewStage({ name: '', color: 'blue' });
    setIsAdding(false);
    
    // TODO: Chamar API para criar estágio
    // await api.post('/api/pipeline-stages', newStageObj);
  };

  const handleEditStage = (stage: PipelineStage) => {
    setEditingId(stage.id);
    setEditStage({ name: stage.name, color: stage.color });
  };

  const handleSaveEdit = (id: string) => {
    setStages(stages.map(s => 
      s.id === id ? { ...s, name: editStage.name, color: editStage.color } : s
    ));
    setEditingId(null);
    
    // TODO: Chamar API para atualizar estágio
    // await api.put(`/api/pipeline-stages/${id}`, editStage);
  };

  const handleDeleteStage = (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este estágio?')) {
      setStages(stages.filter(s => s.id !== id));
      
      // TODO: Chamar API para deletar estágio
      // await api.delete(`/api/pipeline-stages/${id}`);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/html'));
    
    if (dragIndex === dropIndex) return;
    
    const newStages = [...stages];
    const [removed] = newStages.splice(dragIndex, 1);
    newStages.splice(dropIndex, 0, removed);
    
    // Atualizar posições
    const updatedStages = newStages.map((stage, index) => ({
      ...stage,
      position: index + 1,
    }));
    
    setStages(updatedStages);
    
    // TODO: Chamar API para reordenar estágios
    // await api.post('/api/pipeline-stages/reorder', { stages: updatedStages });
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-800 border-gray-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      orange: 'bg-orange-100 text-orange-800 border-orange-300',
      red: 'bg-red-100 text-red-800 border-red-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      pink: 'bg-pink-100 text-pink-800 border-pink-300',
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Gerenciar Estágios do Funil</CardTitle>
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Estágio
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              draggable={!stage.is_system}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`flex items-center gap-3 p-3 border rounded-lg ${
                stage.is_system ? 'bg-gray-50' : 'bg-white cursor-move hover:shadow-md transition-shadow'
              }`}
            >
              {!stage.is_system && (
                <GripVertical className="w-5 h-5 text-gray-400" />
              )}
              
              {editingId === stage.id ? (
                <>
                  <Input
                    value={editStage.name}
                    onChange={(e) => setEditStage({ ...editStage, name: e.target.value })}
                    className="flex-1"
                  />
                  <select
                    value={editStage.color}
                    onChange={(e) => setEditStage({ ...editStage, color: e.target.value })}
                    className="border rounded px-2 py-1"
                  >
                    {colors.map(c => (
                      <option key={c.value} value={c.value}>{c.name}</option>
                    ))}
                  </select>
                  <Button onClick={() => handleSaveEdit(stage.id)} size="sm" variant="ghost">
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => setEditingId(null)} size="sm" variant="ghost">
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getColorClass(stage.color)}`}>
                    {stage.name}
                  </div>
                  <span className="text-sm text-gray-500">Posição: {stage.position}</span>
                  {stage.is_system && (
                    <span className="text-xs text-gray-400 ml-auto">(Estágio do Sistema)</span>
                  )}
                  {!stage.is_system && (
                    <div className="ml-auto flex gap-2">
                      <Button onClick={() => handleEditStage(stage)} size="sm" variant="ghost">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => handleDeleteStage(stage.id)} size="sm" variant="ghost">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          
          {isAdding && (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-blue-50">
              <Input
                placeholder="Nome do estágio"
                value={newStage.name}
                onChange={(e) => setNewStage({ ...newStage, name: e.target.value })}
                className="flex-1"
              />
              <select
                value={newStage.color}
                onChange={(e) => setNewStage({ ...newStage, color: e.target.value })}
                className="border rounded px-2 py-1"
              >
                {colors.map(c => (
                  <option key={c.value} value={c.value}>{c.name}</option>
                ))}
              </select>
              <Button onClick={handleAddStage} size="sm">
                <Save className="w-4 h-4" />
              </Button>
              <Button onClick={() => setIsAdding(false)} size="sm" variant="ghost">
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">💡 Dicas:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Arraste e solte os estágios personalizados para reordenar</li>
            <li>• Estágios do sistema não podem ser deletados ou reordenados</li>
            <li>• Cada estágio pode ter uma cor diferente para melhor visualização</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};