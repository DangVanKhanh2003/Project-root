# REFACTOR DOCUMENTATION - README

> **Hệ thống tài liệu hướng dẫn cho Downloader Monorepo Refactoring**
> Last Updated: 2025-12-24

---

## 📚 MỤC ĐÍCH

Đây là hệ thống tài liệu HOÀN CHỈNH để hướng dẫn AI agents và human developers thực hiện refactor project.

**Đặc điểm:**
- ✅ KHÔNG chứa code (AI phải đọc từ project)
- ✅ Focus vào **CÁI GÌ** và **TẠI SAO**
- ✅ Bắt buộc thảo luận trước khi code
- ✅ Structured theo phases

---

## 🗂️ CẤU TRÚC TÀI LIỆU

```
docs/refactor/
├── README.md                       # ← BẠN ĐANG ĐỌC FILE NÀY
├── MASTER_REFACTOR_DOC.md          # Context tổng quan (READ FIRST)
├── BASELINE_BEHAVIOR.md            # Behavior reference
├── REVIEWER_PROMPT.md              # Hướng dẫn cho AI reviewer
│
├── prompts/                        # Phase-specific instructions
│   ├── PHASE_0_PREPARATION.md
│   ├── PHASE_1_EXTRACT_UTILITIES.md
│   ├── PHASE_2_I18N_SYSTEM.md
│   ├── PHASE_3_EXTRACT_CONVERSION.md
│   ├── PHASE_4_UI_COMPONENTS.md
│   ├── PHASE_5_PILOT_MIGRATION.md
│   ├── PHASE_6_Y2MATEPRO.md
│   ├── PHASE_7_REMAINING_APPS.md
│   └── PHASE_8_POLISH.md
│
└── adr/                            # Architecture Decision Records
    ├── 001-dependency-injection.md
    ├── 002-state-independence.md
    └── 003-i18n-strategy.md
```

---

## 🎯 CHO AI IMPLEMENTATION AGENTS

### **Bắt đầu một Phase:**

**Bước 1: Đọc tài liệu (CRITICAL)**
```
1. Đọc MASTER_REFACTOR_DOC.md (toàn bộ)
2. Đọc prompts/PHASE_X_[NAME].md (phase bạn làm)
3. Đọc tất cả code files được list trong prompt
4. Đọc ADRs liên quan (nếu có)
```

**Bước 2: Phân tích**
```
- Hiểu requirements
- Identify files cần extract
- Compare files giữa các apps
- Identify risks và blockers
```

**Bước 3: THẢO LUẬN (MANDATORY!)**
```
Viết message:

"I'm starting Phase X: [Name]

Documents read:
- ✅ MASTER_REFACTOR_DOC.md
- ✅ PHASE_X.md
- ✅ [list files đã đọc]

My understanding:
[Tóm tắt hiểu biết của bạn]

Files I will extract:
[List files]

Proposed approach:
[Cách tiếp cận]

Questions:
1. [Question 1]
2. [Question 2]

Risks identified:
- [Risk 1]
- [Risk 2]

Awaiting your approval to proceed."
```

**⚠️ NGHIÊM CẤM code trước khi được approve!**

**Bước 4: Implement (sau khi được approve)**
```
- Create feature branch
- Follow task list trong prompt
- Write tests FIRST
- Verify behavior unchanged
```

**Bước 5: Review**
```
- Create PR theo template
- Submit for review
- Address feedback
```

---

## 🔍 CHO AI CODE REVIEWERS

### **Workflow:**

**Bước 1: Đọc context**
```
1. Đọc MASTER_REFACTOR_DOC.md
2. Đọc REVIEWER_PROMPT.md
3. Đọc phase prompt tương ứng
4. Đọc PR description
```

**Bước 2: Review**
```
Sử dụng checklist trong REVIEWER_PROMPT.md:
- PR metadata
- Phase compliance
- Code quality
- Test quality
- i18n (nếu có)
- Performance
- Documentation
- Security
- Backward compatibility
- Git hygiene
```

**Bước 3: Feedback**
```
Viết review theo template trong REVIEWER_PROMPT.md:
- Summary
- Checklist results
- Detailed feedback
- Positive highlights
- Questions
- Recommendations
```

---

## 👨‍💻 CHO HUMAN DEVELOPERS

### **Nếu bạn muốn hiểu project:**

**Đọc theo thứ tự:**
1. `README.md` (file này) - Overview
2. `MASTER_REFACTOR_DOC.md` - Full context
3. `prompts/PHASE_X.md` - Phase bạn quan tâm
4. ADRs - Architecture decisions

### **Nếu bạn muốn review AI's work:**

**Sử dụng:**
- `REVIEWER_PROMPT.md` - Review checklist
- Phase prompt - Verify compliance
- `BASELINE_BEHAVIOR.md` - Verify no regression

### **Nếu bạn muốn add/modify phases:**

**Process:**
1. Update `MASTER_REFACTOR_DOC.md` (roadmap section)
2. Create new prompt file: `prompts/PHASE_X_[NAME].md`
3. Follow template (NO CODE!)
4. Add ADR if architectural decision made

---

## 📋 TEMPLATES

### **Template: Phase Prompt**

```markdown
# PHASE X: [NAME] - AI IMPLEMENTATION PROMPT

> **Phase:** [Name] (Week X-Y)
> **Objective:** [Brief objective]
> **Risk Level:** 🟢/🟡/🔴
> **Prerequisites:** [What must be complete first]

---

## 📚 REQUIRED READING

**Critical Documents:**
1. MASTER_REFACTOR_DOC.md
2. [Other docs]

**Code to Read:**
- /path/to/file1.ts
- /path/to/file2.ts

---

## 🎯 PHASE OBJECTIVES

### **Primary Goals:**
1. [Goal 1]
2. [Goal 2]

### **Success Criteria:**
- [ ] [Criteria 1]
- [ ] [Criteria 2]

---

## 🚫 CRITICAL CONSTRAINTS

### **MUST NOT:**
- ❌ [Constraint 1]

### **MUST:**
- ✅ [Requirement 1]

---

## 📋 DETAILED TASKS

### **Task 1: [Name]**

**Input:**
- [What to read/analyze]

**Expected Output:**
- [What to create]
- [Where to create it]

**Validation:**
- How to verify success

---

## 🔄 WORKFLOW

### **Step 1: DISCUSSION PHASE (MANDATORY)**
[Discussion template]

### **Step 2: IMPLEMENTATION PHASE**
[Implementation steps]

### **Step 3: VERIFICATION PHASE**
[Verification steps]

### **Step 4: REVIEW PHASE**
[Review process]

---

## ✅ DEFINITION OF DONE

Phase complete when:
- [ ] [Criterion 1]
- [ ] [Criterion 2]

---

**[NGHIÊM CẤM: NO CODE IN THIS DOCUMENT]**
```

### **Template: ADR**

```markdown
# ADR-XXX: [Decision Title]

**Date:** YYYY-MM-DD
**Status:** Proposed / Accepted / Rejected / Deprecated
**Deciders:** [Names]
**Related Phases:** Phase X, Y

---

## Context

[Describe the problem/situation requiring decision]

---

## Decision

[The decision made]

---

## Rationale

**Why this decision:**
1. [Reason 1]
2. [Reason 2]

**Alternatives considered:**
- Alternative A: [Why rejected]
- Alternative B: [Why rejected]

---

## Consequences

**Positive:**
- [Benefit 1]

**Negative:**
- [Trade-off 1]

**Neutral:**
- [Neutral impact]

---

## Implementation

**Files affected:**
- /path/to/file1
- /path/to/file2

**Dependencies:**
- [Dependency 1]

**Validation:**
- [How to verify decision is implemented correctly]

---

## References

- Link to discussions
- Link to code examples (in project, not in doc)
- Related ADRs
```

---

## ⚠️ NGUYÊN TẮC QUAN TRỌNG

### **1. KHÔNG BAO GIỜ có code trong docs**

**Lý do:**
- Code examples outdated nhanh
- AI phải đọc code thật từ project
- Tránh AI copy code sai

**Instead:**
- Chỉ đường dẫn đến files
- Mô tả pattern/concept
- Giải thích "what" và "why", không phải "how"

### **2. BẮT BUỘC thảo luận trước khi code**

**Lý do:**
- Verify AI hiểu đúng
- Catch misunderstanding sớm
- Human có cơ hội correct direction

**Workflow:**
```
READ → ANALYZE → DISCUSS → APPROVE → CODE
```

**NGHIÊM CẤM skip bước DISCUSS!**

### **3. Tests là FIRST-CLASS citizen**

**Mọi phase PHẢI:**
- Write tests before/during implementation
- Achieve 80%+ coverage for packages
- Verify behavior unchanged

### **4. Backward compatibility**

**NGHIÊM CẤM:**
- Breaking changes without approval
- Changing app behavior
- Breaking production

**SỬ DỤNG:**
- Feature flags
- Gradual rollout
- Deprecation warnings

---

## 📊 PROGRESS TRACKING

**Current Status:**

| Phase | Status | Owner | Notes |
|-------|--------|-------|-------|
| Phase 0 | 🔵 Planned | - | Testing setup |
| Phase 1 | 🔵 Planned | - | Utilities |
| Phase 2 | 🔵 Planned | - | I18n |
| Phase 3 | 🔵 Planned | - | Conversion (Critical!) |
| Phase 4 | 🔵 Planned | - | UI Components |
| Phase 5 | 🔵 Planned | - | Pilot migration |
| Phase 6 | 🔵 Planned | - | Production (y2matepro) |
| Phase 7 | 🔵 Planned | - | Remaining apps |
| Phase 8 | 🔵 Planned | - | Polish |

Legend:
- 🔵 Planned
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked
- ⏸️ On Hold

---

## 🆘 HELP & SUPPORT

### **Nếu AI không hiểu tài liệu:**

**Hỏi human:**
```
"I've read [document name] but I don't understand [specific section].

My confusion:
[Explain what you don't understand]

Questions:
1. [Question 1]
2. [Question 2]

Can you clarify before I proceed?"
```

### **Nếu phát hiện lỗi trong docs:**

**Report:**
```
"I found an issue in [document name]:

Issue: [Description]
Location: [Section/line]
Impact: [How it affects implementation]

Suggested fix: [If you have one]

Should I proceed with my understanding or wait for clarification?"
```

### **Nếu cần deviation từ plan:**

**Request approval:**
```
"I need to deviate from the plan in Phase X:

Original plan: [What plan says]
Proposed change: [What you want to do]
Reason: [Why deviation needed]

Pros:
- [Pro 1]

Cons/Risks:
- [Con 1]

Awaiting approval."
```

---

## 🔒 SECURITY NOTE

**Documents KHÔNG CHỨA:**
- ❌ Secrets/API keys
- ❌ Production URLs
- ❌ Credentials
- ❌ Sensitive business logic

**Nếu cần reference sensitive info:**
- ✅ Use placeholders: `[API_KEY]`, `[PRODUCTION_URL]`
- ✅ Reference environment variables
- ✅ Link to secure docs (not in repo)

---

## 📝 CHANGE LOG

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-24 | 2.0 | Removed all code examples | Claude |
| 2025-12-24 | 1.0 | Initial documentation | Claude |

---

## 📧 CONTACT

**For questions:**
- Human project lead: [TBD]
- Technical discussions: [GitHub Discussions]
- Issues: [GitHub Issues]

---

## 🎓 CONCLUSION

Hệ thống tài liệu này được thiết kế để:

1. **Hướng dẫn AI** thực hiện refactor đúng cách
2. **Đảm bảo chất lượng** qua review process
3. **Document decisions** qua ADRs
4. **Maintain context** cho future developers

**Nguyên tắc vàng:**
- 📖 Đọc kỹ trước khi làm
- 💬 Thảo luận trước khi code
- ✅ Test đầy đủ
- 📝 Document quyết định

**Remember:** Tài liệu này KHÔNG có code. AI PHẢI đọc code từ project!

---

**Chúc may mắn với refactoring! 🚀**
