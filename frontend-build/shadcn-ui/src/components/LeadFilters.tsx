import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

interface Origin {
  id: string;
  clientId: string;
  name: string;
  color: string;
}

interface LeadFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  searchTerm: string;
  origin: string;
  createdFrom: Date | undefined;
  createdTo: Date | undefined;
  updatedFrom: Date | undefined;
  updatedTo: Date | undefined;
}

export default function LeadFilters({ onFilterChange }: LeadFiltersProps) {
  const { user } = useAuth();
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    origin: 'all',
    createdFrom: undefined,
    createdTo: undefined,
    updatedFrom: undefined,
    updatedTo: undefined
  });

  useEffect(() => {
    loadOrigins();
  }, [user?.id]);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters]);

  const loadOrigins = () => {
    try {
      const stored = localStorage.getItem('crm_origins');
      console.log('Loading origins from localStorage:', stored);
      
      if (stored) {
        const allOrigins = JSON.parse(stored);
        console.log('All origins:', allOrigins);
        
        const userOrigins = allOrigins.filter((o: Origin) => o.clientId === user?.id);
        console.log('User origins for', user?.id, ':', userOrigins);
        
        setOrigins(userOrigins);
      } else {
        console.log('No origins found in localStorage');
        setOrigins([]);
      }
    } catch (error) {
      console.error('Error loading origins:', error);
      setOrigins([]);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      searchTerm: '',
      origin: 'all',
      createdFrom: undefined,
      createdTo: undefined,
      updatedFrom: undefined,
      updatedTo: undefined
    });
  };

  const hasActiveFilters = 
    filters.origin !== 'all' || 
    filters.createdFrom || 
    filters.createdTo || 
    filters.updatedFrom || 
    filters.updatedTo;

  return (
    <div className="space-y-4">
      {/* Busca por texto */}
      <div className="flex gap-2">
        <Input
          placeholder="Buscar por nome, telefone ou e-mail..."
          value={filters.searchTerm}
          onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
          className="flex-1"
        />
      </div>

      {/* Filtros Avançados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Filtro por Origem */}
        <div className="space-y-2">
          <Label>Origem</Label>
          <Select
            value={filters.origin}
            onValueChange={(value) => setFilters({ ...filters, origin: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as origens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as origens</SelectItem>
              {origins.length > 0 ? (
                origins.map((origin) => (
                  <SelectItem key={origin.id} value={origin.name}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: origin.color }}
                      />
                      {origin.name}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-origins" disabled>
                  Nenhuma origem cadastrada
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {origins.length === 0 && (
            <p className="text-xs text-amber-600">
              ⚠️ Cadastre origens na aba "Origens"
            </p>
          )}
        </div>

        {/* Data de Entrada - De */}
        <div className="space-y-2">
          <Label>Entrada De</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.createdFrom ? (
                  format(filters.createdFrom, 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span className="text-muted-foreground">Selecione</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.createdFrom}
                onSelect={(date) => setFilters({ ...filters, createdFrom: date })}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Data de Entrada - Até */}
        <div className="space-y-2">
          <Label>Entrada Até</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.createdTo ? (
                  format(filters.createdTo, 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span className="text-muted-foreground">Selecione</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.createdTo}
                onSelect={(date) => setFilters({ ...filters, createdTo: date })}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Data de Alteração - De */}
        <div className="space-y-2">
          <Label>Alteração De</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.updatedFrom ? (
                  format(filters.updatedFrom, 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span className="text-muted-foreground">Selecione</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.updatedFrom}
                onSelect={(date) => setFilters({ ...filters, updatedFrom: date })}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Data de Alteração - Até */}
        <div className="space-y-2">
          <Label>Alteração Até</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.updatedTo ? (
                  format(filters.updatedTo, 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span className="text-muted-foreground">Selecione</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.updatedTo}
                onSelect={(date) => setFilters({ ...filters, updatedTo: date })}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Botão Limpar Filtros */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
}