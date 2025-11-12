# CRM System - Backend API

Backend PHP para o sistema CRM desenvolvido em React.

## 📋 Requisitos

- PHP 7.4 ou superior
- MySQL 5.7 ou superior
- Apache com mod_rewrite habilitado
- Extensões PHP: PDO, PDO_MySQL, cURL, JSON

## 🚀 Instalação

### 1. Configurar Banco de Dados

```sql
-- Criar banco de dados
CREATE DATABASE crm_system;

-- Importar estrutura
mysql -u root -p crm_system < database/schema.sql
```

### 2. Configurar Conexão

Edite o arquivo `config/database.php` com suas credenciais:

```php
private $host = 'localhost';
private $db_name = 'crm_system';
private $username = 'seu_usuario';
private $password = 'sua_senha';
```

### 3. Configurar Apache

Copie os arquivos para seu servidor web e certifique-se que o `.htaccess` está funcionando.

### 4. Configurar JWT

Altere a chave secreta JWT em `config/database.php`:

```php
define('JWT_SECRET', 'sua_chave_secreta_muito_forte_aqui');
```

## 📡 Endpoints da API

### Autenticação

#### POST /api/auth (Login)
```json
{
  "email": "admin@crm.com",
  "password": "password"
}
```

#### GET /api/auth (Dados do usuário)
Headers: `Authorization: Bearer {token}`

### Clientes (Admin apenas)

#### GET /api/clients
Lista todos os clientes

#### POST /api/clients
Criar novo cliente
```json
{
  "name": "Nome da Empresa",
  "email": "contato@empresa.com",
  "phone": "(11) 99999-9999"
}
```

#### PUT /api/clients
Atualizar cliente
```json
{
  "id": 1,
  "name": "Novo Nome",
  "email": "novo@email.com",
  "phone": "(11) 88888-8888"
}
```

#### DELETE /api/clients
Remover cliente
```json
{
  "id": 1
}
```

### Funis

#### GET /api/funnels?client_id=1
Lista funis do cliente

#### POST /api/funnels (Admin apenas)
Criar funil
```json
{
  "client_id": 1,
  "name": "Funil de Vendas",
  "description": "Descrição do funil",
  "stages": [
    {"name": "Novo Lead", "color": "#ef4444"},
    {"name": "Em Contato", "color": "#f97316"},
    {"name": "Proposta", "color": "#eab308"},
    {"name": "Fechamento", "color": "#22c55e"}
  ]
}
```

### Leads

#### GET /api/leads?client_id=1&funnel_id=1&status=active
Lista leads

#### GET /api/leads/{id}
Buscar lead específico

#### POST /api/leads
Criar lead
```json
{
  "client_id": 1,
  "funnel_id": 1,
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "(11) 99999-9999",
  "source": "Google Ads",
  "value": 5000.00,
  "notes": "Interessado no produto X"
}
```

#### PUT /api/leads/{id}
Atualizar lead
```json
{
  "name": "João Silva Santos",
  "email": "joao.santos@email.com",
  "status": "won"
}
```

#### PUT /api/leads/{id}/stage
Mover lead de estágio (Kanban)
```json
{
  "stage_id": 3
}
```

#### DELETE /api/leads/{id}
Remover lead

### Webhooks

#### GET /api/webhooks?client_id=1
Lista webhooks do cliente

#### POST /api/webhooks
Criar webhook
```json
{
  "client_id": 1,
  "funnel_id": 1,
  "url": "https://seusite.com/webhook",
  "events": ["stage_changed", "lead_won", "lead_lost"],
  "active": true
}
```

#### PUT /api/webhooks/{id}
Atualizar webhook

#### DELETE /api/webhooks/{id}
Remover webhook

#### POST /api/webhooks/{id}/test
Testar webhook

## 🔐 Autenticação

Todas as rotas (exceto login) requerem token JWT no header:

```
Authorization: Bearer {seu_token_jwt}
```

### Permissões:
- **Admin**: Acesso total ao sistema
- **Cliente**: Acesso apenas aos próprios dados

## 📊 Webhooks

Os webhooks são disparados automaticamente nos seguintes eventos:

- `lead_created`: Novo lead criado
- `lead_updated`: Lead atualizado
- `stage_changed`: Lead mudou de estágio
- `lead_won`: Lead marcado como ganho
- `lead_lost`: Lead marcado como perdido

### Payload do Webhook:
```json
{
  "evento": "stage_changed",
  "cliente_id": "1",
  "funil_id": "1",
  "lead_id": "123",
  "estagio_anterior": "Novo Lead",
  "estagio_atual": "Em Contato",
  "status": "active",
  "dados": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "(11) 99999-9999",
    "origem": "Google Ads",
    "valor": 5000.00,
    "observacoes": "Notas do lead"
  },
  "timestamp": "2024-11-04T10:30:00+00:00"
}
```

## 🗃️ Estrutura do Banco

### Principais Tabelas:
- `users` - Usuários do sistema (admin/cliente)
- `clients` - Empresas clientes
- `funnels` - Funis de vendas
- `stages` - Estágios dos funis
- `leads` - Leads/prospects
- `webhooks` - Configurações de webhooks
- `webhook_logs` - Logs dos webhooks enviados

## 👥 Usuários Padrão

```
Admin:
- Email: admin@crm.com
- Senha: password

Cliente 1:
- Email: joao@empresa.com  
- Senha: password

Cliente 2:
- Email: maria@teste.com
- Senha: password
```

## 🔧 Configuração do Frontend

No frontend React, configure a URL da API:

```javascript
const API_BASE_URL = 'https://seudominio.com/backend/api';
```

## 📝 Logs

Os logs de webhooks são salvos na tabela `webhook_logs` para debugging.

## 🚨 Segurança

- Senhas são criptografadas com bcrypt
- Tokens JWT com expiração de 24h
- Validação de permissões em todas as rotas
- Proteção contra SQL injection com prepared statements
- CORS configurado para permitir requisições do frontend

## 🐛 Troubleshooting

### Erro de CORS
Verifique se o `.htaccess` está sendo carregado e se o mod_rewrite está habilitado.

### Erro de conexão com banco
Verifique as credenciais em `config/database.php`.

### Webhook não dispara
Verifique os logs na tabela `webhook_logs` e se a URL está acessível.

### Token JWT inválido
Verifique se a chave JWT_SECRET é a mesma em todos os ambientes.