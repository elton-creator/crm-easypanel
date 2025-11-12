const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { authMiddleware, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, status, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Create user (admin only)
router.post('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (email, password, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, status, created_at`,
      [email, hashedPassword, name, role]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Update user status (admin only)
router.patch('/:id/status', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    const result = await pool.query(
      `UPDATE users 
       SET status = $1
       WHERE id = $2
       RETURNING id, email, name, role, status`,
      [status, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Delete user (admin only)
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

module.exports = router;