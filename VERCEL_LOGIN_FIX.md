# Fix Vercel Login Issue

## Problem
You're getting: "The specified token is not valid. Use `vercel login` to generate a new token."

## Solution: Login First

### Step 1: Login to Vercel

Run this command:
```bash
npm run vercel:login
```

Or directly:
```bash
npx vercel login
```

**What happens:**
1. Browser will open automatically
2. Sign in with GitHub, GitLab, or Email
3. Authorize Vercel
4. Return to terminal - you'll see "Success! Authentication complete."

### Step 2: Deploy

After logging in, deploy:
```bash
npm run deploy:vercel
```

## Alternative: Manual Login

If browser doesn't open:

1. **Visit:** https://vercel.com/login
2. **Sign in** with your account
3. **Go to:** https://vercel.com/account/tokens
4. **Create a token**
5. **Run:**
   ```bash
   npx vercel login
   ```
6. **Paste the token** when prompted

## Quick Commands

```bash
# Login (first time only)
npm run vercel:login

# Deploy
npm run deploy:vercel
```

## Troubleshooting

### "Browser didn't open"
- Visit: https://vercel.com/login manually
- Then run: `npx vercel login` again

### "Token expired"
- Run: `npm run vercel:login` again
- Or create new token at: https://vercel.com/account/tokens

### "Already logged in but still getting error"
- Try: `npx vercel logout` then `npx vercel login` again

