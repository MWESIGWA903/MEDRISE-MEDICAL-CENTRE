# MedRise Medical Centre – HIPAA Compliance Notice

**Project:** MedRise Medical Centre  
**Last Updated:** 2026-06-13  
**Status:** Following HIPAA Principles (Not independently verified)

---

## Important Disclaimer

**MedRise Medical Centre implements controls consistent with HIPAA (Health Insurance Portability and Accountability Act) principles to protect patient health information. However, this system has not been independently verified for formal HIPAA compliance.**

**This notice describes our privacy and security practices but does not constitute a guarantee of HIPAA compliance.**

---

## Protected Health Information (PHI)

### What We Collect

We collect and protect the following types of protected health information:

- **Patient Demographics:** Name, date of birth, contact information
- **Medical Information:** Medical history, diagnoses, treatments, prescriptions
- **Appointment Information:** Appointment dates, times, services requested
- **Feedback Information:** Patient ratings, comments, satisfaction data
- **Staff Information:** Names, roles, contact information (for clinic operations)

### How We Protect PHI

**Technical Safeguards:**
- **Encryption:** Data transmitted over HTTPS/TLS
- **Access Controls:** Role-based access control (RBAC) for staff
- **Authentication:** Session-based authentication with token management
- **Secure Storage:** PostgreSQL database with access controls
- **Environment Variables:** Sensitive credentials stored securely

**Administrative Safeguards:**
- **Staff Training:** Staff trained on privacy and security practices
- **Access Policies:** Minimum necessary access principle
- **Incident Response:** Procedures for responding to data breaches
- **Regular Reviews:** Quarterly security and privacy reviews

**Physical Safeguards:**
- **Secure Facilities:** Clinic premises with controlled access
- **Device Security:** Clinic devices secured and monitored
- **Document Security:** Physical records stored securely

---

## Patient Rights

Under principles consistent with HIPAA, patients have the right to:

1. **Access:** Request access to their medical records
2. **Correction:** Request corrections to inaccurate information
3. **Disclosure:** Receive an accounting of disclosures
4. **Restrictions:** Request restrictions on certain uses/disclosures
5. **Confidential Communications:** Request confidential communications
6. **Paper Copy:** Request a paper copy of electronic records

---

## Data Sharing and Disclosure

We may share patient information only as permitted by law and for healthcare operations:

**Permitted Uses:**
- Treatment: Providing healthcare to the patient
- Payment: Billing and insurance processing
- Healthcare Operations: Quality improvement, training, accreditation
- Public Health: As required by law for public health purposes
- Law Enforcement: As required by law

**We Do Not Sell Patient Information**

---

## Security Measures

### Authentication and Authorization

**Multi-Factor Authentication:** Not currently implemented (recommended for future)

**Role-Based Access Control:**
- Medical Director: Full access
- Admin: Full access
- Doctor: Patient care access
- Nurse: Patient care access
- Receptionist: Appointment and contact access
- Pharmacist: Prescription access
- Lab Technician: Lab results access
- Billing Officer: Billing access
- Records Officer: Medical records access

**Session Management:**
- 24-hour session expiration
- Automatic logout on inactivity
- Secure token generation

### Data Encryption

**In Transit:** HTTPS/TLS encryption for all data transmission

**At Rest:** Database encryption (PostgreSQL) - depends on Render configuration

### Access Logging

**Current Implementation:**
- Login/logout events logged
- Failed login attempts tracked
- Account lockout after 5 failed attempts

**Future Enhancement:** Comprehensive audit logging

---

## Breach Notification

In the event of a data breach affecting unsecured PHI, we will:

1. **Investigate:** Immediately investigate the breach
2. **Mitigate:** Take steps to mitigate harm
3. **Notify:** Notify affected individuals without unreasonable delay
4. **Report:** Report to relevant authorities as required by law

**Breach Notification Timeline:**
- Patients: Within 60 days of discovery (or sooner if required)
- Authorities: As required by law

---

## Business Associate Agreements

We use third-party services that may have access to PHI:

**Current Services:**
- **Render:** Hosting and database services
- **Vercel:** Frontend hosting
- **Gmail:** Email communication
- **Resend:** Email communication (fallback)

**Business Associate Status:**
- We have executed business associate agreements where required
- We ensure business associates implement appropriate safeguards
- We monitor business associate compliance

---

## Security Incident Response

**Incident Response Plan:**

1. **Identification:** Detect and identify security incidents
2. **Containment:** Contain the incident to prevent further harm
3. **Eradication:** Remove the cause of the incident
4. **Recovery:** Restore affected systems and data
5. **Lessons Learned:** Document and learn from the incident

**Contact for Security Incidents:**
- Email: medrisemedicalcentre@gmail.com
- Phone: +256 770 775268

---

## Compliance Limitations

### Free-Tier Limitations

**Infrastructure:**
- Render free tier: No dedicated security features
- Vercel free tier: Standard security features only
- No dedicated security monitoring service

**Monitoring:**
- No real-time security monitoring
- No automated intrusion detection
- No security information and event management (SIEM)

**Backup Security:**
- Backups stored in GitHub (encrypted recommended)
- No off-site backup storage
- 7-day log retention (Render)

### Recommendations for Enhanced Compliance

**Priority 1 (High):**
1. Implement multi-factor authentication for admin access
2. Add comprehensive audit logging
3. Implement automated security monitoring
4. Encrypt backups at rest

**Priority 2 (Medium):**
5. Conduct regular security assessments
6. Implement security awareness training
7. Add intrusion detection system
8. Implement data loss prevention

**Priority 3 (Low):**
9. Obtain formal HIPAA compliance certification
10. Conduct penetration testing
11. Implement advanced threat detection
12. Add security operations center (SOC)

---

## Patient Responsibilities

Patients can help protect their information by:

- **Protecting Login Credentials:** Do not share passwords
- **Secure Devices:** Keep devices secure and updated
- **Report Issues:** Report suspected security incidents immediately
- **Review Records:** Regularly review their medical records for accuracy

---

## Contact Information

**Privacy and Security Inquiries:**
- **Email:** medrisemedicalcentre@gmail.com
- **Phone:** +256 770 775268
- **Address:** Lwadda A, Matugga, Wakiso District, Uganda

**Compliance Officer:** [To be designated]

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-06-13 | 1.0 | Initial HIPAA compliance notice | Cascade |

---

**Next Review Date:** 2026-09-13 (Quarterly review required)

**Document Owner:** Medical Director  
**Legal Review:** Recommended before publication
