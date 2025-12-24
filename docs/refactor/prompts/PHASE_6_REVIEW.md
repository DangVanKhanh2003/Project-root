# GIAI ĐOẠN 6 - MẪU REVIEW CHO AI CODE REVIEWER

> **Giai đoạn:** Giai đoạn 6 - Di trú y2matepro
> **Loại Review:** Production Code Review
> **Vai trò:** AI Code Reviewer
> **⚠️⚠️⚠️ CRITICAL:** PRODUCTION SITE - ZERO TOLERANCE

---

## 🚨 PRODUCTION REVIEW WARNING

**ĐÂY LÀ PRODUCTION CODE REVIEW**

**Standards khác hoàn toàn với test apps:**
- ✅ PERFECT hoặc reject
- ✅ Testing phải EXCELLENT
- ✅ Rollback plan phải SẴN SÀNG
- ✅ Performance CRITICAL
- ✅ SEO CRITICAL
- ❌ NO bugs acceptable
- ❌ NO "sẽ fix later"
- ❌ NO experiments

---

## 📚 PHẢI ĐỌC TRƯỚC KHI REVIEW

**BẮT BUỘC (theo thứ tự):**
1. `/docs/refactor/MASTER_REFACTOR_DOC.md` - Phần y2matepro
2. All Phase 1-5 prompts
3. Phase 5 Migration Playbook
4. `/docs/refactor/prompts/PHASE_6_Y2MATEPRO.md` - Requirements
5. PR description (phải EXTREMELY detailed)
6. Test results document
7. Performance metrics
8. Deployment plan
9. Rollback plan

---

## ✅ PHASE 6 REVIEW CHECKLIST

### **1. PRE-DEPLOYMENT VERIFICATION**

#### **1.1 Test Environment Results**

**CRITICAL - Must have evidence:**

- [ ] Test environment URL provided
- [ ] All features tested on test env
- [ ] Screenshots/videos of testing
- [ ] No errors in test env
- [ ] Performance metrics from test env
- [ ] Cross-browser testing done
- [ ] Mobile testing done

**Ask for PROOF:**
```
Test Environment Evidence:
========================
URL: [test env URL]
Testing period: [X] days
Features tested: [List]
Scenarios tested: [List]
Browsers tested: [List]
Mobile devices: [List]
Issues found: [List]
Issues fixed: [List]
Final status: [All green]
```

**⚠️ Nếu NO test env evidence → REJECT immediately**

#### **1.2 Performance Testing**

**Compare metrics:**

| Metric | Before | After | Change | Status |
|--------|--------|-------|--------|--------|
| Bundle size | [X] KB | [Y] KB | [Z] | ✅/❌ |
| First Paint | [X] ms | [Y] ms | [Z] | ✅/❌ |
| TTI | [X] ms | [Y] ms | [Z] | ✅/❌ |
| Lighthouse | [X] | [Y] | [Z] | ✅/❌ |

**Acceptance criteria:**
- Bundle size: Same hoặc smaller
- First Paint: ≤ before
- TTI: ≤ before
- Lighthouse: ≥ 80 (ideally ≥ 90)

**⚠️ Nếu ANY regression → Request detailed explanation và mitigation**

#### **1.3 Rollback Plan**

**CRITICAL - Must exist và detailed:**

Check rollback documentation:
- [ ] Quick rollback (feature flags) documented
- [ ] Full rollback (git revert) documented
- [ ] Rollback tested on test environment
- [ ] Rollback time estimated
- [ ] Team knows how to rollback
- [ ] Monitoring for when to rollback

**Ask:** "Nếu production breaks sau deploy 5 phút, làm thế nào rollback?"

**Acceptable answer:** Detailed step-by-step, time estimate, tested

**⚠️ Nếu NO clear rollback plan → REJECT**

---

### **2. CODE QUALITY (STRICT)**

#### **2.1 Zero Duplication**

**Same as Phase 5 nhưng STRICTER:**

```bash
# Should be ZERO
diff -r apps/y2matepro/src packages/
```

- [ ] ✅ Absolutely zero duplicate code
- [ ] ❌ Any duplication found → REJECT

#### **2.2 Eleventy Compatibility**

**CRITICAL - Must maintain SSG:**

- [ ] Eleventy build works
- [ ] HTML generated correctly
- [ ] Static pages work
- [ ] JavaScript injected properly
- [ ] CSS bundled correctly
- [ ] Assets optimized

**Test:**
```bash
cd apps/y2matepro
pnpm run build
# Check dist/ output
```

#### **2.3 StateUpdater for Y2matepro**

**Different from clone apps:**

- [ ] StateUpdater adapted for no-state architecture
- [ ] DOM updates work correctly
- [ ] No state management overhead
- [ ] Clean implementation
- [ ] Well documented

#### **2.4 TypeScript - Perfect**

- [ ] ZERO errors
- [ ] ZERO warnings
- [ ] ZERO `any` types (or justified)
- [ ] Strict mode compliant
- [ ] All types exported

---

### **3. FUNCTIONALITY (PERFECT)**

#### **3.1 All Features Working**

**Test on test environment:**

- [ ] URL input works
- [ ] Format selection works
- [ ] All 4 conversion strategies work
- [ ] Progress display correct
- [ ] Download works
- [ ] Error handling works
- [ ] All edge cases work

**Evidence required:**
- Screen recordings
- Test reports
- No errors

#### **3.2 19 Languages**

**ALL 19 must work:**

- [ ] All locale files complete
- [ ] Language switching works
- [ ] Eleventy builds pages for all languages
- [ ] SEO tags correct per language
- [ ] RTL works (Arabic, Urdu)
- [ ] No layout breaks

#### **3.3 SEO Maintained**

**CRITICAL for production:**

- [ ] Meta tags correct
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] Structured data (JSON-LD)
- [ ] Sitemap generated
- [ ] Robots.txt correct
- [ ] Canonical URLs
- [ ] Hreflang tags (19 languages)

**Compare:**
- Before: SEO score
- After: SEO score
- Must be same hoặc better

---

### **4. DEPLOYMENT SAFETY**

#### **4.1 Feature Flags**

Check feature flags implemented:

- [ ] Feature flags exist
- [ ] Can enable/disable features
- [ ] Works in production
- [ ] Tested on test environment
- [ ] Documentation clear

#### **4.2 Monitoring**

**Must have monitoring:**

- [ ] Error tracking (Sentry/similar)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Alerts configured
- [ ] Dashboard ready

**Metrics to watch:**
- Error rate
- Response time
- Conversion success rate
- User engagement

#### **4.3 Deployment Plan**

Check deployment plan:

- [ ] Step-by-step documented
- [ ] Staged rollout plan
- [ ] Timeline realistic
- [ ] Team coordinated
- [ ] Maintenance window (if needed)

---

### **5. TESTING EXCELLENCE**

#### **5.1 Test Coverage**

**Higher bar for production:**

- [ ] Unit tests: 80%+
- [ ] Integration tests exist
- [ ] E2E tests exist
- [ ] Visual regression tests
- [ ] All tests passing

#### **5.2 Test Quality**

- [ ] Tests comprehensive
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Performance tested
- [ ] Security tested

---

### **6. DOCUMENTATION (EXCELLENT)**

#### **6.1 Required Docs**

- [ ] Migration guide complete
- [ ] Architecture docs updated
- [ ] Deployment guide
- [ ] Rollback guide
- [ ] Troubleshooting guide
- [ ] Monitoring guide

#### **6.2 Code Documentation**

- [ ] Complex logic commented
- [ ] Y2matepro-specific adaptations explained
- [ ] StateUpdater usage clear
- [ ] Eleventy integration documented

---

## 🚨 CRITICAL ISSUES (IMMEDIATE REJECT)

**Nếu tìm thấy BẤT KỲ issues sau, REJECT ngay lập tức:**

1. **No Test Environment Testing**
   - Không test trên test environment
   - No evidence of testing
   - Chỉ test local

2. **Performance Regression**
   - Bundle larger significantly
   - Slower load time
   - Worse Lighthouse score
   - No explanation/mitigation

3. **No Rollback Plan**
   - Không có rollback documentation
   - Rollback chưa test
   - Không biết làm sao rollback

4. **Features Broken**
   - Any feature không work
   - Conversion fails
   - Error handling broken

5. **SEO Broken**
   - Meta tags missing/wrong
   - Sitemap broken
   - Hreflang issues
   - Structured data wrong

6. **Code Quality Issues**
   - TypeScript errors
   - Code duplication
   - Poor implementation
   - Security issues

7. **No Monitoring**
   - Không có error tracking
   - Không có alerts
   - Blind deploy

8. **Eleventy Build Fails**
   - Build errors
   - HTML wrong
   - Static generation broken

---

## ⚠️ WARNINGS (Must Address Before Production)

**Không immediate reject nhưng MUST fix:**

1. **Documentation Gaps**
   - Some docs incomplete
   - Need more detail

2. **Minor Performance Issues**
   - Small bundle increase với explanation
   - Minor optimizations possible

3. **Test Coverage Gaps**
   - Coverage < 80% in some areas
   - Missing some edge cases

---

## ✅ APPROVAL CRITERIA (STRICT)

**Chỉ approve khi TẤT CẢ đúng:**

- [ ] Test environment perfect
- [ ] Performance same hoặc better
- [ ] All features working
- [ ] SEO maintained
- [ ] Rollback plan excellent
- [ ] Monitoring ready
- [ ] Documentation excellent
- [ ] Code quality perfect
- [ ] Tests comprehensive
- [ ] Team ready to deploy
- [ ] Human sign-off ready

**Confidence level required:** 100%

**⚠️ Nếu ANY doubt → Do NOT approve**

---

## 📝 REVIEW TEMPLATE (STRICT)

```markdown
## Đánh giá sản phẩm Giai đoạn 6 - y2matepro

⚠️⚠️⚠️ **PRODUCTION SITE - ZERO TOLERANCE** ⚠️⚠️⚠️

### Verdict

**[✅ APPROVE FOR PRODUCTION | ⚠️ APPROVE FOR TEST ONLY | ❌ REJECT]**

**Confidence:** [0-100]%

[If < 100%, explain why]

---

### Test Environment Verification

**Test Environment:** [URL]

**Testing Duration:** [X] days

**Evidence Reviewed:**
- [ ] Screenshots: [✅/❌]
- [ ] Videos: [✅/❌]
- [ ] Test reports: [✅/❌]
- [ ] Performance metrics: [✅/❌]

**All Features Tested:** [✅/❌]

**Issues Found & Fixed:** [List]

**Final Status:** [✅ All Green | ❌ Issues Remain]

---

### Performance Metrics

| Metric | Before | After | Change | Status |
|--------|--------|-------|--------|--------|
| Bundle | [X] KB | [Y] KB | [Z] | [✅/❌] |
| FP | [X] ms | [Y] ms | [Z] | [✅/❌] |
| TTI | [X] ms | [Y] ms | [Z] | [✅/❌] |
| Lighthouse | [X] | [Y] | [Z] | [✅/❌] |

**Assessment:** [✅ Acceptable | ❌ Regression]

[If regression, detailed explanation required]

---

### SEO Verification

- Meta tags: [✅/❌]
- Open Graph: [✅/❌]
- Structured data: [✅/❌]
- Sitemap: [✅/❌]
- Hreflang (19): [✅/❌]
- Robots.txt: [✅/❌]

**SEO Score:** [Before: X, After: Y]

**Status:** [✅/❌]

---

### Rollback Plan

**Quick Rollback (Feature Flags):**
- Documented: [✅/❌]
- Tested: [✅/❌]
- Time: [X] seconds

**Full Rollback (Git Revert):**
- Documented: [✅/❌]
- Tested: [✅/❌]
- Time: [X] minutes

**Triggers for Rollback:**
[List conditions]

**Team Readiness:** [✅/❌]

**Status:** [✅ Ready | ❌ Not Ready]

---

### Deployment Plan

**Staging:**
- [ ] Test environment deploy
- [ ] Full testing complete
- [ ] All issues resolved

**Production:**
- [ ] Backup created
- [ ] Feature flags OFF
- [ ] Deploy
- [ ] Verify
- [ ] Enable gradually
- [ ] Monitor

**Timeline:** [Detailed schedule]

**Status:** [✅ Clear Plan | ❌ Unclear]

---

### Monitoring

**Error Tracking:** [✅/❌] - [Tool]

**Performance:** [✅/❌] - [Tool]

**Uptime:** [✅/❌] - [Tool]

**Alerts Configured:** [✅/❌]

**Dashboard Ready:** [✅/❌]

**Status:** [✅ Ready | ❌ Not Ready]

---

### Code Quality

**Duplication:** [✅ Zero | ❌ Found [X] lines]

**TypeScript:** [✅ Zero errors | ❌ [X] errors]

**Eleventy Build:** [✅ Working | ❌ Broken]

**StateUpdater:** [✅ Adapted | ❌ Issues]

**Overall:** [✅/❌]

---

### Testing

**Unit Tests:** [X]% coverage [✅/❌]

**Integration Tests:** [✅/❌]

**E2E Tests:** [✅/❌]

**Visual Tests:** [✅/❌]

**All Passing:** [✅/❌]

---

### Critical Issues

[List hoặc "None"]

1. [Issue - MUST FIX]
2. [Issue - MUST FIX]

---

### Warnings

[List hoặc "None"]

1. [Warning - Should fix]

---

### Recommendations

**Before Production Deploy:**
1. [Required action]
2. [Required action]

**Post-Deploy:**
1. [Monitoring action]
2. [Optimization]

---

### Final Assessment

**Production Ready:** [YES/NO]

**Risk Level:** [LOW/MEDIUM/HIGH]

[If MEDIUM or HIGH, explain mitigation]

**Recommendation:**

[APPROVE FOR PRODUCTION | APPROVE TEST ONLY | REJECT]

---

### Bước tiếp theo

1. [Action]
2. [Action]
```

---

## 🎯 REMEMBER

**Là Production Reviewer, bạn đang:**
- ✅ Protecting production site
- ✅ Ensuring zero downtime
- ✅ Verifying perfect quality
- ✅ Checking rollback ready

**Standard cao hơn NHIỀU so với test apps.**

**When in doubt → DO NOT APPROVE**

---

**Review CỰC KỲ CẨN THẬN! Production không tha thứ sai lầm.** 🚨
