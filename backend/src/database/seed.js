const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function seed() {
  try {
    console.log('Starting database seeding...');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminResult = await pool.query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['admin@crm.com', adminPassword, 'Administrador', 'admin']
    );
    
    // Create client user
    const clientPassword = await bcrypt.hash('client123', 10);
    const clientResult = await pool.query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['joao@empresa.com', clientPassword, 'João Silva', 'client']
    );
    
    const clientId = clientResult.rows[0]?.id;
    
    if (clientId) {
      // Create default origins
      const origins = [
        { name: 'Google Ads', color: '#4285f4' },
        { name: 'Meta Ads', color: '#1877f2' },
        { name: 'Indicação', color: '#10b981' },
        { name: 'Não Rastreado', color: '#6b7280' },
        { name: 'Outras Origens', color: '#8b5cf6' }
      ];
      
      for (const origin of origins) {
        await pool.query(
          `INSERT INTO origins (client_id, name, color, is_default) 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (client_id, name) DO NOTHING`,
          [clientId, origin.name, origin.color, true]
        );
      }
      
      // Create default funnel
      const defaultStages = [
        { id: 'novo', name: 'Novo Lead', color: '#3b82f6' },
        { id: 'contato', name: 'Primeiro Contato', color: '#8b5cf6' },
        { id: 'qualificado', name: 'Qualificado', color: '#f59e0b' },
        { id: 'proposta', name: 'Proposta Enviada', color: '#10b981' },
        { id: 'negociacao', name: 'Em Negociação', color: '#06b6d4' },
        { id: 'fechado', name: 'Fechado', color: '#22c55e' },
        { id: 'perdido', name: 'Perdido', color: '#ef4444' }
      ];
      
      const funnelResult = await pool.query(
        `INSERT INTO funnels (client_id, name, stages, is_default) 
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [clientId, 'Funil Padrão', JSON.stringify(defaultStages), true]
      );
      
      const funnelId = funnelResult.rows[0]?.id;
      
      // Create sample leads
      if (funnelId) {
        const sampleLeads = [
          {
            name: 'Maria Santos',
            email: 'maria@email.com',
            phone: '(11) 98765-4321',
            origin: 'Google Ads',
            stage: 'novo',
            tags: ['urgente', 'vip']
          },
          {
            name: 'Pedro Oliveira',
            email: 'pedro@email.com',
            phone: '(11) 97654-3210',
            origin: 'Indicação',
            stage: 'contato',
            tags: ['interessado']
          }
        ];
        
        for (const lead of sampleLeads) {
          await pool.query(
            `INSERT INTO leads (client_id, funnel_id, name, email, phone, origin, stage, tags) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [clientId, funnelId, lead.name, lead.email, lead.phone, lead.origin, lead.stage, lead.tags]
          );
        }
      }
    }
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Default Users Created:');
    console.log('Admin: admin@crm.com / admin123');
    console.log('Client: joao@empresa.com / client123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();