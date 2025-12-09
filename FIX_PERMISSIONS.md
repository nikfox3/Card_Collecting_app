# Fix npm Permission Issues

## Problem
You're getting `EACCES: permission denied` when trying to install global packages.

## Solution: Use npx (No Installation Required!)

Instead of installing globally, use `npx` which runs packages without installing them.

### For Vercel:
```bash
# Instead of: npm install -g vercel
# Just use: npx vercel
npx vercel --prod
```

### For Netlify:
```bash
# Instead of: npm install -g netlify-cli
# Just use: npx netlify-cli
npx netlify-cli deploy --prod --dir=dist
```

## Updated Deployment Commands

I've updated your `package.json` to use `npx` automatically:

```bash
# Deploy to Vercel (no global install needed!)
npm run deploy:vercel

# Deploy to Netlify (no global install needed!)
npm run deploy:netlify
```

## Alternative: Fix npm Permissions (Optional)

If you want to fix permissions for future global installs:

### Option 1: Use npm's recommended method
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### Option 2: Use sudo (not recommended)
```bash
sudo npm install -g vercel
```

But **npx is better** - no installation needed!

