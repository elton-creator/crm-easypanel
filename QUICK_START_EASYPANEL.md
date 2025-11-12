# ⚡ Quick Start - CRM no EasyPanel

## 🎯 Resumo Rápido

Este guia te ajuda a instalar o CRM completo no seu VPS com EasyPanel em **15 minutos**.

---

## 📦 O que você tem neste pacote:

```
crm-easypanel/
├── backend/                    # API Node.js
│   ├── src/                   # Código fonte
│   ├── package.json           # Dependências
│   ├── .env.example          # Template de configuração
│   └── ecosystem.config.js   # Configuração PM2
│
├── frontend-build/            # Frontend React (pronto para build)
│   ├── src/                  # Código fonte
│   └── package.json          # Dependências
│
├── database/                  # Scripts SQL
│   └── schema.sql            # Schema do PostgreSQL
│
└── INSTALLATION_EASYPANEL.md # Guia completo
```

---

## 🚀 Instalação Rápida (3 Etapas)

### **Etapa 1: PostgreSQL no EasyPanel (5 min)**

1. Acesse seu EasyPanel
2. Vá em **Databases** > **Create Database**
3. Escolha **PostgreSQL**
4. Configure:
   - Name: `crm-database`
   - Username: `crm_user`
   - Password: [gere uma senha forte]
   - Database: `crm_database`
5. **Anote** o host, porta, usuário e senha

6. Execute o schema SQL:
   - Abra o Query Editor do PostgreSQL no EasyPanel
   - Copie todo o conteúdo de `database/schema.sql`
   - Execute

---

### **Etapa 2: Backend no VPS (5 min)**

```bash
# 1. Conecte ao VPS via SSH
ssh root@seu-ip-vps

# 2. Instale Node.js e PM2 (se não tiver)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
npm install -g pm2

# 3. Faça upload do backend
# (use SCP ou Git - veja instruções abaixo)

# 4. Configure
cd /root/backend
cp .env.example .env
nano .env
# Configure com os dados do PostgreSQL do EasyPanel

# 5. Instale e inicie
npm install --production
npm run migrate
npm run seed
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Configuração do .env:**
```env
PORT=3001
DB_HOST=postgres-xxx.easypanel.host  # Do EasyPanel
DB_PORT=5432
DB_NAME=crm_database
DB_USER=crm_user
DB_PASSWORD=sua_senha_do_easypanel
JWT_SECRET=cole_aqui_resultado_de_openssl_rand_base64_32
CORS_ORIGIN=https://seu-dominio.com
```

---

### **Etapa 3: Frontend no EasyPanel (5 min)**

```bash
# No seu computador local:
cd frontend-build
npm install
echo "VITE_API_URL=https://api.seu-dominio.com/api" > .env
npm run build

# Upload do build
cd dist
tar -czf frontend.tar.gz *
scp frontend.tar.gz root@seu-ip-vps:/var/www/
```

**No EasyPanel:**
1. Vá em **Apps** > **Create App**
2. Escolha **Static Site**
3. Configure:
   - Name: `crm-frontend`
   - Domain: `crm.seu-dominio.com`
   - Root: `/var/www/crm`
   - SSL: ✅ Enabled
4. Salve

**Configure proxy para API:**
1. Vá em **Apps** > **Create App**
2. Escolha **Proxy**
3. Configure:
   - Name: `crm-api`
   - Domain: `api.seu-dominio.com`
   - Target: `http://localhost:3001`
   - SSL: ✅ Enabled

---

## 👤 Primeiro Acesso

Acesse: `https://crm.seu-dominio.com`

**Usuários padrão:**
- Admin: `admin@crm.com` / `admin123`
- Cliente: `joao@empresa.com` / `client123`

⚠️ **Altere as senhas após o primeiro login!**

---

## 📤 Como fazer upload dos arquivos

### **Opção 1: Via SCP (Recomendado)**

```bash
# Compactar backend
cd /caminho/para/crm-easypanel
tar -czf backend.tar.gz backend/

# Upload
scp backend.tar.gz root@seu-ip-vps:/root/

# No VPS
ssh root@seu-ip-vps
cd /root
tar -xzf backend.tar.gz
```

### **Opção 2: Via Git (Melhor para atualizações)**

```bash
# 1. Crie um repositório no GitHub
# 2. Faça upload dos arquivos
# 3. No VPS:
git clone https://github.com/seu-usuario/crm-backend.git /root/backend
```

### **Opção 3: Via SFTP (Interface gráfica)**

Use FileZilla ou WinSCP:
- Host: seu-ip-vps
- User: root
- Password: sua-senha
- Upload para: `/root/backend/`

---

## 🔧 Comandos Úteis

```bash
# Ver status do backend
pm2 status

# Ver logs
pm2 logs crm-backend

# Reiniciar backend
pm2 restart crm-backend

# Testar API
curl http://localhost:3001/health

# Backup do banco
pg_dump -h postgres-xxx.easypanel.host -U crm_user crm_database > backup.sql
```

---

## 🐛 Problemas Comuns

### Backend não inicia
```bash
pm2 logs crm-backend
# Verifique o .env, principalmente DB_HOST e DB_PASSWORD
```

### CORS Error
```bash
# Edite o .env
nano /root/backend/.env
# Altere CORS_ORIGIN para a URL correta do frontend
pm2 restart crm-backend
```

### Não conecta ao banco
```bash
# Teste a conexão
psql -h postgres-xxx.easypanel.host -U crm_user -d crm_database
# Se não conectar, verifique host e senha no EasyPanel
```

---

## 📚 Documentação Completa

Para instruções detalhadas, veja:
- [INSTALLATION_EASYPANEL.md](INSTALLATION_EASYPANEL.md)

---

## 🔒 Checklist de Segurança

- [ ] Alterar senhas padrão (admin e cliente)
- [ ] Configurar JWT_SECRET forte
- [ ] Habilitar SSL em todos os domínios
- [ ] Configurar backup automático do banco
- [ ] Configurar firewall (UFW)

---

## 📞 Precisa de Ajuda?

1. Verifique os logs: `pm2 logs crm-backend`
2. Consulte a documentação completa
3. Verifique as configurações do .env

---

**Pronto! Seu CRM está funcionando! 🎉**

Acesse: `https://crm.seu-dominio.com`