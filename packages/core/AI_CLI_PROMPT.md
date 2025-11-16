# AI CLI Start Prompt

**🚀 Copy và paste prompt này cho AI CLI mới:**

---

## Prompt

```
Bạn là AI CLI developer được giao nhiệm vụ tiếp tục phát triển @downloader/core package.

BƯỚC 1: ĐỌC FILE ONBOARDING
Đọc file sau để hiểu project và nhiệm vụ của bạn:
/Users/macos/Documents/work/downloader/Project-root/packages/core/AI_CLI_ONBOARDING.md

BƯỚC 2: TỰ TÌM VÀ ĐỌC CÁC FILE CẦN THIẾT
Sau khi đọc onboarding guide, bạn PHẢI:
1. Tự tìm và đọc TẤT CẢ các file được đề cập trong STEP 1 (Required Reading)
2. Tự explore codebase để hiểu architecture (STEP 2)
3. Tự check current status bằng cách đọc file verified-services.ts

BƯỚC 3: TẠO IMPLEMENTATION PLAN
Sau khi đọc xong, tạo implementation plan chi tiết cho:
- Task 2E-1: Add IMultifileService
- Task 2E-2: Add IYouTubePublicApiService

BƯỚC 4: XIN CONFIRMATION
Trình bày plan của bạn và đợi user confirm trước khi code.

BƯỚC 5: IMPLEMENT
Chỉ khi được confirm, mới bắt đầu implement theo plan.

QUAN TRỌNG:
- KHÔNG code ngay lập tức
- PHẢI tự tìm và đọc các file cần thiết
- PHẢI hiểu rõ project trước khi làm
- PHẢI có plan rõ ràng trước khi code
- PHẢI follow patterns đã có trong codebase

Bắt đầu bằng cách nói: "Tôi đã đọc onboarding guide. Để tôi đọc các file cần thiết và tạo implementation plan."
```

---

## Expected AI CLI Behavior

### ✅ CORRECT Workflow:

1. AI CLI đọc `AI_CLI_ONBOARDING.md`
2. AI CLI tự tìm và đọc các file trong Required Reading:
   - `REFACTOR_COMPARISON.md`
   - `DOMAIN_LAYER_GUIDE.md`
   - `LOCALSTORAGE_KEY_COLLISION.md`
   - `VERIFIED_SERVICES_QUICKSTART.md`
3. AI CLI đọc source code:
   - `/src/domain/verified-services.ts`
   - `/src/services/v1/interfaces/multifile.interface.ts`
   - `/src/services/public-api/interfaces/public-api.interface.ts`
4. AI CLI hiểu current status và missing pieces
5. AI CLI tạo detailed implementation plan
6. AI CLI trình bày plan và đợi confirmation
7. AI CLI implement theo plan đã được approve

### ❌ INCORRECT Workflow:

1. ❌ AI CLI đọc prompt và code ngay lập tức
2. ❌ AI CLI không đọc documentation
3. ❌ AI CLI không hiểu architecture
4. ❌ AI CLI code sai patterns

---

## Alternative Prompts

### Prompt Version 2 (Shorter):

```
Read this onboarding guide and follow ALL steps:
/Users/macos/Documents/work/downloader/Project-root/packages/core/AI_CLI_ONBOARDING.md

After reading:
1. Find and read all Required Reading files
2. Understand architecture
3. Create implementation plan
4. Get confirmation before coding

Start by saying what you understand from the onboarding guide.
```

### Prompt Version 3 (Vietnamese):

```
Đọc file hướng dẫn này và làm theo TẤT CẢ các bước:
/Users/macos/Documents/work/downloader/Project-root/packages/core/AI_CLI_ONBOARDING.md

Sau khi đọc xong:
1. Tự tìm và đọc tất cả file Required Reading
2. Hiểu architecture của project
3. Tạo implementation plan chi tiết
4. Xin confirmation trước khi code

Bắt đầu bằng cách nói bạn hiểu gì từ onboarding guide.
```

---

## Success Indicators

**AI CLI hiểu tốt khi:**

✅ Nói được Phase hiện tại (Phase 2E)
✅ Nói được task cần làm (Add 2 services)
✅ Biết file nào cần edit (`verified-services.ts`, docs)
✅ Biết pattern nào cần follow (existing methods)
✅ Tạo được plan chi tiết với code examples
✅ Không code trước khi được confirm

**AI CLI chưa hiểu khi:**

❌ Hỏi lại "tôi cần làm gì?"
❌ Code ngay không có plan
❌ Không biết file nào cần đọc
❌ Không follow existing patterns
❌ Đặt tên method sai (không match interface)

---

## Testing The Prompt

**Test with these questions after AI reads onboarding:**

1. "Bạn đang ở Phase nào?" → Should answer: "Phase 2E"
2. "Bạn cần add bao nhiêu services?" → Should answer: "2 services (Multifile, YouTubePublicApi)"
3. "File nào cần edit?" → Should answer: "verified-services.ts, DOMAIN_LAYER_GUIDE.md, etc."
4. "Có bao nhiêu methods sẽ có sau khi xong?" → Should answer: "17 methods (14 + 3)"
5. "Method registry key phải như thế nào?" → Should answer: "Phải match exact với interface method name"

If AI can answer these correctly → Prompt works! ✅

---

## Fallback Prompt (If AI Doesn't Follow)

```
STOP. Before coding anything:

1. Read: /Users/macos/Documents/work/downloader/Project-root/packages/core/AI_CLI_ONBOARDING.md
2. Read: /Users/macos/Documents/work/downloader/Project-root/packages/core/DOMAIN_LAYER_GUIDE.md
3. Read: /Users/macos/Documents/work/downloader/Project-root/packages/core/src/domain/verified-services.ts

After reading, answer these questions:
- What phase are we on?
- What services need to be added?
- How many total methods will there be?
- What files need to be edited?

Only after answering correctly, create your implementation plan.
```
