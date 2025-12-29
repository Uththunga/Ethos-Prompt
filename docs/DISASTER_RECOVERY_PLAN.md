# Disaster Recovery Plan

## Overview

This document outlines procedures for recovering from catastrophic failures in the RAG Prompt Library application.

## Table of Contents

1. [Disaster Scenarios](#disaster-scenarios)
2. [Backup Strategy](#backup-strategy)
3. [Recovery Procedures](#recovery-procedures)
4. [Testing & Validation](#testing--validation)
5. [Roles & Responsibilities](#roles--responsibilities)

---

## Disaster Scenarios

### Scenario 1: Complete Data Loss (Firestore)

**Impact**: All user data, prompts, executions lost  
**RTO**: 4 hours  
**RPO**: 24 hours

### Scenario 2: Cloud Functions Failure

**Impact**: API unavailable, no prompt executions  
**RTO**: 1 hour  
**RPO**: N/A (stateless)

### Scenario 3: Hosting Outage

**Impact**: Frontend unavailable  
**RTO**: 30 minutes  
**RPO**: N/A (static assets)

### Scenario 4: Storage Corruption

**Impact**: Uploaded documents inaccessible  
**RTO**: 2 hours  
**RPO**: 24 hours

### Scenario 5: Security Breach

**Impact**: Unauthorized access, data compromise  
**RTO**: Immediate containment, 8 hours full recovery  
**RPO**: Varies

---

## Backup Strategy

### Firestore Backups

**Automated Daily Backups**:
```bash
# Enable automated backups in Firebase Console
# Settings > Backups > Enable

# Or via gcloud CLI
gcloud firestore backups schedules create \
  --database='(default)' \
  --recurrence=daily \
  --retention=7d
```

**Manual Backup**:
```bash
# Export all collections
gcloud firestore export gs://react-app-000730-backups/$(date +%Y%m%d) \
  --project=react-app-000730

# Export specific collection
gcloud firestore export gs://react-app-000730-backups/prompts-$(date +%Y%m%d) \
  --collection-ids=prompts \
  --project=react-app-000730
```

**Backup Schedule**:
- **Daily**: Full Firestore export (retained 7 days)
- **Weekly**: Full export (retained 4 weeks)
- **Monthly**: Full export (retained 12 months)

### Cloud Storage Backups

**Automated Backup**:
```bash
# Enable versioning
gsutil versioning set on gs://react-app-000730.appspot.com

# Set lifecycle policy
cat > lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "numNewerVersions": 3,
          "isLive": false
        }
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://react-app-000730.appspot.com
```

### Code & Configuration Backups

**Git Repository**:
- All code in version control
- Tagged releases
- Branch protection on main

**Configuration Backups**:
```bash
# Export Firebase config
firebase functions:config:get > config-backup-$(date +%Y%m%d).json

# Export Firestore rules
firebase firestore:rules:get > rules-backup-$(date +%Y%m%d).txt

# Export indexes
cp firestore.indexes.json indexes-backup-$(date +%Y%m%d).json
```

---

## Recovery Procedures

### Firestore Data Recovery

**From Automated Backup**:
```bash
# List available backups
gcloud firestore backups list --project=react-app-000730

# Restore from backup
gcloud firestore import gs://react-app-000730-backups/BACKUP_ID \
  --project=react-app-000730
```

**From Manual Export**:
```bash
# Import specific collection
gcloud firestore import gs://react-app-000730-backups/20251005 \
  --collection-ids=prompts \
  --project=react-app-000730

# Import all collections
gcloud firestore import gs://react-app-000730-backups/20251005 \
  --project=react-app-000730
```

**Verification**:
```bash
# Check document count
gcloud firestore databases describe --project=react-app-000730

# Verify specific documents
firebase firestore:get prompts/PROMPT_ID
```

### Cloud Functions Recovery

**Redeploy from Git**:
```bash
# Checkout last known good version
git checkout v1.x.x

# Deploy functions
cd functions
npm install
firebase deploy --only functions --project=react-app-000730
```

**Rollback to Previous Version**:
```bash
# List function versions
gcloud functions list --project=react-app-000730

# Deploy previous version
firebase deploy --only functions --project=react-app-000730
```

### Hosting Recovery

**Rollback Deployment**:
```bash
# List releases
firebase hosting:releases:list --project=react-app-000730

# Rollback to previous
firebase hosting:rollback --project=react-app-000730
```

**Redeploy from Git**:
```bash
git checkout v1.x.x
cd frontend
npm install
npm run build
firebase deploy --only hosting --project=react-app-000730
```

### Storage Recovery

**Restore from Backup**:
```bash
# List object versions
gsutil ls -a gs://react-app-000730.appspot.com/documents/

# Restore specific version
gsutil cp gs://react-app-000730.appspot.com/documents/FILE#VERSION \
  gs://react-app-000730.appspot.com/documents/FILE
```

**Bulk Restore**:
```bash
# Copy from backup bucket
gsutil -m cp -r gs://react-app-000730-backups/BACKUP_DATE/* \
  gs://react-app-000730.appspot.com/
```

### Security Breach Recovery

**Immediate Actions**:
1. **Contain the breach**
   ```bash
   # Disable compromised functions
   gcloud functions delete FUNCTION_NAME --project=react-app-000730
   
   # Revoke API keys
   firebase functions:config:unset openrouter.api_key
   ```

2. **Assess impact**
   - Check Cloud Logging for unauthorized access
   - Review Firestore audit logs
   - Identify compromised data

3. **Rotate credentials**
   ```bash
   # Generate new API keys
   # Update Firebase config
   firebase functions:config:set openrouter.api_key="NEW_KEY"
   
   # Force user re-authentication
   # (Revoke refresh tokens via Firebase Console)
   ```

4. **Patch vulnerabilities**
   - Update security rules
   - Fix code vulnerabilities
   - Deploy patches

5. **Notify affected users**
   - Send email notifications
   - Update status page
   - Provide guidance

---

## Testing & Validation

### Backup Testing Schedule

**Monthly**: Test Firestore restore
```bash
# Create test project
firebase projects:create test-recovery-$(date +%Y%m)

# Restore backup to test project
gcloud firestore import gs://react-app-000730-backups/LATEST \
  --project=test-recovery-$(date +%Y%m)

# Verify data integrity
# Run validation scripts
```

**Quarterly**: Full disaster recovery drill
1. Simulate complete outage
2. Execute recovery procedures
3. Verify all systems operational
4. Document lessons learned

### Validation Checklist

After recovery:
- [ ] Firestore data accessible
- [ ] Cloud Functions responding
- [ ] Hosting serving content
- [ ] Storage files accessible
- [ ] Authentication working
- [ ] API integrations functional
- [ ] No data corruption
- [ ] Performance acceptable
- [ ] Security rules enforced

### Recovery Time Validation

| Scenario | Target RTO | Actual RTO | Status |
|----------|-----------|------------|--------|
| Firestore Loss | 4 hours | TBD | ⏳ |
| Functions Failure | 1 hour | TBD | ⏳ |
| Hosting Outage | 30 minutes | TBD | ⏳ |
| Storage Corruption | 2 hours | TBD | ⏳ |
| Security Breach | 8 hours | TBD | ⏳ |

---

## Roles & Responsibilities

### Incident Commander
- Declare disaster
- Coordinate recovery efforts
- Communicate with stakeholders

### Technical Lead
- Execute recovery procedures
- Verify system integrity
- Document actions taken

### Communications Lead
- Notify users
- Update status page
- Handle media inquiries

### Security Lead (for breaches)
- Assess security impact
- Coordinate with legal
- Implement security patches

---

## Communication Plan

### Internal Communication
- **Slack**: #incidents channel
- **Email**: incidents@example.com
- **Phone**: On-call rotation

### External Communication
- **Status Page**: status.example.com
- **Email**: User notification list
- **Social Media**: Twitter, LinkedIn

### Communication Templates

**Initial Notification**:
```
Subject: Service Disruption - RAG Prompt Library

We are currently experiencing a service disruption affecting [COMPONENT].
Our team is actively working to resolve the issue.

Estimated Resolution: [TIME]
Status Updates: [URL]

We apologize for the inconvenience.
```

**Resolution Notification**:
```
Subject: Service Restored - RAG Prompt Library

The service disruption has been resolved.
All systems are now operational.

Incident Summary: [BRIEF DESCRIPTION]
Root Cause: [CAUSE]
Actions Taken: [ACTIONS]

Thank you for your patience.
```

---

## Post-Incident Review

After each disaster recovery:

1. **Document timeline**
   - When disaster occurred
   - When detected
   - Actions taken
   - When resolved

2. **Analyze root cause**
   - What caused the disaster
   - Why it wasn't prevented
   - How to prevent recurrence

3. **Review recovery process**
   - What worked well
   - What could be improved
   - Update procedures

4. **Action items**
   - Preventive measures
   - Process improvements
   - Training needs

---

## Emergency Contacts

- **Firebase Support**: https://firebase.google.com/support/contact
- **Google Cloud Support**: https://cloud.google.com/support
- **On-Call Engineer**: [Add contact]
- **Incident Commander**: [Add contact]
- **Security Team**: [Add contact]

---

**Last Updated**: 2025-10-05  
**Next Review**: 2026-01-05  
**Next Drill**: 2026-01-05

