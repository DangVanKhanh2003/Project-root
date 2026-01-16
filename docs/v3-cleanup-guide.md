# Task: Cleanup Legacy V2 Code - Chuyển hoàn toàn sang V3 API

## Bối cảnh

Dự án này có nhiều site (ytmp3.my, y2mate-new-ux, ytmp3-clone-3, ytmp3-clone-4, ytmp3-clone-5, y2matepro) đang trong quá trình chuyển đổi từ V2 API sang V3 API cho tính năng download YouTube.

### V2 API (Cũ - Cần xóa)
- Endpoint: `hub.y2mp3.co`
- Kiến trúc phức tạp với routing logic phân biệt thiết bị (iOS, Windows, Mac, Android)
- Sử dụng Strategy Pattern với nhiều strategy classes khác nhau
- Mỗi loại thiết bị/format có flow xử lý riêng

### V3 API (Mới - Giữ lại)
- Endpoint: `hub.ytconvert.org`
- Kiến trúc đơn giản: createJob → poll statusUrl → nhận downloadUrl
- **Unified flow cho tất cả devices** - iOS, Android, Windows, Mac đều chạy cùng 1 luồng xử lý, không có logic phân biệt thiết bị

### Polling Behavior (Quan trọng)
- **Không có timeout limit** - polling chạy vô thời hạn cho đến khi có kết quả
- **Network error → tiếp tục poll** - khi mất mạng, timeout, connection failed thì log lỗi và poll tiếp
- **Chỉ dừng khi API trả về kết quả cuối cùng:**
  - `status: 'completed'` → thành công, nhận downloadUrl
  - `status: 'error'` → thất bại, hiển thị lỗi
  - User cancel → dừng poll
- **Merging phase:** Khi progress = 100% nhưng status vẫn là 'pending' nghĩa là server đang merge video+audio, UI hiển thị "Merging files..." và tiếp tục poll

---

## Tình trạng hiện tại

**Site đã cleanup xong:** `y2matepro`
- Đây là site mẫu đã được cleanup hoàn chỉnh
- Tham khảo cấu trúc và code của site này làm reference

**Sites cần cleanup:**
- ytmp3.my
- y2mate-new-ux
- ytmp3-clone-3
- ytmp3-clone-4
- ytmp3-clone-5

Các site này đang hoạt động với V3 API nhưng vẫn còn code V2 legacy chưa được xóa.

---

## Yêu cầu

### 1. Xóa code V2 legacy
- Tìm và xóa tất cả files/folders liên quan đến V2: strategies, routing logic, V2 convert logic, polling mapper cũ
- Tìm trong folder `src/features/downloader/logic/conversion/` và `src/features/downloader/logic/`

### 2. Cleanup types và exports
- Xóa các types liên quan routing (RouteType, RoutingDecision, determineRoute...)
- Update file index.ts để chỉ export V3

### 3. Giữ nguyên các files V3 đang hoạt động
- Không thay đổi logic của convert-logic-v3.ts
- Không thay đổi v3/polling.ts
- Không thay đổi conversion-controller.ts

### 4. Xóa hết device-specific code
- Xóa tất cả logic check isIOS(), isWindows(), isMac(), isAndroid() trong conversion flow
- Xóa các RouteType như IOS_RAM, IOS_POLLING, WINDOWS_MP4_POLLING, OTHER_STREAM
- Kết quả: 1 flow duy nhất cho mọi thiết bị

---

## Output mong đợi

Sau cleanup, mỗi site chỉ còn:
- V3 conversion logic đơn giản
- Không còn routing/strategy code
- Không còn device-specific logic
- Build thành công không có TypeScript errors

---

## Cách thực hiện

1. Đọc cấu trúc của `y2matepro` làm reference (site đã cleanup xong)
2. So sánh với các site chưa cleanup để xác định files cần xóa
3. Xóa files V2 legacy
4. Update index.ts và types.ts
5. Chạy TypeScript check để verify
