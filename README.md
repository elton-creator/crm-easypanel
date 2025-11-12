# 🚀 CRM System - Para EasyPanel

Sistema completo de gestão de leads com PostgreSQL, pronto para deploy no EasyPanel.

## 📋 O que está incluído

- ✅ **Backend Node.js** com API REST completa
- ✅ **Frontend React** com interface moderna
- ✅ **PostgreSQL** schema e migrations
- ✅ **Documentação completa** de instalação
- ✅ **Scripts de deploy** automatizados

## 🎯 Funcionalidades

### Para Clientes:
- Gestão completa de leads (criar, editar, excluir)
- Funil de vendas Kanban com drag & drop
- Gerenciamento de origens de leads
- Sistema de tags para organização
- Filtros avançados (origem, data)
- Histórico de mudanças

### Para Administradores:
- Gerenciamento de usuários
- Controle de status de clientes
- Visão geral de todos os leads
- Acesso a dados de todos os clientes

## 🛠️ Tecnologias

- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS
- **Autenticação**: JWT
- **Deploy**: PM2 + Nginx + EasyPanel

## 📦 Estrutura

```
crm-easypanel/
├── backend/                    # API Node.js
│   ├── src/
│   │   ├── config/            # Configurações
│   │   ├── database/          # Migrations e seeds
│   │   ├── middleware/        # Autenticação
│   │   ├── routes/            # Rotas da API
│   │   └── server.js          # Servidor
│   ├── package.json
│   ├── .env.example
│   └── ecosystem.config.js    # PM2 config
│
├── frontend-build/            # Frontend React
│   ├── src/
│   │   ├── components/       # Componentes
│   │   ├── services/         # API services
│   │   └── config/           # Configurações
│   └── package.json
│
├── database/                  # SQL Scripts
│   └── schema.sql            # Schema PostgreSQL
│
├── INSTALLATION_EASYPANEL.md # Guia completo
├── QUICK_START_EASYPANEL.md  # Guia rápido
└── README.md                 # Este arquivo
```

## 🚀 Instalação Rápida

### Pré-requisitos:
- VPS com EasyPanel
- Node.js 18+
- PostgreSQL no EasyPanel

### Passos:

1. **Criar PostgreSQL no EasyPanel**
2. **Fazer upload do backend para o VPS**
3. **Configurar .env com dados do banco**
4. **Instalar e iniciar com PM2**
5. **Build e deploy do frontend**

Veja o guia completo: [QUICK_START_EASYPANEL.md](QUICK_START_EASYPANEL.md)

## 👤 Usuários Padrão

Após executar o seed:

**Admin**: `admin@crm.com` / `admin123`  
**Cliente**: `joao@empresa.com` / `client123`

⚠️ Altere as senhas em produção!

## 📚 Documentação

- [Quick Start](QUICK_START_EASYPANEL.md) - Instalação em 15 minutos
- [Instalação Completa](INSTALLATION_EASYPANEL.md) - Guia detalhado

## 🔧 Comandos Úteis

```bash
# Backend
pm2 status              # Ver status
pm2 logs crm-backend    # Ver logs
pm2 restart crm-backend # Reiniciar

# Banco de Dados
npm run migrate         # Executar migrations
npm run seed           # Popular com dados

# Backup
pg_dump -h host -U user database > backup.sql
```

## 📊 API Endpoints

Base URL: `https://api.seu-dominio.com/api`

- `POST /auth/login` - Login
- `GET /auth/me` - Usuário atual
- `GET /leads` - Listar leads
- `POST /leads` - Criar lead
- `PUT /leads/:id` - Atualizar lead
- `DELETE /leads/:id` - Excluir lead
- `GET /origins` - Listar origens
- `GET /funnels` - Listar funis
- `GET /users` - Listar usuários (admin)

## 🔒 Segurança

Antes de usar em produção:

- [ ] Alterar todas as senhas padrão
- [ ] Configurar JWT_SECRET forte
- [ ] Habilitar SSL/HTTPS
- [ ] Configurar CORS corretamente
- [ ] Configurar firewall
- [ ] Configurar backup automático

## 🐛 Troubleshooting

### Backend não inicia
```bash
pm2 logs crm-backend
# Verifique .env e credenciais do banco
```

### CORS Error
```bash
# Configure CORS_ORIGIN no .env
nano /root/backend/.env
pm2 restart crm-backend
```

### Banco não conecta
```bash
# Teste conexão
psql -h host -U user -d database
# Verifique host e senha no EasyPanel
```

## 📈 Próximas Funcionalidades

- [ ] Dashboard com estatísticas
- [ ] Relatórios e exportação
- [ ] Notificações por email
- [ ] Integração WhatsApp
- [ ] App mobile

## 📝 Licença

MIT License

## 🤝 Suporte

Para dúvidas:
1. Consulte a documentação
2. Verifique os logs: `pm2 logs`
3. Teste a API: `curl http://localhost:3001/health`

---

**Desenvolvido com ❤️ para gestão eficiente de leads**

**Pronto para EasyPanel! 🎉**