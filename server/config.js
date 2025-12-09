import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine database path - use Railway's /tmp for writable storage, or local path
const getDatabasePath = () => {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }
  // In Railway, use /tmp for writable storage, otherwise use local path
  if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
    return path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH || '/tmp', 'cards.db');
  }
  return path.resolve(__dirname, '../cards.db');
};

export const config = {
  port: process.env.PORT || 3002,
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  databasePath: getDatabasePath(),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  pokemonPriceTrackerAPIKey: process.env.POKEMON_PRICE_TRACKER_API_KEY || 'pokeprice_pro_062976b28c69cf8011cb8b728d2ebc4a2b4af606e1347c56'
};
