<?php
require_once '../config/database.php';
require_once '../utils/jwt.php';

setCorsHeaders();

$db = new Database();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        handleLogin($db);
        break;
    case 'GET':
        handleMe($db);
        break;
    default:
        jsonError('Método não permitido', 405);
}

/**
 * Login do usuário
 */
function handleLogin($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email']) || !isset($input['password'])) {
        jsonError('Email e senha são obrigatórios');
    }
    
    $email = trim($input['email']);
    $password = $input['password'];
    
    // Buscar usuário no banco
    $user = $db->fetchOne(
        "SELECT u.*, c.name as client_name 
         FROM users u 
         LEFT JOIN clients c ON u.client_id = c.id 
         WHERE u.email = ? AND u.active = 1",
        [$email]
    );
    
    if (!$user || !password_verify($password, $user['password'])) {
        jsonError('Email ou senha inválidos', 401);
    }
    
    // Gerar token JWT
    $payload = [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'name' => $user['name'],
        'role' => $user['role'],
        'client_id' => $user['client_id'],
        'client_name' => $user['client_name']
    ];
    
    $token = JWT::encode($payload);
    
    // Remover senha da resposta
    unset($user['password']);
    
    jsonSuccess([
        'token' => $token,
        'user' => $user
    ], 'Login realizado com sucesso');
}

/**
 * Dados do usuário atual
 */
function handleMe($db) {
    $user = requireAuth();
    
    // Buscar dados atualizados do usuário
    $userData = $db->fetchOne(
        "SELECT u.*, c.name as client_name 
         FROM users u 
         LEFT JOIN clients c ON u.client_id = c.id 
         WHERE u.id = ? AND u.active = 1",
        [$user['user_id']]
    );
    
    if (!$userData) {
        jsonError('Usuário não encontrado', 404);
    }
    
    unset($userData['password']);
    jsonSuccess($userData);
}
?>