# RetroLens Collaboration Guide

This guide explains how to collaborate on the RetroLens frontend while using a shared deployed backend API.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│ Local Frontend  │ ──API──▶│ Deployed Backend │
│ (localhost:5173)│         │ (Cloud Service)  │
└─────────────────┘         └──────────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │  Supabase    │
                              │  Database    │
                              └──────────────┘
```

## For Backend Deployment (One-time setup by maintainer)

### Quick Deploy to Railway (Recommended)

1. **Fork/Clone the repository**
2. **Install Railway CLI**: https://docs.railway.app/develop/cli
3. **Login to Railway**:
   ```bash
   railway login
   ```

4. **Create new project**:
   ```bash
   cd backend
   railway init
   ```

5. **Set environment variables**:
   ```bash
   # Get these from Supabase dashboard
   railway variables set SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   railway variables set SUPABASE_ANON_KEY=your_key_here
   railway variables set SUPABASE_SERVICE_KEY=your_service_key_here
   railway variables set SUPABASE_PROJECT_ID=your_project_id
   
   # Get these from Clerk dashboard
   railway variables set CLERK_DOMAIN=your-domain.clerk.accounts.dev
   railway variables set CLERK_SECRET_KEY=sk_live_your_key
   
   # Generate secure key
   railway variables set SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
   
   # Set CORS for local development
   railway variables set BACKEND_CORS_ORIGINS="http://localhost:3000,http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173"
   ```

6. **Deploy**:
   ```bash
   railway up
   ```

7. **Get your API URL**:
   ```bash
   railway domain
   ```
   Your API will be at: `https://YOUR-APP.up.railway.app`

### Alternative: Deploy to Render

1. **Connect GitHub repo to Render**
2. **Create new Web Service**
3. **Render will auto-detect `render.yaml`**
4. **Add environment variables in dashboard**:
   - All Supabase keys
   - Clerk keys
   - Generate SECRET_KEY
5. **Deploy**
6. **Your API URL**: `https://YOUR-APP.onrender.com`

## For Frontend Developers (Collaborators)

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_REPO/RetroLens.git
   cd RetroLens/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment** (get these from the backend maintainer):
   ```bash
   # Copy the example file
   cp .env.development .env.local
   
   # Edit .env.local with your editor
   ```

   Update `.env.local` with:
   ```env
   # Backend API URL (provided by maintainer)
   VITE_API_URL=https://retrolens-api.up.railway.app  # Example
   
   # Clerk (get from maintainer or Clerk dashboard)
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
   
   # Supabase (get from maintainer or Supabase dashboard)
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxxx
   ```

4. **Run the frontend locally**:
   ```bash
   npm run dev
   ```
   
   Frontend will run at `http://localhost:5173`

### Daily Workflow

1. **Pull latest changes**:
   ```bash
   git pull origin main
   ```

2. **Install any new dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Make your changes** and test with the shared backend

5. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin your-branch
   ```

## API Documentation

Once the backend is deployed, you can access:

- **API Docs**: `https://YOUR-BACKEND-URL/docs`
- **ReDoc**: `https://YOUR-BACKEND-URL/redoc`
- **Health Check**: `https://YOUR-BACKEND-URL/health`

## Environment Variables Reference

### Backend (Production)
| Variable | Description | Required |
|----------|-------------|----------|
| SUPABASE_URL | Supabase project URL | ✅ |
| SUPABASE_ANON_KEY | Supabase anonymous key | ✅ |
| SUPABASE_SERVICE_KEY | Supabase service key | ✅ |
| SUPABASE_PROJECT_ID | Supabase project ID | ✅ |
| SECRET_KEY | JWT secret (generate secure) | ✅ |
| CLERK_DOMAIN | Clerk domain | ✅ |
| CLERK_SECRET_KEY | Clerk secret key | ✅ |
| BACKEND_CORS_ORIGINS | Allowed origins | ✅ |

### Frontend (Local Development)
| Variable | Description | Required |
|----------|-------------|----------|
| VITE_API_URL | Deployed backend URL | ✅ |
| VITE_CLERK_PUBLISHABLE_KEY | Clerk public key | ✅ |
| VITE_SUPABASE_URL | Supabase URL | ✅ |
| VITE_SUPABASE_ANON_KEY | Supabase anon key | ✅ |

## Troubleshooting

### CORS Issues
- **Error**: "CORS policy blocked"
- **Solution**: Ensure your localhost URL is in backend's `BACKEND_CORS_ORIGINS`

### Authentication Issues
- **Error**: "Unauthorized" or "Invalid token"
- **Solution**: Ensure Clerk keys match between frontend and backend

### API Connection Issues
- **Error**: "Failed to fetch" or "Network error"
- **Solution**: 
  1. Check `VITE_API_URL` is correct
  2. Verify backend is running: `curl https://YOUR-BACKEND-URL/health`
  3. Check network/firewall settings

### Database Issues
- **Error**: "Database connection failed"
- **Solution**: Verify Supabase keys and project status in Supabase dashboard

## Security Notes

⚠️ **NEVER commit `.env.local` or any file with real keys**
⚠️ **Keep `SECRET_KEY` secure and unique**
⚠️ **Use different Clerk apps for dev/prod if needed**
⚠️ **Rotate keys regularly**

## Getting Help

1. **Check API status**: Visit `/health` endpoint
2. **View API docs**: Visit `/docs` endpoint
3. **Check logs**: 
   - Railway: `railway logs`
   - Render: Check dashboard logs
4. **Contact maintainer** with:
   - Error messages
   - Browser console logs
   - Network tab screenshots

## Useful Commands

### Backend (for maintainer)
```bash
# View logs
railway logs

# Update environment variable
railway variables set KEY=value

# Redeploy
railway up

# Open in browser
railway open
```

### Frontend (for everyone)
```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

## Next Steps

1. **Backend maintainer**: Deploy the backend using the guide above
2. **Frontend developers**: Set up local environment
3. **Start collaborating**: Create branches, make PRs, review code
4. **Deploy frontend** when ready (Vercel, Netlify, etc.)

Happy coding! 🚀
