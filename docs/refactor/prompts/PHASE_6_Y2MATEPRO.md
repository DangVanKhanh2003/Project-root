# GIAI ĐOẠN 6: DI TRÚ Y2MATEPRO - HƯỚNG DẪN CHO AI

> **Phase:** Y2matepro Migration (Tuần 13-15)
> **Mục tiêu:** Migrate PRODUCTION app lên refactored architecture
> **Mức độ rủi ro:** 🔴 **RẤT CAO - TRANG SẢN XUẤT**
> **Yêu cầu:** Giai đoạn 1-5 đã hoàn thành HOÀN HẢO

---

## ⚠️⚠️⚠️ CẢNH BÁO CỰC KỲ QUAN TRỌNG ⚠️⚠️⚠️

**PHASE NÀY MIGRATE PRODUCTION SITE - Y2MATEPRO**

**ĐÂY KHÔNG PHẢI TEST APP. ĐÂY LÀ PRODUCTION.**

### **Điều này có nghĩa:**

- ❌ **KHÔNG ĐƯỢC SAI**
- ❌ **KHÔNG ĐƯỢC BREAK SITE**
- ❌ **KHÔNG ĐƯỢC DOWNTIME**
- ❌ **KHÔNG THỬ NGHIỆM TRÊN PRODUCTION**

### **Bắt buộc:**

- ✅ Testing HOÀN HẢO trước khi deploy
- ✅ Rollback plan SẴN SÀNG
- ✅ Backup TOÀN BỘ trước khi merge
- ✅ Feature flags cho safety
- ✅ Staged rollout (test environment trước)
- ✅ Monitoring sẵn sàng
- ✅ Human approval BẮT BUỘC

---

## 📚 TÀI LIỆU BẮT BUỘC PHẢI ĐỌC

### **Tài liệu quan trọng:**
1. `/docs/refactor/MASTER_REFACTOR_DOC.md` - ĐỌC PHẦN Y2MATEPRO KỸ
2. All Phase 1-5 prompts
3. Phase 5 Migration Playbook (lessons learned)
4. `/CLAUDE.md` - Deployment rules
5. Y2matepro specific docs (nếu có)

### **Code files CỰC KỲ quan trọng:**

**Y2matepro app (PRODUCTION):**
- `/apps/y2matepro/` (TOÀN BỘ APP - đọc kỹ)
- Hiểu TOÀN BỘ architecture
- Note EVERY difference với clone apps
- Understand Eleventy SSG integration

**Đặc biệt chú ý:**
- `/apps/y2matepro/.eleventy.js` - Static site generator config
- Build process
- Deployment pipeline
- `.github/workflows/` - CI/CD

**Y2matepro KHÁC với clone apps:**
- ✅ Uses Eleventy SSG (Static Site Generation)
- ✅ Deploy via GitHub Actions
- ❌ THIẾU state layer
- ❌ THIẾU UI render layer (trong một số cases)
- ✅ Has production traffic
- ✅ SEO critical

---

## 🎯 MỤC TIÊU PHASE 6

### **Mục tiêu chính:**

1. **Migrate y2matepro lên packages:**
   - Use @downloader/core (utilities + conversion)
   - Use @downloader/i18n (19 languages)
   - Use @downloader/ui-components (where applicable)
   - **NHƯNG** respect y2matepro's architecture differences

2. **Handle architectural differences:**
   - Eleventy SSG compatibility
   - No state layer → Adapt StateUpdater
   - Different build process
   - SSR vs CSR considerations

3. **Maintain production quality:**
   - ZERO downtime
   - ZERO bugs
   - Performance same hoặc BETTER
   - SEO maintained hoặc improved

4. **Safe deployment:**
   - Test environment deployment FIRST
   - Feature flags
   - Gradual rollout
   - Rollback ready
   - Monitoring

### **Tiêu chí thành công:**
- [ ] y2matepro migrated successfully
- [ ] All features working in production
- [ ] Performance same hoặc better
- [ ] SEO maintained
- [ ] Zero downtime during deployment
- [ ] Rollback plan tested và ready
- [ ] Monitoring shows no issues
- [ ] User metrics unchanged hoặc improved

---

## 🚫 RÀNG BUỘC CỰC KỲ NGHIÊM NGẶT

### **TUYỆT ĐỐI KHÔNG ĐƯỢC:**
- ❌ Break production
- ❌ Deploy chưa test kỹ
- ❌ Ignore architectural differences
- ❌ Force state layer vào (nó không có state layer)
- ❌ Break Eleventy build
- ❌ Break SEO
- ❌ Slow down performance
- ❌ Skip rollback plan

### **BẮT BUỘC PHẢI:**
- ✅ Test THOROUGHLY on test environment
- ✅ Adapt to y2matepro's architecture
- ✅ Maintain Eleventy compatibility
- ✅ Create SSR-compatible StateUpdater
- ✅ Feature flags for safety
- ✅ Staged deployment
- ✅ Rollback plan ready
- ✅ Get human approval before production deploy

---

## 📋 Y2MATEPRO ARCHITECTURE ANALYSIS

### **Sự khác biệt CRITICAL:**

#### **1. Eleventy SSG**
- Static Site Generator
- Build time rendering
- HTML generated at build
- JavaScript minimal (progressive enhancement)

**Implications:**
- I18n phải work tại build time
- Components render server-side
- Conversion strategies inject client-side

#### **2. No State Layer**
- Không có centralized state management
- Conversion trực tiếp update DOM
- Simpler architecture

**Implications:**
- StateUpdater implementation khác
- Direct DOM manipulation
- No Redux/Zustand/etc.

#### **3. Different Build Process**
- Eleventy build → HTML files
- Post-processing
- Asset optimization

**Implications:**
- Package imports phải compatible
- Bundle strategy khác
- Tree-shaking critical

#### **4. SEO Critical**
- Production traffic
- Search engine indexed
- Performance matters for ranking

**Implications:**
- Bundle size critical
- Performance critical
- HTML structure critical

---

## 📋 CÁC TASK CHI TIẾT

### **Task 1: Deep Analysis Y2matepro**

**⚠️ Task này CRITICAL - dành nhiều thời gian**

**Cần hiểu:**

1. **Architecture hoàn chỉnh:**
   - Eleventy build process
   - How pages generated
   - JavaScript injection points
   - CSS strategy

2. **Current implementation:**
   - How conversion works hiện tại
   - How UI renders
   - How i18n works (nếu có)
   - How utilities used

3. **Dependencies:**
   - What depends on what
   - External libraries
   - Build dependencies

4. **Deployment pipeline:**
   - GitHub Actions workflow
   - Test environment
   - Production environment
   - Rollback process

**Output:**
```
Y2matepro Architecture Analysis
================================

Build Process:
- Eleventy version: [X]
- Build command: [X]
- Output directory: [X]
- Post-processing: [X]

Current State:
- Utilities: [Where/how used]
- Conversion: [How implemented]
- UI: [How rendered]
- I18n: [Current strategy]

Differences vs Clone Apps:
1. [Difference 1]
2. [Difference 2]
3. [Etc]

Critical Files:
- .eleventy.js
- [List critical files]

Dependencies Analysis:
[Dependency map]

Deployment:
- Test env: [URL]
- Production: [URL]
- Deploy process: [Steps]
- Rollback: [How to]

Risks Identified:
1. [Risk 1]
2. [Risk 2]

Questions:
1. [Question 1]
2. [Question 2]
```

**⚠️ KHÔNG tiếp tục cho đến khi analysis approved.**

---

### **Task 2: Adapt StateUpdater cho Y2matepro**

**Challenge:** Y2matepro không có state layer

**Solution options:**

**Option 1: DOM-based StateUpdater**
- StateUpdater directly updates DOM
- No centralized state
- Simpler implementation

**Option 2: Minimal State Layer**
- Add minimal state management
- Only for conversion state
- Keep simple

**Option 3: Hybrid**
- Some state in memory
- Some direct DOM updates
- Balance complexity/features

**Quyết định cần thảo luận với human.**

**Implementation:**
- Create y2matepro-specific StateUpdater
- Compatible với conversion strategies
- No breaking changes to strategies
- Test thoroughly

---

### **Task 3: I18n Integration với Eleventy**

**Challenge:** I18n phải work tại build time VÀ runtime

**Approach:**

1. **Build-time i18n:**
   - Eleventy data files cho mỗi language
   - Generate pages cho mỗi language
   - `/en/`, `/es/`, `/ar/`, etc.

2. **Runtime i18n:**
   - Client-side language switching
   - Load translations dynamically
   - Update without page reload

3. **Hybrid approach:**
   - Initial render: build-time
   - Dynamic content: runtime
   - Best of both worlds

**Implementation:**
- Integrate @downloader/i18n với Eleventy
- Create Eleventy plugin/filter
- Test all 19 languages
- Test RTL (Arabic, Urdu)

---

### **Task 4: Adapt UI Components**

**Challenge:** UI rendering khác so với clone apps

**Analyze:**
- How UI currently rendered
- Can use base components?
- Need modifications?

**Approach:**
1. **Where possible:**
   - Use @downloader/ui-components
   - Customize via CSS vars
   - Progressive enhancement

2. **Where not possible:**
   - Create y2matepro-specific components
   - Document why different
   - Keep DRY principles

---

### **Task 5: Bundle Optimization**

**CRITICAL cho production:**

**Analyze current bundle:**
```bash
cd apps/y2matepro
pnpm run build
# Analyze size
```

**Optimize:**
1. **Tree-shaking:**
   - Only import what's needed
   - Remove unused code

2. **Code splitting:**
   - Split by route (nếu có routes)
   - Lazy load heavy components
   - Critical CSS inline

3. **Minimize dependencies:**
   - Review mỗi dependency
   - Replace heavy libs nếu possible
   - Use native APIs where possible

**Target:**
- Bundle size ≤ hiện tại hoặc nhỏ hơn
- First paint < 2s
- Time to Interactive < 3s

---

### **Task 6: Testing Strategy**

**⚠️ Testing CRITICAL cho production**

#### **6.1 Test Environment**

**Setup:**
- Deploy to test-production branch
- Test environment URL
- Identical to production config
- BUT với noindex (SEO)

**Test on test environment:**
- [ ] All features
- [ ] All languages
- [ ] All scenarios
- [ ] Performance
- [ ] SEO tags

#### **6.2 Automated Testing**

**Add tests:**
- [ ] Unit tests cho StateUpdater
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Visual regression tests

**CI/CD:**
- Tests run on every commit
- Prevent broken builds
- Quality gates

#### **6.3 Manual Testing**

**Thorough manual testing:**
- [ ] Full user journeys
- [ ] Error scenarios
- [ ] Cross-browser
- [ ] Mobile devices
- [ ] Network conditions (3G/4G/WiFi)
- [ ] Different locations (CDN)

#### **6.4 Performance Testing**

**Measure:**
- [ ] Lighthouse CI
- [ ] WebPageTest
- [ ] Bundle analyzer
- [ ] Real User Monitoring (if possible)

**Compare:**
- Before migration metrics
- After migration metrics
- Ensure no regression

---

### **Task 7: Feature Flags**

**Implement feature flags cho safety:**

```
Feature flags:
- use_refactored_conversion: true/false
- use_i18n_system: true/false
- use_ui_components: true/false
```

**Benefits:**
- Enable features gradually
- Quick disable nếu có issues
- A/B testing possible
- Rollback không cần redeploy

**Implementation:**
- Simple config file
- Environment variables
- Easy to toggle

---

### **Task 8: Deployment Plan**

**Staged deployment:**

#### **Step 1: Test Environment**
1. Deploy to test-production branch
2. Test thoroughly
3. Fix any issues
4. Repeat until perfect

#### **Step 2: Production Deploy**
1. Create backup
2. Prepare rollback
3. Deploy với feature flags OFF
4. Verify site working
5. Enable features gradually
6. Monitor closely

#### **Step 3: Gradual Rollout**
1. 10% traffic → refactored code
2. Monitor metrics
3. 50% traffic
4. Monitor
5. 100% traffic
6. Celebrate 🎉

#### **Step 4: Cleanup**
After stable (1-2 weeks):
- Remove old code
- Remove feature flags
- Cleanup

---

### **Task 9: Monitoring & Rollback**

**Monitoring setup:**

**Metrics to watch:**
- Error rate
- Conversion success rate
- Page load time
- Bounce rate
- API response times

**Alerts:**
- Error rate spike
- Performance degradation
- Conversion failures

**Rollback plan:**

**If issues detected:**
1. **Quick rollback:**
   - Feature flags OFF
   - Immediate effect
   - No redeploy needed

2. **Full rollback:**
   - Revert git commit
   - Redeploy previous version
   - Takes ~10 minutes

3. **Communication:**
   - Notify team
   - Document issue
   - Plan fix

---

### **Task 10: Documentation**

**Document everything:**

1. **Migration guide:**
   - What was done
   - How it works now
   - Differences from clone apps

2. **Deployment guide:**
   - How to deploy
   - Feature flags
   - Rollback process

3. **Troubleshooting:**
   - Common issues
   - Solutions
   - Debugging tips

4. **Lessons learned:**
   - Challenges
   - Solutions
   - Best practices

---

## 🔄 WORKFLOW CHO PHASE 6

### **Bước 1: VERY EXTENDED DISCUSSION**

**⚠️⚠️⚠️ Phase 6 = PRODUCTION. Thảo luận CỰC KỲ KỸ.**

**Gửi detailed analysis và plan:**

```
Tôi bắt đầu Phase 6: Y2matepro Migration

⚠️⚠️⚠️ ĐÂY LÀ PRODUCTION SITE - CRITICAL ⚠️⚠️⚠️

Đã đọc:
- ✅ All documentation
- ✅ Phase 5 playbook
- ✅ Y2matepro codebase (TOÀN BỘ)
- ✅ Deployment pipeline

Y2MATEPRO ARCHITECTURE ANALYSIS:
[Paste detailed analysis từ Task 1]

CRITICAL DIFFERENCES từ Clone Apps:
1. [Difference 1 - impact và solution]
2. [Difference 2 - impact và solution]
3. [Etc]

STATEUPDATER ADAPTATION:
Current proposal: [Option X]
Reason: [Why this option]
Implementation: [How]
Testing: [How to test]

I18N STRATEGY:
Build-time: [Approach]
Runtime: [Approach]
19 languages: [How handled]
RTL: [How handled]

BUNDLE OPTIMIZATION PLAN:
Current size: [X] KB
Target size: [Y] KB
Strategy: [How to achieve]

TESTING STRATEGY:
Test environment: [URL]
Automated: [What tests]
Manual: [Checklist]
Performance: [Metrics]

DEPLOYMENT PLAN:
Step 1: [Deploy to test]
Step 2: [Test thoroughly]
Step 3: [Deploy to production với flags OFF]
Step 4: [Enable gradually]
Step 5: [Monitor]

ROLLBACK PLAN:
Quick: [Feature flags OFF - instant]
Full: [Git revert + redeploy - 10 min]
Monitoring: [Metrics to watch]

RISKS:
1. **Production downtime:**
   - Probability: [Low/Medium/High]
   - Impact: CRITICAL
   - Mitigation: [Plan]

2. **Performance regression:**
   - Probability: [Low/Medium/High]
   - Impact: HIGH
   - Mitigation: [Plan]

3. **SEO impact:**
   - Probability: [Low/Medium/High]
   - Impact: HIGH
   - Mitigation: [Plan]

4. [Other risks]

TIMELINE:
- Analysis: [X] days
- Implementation: [Y] days
- Testing: [Z] days (KHÔNG RUSH)
- Deployment: [W] days (gradual)
Total: [T] days

QUESTIONS:
1. [Critical question 1]
2. [Critical question 2]

⚠️ Tôi sẽ KHÔNG proceed cho đến khi:
1. Human approve plan hoàn toàn
2. Test environment ready
3. Rollback plan verified
4. Monitoring setup
5. Backup created

Awaiting EXPLICIT approval.
```

**⚠️ ĐỢI APPROVAL. PRODUCTION KHÔNG CHẤP NHẬN SAI.**

---

### **Bước 2: Test Environment Implementation**

1. Deploy to `test-production` branch
2. Test EVERYTHING
3. Fix issues
4. Repeat

**Không proceed production cho đến khi test environment PERFECT.**

---

### **Bước 3: Production Deployment**

1. Human final approval ✅
2. Create backup
3. Deploy
4. Feature flags OFF
5. Verify working
6. Enable gradually
7. Monitor intensely

---

### **Bước 4: Post-Deployment**

1. Monitor 24/7 first week
2. Collect metrics
3. Fix any issues immediately
4. Optimize further
5. Document

---

## ✅ DEFINITION OF DONE

Phase 6 hoàn thành khi:

- [ ] y2matepro migrated successfully
- [ ] Test environment perfect
- [ ] Production deployed successfully
- [ ] ZERO downtime
- [ ] All features working
- [ ] Performance same hoặc better
- [ ] SEO maintained
- [ ] 19 languages working
- [ ] RTL working
- [ ] No errors in production
- [ ] Metrics healthy
- [ ] Monitoring active
- [ ] Rollback plan tested
- [ ] Documentation complete
- [ ] Team trained on new system
- [ ] Stable for 1 week minimum

---

## 📊 EXPECTED METRICS

**Sau Phase 6:**
- Production sites migrated: 1 (y2matepro)
- Downtime: 0 seconds
- Performance: Same hoặc better
- Error rate: Same hoặc lower
- User satisfaction: Same hoặc higher

---

**Phase 6 là MOST CRITICAL. Take your time. Test thoroughly. Deploy safely.** 🚨

**Nhớ: PRODUCTION = ZERO TOLERANCE FOR ERRORS**
