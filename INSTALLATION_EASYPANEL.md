# 🚀 Instalação no EasyPanel - CRM System

## 📋 Pré-requisitos

- VPS com EasyPanel instalado
- Acesso SSH ao VPS
- Node.js 18+ instalado no VPS
- PostgreSQL criado no EasyPanel

---

## 🗄️ Passo 1: Criar Banco de Dados no EasyPanel

### 1.1. No painel do EasyPanel:
1. Vá em **Databases**
2. Clique em **Create Database**
3. Escolha **PostgreSQL**
4. Configure:
   - **Name**: `crm-database`
   - **Username**: `crm_user` (ou outro de sua escolha)
   - **Password**: Gere uma senha forte
   - **Database Name**: `crm_database`
5. Clique em **Create**

### 1.2. Anote as informações:
```
Host: postgres-xxx.easypanel.host (ou IP interno)
Port: 5432
Database: crm_database
Username: crm_user
Password: [sua senha]
```

### 1.3. Executar o Schema SQL:

**Opção A: Via EasyPanel (se disponível)**
1. Acesse o PostgreSQL no EasyPanel
2. Abra o Query Editor
3. Copie todo o conteúdo de `database/schema.sql`
4. Execute

**Opção B: Via psql (SSH)**
```bash
# Conecte ao VPS via SSH
ssh root@seu-ip-vps

# Conecte ao PostgreSQL
psql -h postgres-xxx.easypanel.host -U crm_user -d crm_database

# Cole o conteúdo de schema.sql e execute
# Ou:
psql -h postgres-xxx.easypanel.host -U crm_user -d crm_database < database/schema.sql
```

---

## 🔧 Passo 2: Instalar Backend

### 2.1. Conecte ao VPS via SSH:
```bash
ssh root@seu-ip-vps
```

### 2.2. Instale Node.js (se não tiver):
```bash
# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 2.3. Instale PM2 (gerenciador de processos):
```bash
npm install -g pm2
```

### 2.4. Faça upload do backend:

**Opção A: Via SCP**
```bash
# No seu computador local:
cd /caminho/para/crm-easypanel
tar -czf backend.tar.gz backend/
scp backend.tar.gz root@seu-ip-vps:/root/

# No VPS:
cd /root
tar -xzf backend.tar.gz
cd backend
```

**Opção B: Via Git**
```bash
# No VPS:
cd /root
git clone https://github.com/seu-usuario/crm-backend.git backend
cd backend
```

### 2.5. Configure o .env:
```bash
cd /root/backend
cp .env.example .env
nano .env
```

Configure com os dados do seu PostgreSQL do EasyPanel:
```env
PORT=3001
NODE_ENV=production

# Dados do PostgreSQL do EasyPanel
DB_HOST=postgres-xxx.easypanel.host
DB_PORT=5432
DB_NAME=crm_database
DB_USER=crm_user
DB_PASSWORD=sua_senha_aqui

# Gere uma chave JWT forte:
# openssl rand -base64 32
JWT_SECRET=sua_chave_jwt_aqui
JWT_EXPIRES_IN=7d

# URL do seu frontend
CORS_ORIGIN=https://seu-dominio.com
```

### 2.6. Instale dependências:
```bash
npm install --production
```

### 2.7. Execute as migrações e seed:
```bash
# Criar tabelas (se não fez via psql)
npm run migrate

# Popular com dados de exemplo
npm run seed
```

### 2.8. Inicie o backend com PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2.9. Verifique se está rodando:
```bash
pm2 status
pm2 logs crm-backend

# Teste a API
curl http://localhost:3001/health
```

---

## 🌐 Passo 3: Configurar Proxy Reverso no EasyPanel

### 3.1. No EasyPanel:
1. Vá em **Apps**
2. Clique em **Create App**
3. Escolha **Proxy**
4. Configure:
   - **Name**: `crm-backend`
   - **Domain**: `api.seu-dominio.com` (ou subdomínio de sua escolha)
   - **Target**: `http://localhost:3001`
   - **Enable SSL**: ✅ (recomendado)
5. Salve

Agora sua API estará acessível em: `https://api.seu-dominio.com`

---

## 🎨 Passo 4: Deploy do Frontend

### 4.1. Build do frontend localmente:

No seu computador:
```bash
cd /caminho/para/crm-easypanel/frontend-build

# Instalar dependências
npm install

# Configurar API URL
echo "VITE_API_URL=https://api.seu-dominio.com/api" > .env

# Build
npm run build
```

### 4.2. Upload do build:
```bash
# Compactar dist
cd dist
tar -czf frontend-build.tar.gz *

# Upload para VPS
scp frontend-build.tar.gz root@seu-ip-vps:/root/
```

### 4.3. No EasyPanel:

**Opção A: Servir via Nginx no EasyPanel**
1. Vá em **Apps** > **Create App**
2. Escolha **Static Site**
3. Configure:
   - **Name**: `crm-frontend`
   - **Domain**: `crm.seu-dominio.com`
   - **Root Directory**: `/root/frontend-dist`
   - **Enable SSL**: ✅
4. Salve

**Opção B: Servir via Nginx manual**
```bash
# No VPS
mkdir -p /var/www/crm
cd /var/www/crm
tar -xzf /root/frontend-build.tar.gz

# Configurar Nginx
nano /etc/nginx/sites-available/crm
```

Conteúdo do arquivo:
```nginx
server {
    listen 80;
    server_name crm.seu-dominio.com;

    root /var/www/crm;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative o site:
```bash
ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Configure SSL
certbot --nginx -d crm.seu-dominio.com
```

---

## 👤 Passo 5: Primeiro Acesso

### 5.1. Usuários padrão criados:

**Administrador:**
- Email: `admin@crm.com`
- Senha: `admin123`

**Cliente:**
- Email: `joao@empresa.com`
- Senha: `client123`

### 5.2. Acesse:
```
https://crm.seu-dominio.com
```

⚠️ **IMPORTANTE**: Altere as senhas padrão após o primeiro login!

---

## 🔧 Comandos Úteis

### Backend (PM2):
```bash
# Ver status
pm2 status

# Ver logs
pm2 logs crm-backend

# Reiniciar
pm2 restart crm-backend

# Parar
pm2 stop crm-backend

# Remover
pm2 delete crm-backend
```

### Banco de Dados:
```bash
# Conectar ao PostgreSQL
psql -h postgres-xxx.easypanel.host -U crm_user -d crm_database

# Backup
pg_dump -h postgres-xxx.easypanel.host -U crm_user crm_database > backup.sql

# Restaurar
psql -h postgres-xxx.easypanel.host -U crm_user crm_database < backup.sql
```

### Logs:
```bash
# Backend logs
pm2 logs crm-backend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🔒 Checklist de Segurança

- [ ] Alterar senhas padrão do sistema
- [ ] Configurar JWT_SECRET forte no .env
- [ ] Configurar senha forte do PostgreSQL
- [ ] Habilitar SSL/HTTPS em todos os domínios
- [ ] Configurar CORS apenas para seu domínio
- [ ] Configurar firewall (UFW)
- [ ] Configurar backup automático do banco
- [ ] Atualizar sistema operacional

---

## 🐛 Troubleshooting

### Backend não inicia:
```bash
pm2 logs crm-backend
# Verifique credenciais do banco no .env
```

### Erro de conexão com banco:
```bash
# Teste a conexão
psql -h postgres-xxx.easypanel.host -U crm_user -d crm_database

# Verifique se o host está correto no .env
```

### CORS Error:
```bash
# Configure CORS_ORIGIN no backend/.env
nano /root/backend/.env
# Altere CORS_ORIGIN para a URL do frontend
pm2 restart crm-backend
```

### Frontend não carrega:
```bash
# Verifique se o build foi feito
ls -la /var/www/crm

# Verifique Nginx
nginx -t
systemctl status nginx
```

---

## 📞 Suporte

Para problemas, consulte:
- Logs do PM2: `pm2 logs`
- Logs do Nginx: `/var/log/nginx/`
- Logs do PostgreSQL no EasyPanel

---

**Pronto! Seu CRM está rodando no EasyPanel! 🎉**