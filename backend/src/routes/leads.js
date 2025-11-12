const express = require('express');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all leads for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const clientId = req.user.role === 'admin' ? req.query.clientId : req.user.id;
    
    const result = await pool.query(
      `SELECT l.*, f.name as funnel_name 
       FROM leads l
       JOIN funnels f ON l.funnel_id = f.id
       WHERE l.client_id = $1
       ORDER BY l.created_at DESC`,
      [clientId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
});

// Get single lead
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, f.name as funnel_name 
       FROM leads l
       JOIN funnels f ON l.funnel_id = f.id
       WHERE l.id = $1 AND l.client_id = $2`,
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Erro ao buscar lead' });
  }
});

// Create lead
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { funnelId, name, email, phone, origin, stage, tags, notes } = req.body;
    
    const result = await pool.query(
      `INSERT INTO leads (client_id, funnel_id, name, email, phone, origin, stage, tags, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, funnelId, name, email, phone, origin, stage, tags || [], notes]
    );
    
    // Record history
    await pool.query(
      `INSERT INTO lead_history (lead_id, to_stage, changed_by)
       VALUES ($1, $2, $3)`,
      [result.rows[0].id, stage, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Erro ao criar lead' });
  }
});

// Update lead
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, origin, stage, tags, notes } = req.body;
    
    // Get current lead
    const currentLead = await pool.query(
      'SELECT * FROM leads WHERE id = $1 AND client_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (currentLead.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    const result = await pool.query(
      `UPDATE leads 
       SET name = $1, email = $2, phone = $3, origin = $4, stage = $5, tags = $6, notes = $7
       WHERE id = $8 AND client_id = $9
       RETURNING *`,
      [name, email, phone, origin, stage, tags || [], notes, req.params.id, req.user.id]
    );
    
    // Record history if stage changed
    if (currentLead.rows[0].stage !== stage) {
      await pool.query(
        `INSERT INTO lead_history (lead_id, from_stage, to_stage, changed_by)
         VALUES ($1, $2, $3, $4)`,
        [req.params.id, currentLead.rows[0].stage, stage, req.user.id]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Erro ao atualizar lead' });
  }
});

// Delete lead
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM leads WHERE id = $1 AND client_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    res.json({ message: 'Lead excluído com sucesso' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Erro ao excluir lead' });
  }
});

// Get lead history
router.get('/:id/history', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lh.*, u.name as changed_by_name
       FROM lead_history lh
       LEFT JOIN users u ON lh.changed_by = u.id
       JOIN leads l ON lh.lead_id = l.id
       WHERE lh.lead_id = $1 AND l.client_id = $2
       ORDER BY lh.created_at DESC`,
      [req.params.id, req.user.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get lead history error:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

module.exports = router;