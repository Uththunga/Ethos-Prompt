# Terms of Service Updates - Query Caching Feature

**Document Type:** Legal Amendment Proposal
**Effective Date:** TBD (Upon Legal Approval)
**Status:** Draft - Requires Legal Review
**Task:** 1.2.1 - Draft Terms of Service Updates

---

## Summary of Changes

This document proposes updates to the Terms of Service to disclose the implementation of query caching for performance optimization in the molē AI assistant.

---

## Proposed Additions

### Section: Data Processing and Storage

**Insert after existing data collection section:**

#### 4.5 Performance Caching

To improve response times and user experience, we implement intelligent caching of queries and responses:

**What We Cache:**
- Anonymized versions of common user queries
- Generic AI-generated responses
- Performance metrics and usage patterns

**What We DO NOT Cache:**
- Personally identifiable information (PII) such as email addresses, phone numbers, or personal data
- User-specific or personalized responses
- Low-quality or erroneous responses
- Queries containing sensitive business information

**How Caching Works:**
1. When you submit a query, our system automatically removes any personal information before processing
2. Generic responses to common questions may be cached for faster delivery to future users
3. Cached responses are stored for up to 30 days and then automatically deleted
4. You can request deletion of your cached data at any time

**Your Rights:**
- Right to know if your queries are cached (see Privacy Policy)
- Right to request deletion of cached data
- Right to opt-out of caching (performance may be reduced)
- Right to access your cached data

**Data Retention:**
- Cached queries: 30 days maximum
- Cached responses: 30 days maximum
- Cache statistics (anonymized): 90 days
- After expiration, data is permanently deleted

**Security:**
- All cached data is encrypted at rest and in transit
- Access to cached data is restricted to authorized systems only
- Regular security audits of caching infrastructure
- Automatic PII detection prevents storage of personal information

---

### Section: User Consent

**Add new subsection:**

#### 5.3 Cache Consent

By using the molē AI assistant, you consent to:
- Processing of your queries through our performance caching system
- Storage of anonymized queries for up to 30 days
- Use of cached responses to improve service speed

**Withdrawal of Consent:**
You may withdraw consent to caching at any time by:
1. Contacting support@ethosprompt.com with subject "Opt-Out of Caching"
2. Using the account settings "Disable Performance Caching" option
3. Requesting deletion of all your cached data

Note: Opting out may result in slower response times as your queries will always generate fresh responses.

---

### Section: Data Sharing and Third Parties

**Add clarification:**

#### 6.4 Cache Data Sharing

Cached query and response data is:
- **NOT shared** with third parties
- **NOT sold** or monetized
- **NOT used** for purposes other than performance optimization
- **NOT accessible** to other users (each user receives cached data only for their matching queries)

---

### Section: International Users and Data Residency

**Add new subsection:**

#### 7.5 Cache Data Location

Cached data is stored in:
- **Primary Region:** [Specify: e.g., Australia Southeast (Google Cloud)]
- **Encryption:** AES-256 at rest, TLS 1.3 in transit
- **Compliance:** GDPR, CCPA, Australian Privacy Principles

For users in the European Union:
- Data is processed in accordance with GDPR requirements
- You have the right to request data portability
- You have the right to be forgotten (complete data deletion)

---

## Legal Review Checklist

Before implementation, legal team must verify:

- [ ] Compliance with GDPR (EU General Data Protection Regulation)
- [ ] Compliance with CCPA (California Consumer Privacy Act)
- [ ] Compliance with Australian Privacy Principles
- [ ] Compliance with applicable state/territory privacy laws
- [ ] Language clarity and user understanding
- [ ] No contradictions with existing ToS sections
- [ ] Adequate user notification process
- [ ] Consent mechanism is legally valid
- [ ] Data retention periods are compliant
- [ ] Right to deletion implementation is sufficient

---

## User Notification Plan

**Upon ToS Update:**
1. Email notification to all active users (subject: "Updated Terms of Service - Performance Improvements")
2. In-app notification on next login
3. Consent dialog for existing users: "Accept Updated Terms" or "Review Changes"
4. Blog post explaining changes in plain language
5. FAQ section on website

**Notification Timeline:**
- Day 0: Legal approval
- Day 1-7: Review period (users notified, not enforced)
- Day 8-30: Grace period (users must accept to continue using service)
- Day 31+: Updated ToS in full effect

---

## Plain Language Summary (For Users)

**What's Changing?**
We're adding a smart caching feature to make molē faster. When you ask common questions, we might save the answer (without your personal info) so the next person asking the same thing gets an instant response.

**What Does This Mean for You?**
- ⚡ Faster responses (instant for common queries)
- 🔒 Your personal info (email, phone, etc.) is automatically removed before caching
- 🗑️ Cached data is deleted after 30 days
- ✋ You can opt-out or delete your data anytime

**What We DON'T Do:**
- ❌ Cache your personal information
- ❌ Share cached data with anyone
- ❌ Use it for anything except making the service faster

**Questions?**
Contact legal@ethosprompt.com or support@ethosprompt.com

---

## Next Steps

1. **Legal Review:** Submit to legal team for approval (Est: 3-5 business days)
2. **Revisions:** Incorporate legal team feedback
3. **Final Approval:** Executive sign-off
4. **User Notification:** Execute notification plan
5. **Implementation:** Deploy caching feature after grace period

---

## Appendix: Related Documents

- Privacy Policy Updates (see: `PRIVACY_POLICY_UPDATES.md`)
- GDPR Compliance Implementation (Task 1.2.3)
- Cache Security Analysis (`CACHE_SECURITY_ANALYSIS.md`)

---

**Document Status:** DRAFT - Awaiting Legal Review
**Author:** AI Engineering Team
**Review Required By:** Legal Department
**Target Approval Date:** [TBD]
