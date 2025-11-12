<?php
require_once '../config/database.php';
require_once '../utils/jwt.php';

setCorsHeaders();

$db = new Database();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Rotas: /api/leads, /api/leads/{id}, /api/leads/{id}/stage
if (isset($pathParts[2]) && $pathParts[2] === 'stage') {
    handleUpdateStage($db, $pathParts[1]);
} else {
    switch ($method) {
        case 'GET':
            if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                handleGetLead($db, $pathParts[1]);
            } else {
                handleGetLeads($db);
            }
            break;
        case 'POST':
            handleCreateLead($db);
            break;
        case 'PUT':
            if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                handleUpdateLead($db, $pathParts[1]);
            } else {
                jsonError('ID do lead é obrigatório para atualização');
            }
            break;
        case 'DELETE':
            if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                handleDeleteLead($db, $pathParts[1]);
            } else {
                jsonError('ID do lead é obrigatório para exclusão');
            }
            break;
        default:
            jsonError('Método não permitido', 405);
    }
}

/**
 * Listar leads
 */
function handleGetLeads($db) {
    $user = requireAuth();
    
    $clientId = $_GET['client_id'] ?? null;
    $funnelId = $_GET['funnel_id'] ?? null;
    $status = $_GET['status'] ?? 'active';
    
    // Se não for admin, só pode ver leads do próprio cliente
    if ($user['role'] !== 'admin') {
        $clientId = $user['client_id'];
    }
    
    $sql = "SELECT l.*, f.name as funnel_name, s.name as stage_name, s.color as stage_color,
                   c.name as client_name
            FROM leads l
            JOIN funnels f ON l.funnel_id = f.id
            JOIN stages s ON l.stage_id = s.id
            JOIN clients c ON l.client_id = c.id
            WHERE 1=1";
    
    $params = [];
    
    if ($clientId) {
        $sql .= " AND l.client_id = ?";
        $params[] = $clientId;
    }
    
    if ($funnelId) {
        $sql .= " AND l.funnel_id = ?";
        $params[] = $funnelId;
    }
    
    if ($status) {
        $sql .= " AND l.status = ?";
        $params[] = $status;
    }
    
    $sql .= " ORDER BY l.created_at DESC";
    
    $leads = $db->fetchAll($sql, $params);
    jsonSuccess($leads);
}

/**
 * Buscar lead específico
 */
function handleGetLead($db, $leadId) {
    $user = requireAuth();
    
    $sql = "SELECT l.*, f.name as funnel_name, s.name as stage_name, s.color as stage_color,
                   c.name as client_name
            FROM leads l
            JOIN funnels f ON l.funnel_id = f.id
            JOIN stages s ON l.stage_id = s.id
            JOIN clients c ON l.client_id = c.id
            WHERE l.id = ?";
    
    $params = [$leadId];
    
    // Se não for admin, verificar acesso
    if ($user['role'] !== 'admin') {
        $sql .= " AND l.client_id = ?";
        $params[] = $user['client_id'];
    }
    
    $lead = $db->fetchOne($sql, $params);
    
    if (!$lead) {
        jsonError('Lead não encontrado', 404);
    }
    
    jsonSuccess($lead);
}

/**
 * Criar lead
 */
function handleCreateLead($db) {
    $user = requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['name']) || !isset($input['funnel_id'])) {
        jsonError('Nome e funil são obrigatórios');
    }
    
    $clientId = $input['client_id'] ?? null;
    $funnelId = (int)$input['funnel_id'];
    $name = trim($input['name']);
    $email = trim($input['email'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $source = trim($input['source'] ?? '');
    $value = (float)($input['value'] ?? 0);
    $notes = trim($input['notes'] ?? '');
    
    // Se não for admin, usar cliente do usuário
    if ($user['role'] !== 'admin') {
        $clientId = $user['client_id'];
    }
    
    if (!$clientId) {
        jsonError('Cliente é obrigatório');
    }
    
    // Verificar se o funil pertence ao cliente
    $funnel = $db->fetchOne(
        "SELECT id, client_id FROM funnels WHERE id = ? AND client_id = ? AND active = 1",
        [$funnelId, $clientId]
    );
    
    if (!$funnel) {
        jsonError('Funil não encontrado ou não pertence ao cliente');
    }
    
    // Buscar primeiro estágio do funil
    $firstStage = $db->fetchOne(
        "SELECT id FROM stages WHERE funnel_id = ? ORDER BY position ASC LIMIT 1",
        [$funnelId]
    );
    
    if (!$firstStage) {
        jsonError('Funil não possui estágios configurados');
    }
    
    try {
        $leadId = $db->insert(
            "INSERT INTO leads (client_id, funnel_id, stage_id, name, email, phone, source, value, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [$clientId, $funnelId, $firstStage['id'], $name, $email, $phone, $source, $value, $notes]
        );
        
        // Disparar webhooks
        triggerWebhooks($db, $clientId, $funnelId, $leadId, 'lead_created');
        
        jsonSuccess(['id' => $leadId], 'Lead criado com sucesso');
        
    } catch (Exception $e) {
        jsonError('Erro ao criar lead: ' . $e->getMessage());
    }
}

/**
 * Atualizar lead
 */
function handleUpdateLead($db, $leadId) {
    $user = requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        jsonError('Dados para atualização são obrigatórios');
    }
    
    // Verificar se lead existe e se usuário tem acesso
    $sql = "SELECT * FROM leads WHERE id = ?";
    $params = [$leadId];
    
    if ($user['role'] !== 'admin') {
        $sql .= " AND client_id = ?";
        $params[] = $user['client_id'];
    }
    
    $lead = $db->fetchOne($sql, $params);
    
    if (!$lead) {
        jsonError('Lead não encontrado', 404);
    }
    
    // Campos que podem ser atualizados
    $updateFields = [];
    $updateParams = [];
    
    if (isset($input['name'])) {
        $updateFields[] = "name = ?";
        $updateParams[] = trim($input['name']);
    }
    
    if (isset($input['email'])) {
        $updateFields[] = "email = ?";
        $updateParams[] = trim($input['email']);
    }
    
    if (isset($input['phone'])) {
        $updateFields[] = "phone = ?";
        $updateParams[] = trim($input['phone']);
    }
    
    if (isset($input['source'])) {
        $updateFields[] = "source = ?";
        $updateParams[] = trim($input['source']);
    }
    
    if (isset($input['value'])) {
        $updateFields[] = "value = ?";
        $updateParams[] = (float)$input['value'];
    }
    
    if (isset($input['notes'])) {
        $updateFields[] = "notes = ?";
        $updateParams[] = trim($input['notes']);
    }
    
    if (isset($input['status']) && in_array($input['status'], ['active', 'won', 'lost'])) {
        $updateFields[] = "status = ?";
        $updateParams[] = $input['status'];
    }
    
    if (empty($updateFields)) {
        jsonError('Nenhum campo para atualizar foi fornecido');
    }
    
    $updateParams[] = $leadId;
    
    try {
        $affected = $db->execute(
            "UPDATE leads SET " . implode(', ', $updateFields) . " WHERE id = ?",
            $updateParams
        );
        
        if ($affected > 0) {
            // Disparar webhooks se status mudou
            if (isset($input['status'])) {
                $eventType = $input['status'] === 'won' ? 'lead_won' : 
                            ($input['status'] === 'lost' ? 'lead_lost' : 'lead_updated');
                triggerWebhooks($db, $lead['client_id'], $lead['funnel_id'], $leadId, $eventType);
            } else {
                triggerWebhooks($db, $lead['client_id'], $lead['funnel_id'], $leadId, 'lead_updated');
            }
            
            jsonSuccess(null, 'Lead atualizado com sucesso');
        } else {
            jsonError('Nenhuma alteração foi feita');
        }
        
    } catch (Exception $e) {
        jsonError('Erro ao atualizar lead: ' . $e->getMessage());
    }
}

/**
 * Atualizar estágio do lead (drag & drop)
 */
function handleUpdateStage($db, $leadId) {
    $user = requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['stage_id'])) {
        jsonError('ID do estágio é obrigatório');
    }
    
    $newStageId = (int)$input['stage_id'];
    
    // Verificar se lead existe e se usuário tem acesso
    $sql = "SELECT l.*, s.name as current_stage_name 
            FROM leads l 
            JOIN stages s ON l.stage_id = s.id 
            WHERE l.id = ?";
    $params = [$leadId];
    
    if ($user['role'] !== 'admin') {
        $sql .= " AND l.client_id = ?";
        $params[] = $user['client_id'];
    }
    
    $lead = $db->fetchOne($sql, $params);
    
    if (!$lead) {
        jsonError('Lead não encontrado', 404);
    }
    
    // Verificar se o novo estágio pertence ao mesmo funil
    $newStage = $db->fetchOne(
        "SELECT id, name FROM stages WHERE id = ? AND funnel_id = ?",
        [$newStageId, $lead['funnel_id']]
    );
    
    if (!$newStage) {
        jsonError('Estágio não encontrado ou não pertence ao funil do lead');
    }
    
    // Se já está no mesmo estágio, não fazer nada
    if ($lead['stage_id'] == $newStageId) {
        jsonSuccess(null, 'Lead já está neste estágio');
    }
    
    try {
        $affected = $db->execute(
            "UPDATE leads SET stage_id = ? WHERE id = ?",
            [$newStageId, $leadId]
        );
        
        if ($affected > 0) {
            // Disparar webhooks de mudança de estágio
            triggerWebhooks($db, $lead['client_id'], $lead['funnel_id'], $leadId, 'stage_changed', [
                'previous_stage' => $lead['current_stage_name'],
                'new_stage' => $newStage['name']
            ]);
            
            jsonSuccess(null, 'Estágio do lead atualizado com sucesso');
        } else {
            jsonError('Erro ao atualizar estágio do lead');
        }
        
    } catch (Exception $e) {
        jsonError('Erro ao atualizar estágio: ' . $e->getMessage());
    }
}

/**
 * Deletar lead
 */
function handleDeleteLead($db, $leadId) {
    $user = requireAuth();
    
    // Verificar se lead existe e se usuário tem acesso
    $sql = "SELECT * FROM leads WHERE id = ?";
    $params = [$leadId];
    
    if ($user['role'] !== 'admin') {
        $sql .= " AND client_id = ?";
        $params[] = $user['client_id'];
    }
    
    $lead = $db->fetchOne($sql, $params);
    
    if (!$lead) {
        jsonError('Lead não encontrado', 404);
    }
    
    try {
        $affected = $db->execute("DELETE FROM leads WHERE id = ?", [$leadId]);
        
        if ($affected > 0) {
            jsonSuccess(null, 'Lead removido com sucesso');
        } else {
            jsonError('Erro ao remover lead');
        }
        
    } catch (Exception $e) {
        jsonError('Erro ao remover lead: ' . $e->getMessage());
    }
}

/**
 * Disparar webhooks
 */
function triggerWebhooks($db, $clientId, $funnelId, $leadId, $eventType, $extraData = []) {
    // Buscar webhooks ativos para este cliente e evento
    $webhooks = $db->fetchAll(
        "SELECT * FROM webhooks 
         WHERE client_id = ? 
         AND active = 1 
         AND (funnel_id IS NULL OR funnel_id = ?)
         AND JSON_CONTAINS(events, ?)",
        [$clientId, $funnelId, json_encode($eventType)]
    );
    
    if (empty($webhooks)) {
        return;
    }
    
    // Buscar dados do lead
    $lead = $db->fetchOne(
        "SELECT l.*, f.name as funnel_name, s.name as stage_name, c.name as client_name
         FROM leads l
         JOIN funnels f ON l.funnel_id = f.id
         JOIN stages s ON l.stage_id = s.id
         JOIN clients c ON l.client_id = c.id
         WHERE l.id = ?",
        [$leadId]
    );
    
    if (!$lead) {
        return;
    }
    
    // Preparar payload
    $payload = [
        'evento' => $eventType,
        'cliente_id' => $clientId,
        'funil_id' => $funnelId,
        'lead_id' => $leadId,
        'status' => $lead['status'],
        'dados' => [
            'nome' => $lead['name'],
            'email' => $lead['email'],
            'telefone' => $lead['phone'],
            'origem' => $lead['source'],
            'valor' => $lead['value'],
            'observacoes' => $lead['notes']
        ],
        'timestamp' => date('c')
    ];
    
    // Adicionar dados extras (ex: estágios anterior/novo)
    $payload = array_merge($payload, $extraData);
    
    // Enviar para cada webhook
    foreach ($webhooks as $webhook) {
        sendWebhook($db, $webhook, $payload);
    }
}

/**
 * Enviar webhook
 */
function sendWebhook($db, $webhook, $payload) {
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $webhook['url'],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'User-Agent: CRM-System-Webhook/1.0'
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
    
    // Log do webhook
    try {
        $db->insert(
            "INSERT INTO webhook_logs (webhook_id, event_type, payload, response_status, response_body) 
             VALUES (?, ?, ?, ?, ?)",
            [
                $webhook['id'],
                $payload['evento'],
                json_encode($payload),
                $httpCode ?: null,
                $error ? $error : $response
            ]
        );
    } catch (Exception $e) {
        error_log("Erro ao salvar log do webhook: " . $e->getMessage());
    }
}
?>