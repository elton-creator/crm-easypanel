const express = require('express');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all funnels for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM funnels WHERE client_id = $1 ORDER BY name',
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get funnels error:', error);
    res.status(500).json({ error: 'Erro ao buscar funis' });
  }
});

// Get single funnel
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM funnels WHERE id = $1 AND client_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funil não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get funnel error:', error);
    res.status(500).json({ error: 'Erro ao buscar funil' });
  }
});

// Create funnel
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, stages } = req.body;
    
    const result = await pool.query(
      `INSERT INTO funnels (client_id, name, stages, is_default)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, name, JSON.stringify(stages), false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create funnel error:', error);
    res.status(500).json({ error: 'Erro ao criar funil' });
  }
});

// Update funnel
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, stages } = req.body;
    
    const result = await pool.query(
      `UPDATE funnels 
       SET name = $1, stages = $2
       WHERE id = $3 AND client_id = $4
       RETURNING *`,
      [name, JSON.stringify(stages), req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funil não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update funnel error:', error);
    res.status(500).json({ error: 'Erro ao atualizar funil' });
  }
});

// Delete funnel
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM funnels WHERE id = $1 AND client_id = $2 AND is_default = false RETURNING id',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funil não encontrado ou não pode ser excluído' });
    }
    
    res.json({ message: 'Funil excluído com sucesso' });
  } catch (error) {
    console.error('Delete funnel error:', error);
    res.status(500).json({ error: 'Erro ao excluir funil' });
  }
});

module.exports = router;