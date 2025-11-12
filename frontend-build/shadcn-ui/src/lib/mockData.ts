export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'client';
  company?: string;
  status: 'active' | 'inactive';
  token?: string;
  subscriptionValue?: number;
}

export interface Lead {
  id: string;
  clientId: string;
  funnelId: string;
  stageId: string;
  name: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  origin?: string;
  gclid?: string;
  fbclid?: string;
  utms?: string;
  ip?: string;
  notes?: string;
  status: 'active' | 'won' | 'lost';
  tags?: string[];
  extraFields?: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface Funnel {
  id: string;
  name: string;
  clientId: string;
  stages: Stage[];
}

export interface Client {
  id: string;
  companyName: string;
  responsibleName: string;
  email: string;
  password: string;
  activity: string;
  status: 'active' | 'inactive';
  token: string;
  subscriptionValue: number;
  createdAt: string;
}

export interface Webhook {
  id: string;
  clientId: string;
  funnelId?: string;
  url: string;
  events: ('lead_created' | 'lead_updated' | 'stage_changed' | 'lead_won' | 'lead_lost')[];
  active: boolean;
  createdAt: string;
}

// Mock data - Dados iniciais
export const mockUsers: User[] = (() => {
  try {
    const stored = localStorage.getItem('crm_mock_users');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading users from localStorage:', error);
  }
  
  const defaultUsers = [
    {
      id: '1',
      name: 'Admin',
      email: 'admin@crm.com',
      password: 'admin123',
      role: 'admin' as const,
      status: 'active' as const
    },
    {
      id: '2',
      name: 'João Silva',
      email: 'joao@empresa.com',
      password: 'client123',
      role: 'client' as const,
      company: 'Empresa ABC',
      status: 'active' as const,
      token: 'abc123token',
      subscriptionValue: 299.90
    },
    {
      id: '3',
      name: 'Maria Santos',
      email: 'maria@loja.com',
      password: 'client123',
      role: 'client' as const,
      company: 'Loja XYZ',
      status: 'active' as const,
      token: 'xyz456token',
      subscriptionValue: 499.90
    }
  ];
  
  localStorage.setItem('crm_mock_users', JSON.stringify(defaultUsers));
  return defaultUsers;
})();

export const mockClients: Client[] = (() => {
  try {
    const stored = localStorage.getItem('crm_clients');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading clients from localStorage:', error);
  }
  
  const defaultClients = [
    {
      id: '2',
      companyName: 'Empresa ABC',
      responsibleName: 'João Silva',
      email: 'joao@empresa.com',
      password: 'client123',
      activity: 'E-commerce',
      status: 'active' as const,
      token: 'abc123token',
      subscriptionValue: 299.90,
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      companyName: 'Loja XYZ',
      responsibleName: 'Maria Santos',
      email: 'maria@loja.com',
      password: 'client123',
      activity: 'Varejo',
      status: 'active' as const,
      token: 'xyz456token',
      subscriptionValue: 499.90,
      createdAt: '2024-02-10'
    }
  ];
  
  localStorage.setItem('crm_clients', JSON.stringify(defaultClients));
  return defaultClients;
})();

export const mockStages: Stage[] = [
  { id: '1', name: 'Novo Lead', color: 'bg-blue-500', order: 1 },
  { id: '2', name: 'Em Contato', color: 'bg-yellow-500', order: 2 },
  { id: '3', name: 'Negociação', color: 'bg-orange-500', order: 3 },
  { id: '4', name: 'Fechamento', color: 'bg-green-500', order: 4 }
];

// Inicializar funis padrão para clientes existentes
export const mockFunnels: Funnel[] = (() => {
  try {
    const stored = localStorage.getItem('crm_funnels');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading funnels from localStorage:', error);
  }
  
  const defaultFunnels = [
    {
      id: 'funnel_default_2',
      name: 'Funil Principal',
      clientId: '2',
      stages: mockStages
    },
    {
      id: 'funnel_default_3',
      name: 'Funil Principal',
      clientId: '3',
      stages: mockStages
    }
  ];
  
  localStorage.setItem('crm_funnels', JSON.stringify(defaultFunnels));
  return defaultFunnels;
})();

// Atualizar leads de exemplo para usar os funis padrão
export const mockLeads: Lead[] = (() => {
  try {
    const stored = localStorage.getItem('crm_leads');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading leads from localStorage:', error);
  }
  
  const defaultLeads = [
    {
      id: '1',
      clientId: '2',
      funnelId: 'funnel_default_2',
      stageId: '1',
      name: 'Carlos Oliveira',
      phone: '(11) 99999-1111',
      email: 'carlos@email.com',
      origin: 'Google Ads',
      status: 'active' as const,
      tags: ['VIP', 'Urgente'],
      createdAt: '2024-11-01T10:00:00Z',
      updatedAt: '2024-11-01T10:00:00Z'
    },
    {
      id: '2',
      clientId: '2',
      funnelId: 'funnel_default_2',
      stageId: '2',
      name: 'Ana Costa',
      phone: '(11) 99999-2222',
      email: 'ana@email.com',
      origin: 'Facebook',
      status: 'active' as const,
      tags: ['Interessado'],
      notes: 'Interessada no plano premium',
      createdAt: '2024-10-30T14:30:00Z',
      updatedAt: '2024-11-01T09:15:00Z'
    },
    {
      id: '3',
      clientId: '2',
      funnelId: 'funnel_default_2',
      stageId: '3',
      name: 'Pedro Santos',
      phone: '(11) 99999-3333',
      email: 'pedro@email.com',
      origin: 'Site',
      status: 'active' as const,
      tags: [],
      createdAt: '2024-10-28T16:45:00Z',
      updatedAt: '2024-10-31T11:20:00Z'
    },
    {
      id: '4',
      clientId: '2',
      funnelId: 'funnel_default_2',
      stageId: '4',
      name: 'Lucia Ferreira',
      phone: '(11) 99999-4444',
      email: 'lucia@email.com',
      origin: 'Indicação',
      status: 'won' as const,
      tags: ['Cliente'],
      notes: 'Cliente fechado - plano anual',
      createdAt: '2024-10-25T08:00:00Z',
      updatedAt: '2024-10-30T17:30:00Z'
    },
    {
      id: '5',
      clientId: '3',
      funnelId: 'funnel_default_3',
      stageId: '1',
      name: 'Roberto Lima',
      phone: '(11) 99999-5555',
      email: 'roberto@email.com',
      origin: 'WhatsApp',
      status: 'active' as const,
      tags: [],
      createdAt: '2024-11-01T12:00:00Z',
      updatedAt: '2024-11-01T12:00:00Z'
    }
  ];
  
  localStorage.setItem('crm_leads', JSON.stringify(defaultLeads));
  return defaultLeads;
})();

export const mockWebhooks: Webhook[] = [
  {
    id: '1',
    clientId: '2',
    funnelId: 'funnel_default_2',
    url: 'https://empresa-abc.com/webhook/leads',
    events: ['stage_changed', 'lead_won', 'lead_lost'],
    active: true,
    createdAt: '2024-01-20'
  }
];