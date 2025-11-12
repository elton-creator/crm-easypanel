<?php
require_once '../config/database.php';
require_once '../utils/jwt.php';

setCorsHeaders();

$db = new Database();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetFunnels($db);
        break;
    case 'POST':
        handleCreateFunnel($db);
        break;
    case 'PUT':
        handleUpdateFunnel($db);
        break;
    case 'DELETE':
        handleDeleteFunnel($db);
        break;
    default:
        jsonError('Método não permitido', 405);
}

/**
 * Listar funis
 */
function handleGetFunnels($db) {
    $user = requireAuth();
    
    $clientId = $_GET['client_id'] ?? null;
    
    // Se não for admin, só pode ver funis do próprio cliente
    if ($user['role'] !== 'admin') {
        $clientId = $user['client_id'];
    }
    
    $sql = "SELECT f.*, c.name as client_name,
                   COUNT(DISTINCT l.id) as leads_count,
                   COUNT(DISTINCT s.id) as stages_count
            FROM funnels f
            JOIN clients c ON f.client_id = c.id
            LEFT JOIN leads l ON f.id = l.funnel_id AND l.status = 'active'
            LEFT JOIN stages s ON f.id = s.funnel_id
            WHERE f.active = 1";
    
    $params = [];
    
    if ($clientId) {
        $sql .= " AND f.client_id = ?";
        $params[] = $clientId;
    }
    
    $sql .= " GROUP BY f.id ORDER BY f.created_at DESC";
    
    $funnels = $db->fetchAll($sql, $params);
    
    // Buscar estágios para cada funil
    foreach ($funnels as &$funnel) {
        $funnel['stages'] = $db->fetchAll(
            "SELECT * FROM stages WHERE funnel_id = ? ORDER BY position ASC",
            [$funnel['id']]
        );
    }
    
    jsonSuccess($funnels);
}

/**
 * Criar funil (apenas admin)
 */
function handleCreateFunnel($db) {
    requireAdmin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['name']) || !isset($input['client_id'])) {
        jsonError('Nome e cliente são obrigatórios');
    }
    
    $clientId = (int)$input['client_id'];
    $name = trim($input['name']);
    $description = trim($input['description'] ?? '');
    $stages = $input['stages'] ?? [];
    
    if (empty($name)) {
        jsonError('Nome do funil não pode estar vazio');
    }
    
    // Verificar se cliente existe
    $client = $db->fetchOne("SELECT id FROM clients WHERE id = ? AND active = 1", [$clientId]);
    if (!$client) {
        jsonError('Cliente não encontrado');
    }
    
    // Validar estágios
    if (empty($stages)) {
        jsonError('Pelo menos um estágio deve ser fornecido');
    }
    
    foreach ($stages as $stage) {
        if (empty(trim($stage['name'] ?? ''))) {
            jsonError('Nome do estágio não pode estar vazio');
        }
    }
    
    try {
        $db->connect()->beginTransaction();
        
        // Criar funil
        $funnelId = $db->insert(
            "INSERT INTO funnels (client_id, name, description) VALUES (?, ?, ?)",
            [$clientId, $name, $description]
        );
        
        // Criar estágios
        foreach ($stages as $index => $stage) {
            $stageName = trim($stage['name']);
            $stageColor = $stage['color'] ?? '#3b82f6';
            $position = $index + 1;
            
            $db->insert(
                "INSERT INTO stages (funnel_id, name, position, color) VALUES (?, ?, ?, ?)",
                [$funnelId, $stageName, $position, $stageColor]
            );
        }
        
        $db->connect()->commit();
        
        jsonSuccess(['id' => $funnelId], 'Funil criado com sucesso');
        
    } catch (Exception $e) {
        $db->connect()->rollBack();
        jsonError('Erro ao criar funil: ' . $e->getMessage());
    }
}

/**
 * Atualizar funil (apenas admin)
 */
function handleUpdateFunnel($db) {
    requireAdmin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        jsonError('ID do funil é obrigatório');
    }
    
    $funnelId = (int)$input['id'];
    $name = trim($input['name'] ?? '');
    $description = trim($input['description'] ?? '');
    $stages = $input['stages'] ?? null;
    
    // Verificar se funil existe
    $funnel = $db->fetchOne("SELECT * FROM funnels WHERE id = ? AND active = 1", [$funnelId]);
    if (!$funnel) {
        jsonError('Funil não encontrado', 404);
    }
    
    try {
        $db->connect()->beginTransaction();
        
        // Atualizar dados do funil se fornecidos
        if (!empty($name)) {
            $db->execute(
                "UPDATE funnels SET name = ?, description = ? WHERE id = ?",
                [$name, $description, $funnelId]
            );
        }
        
        // Atualizar estágios se fornecidos
        if ($stages !== null) {
            if (empty($stages)) {
                jsonError('Pelo menos um estágio deve ser fornecido');
            }
            
            // Verificar se há leads nos estágios que serão removidos
            $currentStages = $db->fetchAll("SELECT id FROM stages WHERE funnel_id = ?", [$funnelId]);
            $newStageIds = array_filter(array_column($stages, 'id'));
            
            foreach ($currentStages as $currentStage) {
                if (!in_array($currentStage['id'], $newStageIds)) {
                    $leadsCount = $db->fetchOne(
                        "SELECT COUNT(*) as count FROM leads WHERE stage_id = ? AND status = 'active'",
                        [$currentStage['id']]
                    );
                    
                    if ($leadsCount['count'] > 0) {
                        jsonError('Não é possível remover estágio que possui leads ativos');
                    }
                }
            }
            
            // Remover estágios antigos
            $db->execute("DELETE FROM stages WHERE funnel_id = ?", [$funnelId]);
            
            // Criar novos estágios
            foreach ($stages as $index => $stage) {
                $stageName = trim($stage['name']);
                $stageColor = $stage['color'] ?? '#3b82f6';
                $position = $index + 1;
                
                if (empty($stageName)) {
                    jsonError('Nome do estágio não pode estar vazio');
                }
                
                $db->insert(
                    "INSERT INTO stages (funnel_id, name, position, color) VALUES (?, ?, ?, ?)",
                    [$funnelId, $stageName, $position, $stageColor]
                );
            }
        }
        
        $db->connect()->commit();
        
        jsonSuccess(null, 'Funil atualizado com sucesso');
        
    } catch (Exception $e) {
        $db->connect()->rollBack();
        jsonError('Erro ao atualizar funil: ' . $e->getMessage());
    }
}

/**
 * Deletar funil (apenas admin)
 */
function handleDeleteFunnel($db) {
    requireAdmin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        jsonError('ID do funil é obrigatório');
    }
    
    $funnelId = (int)$input['id'];
    
    // Verificar se funil existe
    $funnel = $db->fetchOne("SELECT * FROM funnels WHERE id = ? AND active = 1", [$funnelId]);
    if (!$funnel) {
        jsonError('Funil não encontrado', 404);
    }
    
    // Verificar se há leads ativos no funil
    $leadsCount = $db->fetchOne(
        "SELECT COUNT(*) as count FROM leads WHERE funnel_id = ? AND status = 'active'",
        [$funnelId]
    );
    
    if ($leadsCount['count'] > 0) {
        jsonError('Não é possível remover funil que possui leads ativos');
    }
    
    try {
        // Soft delete - marcar como inativo
        $affected = $db->execute(
            "UPDATE funnels SET active = 0 WHERE id = ?",
            [$funnelId]
        );
        
        if ($affected > 0) {
            jsonSuccess(null, 'Funil removido com sucesso');
        } else {
            jsonError('Erro ao remover funil');
        }
        
    } catch (Exception $e) {
        jsonError('Erro ao remover funil: ' . $e->getMessage());
    }
}
?>