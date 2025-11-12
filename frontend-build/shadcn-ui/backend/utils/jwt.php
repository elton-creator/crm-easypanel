<?php
/**
 * Utilitários JWT para autenticação
 */

class JWT {
    
    /**
     * Gera um token JWT
     */
    public static function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => JWT_ALGORITHM]);
        $payload['exp'] = time() + JWT_EXPIRATION;
        $payload = json_encode($payload);
        
        $headerEncoded = self::base64UrlEncode($header);
        $payloadEncoded = self::base64UrlEncode($payload);
        
        $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, JWT_SECRET, true);
        $signatureEncoded = self::base64UrlEncode($signature);
        
        return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
    }
    
    /**
     * Decodifica e valida um token JWT
     */
    public static function decode($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new Exception('Token JWT inválido');
        }
        
        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;
        
        $signature = self::base64UrlDecode($signatureEncoded);
        $expectedSignature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, JWT_SECRET, true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            throw new Exception('Assinatura JWT inválida');
        }
        
        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
        
        if ($payload['exp'] < time()) {
            throw new Exception('Token JWT expirado');
        }
        
        return $payload;
    }
    
    /**
     * Verifica se o usuário está autenticado
     */
    public static function authenticate() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        
        if (!$authHeader) {
            throw new Exception('Token de autorização não fornecido');
        }
        
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            throw new Exception('Formato de token inválido');
        }
        
        $token = $matches[1];
        return self::decode($token);
    }
    
    /**
     * Verifica se o usuário é admin
     */
    public static function requireAdmin() {
        $user = self::authenticate();
        if ($user['role'] !== 'admin') {
            throw new Exception('Acesso negado: privilégios de administrador necessários');
        }
        return $user;
    }
    
    /**
     * Verifica se o usuário pode acessar dados do cliente
     */
    public static function requireClientAccess($clientId) {
        $user = self::authenticate();
        
        // Admin pode acessar qualquer cliente
        if ($user['role'] === 'admin') {
            return $user;
        }
        
        // Cliente só pode acessar seus próprios dados
        if ($user['client_id'] != $clientId) {
            throw new Exception('Acesso negado: você não tem permissão para acessar estes dados');
        }
        
        return $user;
    }
    
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
}

/**
 * Middleware de autenticação
 */
function requireAuth() {
    try {
        return JWT::authenticate();
    } catch (Exception $e) {
        jsonError($e->getMessage(), 401);
    }
}

function requireAdmin() {
    try {
        return JWT::requireAdmin();
    } catch (Exception $e) {
        jsonError($e->getMessage(), 403);
    }
}

function requireClientAccess($clientId) {
    try {
        return JWT::requireClientAccess($clientId);
    } catch (Exception $e) {
        jsonError($e->getMessage(), 403);
    }
}
?>