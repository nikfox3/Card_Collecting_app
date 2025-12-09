import express from 'express';
import { query, get, run } from '../utils/database.js';

const router = express.Router();

// Initialize settings tables
const initializeSettingsTables = async () => {
  try {
    // Create user_settings table
    await run(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id VARCHAR(36) NOT NULL UNIQUE,
        -- App Settings
        theme VARCHAR(20) DEFAULT 'dark',
        notifications_enabled BOOLEAN DEFAULT 1,
        email_notifications BOOLEAN DEFAULT 1,
        price_alerts_enabled BOOLEAN DEFAULT 1,
        -- Collection Defaults
        default_condition VARCHAR(20) DEFAULT 'Near Mint',
        default_quantity INTEGER DEFAULT 1,
        default_variant VARCHAR(20) DEFAULT 'Normal',
        -- Display Preferences
        currency VARCHAR(10) DEFAULT 'USD',
        date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
        show_prices_in_collection BOOLEAN DEFAULT 1,
        -- Privacy Settings
        profile_public BOOLEAN DEFAULT 1,
        collection_public BOOLEAN DEFAULT 1,
        show_email BOOLEAN DEFAULT 0,
        show_activity BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await run('CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)');

    // Add missing columns if they don't exist (for existing tables)
    const columnsToAdd = [
      { name: 'default_condition', type: "VARCHAR(20) DEFAULT 'Near Mint'" },
      { name: 'default_quantity', type: "INTEGER DEFAULT 1" },
      { name: 'default_variant', type: "VARCHAR(20) DEFAULT 'Normal'" },
      { name: 'currency', type: "VARCHAR(10) DEFAULT 'USD'" },
      { name: 'date_format', type: "VARCHAR(20) DEFAULT 'MM/DD/YYYY'" },
      { name: 'show_prices_in_collection', type: "BOOLEAN DEFAULT 1" }
    ];

    for (const column of columnsToAdd) {
      try {
        await run(`ALTER TABLE user_settings ADD COLUMN ${column.name} ${column.type}`);
        console.log(`✅ Added missing column: ${column.name}`);
      } catch (error) {
        // Column already exists, ignore
        if (!error.message.includes('duplicate column')) {
          console.error(`⚠️ Error adding column ${column.name}:`, error.message);
        }
      }
    }

    console.log('✅ Settings tables initialized');
  } catch (error) {
    console.error('❌ Error initializing settings tables:', error.message);
  }
};

// Initialize tables on startup
initializeSettingsTables();

// Get user settings
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let settings = await get('SELECT * FROM user_settings WHERE user_id = ?', [userId]);

    // If no settings exist, create default settings
    if (!settings) {
      await run(
        `INSERT INTO user_settings (user_id) VALUES (?)`,
        [userId]
      );
      settings = await get('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
    }

    res.json({
      success: true,
      data: {
        theme: settings.theme || 'dark',
        notificationsEnabled: settings.notifications_enabled === 1,
        emailNotifications: settings.email_notifications === 1,
        priceAlertsEnabled: settings.price_alerts_enabled === 1,
        profilePublic: settings.profile_public === 1,
        collectionPublic: settings.collection_public === 1,
        showEmail: settings.show_email === 1,
        showActivity: settings.show_activity === 1,
        defaultCondition: settings.default_condition || 'Near Mint',
        defaultQuantity: settings.default_quantity || 1,
        defaultVariant: settings.default_variant || 'Normal',
        currency: settings.currency || 'USD',
        dateFormat: settings.date_format || 'MM/DD/YYYY',
        showPricesInCollection: settings.show_prices_in_collection === 1
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update user settings
router.put('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      theme,
      notificationsEnabled,
      emailNotifications,
      priceAlertsEnabled,
      profilePublic,
      collectionPublic,
      showEmail,
      showActivity,
      defaultCondition,
      defaultQuantity,
      defaultVariant,
      currency,
      dateFormat,
      showPricesInCollection
    } = req.body;

    // Check if settings exist
    let settings = await get('SELECT id FROM user_settings WHERE user_id = ?', [userId]);

    if (!settings) {
      // Create settings
      await run(
        `INSERT INTO user_settings (user_id, theme, notifications_enabled, email_notifications, price_alerts_enabled, 
         profile_public, collection_public, show_email, show_activity, default_condition, default_quantity, default_variant,
         currency, date_format, show_prices_in_collection)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          theme || 'dark',
          notificationsEnabled !== undefined ? (notificationsEnabled ? 1 : 0) : 1,
          emailNotifications !== undefined ? (emailNotifications ? 1 : 0) : 1,
          priceAlertsEnabled !== undefined ? (priceAlertsEnabled ? 1 : 0) : 1,
          profilePublic !== undefined ? (profilePublic ? 1 : 0) : 1,
          collectionPublic !== undefined ? (collectionPublic ? 1 : 0) : 1,
          showEmail !== undefined ? (showEmail ? 1 : 0) : 0,
          showActivity !== undefined ? (showActivity ? 1 : 0) : 1,
          defaultCondition || 'Near Mint',
          defaultQuantity || 1,
          defaultVariant || 'Normal',
          currency || 'USD',
          dateFormat || 'MM/DD/YYYY',
          showPricesInCollection !== undefined ? (showPricesInCollection ? 1 : 0) : 1
        ]
      );
    } else {
      // Update settings
      await run(
        `UPDATE user_settings 
         SET theme = COALESCE(?, theme),
             notifications_enabled = COALESCE(?, notifications_enabled),
             email_notifications = COALESCE(?, email_notifications),
             price_alerts_enabled = COALESCE(?, price_alerts_enabled),
             profile_public = COALESCE(?, profile_public),
             collection_public = COALESCE(?, collection_public),
             show_email = COALESCE(?, show_email),
             show_activity = COALESCE(?, show_activity),
             default_condition = COALESCE(?, default_condition),
             default_quantity = COALESCE(?, default_quantity),
             default_variant = COALESCE(?, default_variant),
             currency = COALESCE(?, currency),
             date_format = COALESCE(?, date_format),
             show_prices_in_collection = COALESCE(?, show_prices_in_collection),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [
          theme || null,
          notificationsEnabled !== undefined ? (notificationsEnabled ? 1 : 0) : null,
          emailNotifications !== undefined ? (emailNotifications ? 1 : 0) : null,
          priceAlertsEnabled !== undefined ? (priceAlertsEnabled ? 1 : 0) : null,
          profilePublic !== undefined ? (profilePublic ? 1 : 0) : null,
          collectionPublic !== undefined ? (collectionPublic ? 1 : 0) : null,
          showEmail !== undefined ? (showEmail ? 1 : 0) : null,
          showActivity !== undefined ? (showActivity ? 1 : 0) : null,
          defaultCondition || null,
          defaultQuantity || null,
          defaultVariant || null,
          currency || null,
          dateFormat || null,
          showPricesInCollection !== undefined ? (showPricesInCollection ? 1 : 0) : null,
          userId
        ]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get CSV template
router.get('/csv-template', async (req, res) => {
  try {
    const csvTemplate = `card_id,product_id,name,set_name,variant,condition,is_graded,grade_company,grade_value,quantity,purchase_price,purchase_date,notes
654340,654340,Pikachu,Base Set,Normal,Near Mint,0,,,1,10.50,2025-01-15,Added from pack
654500,654500,Charizard,Base Set,Normal,Near Mint,1,PSA,10,1,500.00,2025-01-20,First edition`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="collection-import-template.csv"');
    res.send(csvTemplate);
  } catch (error) {
    console.error('Error generating CSV template:', error);
    res.status(500).json({ error: 'Failed to generate CSV template' });
  }
});

// Export user's collection as CSV
router.get('/export-collection', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's collection with card details
    // Try product_id first (new schema), fallback to card_id (old schema)
    const collection = await query(`
      SELECT 
        uc.id,
        COALESCE(uc.product_id, uc.card_id) as card_id,
        COALESCE(uc.product_id, uc.card_id) as product_id,
        COALESCE(p.clean_name, p.name) as name,
        COALESCE(g.clean_name, g.name) as set_name,
        COALESCE(uc.sub_type_name, uc.variant) as variant,
        uc.condition,
        COALESCE(uc.is_graded, 0) as is_graded,
        uc.grade_company,
        uc.grade_value,
        uc.quantity,
        uc.purchase_price,
        uc.purchase_date,
        uc.notes,
        uc.created_at,
        uc.updated_at
      FROM user_collections uc
      LEFT JOIN products p ON (uc.product_id = p.product_id OR CAST(uc.card_id AS INTEGER) = p.product_id)
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE uc.user_id = ?
      ORDER BY uc.created_at DESC
    `, [userId]);

    if (collection.length === 0) {
      return res.status(404).json({ error: 'No collection data found' });
    }

    // Convert to CSV format
    const headers = [
      'card_id',
      'product_id',
      'name',
      'set_name',
      'variant',
      'condition',
      'is_graded',
      'grade_company',
      'grade_value',
      'quantity',
      'purchase_price',
      'purchase_date',
      'notes'
    ];

    const csvRows = [
      headers.join(',')
    ];

    collection.forEach(item => {
      const row = [
        item.card_id || '',
        item.product_id || '',
        `"${(item.name || '').replace(/"/g, '""')}"`,
        `"${(item.set_name || '').replace(/"/g, '""')}"`,
        item.variant || 'Normal',
        item.condition || 'Near Mint',
        item.is_graded ? '1' : '0',
        item.grade_company || '',
        item.grade_value || '',
        item.quantity || 1,
        item.purchase_price || '',
        item.purchase_date || '',
        `"${(item.notes || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `collection-export-${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting collection:', error);
    res.status(500).json({ error: 'Failed to export collection' });
  }
});

// Import collection from CSV
router.post('/import-csv', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { csvData, options = {} } = req.body;
    const { skipDuplicates = true, updateExisting = false } = options;

    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({ error: 'Invalid CSV data' });
    }

    const results = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      try {
        // Validate required fields
        const cardId = row.card_id || row.product_id;
        if (!cardId) {
          results.errors.push({ row: i + 1, error: 'Missing card_id or product_id' });
          results.skipped++;
          continue;
        }

        const variant = row.variant || 'Normal';
        const condition = row.condition || 'Near Mint';
        const isGraded = row.is_graded === '1' || row.is_graded === 1 || row.is_graded === true || row.is_graded === 'true';
        const gradeCompany = isGraded ? (row.grade_company || null) : null;
        const gradeValue = isGraded ? (row.grade_value || null) : null;
        const quantity = parseInt(row.quantity) || 1;
        const purchasePrice = row.purchase_price ? parseFloat(row.purchase_price) : null;
        const purchaseDate = row.purchase_date || null;
        const notes = row.notes || null;

        // Check if exists
        const existing = await get(
          `SELECT id, quantity FROM user_collections 
           WHERE user_id = ? AND card_id = ? AND variant = ? AND condition = ? 
           AND COALESCE(grade_company, '') = COALESCE(?, '') AND COALESCE(grade_value, '') = COALESCE(?, '')`,
          [userId, cardId.toString(), variant, condition, gradeCompany, gradeValue]
        );

        if (existing) {
          if (updateExisting) {
            // Update existing
            await run(
              `UPDATE user_collections 
               SET quantity = ?,
                   purchase_price = COALESCE(?, purchase_price),
                   purchase_date = COALESCE(?, purchase_date),
                   notes = COALESCE(?, notes)
               WHERE id = ?`,
              [existing.quantity + quantity, purchasePrice, purchaseDate, notes, existing.id]
            );
            results.updated++;
          } else if (skipDuplicates) {
            results.skipped++;
          } else {
            results.errors.push({ row: i + 1, error: 'Duplicate entry' });
            results.skipped++;
          }
        } else {
          // Insert new
          await run(
            `INSERT INTO user_collections 
             (user_id, card_id, variant, condition, is_graded, grade_company, grade_value, 
              quantity, purchase_price, purchase_date, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, cardId.toString(), variant, condition, isGraded ? 1 : 0, gradeCompany, gradeValue, quantity, purchasePrice, purchaseDate, notes]
          );
          results.added++;
        }
      } catch (error) {
        results.errors.push({ row: i + 1, error: error.message });
        results.skipped++;
      }
    }

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({ error: 'Failed to import CSV' });
  }
});

export default router;



