# MedRise Medical Centre – Backup Procedures

**Project:** MedRise Medical Centre  
**Last Updated:** 2026-06-13  
**Retention Policy:** 30 days  
**Backup Method:** Automated (GitHub Actions) + Manual (pg_dump)

---

## Overview

This document outlines the backup procedures for the MedRise Medical Centre system, including database backups, application backups, and disaster recovery preparation.

---

## Critical Systems

### 1. PostgreSQL Database (Render)
- **Location:** Render PostgreSQL (free tier)
- **Size:** Up to 1GB (free tier limit)
- **Data:** Patient records, appointments, staff accounts, sessions, notifications
- **Backup Frequency:** Daily automated
- **Retention:** 30 days

### 2. Application Code (GitHub)
- **Location:** GitHub repository
- **Backup Method:** Git version control
- **Backup Frequency:** On every commit
- **Retention:** Permanent (Git history)

### 3. Static Assets (Vercel)
- **Location:** Vercel CDN
- **Data:** Images, fonts, static files
- **Backup Method:** Source code in Git
- **Backup Frequency:** On every deployment
- **Retention:** Permanent (Git history)

---

## Automated Backup Procedures

### GitHub Actions Database Backup

**Workflow File:** `.github/workflows/db-backup.yml`

**Schedule:** Daily at 00:00 UTC

**Process:**
1. Connects to Render PostgreSQL database
2. Runs `pg_dump` to export entire database
3. Uploads backup to GitHub repository (encrypted)
4. Retains last 30 days of backups
5. Sends notification on failure

**Backup Location:** `backups/database/YYYY-MM-DD-medrise-db.sql.gz`

**Limitations:**
- Free tier: 500MB storage limit per repository
- Large databases may exceed GitHub limits
- Manual intervention required if backup fails

---

## Manual Backup Procedures

### PostgreSQL Database Backup (Manual)

**When to Use:**
- Before major schema changes
- Before data migrations
- When automated backup fails
- Before deploying to production

**Steps:**

1. **Get Database Connection String:**
   ```bash
   # From Render dashboard
   # Settings → Database → Connection String
   ```

2. **Run Backup:**
   ```bash
   # Install PostgreSQL client tools if not installed
   # Windows: Download from postgresql.org
   # Linux: sudo apt-get install postgresql-client
   # macOS: brew install postgresql

   # Run backup
   pg_dump "postgresql://user:password@host:5432/medrise" \
     --format=custom \
     --file=medrise-backup-$(date +%Y-%m-%d).dump
   ```

3. **Compress Backup:**
   ```bash
   gzip medrise-backup-$(date +%Y-%m-%d).dump
   ```

4. **Store Securely:**
   - Upload to secure cloud storage (Google Drive, Dropbox)
   - Encrypt with strong password
   - Document backup location and password

---

## Backup Verification

### Verification Steps

1. **Check GitHub Actions:**
   - Go to repository → Actions tab
   - Verify "Database Backup" workflow ran successfully
   - Check last run time (should be within 24 hours)

2. **Verify Backup File:**
   - Navigate to `backups/database/` in repository
   - Verify latest backup file exists
   - Check file size (should be > 0)

3. **Test Restore (Optional):**
   - Create test database
   - Restore backup to test database
   - Verify data integrity
   - Delete test database

---

## Backup Retention Policy

### Automated Backups (GitHub)
- **Retention:** 30 days
- **Cleanup:** Automatic via GitHub Actions
- **Oldest Backup:** Automatically deleted after 30 days

### Manual Backups
- **Retention:** 90 days recommended
- **Cleanup:** Manual
- **Storage:** External cloud storage

---

## Restoration Procedures

### Database Restoration from Automated Backup

**Steps:**

1. **Download Backup:**
   ```bash
   # From GitHub repository
   git clone https://github.com/MWESIGWA903/MEDRISE-MEDICAL-CENTRE.git
   cd MEDRISE-MEDICAL-CENTRE/backups/database/
   ```

2. **Decrypt Backup (if encrypted):**
   ```bash
   # If using GPG encryption
   gpg --decrypt 2026-06-13-medrise-db.sql.gz.gpg > 2026-06-13-medrise-db.sql.gz
   ```

3. **Restore to Render:**
   ```bash
   # Decompress
   gunzip 2026-06-13-medrise-db.sql.gz

   # Restore using psql
   psql "postgresql://user:password@host:5432/medrise" < 2026-06-13-medrise-db.sql
   ```

4. **Verify Restoration:**
   - Check record counts
   - Test application functionality
   - Verify login works

---

## Application Code Restoration

### From GitHub

**Steps:**

1. **Clone Repository:**
   ```bash
   git clone https://github.com/MWESIGWA903/MEDRISE-MEDICAL-CENTRE.git
   cd MEDRISE-MEDICAL-CENTRE
   ```

2. **Checkout Desired Branch:**
   ```bash
   git checkout main
   # Or specific commit
   git checkout <commit-hash>
   ```

3. **Install Dependencies:**
   ```bash
   pnpm install
   ```

4. **Build Application:**
   ```bash
   pnpm build
   ```

5. **Deploy:**
   - Push to Vercel (automatic deployment)
   - Deploy to Render (automatic deployment)

---

## Backup Monitoring

### Monitoring Checklist

- [ ] GitHub Actions workflow runs daily
- [ ] Backup files are created successfully
- [ ] Backup file sizes are reasonable
- [ ] No error notifications received
- [ ] Oldest backups are cleaned up automatically

### Alerting

**Current Method:** GitHub Actions email notifications

**Limitations:**
- No real-time monitoring
- No SMS alerts
- No dashboard visibility

**Recommendations (Future):**
- Implement UptimeRobot for free monitoring
- Use Render built-in monitoring
- Set up email alerts for failures

---

## Free-Tier Limitations

### GitHub Actions
- **Limit:** 2,000 free minutes/month
- **Current Usage:** ~5 minutes/day = 150 minutes/month
- **Status:** Within free tier

### Render Database
- **Limit:** 1GB storage (free tier)
- **Current Usage:** Unknown (monitor required)
- **Backup Size:** Depends on data volume

### GitHub Storage
- **Limit:** 500MB per repository (soft limit)
- **Backup Size:** Compressed SQL dumps
- **Status:** Monitor required

---

## Security Considerations

### Backup Security
- **Encryption:** Backups should be encrypted at rest
- **Access:** Restrict backup access to authorized personnel
- **Transmission:** Use secure connections (HTTPS, SSH)
- **Storage:** Store in secure, access-controlled location

### Backup Passwords
- Use strong, unique passwords
- Store passwords securely (password manager)
- Rotate passwords regularly
- Document password recovery procedures

---

## Disaster Recovery Preparation

### Pre-Disaster Checklist
- [ ] All backups are current
- [ ] Backup restoration tested
- [ ] Documentation up to date
- [ ] Contact information available
- [ ] Emergency procedures documented

### Post-Disaster Recovery
1. Assess damage and impact
2. Identify most recent good backup
3. Restore from backup
4. Verify data integrity
5. Test application functionality
6. Communicate status to stakeholders
7. Document incident and lessons learned

---

## Contact Information

### Technical Support
- **GitHub:** https://github.com/MWESIGWA903/MEDRISE-MEDICAL-CENTRE
- **Render Dashboard:** https://dashboard.render.com
- **Vercel Dashboard:** https://vercel.com/dashboard

### Emergency Contacts
- **System Administrator:** [To be documented]
- **Database Administrator:** [To be documented]
- **IT Support:** [To be documented]

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-06-13 | 1.0 | Initial documentation | Cascade |

---

**Next Review Date:** 2026-09-13 (Quarterly review recommended)
