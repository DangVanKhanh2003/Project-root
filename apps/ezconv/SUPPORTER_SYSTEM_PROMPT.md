# 📋 PROMPT TRIỂN KHAI HỆ THỐNG SUPPORTER (ezconv)

Copy toàn bộ nội dung dưới đây và dán vào cửa sổ chat với AI Developer (Cursor, Claude, or GPT) để thực hiện triển khai.

---

```markdown
Bạn là một Chuyên gia Phát triển Web và Refactoring. Nhiệm vụ của bạn là triển khai **Hệ thống Supporter (License, Levels & Limits)** cho dự án `ezconv` dựa trên các yêu cầu nghiệp vụ và kế hoạch kỹ thuật đã được chốt.

### 📖 BƯỚC 1: Đọc Tài liệu Context
Trước khi bắt đầu, hãy đọc kỹ file kế hoạch triển khai để nắm bắt toàn bộ yêu cầu:
- **Kế hoạch chi tiết**: `C:\Users\khanh084\.gemini\antigravity\brain\f1023e7d-9d1c-40f0-80f8-9d817147f361\implementation_plan.md`

### 🎯 Mục tiêu Chính
1.  **Xác thực License**: Gọi API `https://ytmp3-supporter.ytmp3.gg/api/check-key` (POST {key: string}).
2.  **Theo dõi Cấp độ (Levels)**:
    - Level 1: 0-1 download.
    - Level 2: 2-6 downloads (Bắt đầu hiện nút License trên Header).
    - Level 3: > 6 downloads.
3.  **Lưu trữ (IndexedDB)**: Sử dụng IndexedDB để lưu log mỗi khi convert thành công (method, status, timestamp). Không dùng localStorage cho log.
4.  **Giới hạn (Limits)**:
    - **Playlist/Channel**: Tối đa 5 lượt tải/ngày cho khách thường.
    - **Bulk Download**: Tối đa 10 video/lần dán cho khách thường.
    - **License Holder**: Bỏ qua tất cả các giới hạn trên.

### 🛠️ Các Bước Triển khai (Làm Tuần tự)

**Bước 1: Tạo Core Logic & Storage**
- Triển khai `src/features/download-limit.ts` để quản lý giới hạn.
- Cập nhật `src/features/widget-level-manager.ts` để tích hợp logic License (lưu key trong localStorage `ezconv:license_key`).
- Thiết lập IndexedDB để lưu log convert thành công.

**Bước 2: Triển khai UI Components**
- Tạo `src/features/ui/maintenance-popup.ts` với các modal: "Daily Limit Reached" (có countdown đến 00:00) và "Video Limit Exceeded".
- Tạo trang `license.html` và file logic `src/features/license-page.ts` để người dùng nhập và kích hoạt key.
- Cập nhật Header để hiển thị nút License linh hoạt theo Level.

**Bước 3: Tích hợp vào Luồng Convert**
- Chỉnh sửa `src/features/downloader/logic/conversion/convert-logic-v3.ts`:
    - Kiểm tra giới hạn bằng `checkLimit()` trước khi gọi API tạo Job.
    - Nếu bị chặn, hiển thị Popup tương ứng.
    - Nếu thành công, ghi log vào IndexedDB và increment download count.

### ⚠️ Lưu ý Quan trọng
- **Đồng hồ đếm ngược**: Trong popup giới hạn ngày, phải tính toán thời gian thực tế đến nửa đêm (00:00).
- **Trải nghiệm người dùng**: Các hiệu ứng Fade-in cho modal cần mượt mà (dùng CSS transitions).
- **i18n**: Đảm bảo các thông báo hỗ trợ đa ngôn ngữ nếu hệ thống hiện tại có i18n.

Bạn đã hiểu yêu cầu chưa? Hãy xác nhận và bắt đầu thực hiện **Bước 1**.
```

---

## 💡 Hướng dẫn cho Bạn
1.  **File Kế hoạch**: Tôi đã lưu bản kế hoạch chính thức tại dự án. AI mới chỉ cần đọc đường dẫn đó.
2.  **Theo dõi**: Hãy yêu cầu AI báo cáo sau mỗi bước (Step 1, Step 2...) để bạn kiểm soát chất lượng code.
3.  **Kiểm tra**: Sau khi AI báo xong, bạn hãy thử tải video để xem các popup giới hạn có hiện ra đúng như mong muốn không.
