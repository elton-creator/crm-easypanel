-- CRM System Database Schema
-- Execute este arquivo para criar todas as tabelas necessárias

CREATE DATABASE IF NOT EXISTS crm_system;
USE crm_system;

-- Tabela de usuários (admins e clientes)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'client') NOT NULL DEFAULT 'client',
    client_id INT NULL, -- NULL para admins, preenchido para usuários de cliente
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de clientes (empresas)
CREATE TABLE clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de funis de vendas
CREATE TABLE funnels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Tabela de estágios dos funis
CREATE TABLE stages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    funnel_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    position INT NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE
);

-- Tabela de leads
CREATE TABLE leads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    funnel_id INT NOT NULL,
    stage_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(100),
    value DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('active', 'won', 'lost') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
);

-- Tabela de webhooks
CREATE TABLE webhooks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    funnel_id INT NULL, -- NULL = todos os funis
    url VARCHAR(500) NOT NULL,
    events JSON NOT NULL, -- ['lead_created', 'lead_updated', 'stage_changed', 'lead_won', 'lead_lost']
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE SET NULL
);

-- Tabela de logs de webhooks (opcional, para debugging)
CREATE TABLE webhook_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    webhook_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    payload JSON NOT NULL,
    response_status INT,
    response_body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_leads_client_funnel ON leads(client_id, funnel_id);
CREATE INDEX idx_leads_stage ON leads(stage_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_stages_funnel ON stages(funnel_id, position);
CREATE INDEX idx_webhooks_client ON webhooks(client_id);
CREATE INDEX idx_users_email ON users(email);

-- Dados iniciais
INSERT INTO clients (id, name, email, phone) VALUES 
(1, 'Empresa Demo', 'contato@empresa.com', '(11) 99999-9999'),
(2, 'Cliente Teste', 'cliente@teste.com', '(11) 88888-8888');

INSERT INTO users (id, name, email, password, role, client_id) VALUES 
(1, 'Administrador', 'admin@crm.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NULL),
(2, 'João Silva', 'joao@empresa.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', 1),
(3, 'Maria Santos', 'maria@teste.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', 2);

INSERT INTO funnels (id, client_id, name, description) VALUES 
(1, 1, 'Vendas Online', 'Funil principal de vendas online'),
(2, 1, 'Vendas Presencial', 'Funil de vendas presencial'),
(3, 2, 'Captação de Leads', 'Funil de captação e nutrição');

INSERT INTO stages (funnel_id, name, position, color) VALUES 
(1, 'Novo Lead', 1, '#ef4444'),
(1, 'Em Contato', 2, '#f97316'),
(1, 'Proposta Enviada', 3, '#eab308'),
(1, 'Negociação', 4, '#3b82f6'),
(1, 'Fechamento', 5, '#22c55e'),
(2, 'Interesse', 1, '#ef4444'),
(2, 'Visita Agendada', 2, '#f97316'),
(2, 'Apresentação', 3, '#eab308'),
(2, 'Proposta', 4, '#3b82f6'),
(2, 'Assinatura', 5, '#22c55e'),
(3, 'Lead Captado', 1, '#ef4444'),
(3, 'Qualificação', 2, '#f97316'),
(3, 'Nutrição', 3, '#eab308'),
(3, 'Oportunidade', 4, '#3b82f6'),
(3, 'Cliente', 5, '#22c55e');

INSERT INTO leads (client_id, funnel_id, stage_id, name, email, phone, source, value) VALUES 
(1, 1, 1, 'Pedro Oliveira', 'pedro@email.com', '(11) 91111-1111', 'Google Ads', 5000.00),
(1, 1, 2, 'Ana Costa', 'ana@email.com', '(11) 92222-2222', 'Facebook', 3500.00),
(1, 1, 3, 'Carlos Silva', 'carlos@email.com', '(11) 93333-3333', 'Indicação', 7500.00),
(2, 3, 1, 'Lucia Santos', 'lucia@email.com', '(11) 94444-4444', 'Site', 2000.00),
(2, 3, 2, 'Roberto Lima', 'roberto@email.com', '(11) 95555-5555', 'WhatsApp', 4000.00);

-- Senha padrão para todos os usuários: "password" (hash bcrypt)
-- Para criar novos hashes: password_hash('sua_senha', PASSWORD_DEFAULT)