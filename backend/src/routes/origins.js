const express = require('express');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all origins for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM origins WHERE client_id = $1 ORDER BY name',
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get origins error:', error);
    res.status(500).json({ error: 'Erro ao buscar origens' });
  }
});

// Create origin
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, color } = req.body;
    
    const result = await pool.query(
      `INSERT INTO origins (client_id, name, color, is_default)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, name, color, false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Origem já existe' });
    }
    console.error('Create origin error:', error);
    res.status(500).json({ error: 'Erro ao criar origem' });
  }
});

// Update origin
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, color } = req.body;
    
    const result = await pool.query(
      `UPDATE origins 
       SET name = $1, color = $2
       WHERE id = $3 AND client_id = $4
       RETURNING *`,
      [name, color, req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Origem não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update origin error:', error);
    res.status(500).json({ error: 'Erro ao atualizar origem' });
  }
});

// Delete origin
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM origins WHERE id = $1 AND client_id = $2 AND is_default = false RETURNING id',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Origem não encontrada ou não pode ser excluída' });
    }
    
    res.json({ message: 'Origem excluída com sucesso' });
  } catch (error) {
    console.error('Delete origin error:', error);
    res.status(500).json({ error: 'Erro ao excluir origem' });
  }
});

module.exports = router;