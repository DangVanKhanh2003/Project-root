# PHASE 7: REMAINING APPS MIGRATION - HƯỚNG DẪN CHO AI

> **Phase:** Remaining Apps (Tuần 16-17)
> **Mục tiêu:** Migrate 3 apps còn lại
> **Mức độ rủi ro:** 🟡 Trung bình (non-production)
> **Yêu cầu:** Phase 1-6 hoàn thành

---

## 🎯 TỔNG QUAN PHASE 7

### **Apps cần migrate:**

1. **ytmp3-clone-3** - Original reference app
2. **ytmp3-clone-darkmode-3** - Dark theme variant
3. **y2mate-new-ux** - New UX experiment

**Đã migrated:**
- ✅ ytmp3-clone-4 (Phase 5 - pilot)
- ✅ y2matepro (Phase 6 - production)

### **Tại sao dễ hơn Phase 5-6:**

- ✅ Đã có playbook from Phase 5
- ✅ Đã có experience from Phase 6
- ✅ Apps không phải production (lower risk)
- ✅ Architecture giống clone-4 (straightforward)
- ✅ Can migrate song song (parallel)

---

## 📋 STRATEGY

### **Approach: Replicate Phase 5 Success**

**For EACH app:**
1. Audit app (như Phase 5 Task 1)
2. Follow Phase 5 migration plan
3. Adapt for app-specific features
4. Test thoroughly
5. Document differences

### **Parallel Migration Possible:**

Vì apps độc lập, có thể migrate:
- Clone-3 và darkmode-3 song song
- new-ux riêng (có thể khác biệt nhiều)

---

## 📋 CÁC APP CHI TIẾT

### **App 1: ytmp3-clone-3**

**Đặc điểm:**
- Original reference app
- Full architecture (state + UI + conversion)
- Source of truth trong Phase 1-4

**Migration:**
- Straightforward (giống clone-4)
- Follow Phase 5 playbook exactly
- Main difference: Đây là reference, keep as backup?

**Decision needed:**
- Migrate clone-3 hay giữ làm reference?
- Nếu migrate: Archive old version
- Nếu không: Document why kept

### **App 2: ytmp3-clone-darkmode-3**

**Đặc điểm:**
- Clone-3 + dark theme
- Additional dark mode CSS
- Toggle light/dark

**Migration:**
- Như clone-4
- PLUS: Dark theme customization
- CSS Custom Properties cho theme

**Customization:**
- Override CSS vars cho dark colors
- Test theme switching
- Verify both themes work

### **App 3: y2mate-new-ux**

**Đặc điểm:**
- Different UX/UI
- Experimental features?
- May have unique components

**Migration:**
- Audit carefully (có thể khác biệt nhiều)
- Use packages where possible
- Keep UX-specific code local
- Document differences

**Risk:** Higher (unknown differences)

---

## 📋 TASKS

### **Task 1: Apps Audit**

For EACH app:

**Analyze:**
- Current structure
- Differences vs clone-4
- Unique features
- Custom components

**Output:**
```
[App Name] Audit
================

Similarities with clone-4:
[List]

Differences:
[List with impact]

Unique features:
[List]

Custom components:
[List - keep or migrate?]

Estimated effort:
[X] days

Migration approach:
[Plan]
```

### **Task 2: Parallel Migration Plan**

**Group apps:**

**Group A (Parallel):**
- ytmp3-clone-3
- ytmp3-clone-darkmode-3
- Reason: Similar architecture

**Group B (Sequential):**
- y2mate-new-ux
- Reason: May have unique challenges

**Timeline:**
```
Week 1:
- Day 1-2: Audit all apps
- Day 3-4: Migrate clone-3
- Day 5-6: Migrate darkmode-3

Week 2:
- Day 1-3: Migrate new-ux
- Day 4-5: Testing all apps
- Day 6-7: Documentation & cleanup
```

### **Task 3: Migrate ytmp3-clone-3**

**Follow Phase 5 playbook:**

1. ✅ Complete i18n
2. ✅ Complete UI components
3. ✅ Complete utilities
4. ✅ State cleanup
5. ✅ Integration testing
6. ✅ Optimization

**Specific considerations:**
- Đây là reference app từ Phase 1-4
- Verify không break references
- Consider keeping backup

### **Task 4: Migrate ytmp3-clone-darkmode-3**

**Follow clone-3 + Dark theme:**

**Additional steps:**
1. Migrate base (như clone-3)
2. Adapt dark theme:
   - Override CSS custom properties
   - Dark color scheme
   - Test theme toggle
3. Verify both themes work

**Dark theme customization:**
```css
/* Dark theme CSS vars override */
--bg-color: #1a1a1a;
--text-color: #ffffff;
--primary-color: #4a9eff;
/* etc */
```

### **Task 5: Migrate y2mate-new-ux**

**Careful approach:**

1. **Deep audit first:**
   - What's different?
   - Unique UX elements?
   - Custom components?

2. **Migration strategy:**
   - Use packages where applicable
   - Keep UX-specific local
   - Document why different

3. **Testing:**
   - Verify unique UX preserved
   - All custom features work
   - No regressions

### **Task 6: Cross-App Verification**

**After all migrations:**

**Verify consistency:**
- [ ] All apps use same packages
- [ ] All apps have 0% duplication
- [ ] All apps have i18n (19 languages)
- [ ] All apps use StateUpdater pattern

**Verify independence:**
- [ ] Each app's UI unique (where intended)
- [ ] Customizations work
- [ ] No conflicts

### **Task 7: Documentation**

**Update documentation:**

1. **Per-app migration notes:**
   - What was unique
   - How handled
   - Lessons learned

2. **Final metrics:**
   ```
   Total Refactor Metrics
   ======================
   Apps migrated: 5/5
   Packages created: 3
   Code duplication eliminated: ~20,000 lines
   Test coverage: [X]%
   Languages supported: 19
   ```

3. **Maintenance guide:**
   - How to add new features
   - How to maintain packages
   - How to customize per app

---

## ✅ DEFINITION OF DONE

Phase 7 hoàn thành khi:

- [ ] ytmp3-clone-3 migrated (hoặc archived với justification)
- [ ] ytmp3-clone-darkmode-3 migrated
- [ ] y2mate-new-ux migrated
- [ ] All 5 apps using packages
- [ ] 0% code duplication across apps
- [ ] All apps tested
- [ ] All apps' unique features preserved
- [ ] Documentation complete
- [ ] Metrics collected
- [ ] Ready for Phase 8 (polish)

---

## 📊 EXPECTED OUTCOME

**Sau Phase 7:**
- Apps fully migrated: 5/5 (100%)
- Total duplication eliminated: ~20,000-25,000 lines
- Maintenance overhead: Significantly reduced
- Code reuse: Maximized
- Ready for polish phase

---

**Phase 7 là consolidation - Áp dụng lessons learned vào apps còn lại!** 🚀
