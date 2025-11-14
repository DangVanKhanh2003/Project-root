# JavaScript Function Comment Guidelines

**AI-ready, minimal commenting cho functions - chỉ comment function header, KHÔNG comment HTML/CSS**

## 🎯 NGUYÊN TẮC CORE

### 1) CHỈ comment **trên đầu function**

* **Mục tiêu**: Đủ để AI/đồng đội **gọi đúng** mà **không cần đọc thân hàm**
* **Format**: Đúng 6 tag, mỗi tag 1 dòng ngắn
* **Độ dài**: Không quá 6-7 dòng tổng cộng

### 2) **KHÔNG** comment HTML/CSS

* JavaScript only
* Nếu behavior phụ thuộc DOM/CSS, mô tả ở **CONTRACT/PRE** (ví dụ: "yêu cầu container có id #app")

### 3) **HẦU NHƯ KHÔNG** comment bên trong thân hàm

Chỉ thêm **1 dòng** inline khi:
* Có ràng buộc **phi hiển nhiên** (thứ tự, lock, header order...)
* Workaround/anti-bot/driver bug cần giữ nguyên

### 4) **KHÔNG comment trong quá trình implementation**

* Chỉ comment khi **review code xong**
* Claude sẽ hỏi user về list functions cần comment ở giai đoạn cuối

### 5) **🚨 RULE QUAN TRỌNG: Comment Consistency (BẮT BUỘC)**

* **KHI SỬA LOGIC HÀM** → **BẮT BUỘC SỬA LẠI COMMENT** cho đúng với logic mới
* **KHÔNG ĐƯỢC** để comment outdated hoặc sai lệch với implementation
* **COMMENT PHẢI PHẢN ÁNH CHÍNH XÁC** logic hiện tại của function
* **KIỂM TRA LẠI** tất cả 6 tag (WHY, CONTRACT, PRE, POST, EDGE, USAGE) khi có thay đổi logic

---

## 📋 FORMAT 6 TAG CHUẨN

### Template dán ngay trên function:

```javascript
/**
 * WHY: [lý do tồn tại / mục tiêu]
 * CONTRACT: [input kiểu/phạm vi → output kiểu/phạm vi]
 * PRE: [tiền điều kiện khi gọi - quyền, config, môi trường]
 * POST: [điều kiện sau khi chạy - state, side-effect]
 * EDGE: [biên/ngoại lệ quan trọng + tên lỗi]
 * USAGE: [1 ví dụ gọi tối thiểu, có thể mock]
 */
```

### Chi Tiết Từng Tag:

#### **WHY** - Lý do tồn tại
- Mục tiêu của function
- Vấn đề gì được giải quyết
- Tại sao cần function này

#### **CONTRACT** - Hợp đồng input/output
- Input: kiểu, phạm vi, đơn vị
- Output: kiểu, phạm vi, đơn vị
- Throws: các exception có thể

#### **PRE** - Tiền điều kiện
- Quyền cần thiết
- Config/environment setup
- Dependencies cần có
- State cần đảm bảo trước khi gọi

#### **POST** - Hậu điều kiện
- State thay đổi sau khi chạy
- Side effects
- Cleanup được thực hiện
- Guarantees về kết quả

#### **EDGE** - Cases biên và ngoại lệ
- Boundary conditions
- Error cases quan trọng
- Tên lỗi cụ thể (E_TIMEOUT, E_NO_ACCESS)
- Special behaviors

#### **USAGE** - Ví dụ sử dụng
- 1 ví dụ minimal có thể chạy
- Mock data nếu cần
- Không chứa secret/dữ liệu thật

---

## ✅ VÍ DỤ ĐÚNG

### Function phức tạp cần comment:
```javascript
/**
 * WHY: Resolve direct downloadable URL cho social links có redirect/anti-bot
 * CONTRACT: input url:string → Promise<{directUrl:string, mime:string, size?:number}> | throws
 * PRE: Chạy server-side; outbound HTTP được phép; cần network egress
 * POST: Không lưu state; mask PII trong log
 * EDGE: Private/region-locked → throw E_NO_ACCESS; age-gate → E_AUTH
 * USAGE: await resolveDownloadUrl("https://tiktok.com/@u/video/123");
 */
export async function resolveDownloadUrl(input) {
    /* implementation */
}
```

### Function với inline comment (hiếm):
```javascript
/**
 * WHY: Gửi SSE progress cho 1 session
 * CONTRACT: sessionId:uuid → phát event {progress:number, state:string}
 * PRE: Phải openSSE(sessionId) trước; 1 sessionId ↔ 1 connection
 * POST: Tự dọn connection khi 'done'/'error'
 * EDGE: Mất kết nối → hủy job sau 30_000ms (graceful cancel)
 * USAGE: openSSE(id); startZipJob(id, files);
 */
function emitProgress(sessionId, data) {
    // Avoid writes after close — check before send to prevent leak
    if (!isOpen(sessionId)) return;
    sendEvent(sessionId, "progress", data);
}
```

---

## 🚫 TRƯỜNG HỢP KHÔNG CẦN COMMENT

### Functions đơn giản, tự giải thích:
```javascript
// ✅ KHÔNG cần comment - tên và type đã đủ rõ
function formatFileSize(bytes) {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}
```

---

## 🎯 KHI NÀO **PHẢI** CÓ COMMENT

### Functions cần comment bắt buộc:
- Hợp đồng sử dụng không hiển nhiên (auth, context server-side, stream/SSE)
- Có side-effect đa hệ (DB + queue + cache)
- Phụ thuộc môi trường/anti-bot/limit/rate/region-lock
- Yêu cầu đồng bộ hóa (idempotency, order, lock)
- Business logic phức tạp không rõ từ tên function

### Functions KHÔNG cần comment:
- Pure functions đơn giản
- Utility functions với tên rõ ràng
- Type annotation đã nói đủ
- Logic straightforward

---

## 💡 BEST PRACTICES

### Văn phong & định dạng:
- **Câu ngắn, chủ động**
- **Đơn vị rõ ràng** (ms, MB, ISO-8601)
- **Tên lỗi nhất quán**: `E_TIMEOUT`, `E_NO_ACCESS`
- **Flags rõ ràng**: `idempotent=true`
- **Không mâu thuẫn** với type/annotation
- **Không secret/dữ liệu thật** trong USAGE

### Inline comments (rất hiếm):
```javascript
// ✅ Hợp lệ - phi hiển nhiên, cần giữ nguyên
// Keep header order stable to bypass naive bot checks

// ❌ Không cần - mô tả lại code
// Tăng i lên 1
// Gọi API để lấy dữ liệu
```

---

## 🛠️ VSCode Snippet

```json
{
  "AI-ready JS function comment": {
    "prefix": "aicomment",
    "body": [
      "/**",
      " * WHY: $1",
      " * CONTRACT: $2",
      " * PRE: $3",
      " * POST: $4",
      " * EDGE: $5",
      " * USAGE: $6",
      " */"
    ],
    "description": "Comment chuẩn cho function JS (AI-ready, ngắn, hành động được)"
  }
}
```

---

## 🔄 WORKFLOW INTEGRATION

### Trong quá trình implementation:
- **KHÔNG comment functions** ngay khi viết
- Focus vào logic và functionality
- Chỉ inline comments nếu thực sự cần thiết

### Sau khi review code xong:
- Claude sẽ liệt kê **functions lớn/quan trọng** cần comment
- User confirm từng function
- Thêm comments theo format 6 tag
- Final review comments vs implementation

### Comment update policy:
- **🚨 KHI SỬA LOGIC FUNCTION** → **BẮT BUỘC UPDATE COMMENT** cho đúng logic mới
- **Code không có comments** → Không cần thêm mới
- **Đảm bảo accuracy** → Comments phải đúng với logic hiện tại
- **Review tất cả 6 tag** → WHY, CONTRACT, PRE, POST, EDGE, USAGE khi có logic changes
- **ZERO TOLERANCE** → Không được để comment outdated/misleading

---

*Guidelines này đảm bảo comments hữu ích, không redundant, và AI-friendly cho maintenance dài hạn.*