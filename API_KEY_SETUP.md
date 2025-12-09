# API Key Setup

## Pokemon Price Tracker API Key Configuration

Your API key is: `pokeprice_pro_062976b28c69cf8011cb8b728d2ebc4a2b4af606e1347c56`

## Setup Instructions

### Option 1: Environment Variable (Recommended)

Set the environment variable before starting the server:

```bash
export POKEMON_PRICE_TRACKER_API_KEY=pokeprice_pro_062976b28c69cf8011cb8b728d2ebc4a2b4af606e1347c56
```

Then start the server:
```bash
cd server
node server.js
```

### Option 2: Create server/.env file

Create a `.env` file in the `server` directory with:

```env
POKEMON_PRICE_TRACKER_API_KEY=pokeprice_pro_062976b28c69cf8011cb8b728d2ebc4a2b4af606e1347c56
PORT=3001
NODE_ENV=development
DATABASE_PATH=../cards.db
```

Then install dotenv and update server.js to load it:

```bash
npm install dotenv
```

### Option 3: Direct Configuration (Not Recommended)

If you need to hardcode temporarily, you can modify:
- `src/services/pokemonPriceTrackerService.js` line 7
- `server/routes/pokemon-price-tracker.js`

But this is not recommended for production!

## Testing the API

Once configured, test with:

```bash
curl http://localhost:3001/api/pokemon-price-tracker/raw/86552
curl http://localhost:3001/api/pokemon-price-tracker/psa/86552/10
curl http://localhost:3001/api/pokemon-price-tracker/comprehensive/86552
```

## Troubleshooting

If you get "Unauthorized" or "API key not found":
1. Check that the environment variable is set: `echo $POKEMON_PRICE_TRACKER_API_KEY`
2. Restart the server after setting the variable
3. Check the server logs for API errors



