# Deployment Guide

This project can be deployed on multiple platforms. Choose the one that best fits your needs.

## 🚂 Railway (Recommended - Easiest)

**Why Railway?**
- ✅ Native modules work perfectly (no canvas issues)
- ✅ Simple GitHub integration
- ✅ Free tier available
- ✅ Automatic deployments

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect Next.js and deploy
6. Add your environment variables (DATABASE_URL, etc.)
7. Done! Your app will be live

**No additional configuration needed** - Railway will use the `railway.json` file automatically.

---

## 🐳 Render

**Why Render?**
- ✅ Docker support
- ✅ Native modules work
- ✅ Free tier available

**Steps:**
1. Go to [render.com](https://render.com)
2. Sign up and connect GitHub
3. Click "New" → "Web Service"
4. Connect your repository
5. Render will auto-detect the `render.yaml` configuration
6. Add environment variables
7. Deploy!

---

## 🪁 Fly.io

**Why Fly.io?**
- ✅ Global edge deployment
- ✅ Native modules supported
- ✅ Good free tier

**Steps:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run: `fly launch`
3. Follow the prompts
4. Deploy: `fly deploy`

---

## 🐳 Docker (Any Platform)

If you want to use Docker on any platform:

**Build:**
```bash
docker build -t search-engine .
```

**Run:**
```bash
docker run -p 3000:3000 -e DATABASE_URL=your_db_url search-engine
```

---

## 📝 Environment Variables

Make sure to set these on your platform:

- `DATABASE_URL` - Your PostgreSQL connection string
- `NODE_ENV=production` - Usually set automatically

---

## 🔧 Platform Comparison

| Platform | Native Modules | Ease of Use | Free Tier | Best For |
|----------|---------------|-------------|-----------|----------|
| **Railway** | ✅ Perfect | ⭐⭐⭐⭐⭐ | ✅ Yes | **Recommended** |
| **Render** | ✅ Works | ⭐⭐⭐⭐ | ✅ Yes | Docker users |
| **Fly.io** | ✅ Works | ⭐⭐⭐ | ✅ Yes | Global edge |
| **Vercel** | ⚠️ Issues | ⭐⭐⭐⭐⭐ | ✅ Yes | Simple apps (no native modules) |

---

## 🎯 Recommendation

**Use Railway** - It's the easiest and handles native modules like `@napi-rs/canvas` perfectly without any webpack configuration issues.

