import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeadSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const LeadSearchFilter: React.FC<LeadSearchFilterProps> = ({
  searchTerm,
  onSearchChange
}) => {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="text"
        placeholder="Buscar por nome, telefone ou e-mail..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
          onClick={() => onSearchChange('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};