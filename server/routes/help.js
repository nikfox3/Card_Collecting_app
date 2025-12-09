import express from 'express';
import { query, get, run } from '../utils/database.js';

const router = express.Router();

// Initialize help tables
const initializeHelpTables = async () => {
  try {
    // Create support_tickets table
    await run(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id VARCHAR(36),
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await run('CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status)');
    await run('CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at)');

    console.log('✅ Help tables initialized');
  } catch (error) {
    console.error('❌ Error initializing help tables:', error.message);
  }
};

// Initialize tables on startup
initializeHelpTables();

// Submit support ticket
router.post('/tickets', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || null;
    const { email, subject, category, message } = req.body;

    // Validation
    if (!email || !subject || !category || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Create ticket
    const result = await run(
      `INSERT INTO support_tickets (user_id, email, subject, category, message)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, email, subject.trim(), category, message.trim()]
    );

    // Get the created ticket
    const ticket = await get(
      'SELECT * FROM support_tickets WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json({
      success: true,
      data: {
        id: ticket.id,
        ticketNumber: `TICKET-${ticket.id.toString().padStart(6, '0')}`,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        createdAt: ticket.created_at
      }
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to submit ticket' });
  }
});

// Get user's tickets (if logged in)
router.get('/tickets', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.json({ success: true, data: [] });
    }

    const tickets = await query(
      'SELECT id, subject, category, status, created_at, updated_at FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      ticketNumber: `TICKET-${ticket.id.toString().padStart(6, '0')}`,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at
    }));

    res.json({ success: true, data: formattedTickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

export default router;





