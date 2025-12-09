#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./database/cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));

// Fix Umbreon VMAX ability
const umbreonAbility = JSON.stringify([{
  name: "Dark Signal",
  type: "Ability",
  text: "When you play this Pokémon from your hand to evolve 1 of your Pokémon during your turn, you may switch 1 of your opponent's Benched Pokémon with their Active Pokémon."
}]);

async function fixAbilities() {
  console.log('🔧 Fixing missing abilities...\n');
  
  try {
    // Fix Umbreon VMAX
    await run('UPDATE cards SET abilities = ? WHERE id = ?', [umbreonAbility, 'swsh7-95']);
    console.log('✅ Updated Umbreon VMAX ability');
    
    // Verify
    const card = await get('SELECT id, name, abilities FROM cards WHERE id = ?', ['swsh7-95']);
    console.log(`Verified: ${card.name}`);
    console.log(`Abilities: ${card.abilities}\n`);
    
    // Check how many cards are missing abilities
    const missing = await get('SELECT COUNT(*) as count FROM cards WHERE abilities IS NULL OR abilities = ""');
    console.log(`📊 Cards with missing abilities: ${missing.count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
  }
}

fixAbilities();
