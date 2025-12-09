# Fix: Stripe API Key Error

## The Problem

Server is crashing because Stripe is trying to initialize without an API key:
```
Error: Neither apiKey nor config.authenticator provided
```

## What I Fixed

✅ **Made Stripe initialization optional** - Only initializes if `STRIPE_SECRET_KEY` is set
✅ **Added error handling** - Routes return 503 if Stripe not configured (instead of crashing)
✅ **Server won't crash** - Can run without Stripe key

## Next Steps

### Option 1: Run Without Stripe (Quick Fix)

Just commit and push the fix - server will run without Stripe features:

```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
git add server/routes/stripe.js
git commit -m "Fix: Make Stripe optional - don't crash if key missing"
git push
```

Then redeploy in Render.

### Option 2: Add Stripe Key (If You Need Stripe)

If you want Stripe features to work:

1. **Get Stripe API Key:**
   - Go to: https://dashboard.stripe.com/apikeys
   - Copy your **Secret Key** (starts with `sk_`)

2. **Add to Render:**
   - Go to Render dashboard → Your service → Environment
   - Add variable:
     - **Key:** `STRIPE_SECRET_KEY`
     - **Value:** `sk_test_...` (your Stripe secret key)
   - Save

3. **Redeploy**

## After Fixing

After committing and pushing the fix, redeploy in Render. You should see:

**✅ Good:**
```
✅ Stripe initialized
🚀 Server running on http://0.0.0.0:10000
✅ Server ready!
```

**OR (if no Stripe key):**
```
⚠️  Stripe not configured - STRIPE_SECRET_KEY not set. Stripe features will be disabled.
🚀 Server running on http://0.0.0.0:10000
✅ Server ready!
```

Both are fine! The server will run either way.

## Summary

**The fix is ready! Just commit and push:**

```bash
git add server/routes/stripe.js
git commit -m "Fix: Make Stripe optional"
git push
```

Then redeploy in Render! 🚀

