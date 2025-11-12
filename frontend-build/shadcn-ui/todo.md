# CRM Multi-usuário - MVP Todo List

## Arquivos a serem criados:

### 1. Componentes principais
- `src/components/Layout.tsx` - Layout principal com navegação
- `src/components/KanbanBoard.tsx` - Quadro Kanban com drag & drop
- `src/components/LeadCard.tsx` - Card individual do lead
- `src/components/LeadModal.tsx` - Modal para editar/visualizar lead
- `src/components/ClientManagement.tsx` - Gestão de clientes (admin)

### 2. Páginas
- `src/pages/Dashboard.tsx` - Dashboard principal
- `src/pages/Login.tsx` - Página de login
- `src/pages/AdminPanel.tsx` - Painel administrativo

### 3. Contextos e hooks
- `src/contexts/AuthContext.tsx` - Contexto de autenticação
- `src/hooks/useLeads.tsx` - Hook para gerenciar leads
- `src/lib/mockData.ts` - Dados mockados para demonstração

## Funcionalidades MVP:
1. ✅ Sistema de login (Admin/Cliente)
2. ✅ Dashboard com funis Kanban
3. ✅ Drag & drop de leads entre estágios
4. ✅ Modal de edição de leads
5. ✅ Gestão de clientes (admin)
6. ✅ Formulário de integração WordPress
7. ✅ Leads arquivados (ganho/perdido)
8. ✅ Filtros e busca

## Limitações do MVP:
- Dados em localStorage (não MySQL)
- Sem webhooks reais
- Sem API REST funcional (apenas demonstração)
- Autenticação simulada