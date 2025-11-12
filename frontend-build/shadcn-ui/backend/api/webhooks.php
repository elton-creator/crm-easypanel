<?php
require_once '../config/database.php';
require_once '../utils/jwt.php';

setCorsHeaders();

$db = new Database();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Rotas: /api/webhooks, /api/webhooks/{id}, /api/webhooks/{id}/test
if (isset($pathParts[2]) && $pathParts[2] === 'test') {
    handleTestWebhook($db, $pathParts[1]);
} else {
    switch ($method) {
        case 'GET':
            if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                handleGetWebhook($db, $pathParts[1]);
            } else {
                handleGetWebhooks($db);
            }
            break;
        case 'POST':
            handleCreateWebhook($db);
            break;
        case 'PUT':
            if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                handleUpdateWebhook($db, $pathParts[1]);
            } else {
                jsonError('ID do webhook é obrigatório para atualização');
            }
            break;
        case 'DELETE':
            if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                handleDeleteWebhook($db, $pathParts[1]);
            } else {
                jsonError('ID do webhook é obrigatório para exclusão');
            }
            break;
        default:
            jsonError('Método não permitido', 405);
    }
}

/**
 * Listar webhooks
 */
function handleGetWebhooks($db) {
    $user = requireAuth();
    
    $clientId = $_GET['client_id'] ?? null;
    
    // Se não for admin, só pode ver webhooks do próprio cliente
    if ($user['role'] !== 'admin') {
        $clientId = $user['client_id'];
    }
    
    $sql = "SELECT w.*, f.name as funnel_name, c.name as client_name
            FROM webhooks w
            JOIN clients c ON w.client_id = c.id
            LEFT JOIN funnels f ON w.funnel_id = f.id
            WHERE 1=1";
    
    $params = [];
    
    if ($clientId) {
        $sql .= " AND w.client_id = ?";
        $params[] = $clientId;
    }
    
    $sql .= " ORDER BY w.created_at DESC";
    
    $webhooks = $db->fetchAll($sql, $params);
    
    // Decodificar JSON dos events
    foreach ($webhooks as &$webhook) {
        $webhook['events'] = json_decode($webhook['events'], true);
    }
    
    jsonSuccess($webhooks);
}

/**
 * Buscar webhook específico
 */
function handleGetWebhook($db, $webhookId) {
    $user = requireAuth();
    
    $sql = "SELECT w.*, f.name as funnel_name, c.name as client_name
            FROM webhooks w
            JOIN clients c ON w.client_id = c.id
            LEFT JOIN funnels f ON w.funnel_id = f.id
            WHERE w.id = ?";
    
    $params = [$webhookId];
    
    // Se não for admin, verificar acesso
    if ($user['role'] !== 'admin') {
        $sql .= " AND w.client_id = ?";
        $params[] = $user['client_id'];
    }
    
    $webhook = $db->fetchOne($sql, $params);
    
    if (!$webhook) {
        jsonError('Webhook não encontrado', 404);
    }
    
    $webhook['events'] = json_decode($webhook['events'], true);
    jsonSuccess($webhook);
}

/**
 * Criar webhook
 */
function handleCreateWebhook($db) {
    $user = requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['url']) || !isset($input['events'])) {
        jsonError('URL e eventos são obrigatórios');
    }
    
    $clientId = $input['client_id'] ?? null;
    $funnelId = $input['funnel_id'] ?? null;
    $url = trim($input['url']);
    $events = $input['events'];
    $active = isset($input['active']) ? (bool)$input['active'] : true;
    
    // Se não for admin, usar cliente do usuário
    if ($user['role'] !== 'admin') {
        $clientId = $user['client_id'];
    }
    
    if (!$clientId) {
        jsonError('Cliente é obrigatório');
    }
    
    // Validar URL
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        jsonError('URL inválida');
    }
    
    // Validar eventos
    $validEvents = ['lead_created', 'lead_updated', 'stage_changed', 'lead_won', 'lead_lost'];
    if (!is_array($events) || empty($events)) {
        jsonError('Pelo menos um evento deve ser selecionado');
    }
    
    foreach ($events as $event) {
        if (!in_array($event, $validEvents)) {
            jsonError('Evento inválido: ' . $event);
        }
    }
    
    // Se funil foi especificado, verificar se pertence ao cliente
    if ($funnelId) {
        $funnel = $db->fetchOne(
            "SELECT id FROM funnels WHERE id = ? AND client_id = ? AND active = 1",
            [$funnelId, $clientId]
        );
        
        if (!$funnel) {
            jsonError('Funil não encontrado ou não pertence ao cliente');
        }
    }
    
    try {
        $webhookId = $db->insert(
            "INSERT INTO webhooks (client_id, funnel_id, url, events, active) VALUES (?, ?, ?, ?, ?)",
            [$clientId, $funnelId, $url, json_encode($events), $active]
        );
        
        jsonSuccess(['id' => $webhookId], 'Webhook criado com sucesso');
        
    } catch (Exception $e) {
        jsonError('Erro ao criar webhook: ' . $e->getMessage());
    }
}

/**
 * Atualizar webhook
 */
function handleUpdateWebhook($db, $webhookId) {
    $user = requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        jsonError('Dados para atualização são obrigatórios');
    }
    
    // Verificar se webhook existe e se usuário tem acesso
    $sql = "SELECT * FROM webhooks WHERE id = ?";
    $params = [$webhookId];
    
    if ($user['role'] !== 'admin') {
        $sql .= " AND client_id = ?";
        $params[] = $user['client_id'];
    }
    
    $webhook = $db->fetchOne($sql, $params);
    
    if (!$webhook) {
        jsonError('Webhook não encontrado', 404);
    }
    
    // Campos que podem ser atualizados
    $updateFields = [];
    $updateParams = [];
    
    if (isset($input['url'])) {
        $url = trim($input['url']);
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            jsonError('URL inválida');
        }
        $updateFields[] = "url = ?";
        $updateParams[] = $url;
    }
    
    if (isset($input['funnel_id'])) {
        $funnelId = $input['funnel_id'];
        
        // Se funil foi especificado, verificar se pertence ao cliente
        if ($funnelId) {
            $funnel = $db->fetchOne(
                "SELECT id FROM funnels WHERE id = ? AND client_id = ? AND active = 1",
                [$funnelId, $webhook['client_id']]
            );
            
            if (!$funnel) {
                jsonError('Funil não encontrado ou não pertence ao cliente');
            }
        }
        
        $updateFields[] = "funnel_id = ?";
        $updateParams[] = $funnelId;
    }
    
    if (isset($input['events'])) {
        $events = $input['events'];
        $validEvents = ['lead_created', 'lead_updated', 'stage_changed', 'lead_won', 'lead_lost'];
        
        if (!is_array($events) || empty($events)) {
            jsonError('Pelo menos um evento deve ser selecionado');
        }
        
        foreach ($events as $event) {
            if (!in_array($event, $validEvents)) {
                jsonError('Evento inválido: ' . $event);
            }
        }
        
        $updateFields[] = "events = ?";
        $updateParams[] = json_encode($events);
    }
    
    if (isset($input['active'])) {
        $updateFields[] = "active = ?";
        $updateParams[] = (bool)$input['active'];
    }
    
    if (empty($updateFields)) {
        jsonError('Nenhum campo para atualizar foi fornecido');
    }
    
    $updateParams[] = $webhookId;
    
    try {
        $affected = $db->execute(
            "UPDATE webhooks SET " . implode(', ', $updateFields) . " WHERE id = ?",
            $updateParams
        );
        
        if ($affected > 0) {
            jsonSuccess(null, 'Webhook atualizado com sucesso');
        } else {
            jsonError('Nenhuma alteração foi feita');
        }
        
    } catch (Exception $e) {
        jsonError('Erro ao atualizar webhook: ' . $e->getMessage());
    }
}

/**
 * Deletar webhook
 */
function handleDeleteWebhook($db, $webhookId) {
    $user = requireAuth();
    
    // Verificar se webhook existe e se usuário tem acesso
    $sql = "SELECT * FROM webhooks WHERE id = ?";
    $params = [$webhookId];
    
    if ($user['role'] !== 'admin') {
        $sql .= " AND client_id = ?";
        $params[] = $user['client_id'];
    }
    
    $webhook = $db->fetchOne($sql, $params);
    
    if (!$webhook) {
        jsonError('Webhook não encontrado', 404);
    }
    
    try {
        $affected = $db->execute("DELETE FROM webhooks WHERE id = ?", [$webhookId]);
        
        if ($affected > 0) {
            jsonSuccess(null, 'Webhook removido com sucesso');
        } else {
            jsonError('Erro ao remover webhook');
        }
        
    } catch (Exception $e) {
        jsonError('Erro ao remover webhook: ' . $e->getMessage());
    }
}

/**
 * Testar webhook
 */
function handleTestWebhook($db, $webhookId) {
    $user = requireAuth();
    
    // Verificar se webhook existe e se usuário tem acesso
    $sql = "SELECT w.*, f.name as funnel_name FROM webhooks w 
            LEFT JOIN funnels f ON w.funnel_id = f.id 
            WHERE w.id = ?";
    $params = [$webhookId];
    
    if ($user['role'] !== 'admin') {
        $sql .= " AND w.client_id = ?";
        $params[] = $user['client_id'];
    }
    
    $webhook = $db->fetchOne($sql, $params);
    
    if (!$webhook) {
        jsonError('Webhook não encontrado', 404);
    }
    
    // Payload de teste
    $payload = [
        'evento' => 'test',
        'cliente_id' => $webhook['client_id'],
        'funil_id' => $webhook['funnel_id'] ?: '1',
        'funil_nome' => $webhook['funnel_name'] ?: 'Funil de Teste',
        'lead_id' => 'test_lead_' . time(),
        'estagio_anterior' => 'Novo Lead',
        'estagio_atual' => 'Em Contato',
        'status' => 'active',
        'dados' => [
            'nome' => 'Lead de Teste',
            'email' => 'teste@email.com',
            'telefone' => '(11) 99999-9999',
            'origem' => 'Teste Webhook',
            'valor' => 1000.00,
            'observacoes' => 'Este é um teste de webhook'
        ],
        'timestamp' => date('c'),
        'teste' => true
    ];
    
    // Enviar webhook
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $webhook['url'],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'User-Agent: CRM-System-Webhook/1.0',
            'X-Webhook-Test: true'
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    // Log do teste
    try {
        $db->insert(
            "INSERT INTO webhook_logs (webhook_id, event_type, payload, response_status, response_body) 
             VALUES (?, ?, ?, ?, ?)",
            [
                $webhook['id'],
                'test',
                json_encode($payload),
                $httpCode ?: null,
                $error ? $error : $response
            ]
        );
    } catch (Exception $e) {
        error_log("Erro ao salvar log do teste: " . $e->getMessage());
    }
    
    // Resposta do teste
    $result = [
        'success' => $httpCode >= 200 && $httpCode < 300,
        'status_code' => $httpCode,
        'response' => $response,
        'error' => $error,
        'payload_sent' => $payload
    ];
    
    if ($result['success']) {
        jsonSuccess($result, 'Webhook testado com sucesso');
    } else {
        jsonSuccess($result, 'Webhook testado, mas houve erro na resposta');
    }
}
?>