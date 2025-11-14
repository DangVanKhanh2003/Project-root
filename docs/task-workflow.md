# Task Execution Workflow

Quy trình thực hiện task chuyên nghiệp để đảm bảo chất lượng code và giải pháp tối ưu.

## 🚨 QUY TẮC VÀNG: KHÔNG BAO GIỜ CODE NGAY LẬP TỨC

**LUÔN LUÔN tuân thủ quy trình 7 bước này trước khi viết một dòng code nào.**

---

## Phase 1: 🔍 PHÂN TÍCH & RESEARCH (CRITICAL)

### 1.1 Phân Tích Vấn Đề Sâu
- [ ] **Đọc và hiểu đầy đủ requirements**
- [ ] **Xác định scope và boundaries của task**
- [ ] **Liệt kê tất cả constraints và limitations**
- [ ] **Phân tích impact lên existing codebase**

### 1.2 Research Kỹ Càng
- [ ] **Nghiên cứu trên Google về best practices**
- [ ] **Tìm hiểu solutions tương tự từ community**
- [ ] **Research các thư viện/tools có thể hỗ trợ**
- [ ] **Đọc documentation liên quan**
- [ ] **Tìm hiểu potential pitfalls và common mistakes**

### 1.3 Mandatory File Checks
- [ ] **ĐỌC `/docs/learned.md` - tránh lặp lại mistakes**
- [ ] **ĐỌC `/docs/cls-guidelines.md` - performance requirements**
- [ ] **ĐỌC `/docs/comment-guidelines.md` - function comment standards**
- [ ] **KIỂM TRA `learned.md` ở project root**
- [ ] **REVIEW các files liên quan trong project**

### 1.4 Deliverable - Analysis Report
**KHÔNG TRÍCH CODE** - chỉ giải thích:
```
## Phân Tích Task: [Tên Task]

### Vấn Đề Cần Giải Quyết
[Mô tả chi tiết vấn đề]

### Research Findings
[Kết quả nghiên cứu, best practices tìm được]

### Potential Approaches
[Các approach có thể, ưu/nhược điểm]

### Constraints & Considerations
[Các ràng buộc, yêu cầu đặc biệt]

### Recommended Direction
[Hướng tiếp cận được khuyến nghị và lý do]
```

**⏸️ DỪNG TẠI ĐÂY - CHỜ USER CONFIRM**

---

## Phase 2: 💬 CLARIFICATION & DISCUSSION

### 2.1 Thảo Luận Với User
- [ ] **Present analysis findings**
- [ ] **Hỏi clarifying questions về requirements**
- [ ] **Thảo luận về trade-offs của các approaches**
- [ ] **Confirm scope và expectations**

### 2.2 Edge Cases & Scenarios
- [ ] **Liệt kê tất cả edge cases có thể**
- [ ] **Thảo luận error handling strategies**
- [ ] **Xác định testing scenarios**
- [ ] **Discuss performance implications**

### 2.3 Requirements Refinement
- [ ] **Làm rõ ambiguous requirements**
- [ ] **Prioritize features nếu có multiple requirements**
- [ ] **Set clear acceptance criteria**
- [ ] **Agree on definition of "done"**

**⏸️ DỪNG TẠI ĐÂY - CHỜ USER INPUT**

---

## Phase 3: 📋 SYNTHESIS & PLANNING

### 3.1 Tổng Hợp Lại Toàn Bộ
```
## Tổng Hợp Final Requirements

### Confirmed Scope
[Chi tiết scope đã được confirm]

### Technical Approach
[Approach cuối cùng đã chọn]

### Edge Cases Covered
[Tất cả edge cases sẽ handle]

### Success Criteria
[Tiêu chí đánh giá thành công]

### Risk Mitigation
[Các risks đã identify và cách handle]
```

**⏸️ DỪNG TẠI ĐÂY - CHỜ USER FINAL CONFIRM**

---

## Phase 4: 🗺️ DETAILED IMPLEMENTATION PLAN

### 4.1 Kế Hoạch Chi Tiết Từng Bước
```
## Implementation Plan

### Step 1: [Mô tả bước 1]
- Sub-task 1.1: [Chi tiết]
- Sub-task 1.2: [Chi tiết]
- Files to modify: [Danh sách files]

### Step 2: [Mô tả bước 2]
- Sub-task 2.1: [Chi tiết]
- Sub-task 2.2: [Chi tiết]
- Dependencies: [Phụ thuộc vào step nào]

### Step N: [Final step]
- Testing strategy
- Integration points
- Review checklist
```

### 4.2 Technical Specifications
- [ ] **Component architecture decisions**
- [ ] **Data flow diagrams (nếu cần)**
- [ ] **API contracts (nếu có)**
- [ ] **State management strategy**
- [ ] **CSS architecture decisions**

### 4.3 Quality Gates
- [ ] **Performance budget compliance**
- [ ] **Mobile-first requirements**
- [ ] **Critical CSS separation**
- [ ] **Module structure compliance**
- [ ] **Accessibility requirements**

---

## Phase 5: 🔨 IMPLEMENTATION

### 5.1 Execute Implementation Plan
- [ ] **Follow implementation plan từng bước**
- [ ] **Commit changes theo logical chunks**
- [ ] **Document code với clear comments**
- [ ] **Follow project coding standards**

### 5.2 Continuous Testing
- [ ] **Test từng component khi hoàn thành**
- [ ] **Manual testing trên multiple devices**
- [ ] **Check performance budget compliance**
- [ ] **Validate against requirements**

---

## Phase 6: 🧪 TESTING & DEBUGGING

### 6.1 Comprehensive Testing
- [ ] **Functional testing tất cả features**
- [ ] **Edge case testing**
- [ ] **Cross-browser testing**
- [ ] **Mobile responsiveness testing (350px → 4K+)**
- [ ] **Performance testing**
- [ ] **Accessibility testing**

### 6.2 Debug & Fix Issues
- [ ] **Document tất cả bugs found**
- [ ] **Prioritize bugs theo severity**
- [ ] **Fix bugs systematic approach**
- [ ] **Re-test after mỗi fix**
- [ ] **Regression testing**

### 6.3 Performance Validation
- [ ] **LCP ≤ 2.5s**
- [ ] **CLS < 0.1**
- [ ] **TBT ≤ 200ms**
- [ ] **Critical CSS ≤ 10KB**
- [ ] **Initial JS ≤ 70KB gzip**

---

## Phase 7: 🔍 CODE REVIEW & QUALITY ASSURANCE

### 7.1 Self Code Review
- [ ] **Review code against project standards**
- [ ] **Check CLAUDE.md compliance**
- [ ] **Validate mobile-first approach**
- [ ] **Verify critical CSS separation**
- [ ] **Check module structure**

### 7.2 Quality Checklist Validation
**Run through complete Quality Checklist từ CLAUDE.md:**

#### 🔥 MANDATORY CHECKS
- [ ] **Đã đọc `learned.md` và `cls-guidelines.md`**
- [ ] **Mobile-first design từ 350px**
- [ ] **Critical CSS trong `/src/styles/critical/`**
- [ ] **Module separation đúng chuẩn**

#### 📱 RESPONSIVE & CSS
- [ ] **Đầy đủ breakpoints (bao gồm 2K, 4K)**
- [ ] **Chỉ sử dụng `min-width`**
- [ ] **Design tokens, không hardcode**
- [ ] **Critical/feature CSS separation**

#### ⚡ PERFORMANCE & STRUCTURE
- [ ] **Performance budgets không vượt**
- [ ] **Critical CSS ≤ 10KB**
- [ ] **Proper module exports**
- [ ] **Dynamic imports cho code splitting**

#### 🔧 TECHNICAL
- [ ] **Không console errors**
- [ ] **Accessibility compliance**
- [ ] **CLS guidelines followed**
- [ ] **Animation triggers proper**

#### 📐 2K/4K SUPPORT
- [ ] **Layout works trên 2K (1920-2559px)**
- [ ] **Layout works trên 4K (2560px+)**
- [ ] **Typography scaling appropriate**

### 7.3 Function Comment Review & Documentation
- [ ] **Liệt kê tất cả functions lớn/quan trọng cần comment**
- [ ] **Hỏi user confirm từng function trong list**
- [ ] **Thêm comments theo format trong `/docs/comment-guidelines.md`**
- [ ] **Review comments accuracy vs implementation**

### 7.4 Documentation & Cleanup
- [ ] **Update documentation nếu cần**
- [ ] **Clean up temporary files**
- [ ] **Optimize imports và dependencies**
- [ ] **Add học được lessons vào `learned.md` (ask permission first)**

---

## 🎯 FINAL DELIVERABLE TEMPLATE

```
## Task Completion Summary

### ✅ Requirements Fulfilled
[Liệt kê tất cả requirements đã complete]

### 🧪 Testing Results
[Kết quả testing, performance metrics]

### 📱 Device Compatibility
[Các devices/screens đã test]

### 🚀 Performance Metrics
- LCP: [số liệu]
- CLS: [số liệu]
- TBT: [số liệu]
- CSS Size: [số liệu]
- JS Size: [số liệu]

### 🔄 Changes Made
[Summary các files modified]

### 🎓 Lessons Learned
[Bài học rút ra, potential improvements]

### 📋 Ready For Review
All quality gates passed ✅
```

---

## ⚠️ IMPORTANT REMINDERS

1. **KHÔNG BAO GIỜ SKIP BẤT KỲ PHASE NÀO**
2. **LUÔN CHỜ USER CONFIRM trước khi move to next phase**
3. **KHÔNG TRÍCH CODE trong analysis phase trừ khi được yêu cầu**
4. **TESTING là bắt buộc, không optional**
5. **QUALITY REVIEW phải comprehensive**

---

## 🆘 EMERGENCY PROTOCOLS

**Nếu gặp blocking issues:**
1. Document issue chi tiết
2. Research potential solutions
3. Report lại user với options
4. CHỜ GUIDANCE trước khi proceed

**Nếu requirements thay đổi mid-task:**
1. STOP implementation ngay lập tức
2. Re-run analysis cho new requirements
3. Update plan accordingly
4. Get re-confirmation trước khi continue

---

*Workflow này đảm bảo chất lượng cao và tránh waste time do miscommunication hoặc insufficient planning.*