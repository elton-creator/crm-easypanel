<?php
/**
 * Configuração do Banco de Dados
 * Altere as configurações conforme seu ambiente
 */

class Database {
    private $host = 'localhost';
    private $db_name = 'crm_system';
    private $username = 'root';
    private $password = '';
    private $conn = null;

    /**
     * Conecta ao banco de dados
     */
    public function connect() {
        if ($this->conn === null) {
            try {
                $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];
                
                $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            } catch(PDOException $e) {
                error_log("Erro de conexão: " . $e->getMessage());
                throw new Exception("Erro de conexão com o banco de dados");
            }
        }
        
        return $this->conn;
    }

    /**
     * Fecha a conexão
     */
    public function disconnect() {
        $this->conn = null;
    }

    /**
     * Executa uma query preparada
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connect()->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch(PDOException $e) {
            error_log("Erro na query: " . $e->getMessage());
            throw new Exception("Erro na execução da query");
        }
    }

    /**
     * Busca um único registro
     */
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }

    /**
     * Busca múltiplos registros
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * Executa insert e retorna o ID
     */
    public function insert($sql, $params = []) {
        $this->query($sql, $params);
        return $this->connect()->lastInsertId();
    }

    /**
     * Executa update/delete e retorna número de linhas afetadas
     */
    public function execute($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }
}

// Configurações globais
define('JWT_SECRET', 'sua_chave_secreta_jwt_aqui_mude_em_producao');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION', 86400); // 24 horas

// Headers CORS para permitir requisições do frontend
function setCorsHeaders() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");
    
    // Responder a requisições OPTIONS (preflight)
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Função para retornar resposta JSON
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

// Função para retornar erro JSON
function jsonError($message, $status = 400) {
    jsonResponse(['error' => $message, 'success' => false], $status);
}

// Função para retornar sucesso JSON
function jsonSuccess($data = null, $message = null) {
    $response = ['success' => true];
    if ($message) $response['message'] = $message;
    if ($data) $response['data'] = $data;
    jsonResponse($response);
}
?>