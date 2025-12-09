import fs from 'fs/promises';
import { query, run } from './server/utils/database.js';

async function fixGroupsImport() {
    console.log('🔧 Fixing groups import...');
    
    try {
        // Read groups from CSV
        const groupsCsvContent = await fs.readFile('./pokemon_data/groups.csv', 'utf-8');
        const lines = groupsCsvContent.split('\n').filter(line => line.trim());
        
        let importedGroups = 0;
        for (const line of lines) {
            // Parse CSV line: groupId,"name",categoryId,abbreviation,modifiedOn
            const match = line.match(/^(\d+),"([^"]+)",(\d+),"?([^"]*)"?,"?([^"]*)"?$/);
            if (match) {
                const [, groupId, name, categoryId, abbreviation, modifiedOn] = match;
                
                await run(
                    `INSERT INTO groups (group_id, name, abbreviation, is_supplemental, published_on, modified_on, category_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        parseInt(groupId),
                        name,
                        abbreviation || null,
                        0, // is_supplemental
                        null, // published_on
                        modifiedOn || null,
                        parseInt(categoryId)
                    ]
                );
                importedGroups++;
            }
        }
        
        console.log(`✅ Imported ${importedGroups} groups.`);
        
        // Show summary
        const groupCount = await query('SELECT COUNT(*) as count FROM groups');
        console.log(`Total groups in database: ${groupCount[0].count}`);
        
    } catch (error) {
        console.error('❌ Error importing groups:', error);
    }
}

fixGroupsImport();







