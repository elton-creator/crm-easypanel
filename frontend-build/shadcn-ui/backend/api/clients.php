<?php
require_once '../config/database.php';
require_once '../utils/jwt.php';

setCorsHeaders();

$db = new Database();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetClients($db);
        break;
    case 'POST':
        handleCreateClient($db);
        break;
    case 'PUT':
        handleUpdateClient($db);
        break;
    case 'DELETE':
        handleDeleteClient($db);
        break;
    default:
        jsonError('Método não permitido', 405);
}

/**
 * Listar clientes (apenas admin)
 */
function handleGetClients($db) {
    requireAdmin();
    
    $clients = $db->fetchAll(
        "SELECT c.*, 
                COUNT(DISTINCT f.id) as funnels_count,
                COUNT(DISTINCT l.id) as leads_count,
                COUNT(DISTINCT u.id) as users_count
         FROM clients c
         LEFT JOIN funnels f ON c.id = f.client_id AND f.active = 1
         LEFT JOIN leads l ON c.id = l.client_id AND l.status = 'active'
         LEFT JOIN users u ON c.id = u.client_id AND u.active = 1
         WHERE c.active = 1
         GROUP BY c.id
         ORDER BY c.created_at DESC"
    );
    
    jsonSuccess($clients);
}

/**
 * Criar cliente (apenas admin)
 */
function handleCreateClient($db) {
    requireAdmin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['name'])) {
        jsonError('Nome do cliente é obrigatório');
    }
    
    $name = trim($input['name']);
    $email = trim($input['email'] ?? '');
    $phone = trim($input['phone'] ?? '');
    
    if (empty($name)) {
        jsonError('Nome do cliente não pode estar vazio');
    }
    
    // Verificar se já existe cliente com mesmo email
    if (!empty($email)) {
        $existing = $db->fetchOne("SELECT id FROM clients WHERE email = ? AND active = 1", [$email]);
        if ($existing) {
            jsonError('Já existe um cliente com este email');
        }
    }
    
    try {
        $clientId = $db->insert(
            "INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)",
            [$name, $email, $phone]
        );
        
        // Criar funil padrão para o cliente
        $funnelId = $db->insert(
            "INSERT INTO funnels (client_id, name, description) VALUES (?, ?, ?)",
            [$clientId, 'Funil Principal', 'Funil padrão de vendas']
        );
        
        // Criar estágios padrão
        $stages = [
            ['Novo Lead', 1, '#ef4444'],
            ['Em Contato', 2, '#f97316'],
            ['Proposta', 3, '#eab308'],
            ['Negociação', 4, '#3b82f6'],
            ['Fechamento', 5, '#22c55e']
        ];
        
        foreach ($stages as $stage) {
            $db->insert(
                "INSERT INTO stages (funnel_id, name, position, color) VALUES (?, ?, ?, ?)",
                [$funnelId, $stage[0], $stage[1], $stage[2]]
            );
        }
        
        jsonSuccess(['id' => $clientId], 'Cliente criado com sucesso');
        
    } catch (Exception $e) {
        jsonError('Erro ao criar cliente: ' . $e->getMessage());
    }
}

/**
 * Atualizar cliente (apenas admin)
 */
function handleUpdateClient($db) {
    requireAdmin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id']) || !isset($input['name'])) {
        jsonError('ID e nome do cliente são obrigatórios');
    }
    
    $id = (int)$input['id'];
    $name = trim($input['name']);
    $email = trim($input['email'] ?? '');
    $phone = trim($input['phone'] ?? '');
    
    if (empty($name)) {
        jsonError('Nome do cliente não pode estar vazio');
    }
    
    // Verificar se cliente existe
    $existing = $db->fetchOne("SELECT id FROM clients WHERE id = ? AND active = 1", [$id]);
    if (!$existing) {
        jsonError('Cliente não encontrado', 404);
    }
    
    // Verificar email duplicado (exceto o próprio cliente)
    if (!empty($email)) {
        $emailExists = $db->fetchOne(
            "SELECT id FROM clients WHERE email = ? AND id != ? AND active = 1", 
            [$email, $id]
        );
        if ($emailExists) {
            jsonError('Já existe um cliente com este email');
        }
    }
    
    try {
        $affected = $db->execute(
            "UPDATE clients SET name = ?, email = ?, phone = ? WHERE id = ?",
            [$name, $email, $phone, $id]
        );
        
        if ($affected > 0) {
            jsonSuccess(null, 'Cliente atualizado com sucesso');
        } else {
            jsonError('Nenhuma alteração foi feita');
        }
        
    } catch (Exception $e) {
        jsonError('Erro ao atualizar cliente: ' . $e->getMessage());
    }
}

/**
 * Deletar cliente (apenas admin)
 */
function handleDeleteClient($db) {
    requireAdmin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        jsonError('ID do cliente é obrigatório');
    }
    
    $id = (int)$input['id'];
    
    // Verificar se cliente existe
    $existing = $db->fetchOne("SELECT id FROM clients WHERE id = ? AND active = 1", [$id]);
    if (!$existing) {
        jsonError('Cliente não encontrado', 404);
    }
    
    try {
        // Soft delete - marcar como inativo
        $affected = $db->execute(
            "UPDATE clients SET active = 0 WHERE id = ?",
            [$id]
        );
        
        // Desativar usuários do cliente
        $db->execute(
            "UPDATE users SET active = 0 WHERE client_id = ?",
            [$id]
        );
        
        // Desativar funis do cliente
        $db->execute(
            "UPDATE funnels SET active = 0 WHERE client_id = ?",
            [$id]
        );
        
        if ($affected > 0) {
            jsonSuccess(null, 'Cliente removido com sucesso');
        } else {
            jsonError('Erro ao remover cliente');
        }
        
    } catch (Exception $e) {
        jsonError('Erro ao remover cliente: ' . $e->getMessage());
    }
}
?>