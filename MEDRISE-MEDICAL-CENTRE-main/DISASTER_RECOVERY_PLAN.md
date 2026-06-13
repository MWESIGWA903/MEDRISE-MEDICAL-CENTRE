# MedRise Medical Centre – Disaster Recovery Plan

**Project:** MedRise Medical Centre  
**Last Updated:** 2026-06-13  
**Target RTO (Recovery Time Objective):** 4 hours  
**Target RPO (Recovery Point Objective):** 24 hours  
**Uptime Target:** 99.9% (within free-tier limitations)

---

## Executive Summary

This disaster recovery plan outlines procedures for recovering the MedRise Medical Centre system from various disaster scenarios. The plan focuses on free-tier solutions and manual procedures to minimize costs while maintaining reasonable recovery objectives.

---

## System Architecture

### Components
1. **Frontend:** Vercel (React SPA)
2. **Backend:** Render (Node.js/Express API)
3. **Database:** Render PostgreSQL (free tier)
4. **Email:** Gmail/Resend (free tier)
5. **Code Repository:** GitHub

### Dependencies
- Frontend depends on Backend API
- Backend depends on PostgreSQL database
- Email depends on Gmail/Resend API
- All components depend on internet connectivity

---

## Disaster Scenarios

### Scenario 1: Database Corruption
**Severity:** CRITICAL  
**Impact:** All data lost or corrupted  
**RTO:** 4 hours  
**RPO:** 24 hours

**Recovery Steps:**
1. Identify corruption extent
2. Select most recent good backup (from GitHub Actions)
3. Restore database from backup
4. Verify data integrity
5. Test application functionality
6. Communicate status to stakeholders

**Tools:** pg_restore, GitHub Actions backups

---

### Scenario 2: Backend Service Failure
**Severity:** HIGH  
**Impact:** API unavailable, frontend non-functional  
**RTO:** 2 hours  
**RPO:** 0 hours (stateless)

**Recovery Steps:**
1. Check Render dashboard for service status
2. Review error logs
3. Restart service if needed
4. If service cannot be recovered:
   - Redeploy from GitHub
   - Verify environment variables
   - Test API endpoints
5. Monitor for stability

**Tools:** Render dashboard, GitHub deployment

---

### Scenario 3: Frontend Deployment Failure
**Severity:** MEDIUM  
**Impact:** Website unavailable  
**RTO:** 1 hour  
**RPO:** 0 hours (static assets)

**Recovery Steps:**
1. Check Vercel dashboard for deployment status
2. Review build logs
3. Redeploy from GitHub if needed
4. Verify deployment succeeds
5. Test website functionality

**Tools:** Vercel dashboard, GitHub deployment

---

### Scenario 4: GitHub Repository Loss
**Severity:** CRITICAL  
**Impact:** Code and backup history lost  
**RTO:** 8 hours  
**RPO:** Depends on local copies

**Recovery Steps:**
1. Check if repository is truly deleted (may be recoverable)
2. Restore from local clone if available
3. Contact GitHub support for recovery
4. If unrecoverable:
   - Reinitialize repository from local copy
   - Restore from any external backups
   - Rebuild deployment pipelines
5. Verify all services

**Tools:** Git, GitHub support

---

### Scenario 5: Email Service Failure
**Severity:** MEDIUM  
**Impact:** No appointment confirmations, no notifications  
**RTO:** 4 hours  
**RPO:** 0 hours

**Recovery Steps:**
1. Test Gmail/Resend connectivity
2. Check API credentials
3. Switch to backup email provider if needed
4. Update environment variables
5. Test email sending
6. Queue failed emails for retry

**Tools:** Email service dashboards, API testing

---

### Scenario 6: DNS/Domain Issues
**Severity:** HIGH  
**Impact:** Website inaccessible  
**RTO:** 2 hours  
**RPO:** 0 hours

**Recovery Steps:**
1. Check DNS configuration
2. Verify domain registration status
3. Update DNS records if needed
4. Propagate DNS changes (may take time)
5. Monitor for resolution

**Tools:** Domain registrar dashboard, DNS tools

---

### Scenario 7: Security Breach
**Severity:** CRITICAL  
**Impact:** Data compromise, unauthorized access  
**RTO:** 2 hours  
**RPO:** Depends on breach extent

**Recovery Steps:**
1. Identify breach scope
2. Isolate affected systems
3. Change all credentials
4. Review audit logs
5. Patch vulnerabilities
6. Restore from clean backup if needed
7. Notify affected parties
8. Document incident

**Tools:** Security tools, audit logs

---

## Recovery Procedures

### Pre-Recovery Checklist
- [ ] Identify disaster type and scope
- [ ] Notify stakeholders
- [ ] Assemble recovery team
- [ ] Review this disaster recovery plan
- [ ] Identify most recent good backup
- [ ] Prepare recovery environment

### Recovery Execution
1. **Assessment Phase (30 minutes)**
   - Determine disaster scope
   - Identify affected systems
   - Estimate recovery time
   - Communicate status

2. **Recovery Phase (varies by scenario)**
   - Execute scenario-specific procedures
   - Monitor progress
   - Document actions taken

3. **Verification Phase (1 hour)**
   - Test recovered systems
   - Verify data integrity
   - Test critical functionality
   - Performance validation

4. **Post-Recovery Phase (1 hour)**
   - Document incident
   - Update disaster recovery plan
   - Conduct root cause analysis
   - Implement preventive measures

---

## Communication Plan

### Internal Communication
- **Stakeholders:** Medical director, IT staff, clinic staff
- **Method:** Email, WhatsApp, phone
- **Frequency:** Every 30 minutes during disaster
- **Content:** Status updates, ETA, impact assessment

### External Communication
- **Patients:** Website banner, social media, phone
- **Partners:** Direct communication
- **Timing:** As appropriate to disaster severity

### Communication Templates

**Initial Notification:**
```
Subject: SYSTEM ALERT - MedRise Medical Centre

We are currently experiencing a system issue affecting [affected services].
Our team is working to resolve this issue.
Estimated recovery time: [ETA].
We apologize for any inconvenience.
```

**Recovery Complete:**
```
Subject: SYSTEM RESTORED - MedRise Medical Centre

All systems have been restored to normal operation.
Thank you for your patience.
```

---

## Contact Information

### Primary Contacts
- **Medical Director:** Hannington
- **System Administrator:** [To be documented]
- **IT Support:** [To be documented]

### Service Providers
- **GitHub:** https://github.com/contact
- **Render:** https://render.com/support
- **Vercel:** https://vercel.com/support
- **Domain Registrar:** [To be documented]

---

## Testing and Maintenance

### Testing Schedule
- **Monthly:** Review and update contact information
- **Quarterly:** Test backup restoration procedures
- **Annually:** Full disaster recovery drill

### Maintenance Tasks
- Update this document quarterly
- Review and update recovery procedures
- Test backup integrity monthly
- Update contact information as needed

---

## Free-Tier Limitations

### Recovery Limitations
- **No automated failover:** Manual intervention required
- **No real-time replication:** RPO is 24 hours
- **No dedicated DR environment:** Recovery uses production resources
- **No 24/7 support:** Response time depends on availability

### Mitigation Strategies
- Maintain local code copies
- Use multiple backup locations
- Document procedures thoroughly
- Train staff on recovery procedures
- Monitor systems regularly

---

## Business Continuity

### During Outage
- **Patient Appointments:** Manual recording, phone confirmations
- **Patient Records:** Paper backup system
- **Staff Communication:** Phone, WhatsApp
- **Billing:** Manual invoicing

### Post-Recovery
- **Data Entry:** Enter manual records into system
- **Verification:** Reconcile manual and electronic records
- **Process Review:** Identify gaps and improvements

---

## Appendix: Recovery Scripts

### Database Restore Script
```bash
#!/bin/bash
# Restore database from GitHub backup

BACKUP_FILE=$1
DB_URL="postgresql://user:password@host:5432/medrise"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-db.sh <backup-file>"
  exit 1
fi

echo "Restoring from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | psql "$DB_URL"

echo "Restore complete. Verifying..."
psql "$DB_URL" -c "SELECT COUNT(*) FROM patients;"
```

### Service Restart Script
```bash
#!/bin/bash
# Restart Render service via API

RENDER_SERVICE_ID=$1
RENDER_API_KEY=$2

curl -X POST \
  https://api.render.com/v1/services/$RENDER_SERVICE_ID/restart \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-06-13 | 1.0 | Initial disaster recovery plan | Cascade |

---

**Next Review Date:** 2026-09-13 (Quarterly review required)

**Document Owner:** Medical Director  
**Approved By:** [To be documented]
