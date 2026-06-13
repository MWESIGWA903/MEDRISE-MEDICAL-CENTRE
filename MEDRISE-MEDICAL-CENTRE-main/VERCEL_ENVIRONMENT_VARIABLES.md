# Vercel Environment Variables Configuration

**Project:** MedRise Medical Centre  
**Frontend URL:** https://medrise-medical-centre-medrise.vercel.app  
**Backend URL:** https://medrise-api-v8iz.onrender.com  
**Last Updated:** 2026-06-13

---

## CRITICAL: Required Environment Variables

### VITE_API_URL (REQUIRED)
**Purpose:** Base URL for API calls from frontend to backend  
**Value:** `https://medrise-api-v8iz.onrender.com`  
**Required:** YES - Frontend will not work without this  
**How to Set:**
1. Go to Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add variable: `VITE_API_URL`
4. Value: `https://medrise-api-v8iz.onrender.com`
5. Select environments: Production, Preview, Development
6. Save and redeploy

### VITE_RENDER_URL (OPTIONAL FALLBACK)
**Purpose:** Alternative API URL (fallback if VITE_API_URL not set)  
**Value:** `https://medrise-api-v8iz.onrender.com`  
**Required:** NO (but recommended as backup)  
**How to Set:** Same as VITE_API_URL above

---

## Environment Variables Summary

| Variable | Required | Value | Purpose |
|----------|----------|-------|---------|
| VITE_API_URL | YES | https://medrise-api-v8iz.onrender.com | API base URL for frontend |
| VITE_RENDER_URL | NO | https://medrise-api-v8iz.onrender.com | Fallback API URL |

---

## Verification Steps

After setting environment variables:

1. **Check Vercel Dashboard:**
   - Go to Settings → Environment Variables
   - Verify VITE_API_URL is set correctly
   - Verify it's applied to all environments

2. **Test Frontend:**
   - Visit https://medrise-medical-centre-medrise.vercel.app
   - Open browser DevTools → Console
   - Look for API connection errors
   - Should see no "API base URL not configured" errors

3. **Test API Connection:**
   - Try to access login pages:
     - https://medrise-medical-centre-medrise.vercel.app/admin/login
     - https://medrise-medical-centre-medrise.vercel.app/staff/login
   - Network tab should show API calls to https://medrise-api-v8iz.onrender.com

---

## Troubleshooting

### Issue: "API base URL not configured" error
**Solution:** VITE_API_URL not set in Vercel. Follow steps above to add it.

### Issue: API calls failing with 404
**Solution:** Verify backend URL is correct. Backend should be at https://medrise-api-v8iz.onrender.com

### Issue: CORS errors
**Solution:** Backend ALLOWED_ORIGIN must include Vercel domain. Check Render environment variables.

---

## Backend Environment Variables (Render)

For reference, these are set on Render (backend):

| Variable | Required | Value | Purpose |
|----------|----------|-------|---------|
| DATABASE_URL | YES | From Render database | PostgreSQL connection |
| EMAIL_USER | YES | medrisemedicalcentre@gmail.com | Gmail for email |
| EMAIL_APP_PASSWORD | YES | [App Password] | Gmail app password |
| RESEND_API_KEY | NO | [API Key] | Resend email service |
| NOTIFICATION_EMAIL | YES | medrisemedicalcentre@gmail.com | Notification recipient |
| ALLOWED_ORIGIN | YES | https://medrise-medical-centre-medrise.vercel.app | CORS allowed origin |
| NODE_ENV | YES | production | Environment mode |
| LOG_LEVEL | YES | info | Logging level |

---

## Security Notes

- **Never commit** .env files to Git
- **Never share** API keys or passwords
- **Use different values** for production vs development
- **Rotate credentials** periodically
- **Monitor** for unauthorized access

---

## Free-Tier Constraints

- Vercel free tier: 100GB bandwidth/month, 6,000 minutes build/month
- Render free tier: 750 hours/month, 256MB RAM
- Email: Gmail free tier (Resend free tier available)
- No paid services used

---

## Contact

For issues with environment variables:
- Check Vercel documentation: https://vercel.com/docs/projects/environment-variables
- Check Render documentation: https://render.com/docs/environment-variables
