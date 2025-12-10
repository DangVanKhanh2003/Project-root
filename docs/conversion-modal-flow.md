# Tài Liệu Luồng Hiển Thị Conversion Modal

## Giới Thiệu

Document này mô tả chi tiết toàn bộ flow hiển thị popup conversion modal khi user click download, bao gồm 5 cases routing khác nhau dựa trên platform và file type, cùng với các chiến lược UI/UX để đảm bảo trải nghiệm mượt mà.

---

## Mục Lục

1. [Hệ Thống 2 Phase](#hệ-thống-2-phase)
2. [5 Cases Routing](#5-cases-routing)
   - [Case 1: Static Direct Download](#case-1-static-direct-download)
   - [Case 2: iOS Stream RAM Download](#case-2-ios-stream-ram-download)
   - [Case 3: iOS Stream Polling](#case-3-ios-stream-polling)
   - [Case 4: Windows MP4 Stream](#case-4-windows-mp4-stream)
   - [Case 5: Other Stream](#case-5-other-stream)
3. [Chiến Lược UI Tricks](#chiến-lược-ui-tricks)
4. [Lưu Ý Quan Trọng](#lưu-ý-quan-trọng)

---

## Hệ Thống 2 Phase

Modal conversion hoạt động theo 2 giai đoạn riêng biệt để tối ưu UX:

### Phase 1: EXTRACTING (Giai Đoạn Trích Xuất)

**Mục đích:** Gọi API để backend phân tích URL video và trả về link download thực tế.

**Hiển thị:**
- Icon spinner quay tròn
- Text chính: "Extracting..."
- Text phụ: "Preparing your download"
- KHÔNG có phần trăm progress
- KHÔNG có progress bar

**Đặc điểm:**
- Chỉ hiển thị spinner animation đơn giản
- Không có hệ thống progress tracking
- Thời gian: Thường 1-3 giây

### Phase 2: CONVERTING (Giai Đoạn Chuyển Đổi)

**Mục đích:** Hiển thị tiến trình download/conversion file thực tế.

**Hiển thị:**
- Text tiến trình: "Processing... 45%"
- KHÔNG có spinner
- KHÔNG có progress bar (chỉ text hiển thị %)
- Progress text được cập nhật liên tục

**Đặc điểm:**
- Có hệ thống ProgressBarManager để quản lý progress
- Hiển thị phần trăm và status text động
- Thời gian: Từ vài giây đến vài phút tùy file size

### Chuyển Đổi Giữa Các Phase

**Quy tắc chung:**
- EXTRACTING hoàn thành → Tự động chuyển sang CONVERTING
- Một số case đặc biệt skip CONVERTING phase (xem chi tiết bên dưới)

---

## 5 Cases Routing

Hệ thống tự động phát hiện platform và file type để quyết định routing phù hợp.

---

## CASE 1: Static Direct Download

### Khi Nào Xảy Ra?

**Điều kiện:**
- API trả về `status = "static"`
- File đã sẵn sàng, không cần conversion
- Bất kỳ platform, bất kỳ file type

**Ví dụ:** File MP4 đã được cache sẵn ở backend, chỉ cần trả link download.

### Luồng Hiển Thị

```
1. User click download
   ↓
2. Modal mở: EXTRACTING phase
   - Spinner quay
   - Text: "Extracting..."
   - Thời gian: 1-3 giây
   ↓
3. API trả về link file static
   ↓
4. Modal chuyển NGAY sang SUCCESS
   - Hiển thị nút "Download"
   - KHÔNG qua CONVERTING phase
   ↓
5. User click nút → Download file
```

### Đặc Điểm

- **Nhanh nhất:** Chỉ 1-3 giây
- **Không tracking progress:** Skip hoàn toàn phase CONVERTING
- **Direct download:** Link file được trả về sẵn

---

## CASE 2: iOS Stream RAM Download

### Khi Nào Xảy Ra?

**Điều kiện:**
- Platform: iOS (iPhone/iPad)
- File type: MP3
- File size: ≤ 150MB
- API trả về `status = "stream"`

**Lý do đặc biệt:** iOS có giới hạn memory khi stream files. MP3 nhỏ (≤150MB) được download vào RAM trước rồi mới save file để tránh memory issues.

### Luồng Hiển Thị

```
1. User click download MP3 nhỏ trên iOS
   ↓
2. Modal mở: EXTRACTING phase #1
   - Spinner quay
   - Text: "Extracting..."
   - Thời gian: 1-3 giây
   ↓
3. API trả về stream URL
   ↓
4. ⚡ TRICK: GIỮ LẠI EXTRACTING phase #2
   - Vẫn hiển thị spinner "Extracting..."
   - Backend đang kết nối stream (1-2 giây)
   - Tránh hiển thị "0 MB" bị stuck
   - Thời gian: Tối đa 1 giây
   ↓
5. Stream bắt đầu download (chunk đầu tiên đến)
   ↓
6. Modal chuyển sang CONVERTING phase
   - Text: "Converting... X MB / Y MB"
   - Progress tăng từ 0 MB → file size
   - Tất cả đều là REAL progress (không fake)
   ↓
7. Download xong, file lưu trong RAM (blob)
   ↓
8. Modal chuyển sang SUCCESS
   - Nút: "Download from RAM"
   ↓
9. User click nút → Lưu file từ RAM ra disk
```

### UI Trick: Double EXTRACTING Phase

**Vấn đề gốc:**
- Sau extract API xong, nếu chuyển ngay sang CONVERTING
- Hiển thị "Converting... 0 MB / 50 MB"
- Stream mất 1-2 giây để connect
- User thấy progress stuck ở "0 MB" → Bad UX

**Giải pháp:**
- KHÔNG chuyển sang CONVERTING ngay
- GIỮ LẠI EXTRACTING phase (vẫn hiển thị spinner)
- Trong khi đó stream đang connect ở background
- Khi chunk đầu tiên đến → MỚI chuyển sang CONVERTING
- Lúc này progress sẽ tăng ngay lập tức → Good UX

**Timeline chi tiết:**
```
T+0s:     Extract API complete
          Modal: "Extracting..." (spinner) ← Phase 1

T+0-1s:   Stream đang connect (background)
          Modal: "Extracting..." (spinner) ← TRICK: Giữ lại phase 1
          User không thấy "0 MB" stuck

T+1s:     First chunk arrives!
          Modal chuyển: "Converting... 0 MB / 50 MB"
          Progress tăng ngay: 0 → 5 → 10 → ...
```

### Đặc Điểm

- **Độc quyền iOS:** Chỉ áp dụng cho iPhone/iPad
- **MP3 nhỏ only:** ≤150MB, tránh memory issues
- **RAM download:** File lưu trong memory trước
- **Real progress:** Không có fake progress, tất cả đều thật
- **Double EXTRACTING trick:** Smooth UX, không stuck
- **Memory cleanup:** Blob được xóa khi modal đóng

---

## CASE 3: iOS Stream Polling

### Khi Nào Xảy Ra?

**Điều kiện:**
- Platform: iOS (iPhone/iPad)
- File type: MP4, WEBM, hoặc MP3 lớn (>150MB)
- API trả về `status = "stream"`

**Lý do polling:** iOS không thể stream files lớn. Backend phải merge video+audio trước, trả về file đã merge.

### Luồng Hiển Thị

```
1. User click download file lớn trên iOS
   ↓
2. Modal mở: EXTRACTING phase
   - Spinner quay
   - Text: "Extracting..."
   - Thời gian: 1-3 giây
   ↓
3. API trả về progressUrl (link để polling)
   ↓
4. Modal chuyển sang CONVERTING phase
   - Text: "Processing... 0%"
   ↓
5. FAKE PROGRESS 1: Animation nhanh 0% → 5%
   - Thời gian: 200ms (0.2 giây)
   - Tăng từng 1%: 0 → 1 → 2 → 3 → 4 → 5
   - Mục đích: Instant feedback cho user
   ↓
6. Backend đang chuẩn bị, chưa có progress thật
   API trả về: status = "no_download"
   ↓
7. FAKE PROGRESS 2: Tăng dần 5% → 10%
   - Mỗi lần gọi API: Tăng 1%
   - 5 → 6 → 7 → 8 → 9 → 10 (max)
   - Mục đích: Cho user thấy backend đang làm việc
   ↓
8. Backend bắt đầu process, API trả về progress thật
   video=10%, audio=10%
   ↓
9. REAL PROGRESS: 10% → 90% (MP4) hoặc 10% → 60% (MP3)
   - Text: "Processing mp4... 45%"
   - Progress map từ API thật
   - Công thức: Display = 10% + (API% * 80%) cho MP4
   ↓
10. Processing xong, chuyển sang Merging phase
    video=100%, audio=100%
    ↓
11. FAKE PROGRESS 3 (chỉ MP3): Time-based 60% → 95%
    - MP3 encoding audio rất chậm (60-150 giây)
    - Tăng theo thời gian ước tính, không theo API
    - Text: "Encoding audio..." → "Finalizing audio..."

    (MP4 skip bước này, merging instant <500ms)
    ↓
12. API trả về mergedUrl (file đã merge xong)
    ↓
13. FAKE PROGRESS 4: Animation nhanh → 100%
    - Từ 90%/60% lên 100% trong 100ms
    - Smooth finish
    ↓
14. Modal chuyển sang SUCCESS
    - Nút: "Download"
    ↓
15. User click nút → Download file merged
```

### Cấu Trúc Progress

#### MP4 Format
```
0-10%:    Fake progress (instant + no_download)
10-90%:   Real progress từ API (processing)
90-100%:  Merging (instant, không fake)
```

#### MP3 Format
```
0-10%:    Fake progress (instant + no_download)
10-60%:   Real progress từ API (processing)
60-100%:  Merging (fake dựa thời gian, 60-150s)
```

### 4 Lớp Fake Progress

#### Layer 1: Initial Animation (0% → 5%)

**Thời gian:** 200ms
**Mục đích:** Instant feedback khi bắt đầu
**Cách hoạt động:**
- Animation tự động chạy ngay khi vào CONVERTING
- Update mỗi 50ms: 0 → 1 → 2 → 3 → 4 → 5
- User thấy có progress ngay lập tức

#### Layer 2: no_download Handling (5% → 10%)

**Khi nào:** Backend đang chuẩn bị, API trả về `status="no_download"`
**Mục đích:** Cho thấy backend đang active
**Cách hoạt động:**
- Mỗi lần polling API (2 giây 1 lần): Tăng 1%
- Lần 1: 5% → 6%
- Lần 2: 6% → 7%
- ...
- Lần 5: 9% → 10% (dừng ở 10%, không tăng nữa)

**Quan trọng:** Phải sync với hệ thống progress để tránh lùi về 5% khi real progress bắt đầu.

#### Layer 3: Merging Phase (Chỉ MP3)

**Khi nào:** Processing xong (video=100%, audio=100%), chuyển sang merge
**Thời gian:** 60-150 giây (tùy file size)
**Mục đích:** MP3 encoding rất chậm, fake progress để user không nghĩ bị treo

**Cách hoạt động:**
- File 150-250MB: Ước tính 60 giây
- File 250-450MB: Ước tính 100 giây
- File 450MB+: Ước tính 150 giây

**Phân bổ 3 phase:**
```
Phase 1 (60→70%): Nhanh - 15% thời gian
  "Encoding audio..."
  Ví dụ: 9s trong 60s total

Phase 2 (70→80%): Vừa - 35% thời gian
  "Optimizing quality..."
  Ví dụ: 21s trong 60s total

Phase 3 (80→95%): Chậm - 50% thời gian
  "Finalizing audio... (this may take a while)"
  Ví dụ: 30s trong 60s total
```

**Dừng ở 95%:** Để 5% cuối đợi API confirm, không fake lên 100%.

**MP4 skip layer này:** MP4 merging instant (<500ms), không cần fake.

#### Layer 4: Final Animation (→ 100%)

**Khi nào:** API trả về `mergedUrl` (file đã xong)
**Thời gian:** 100ms
**Mục đích:** Smooth finish trước khi show button

**Cách hoạt động:**
- From current progress (90% hoặc 60%) → 100%
- Animation 5 bước, mỗi bước 20ms
- Ví dụ từ 90%: 90 → 92 → 94 → 96 → 98 → 100

### Progress Mapping Formula

**Fake 10% đầu là BASE, real progress CỘNG thêm vào:**

```
Với cả MP4 và MP3 (range 10-95%):
API report: 0%   → Display: 10% (base)
API report: 50%  → Display: 52.5% (10 + 50%*85%)
API report: 100% → Display: 95% (10 + 100%*85%)
```

**Công thức:** `displayPercent = 10 + (apiPercent / 100) * 85`

**Quan trọng:** 10% fake KHÔNG bị replace, mà là base để cộng thêm!

### Video + Audio Progress

**MP4 (có cả video và audio):**
- Overall = (video * 60%) + (audio * 40%)
- Video chiếm tỷ trọng lớn hơn

**MP3 (chỉ audio):**
- Overall = audio progress
- Bỏ qua video progress (luôn = 0)

**Ví dụ MP4:**
```
video=50%, audio=40% → overall = 50*0.6 + 40*0.4 = 46%
                    → display = 10 + 46*0.8 = 46.8%
```

### Quy Tắc Never Backwards

**Nguyên tắc:** Progress KHÔNG BAO GIỜ giảm xuống.

**Vấn đề có thể xảy ra:**
```
Scenario:
1. no_download đưa progress lên 10%
2. API bắt đầu trả real progress: video=1%, audio=1%
3. Calculate: 10 + 1*80% = 10.8%
4. Nếu hệ thống không sync đúng → có thể lùi về 5.8%
5. User thấy: 10% → 5.8% ❌ BAD!
```

**Giải pháp:**
- Khi no_download tăng lên 10%, phải sync với progress mapper
- Mọi calculation đều check: Nếu < lastProgress → giữ nguyên lastProgress
- Đảm bảo: 10% → 10.8% → 18% → ... (chỉ tăng, không giảm)

### Đặc Điểm

- **Phức tạp nhất:** 4 layers fake progress
- **Time-based MP3 merging:** Dựa thời gian ước tính
- **Format-specific:** MP4 vs MP3 khác nhau hoàn toàn
- **Never backwards:** Progress không bao giờ lùi
- **Polling 2s/lần:** Gọi API mỗi 2 giây

---

## CASE 4: Windows MP4 Stream

### Khi Nào Xảy Ra?

**Điều kiện:**
- Platform: Windows
- File type: MP4
- API trả về `status = "stream"`

**Lý do polling:** Windows MP4 stream có vấn đề tương tự iOS, cần merge trước.

### Luồng Hiển Thị

```
GIỐNG HỆT CASE 3 (iOS Stream Polling)
```

### Khác Biệt với iOS Polling

**Giống nhau:**
- Cùng 4 layers fake progress
- Cùng progress mapping formula
- Cùng never backwards rule

**Khác biệt:**
- **Không có warning:** iOS có warning "may cause memory issues", Windows không
- **MP4 only:** Windows chỉ routing polling cho MP4
- **Instant merging:** MP4 merge nhanh, không có time-based fake

### Đặc Điểm

- **Windows MP4 only**
- **Same as iOS Polling** về mặt UX
- **No warning message**

---

## CASE 5: Other Stream

### Khi Nào Xảy Ra?

**Điều kiện:**
- Platform: Android, Desktop (Mac/Linux), hoặc Windows non-MP4
- API trả về `status = "stream"`

**Lý do skip CONVERTING:** Các platform này handle stream tốt, không cần special processing.

### Luồng Hiển Thị

```
1. User click download
   ↓
2. Modal mở: EXTRACTING phase
   - Spinner quay
   - Text: "Extracting..."
   - Thời gian: 1-3 giây
   ↓
3. API trả về stream URL
   ↓
4. Modal chuyển NGAY sang SUCCESS
   - Nút: "Download Stream (XMB)"
   - KHÔNG qua CONVERTING phase
   ↓
5. User click nút → Download stream file
```

### Đặc Điểm

- **Giống Case 1:** Skip CONVERTING
- **Nhanh:** 1-3 giây
- **Direct stream:** Không cần merge
- **Button text khác:** Hiển thị "Download Stream (XMB)"

---

## Chiến Lược UI Tricks

### Bảng Tổng Hợp

| Case | Fake Progress | Real Progress | Main Trick |
|------|---------------|---------------|------------|
| Static Direct | ❌ | ❌ | Skip CONVERTING |
| iOS RAM | ❌ | ✅ MB/MB | Double EXTRACTING |
| iOS Polling | ✅ 4 layers | ✅ 10-90% | Never backwards |
| Windows MP4 | ✅ 4 layers | ✅ 10-90% | Same as iOS |
| Other Stream | ❌ | ❌ | Skip CONVERTING |

### Timeline So Sánh

#### Static/Other Stream (Nhanh nhất)
```
0s ────────► 3s
EXTRACTING → SUCCESS
Total: 3 giây
```

#### iOS RAM (Trung bình)
```
0s ────────► 3s ────────► 4s ────────► 20s
EXTRACTING → EXTRACTING → CONVERTING → SUCCESS
             (trick)      (download)
Total: 20 giây (tùy file size)
```

#### Polling (Chậm nhất)
```
0s ────► 3s ────► 0.2s ────► Xs ────► Ys ────► Zs
EXTRACTING → FAKE1 → FAKE2 → REAL → FAKE3 → FAKE4 → SUCCESS
             0→5%    5→10%   10→90%  merge   →100%
Total: Vài phút (tùy file size, MP3 chậm nhất)
```

---

## Lưu Ý Quan Trọng

### 1. iOS RAM - Double EXTRACTING Trick

**Tại sao cần:**
- Stream connection mất 1-2 giây
- Nếu show "0 MB" ngay → User thấy stuck
- Giữ lại "Extracting..." → Smooth UX

**Cách implement:**
- Không chuyển phase sau extract
- Đợi max 1 giây cho stream
- Khi chunk đầu đến → Mới chuyển phase

**Kết quả:**
- User không thấy "0 MB" stuck
- Progress tăng ngay khi hiển thị

### 2. Polling - Never Backwards

**Vấn đề:**
- Fake progress 10%, real progress bắt đầu từ 1%
- Nếu không sync → Progress lùi về 5%

**Giải pháp:**
- Sync progress mapper với fake progress
- Mọi calculation đều check lastProgress
- Clamp to lastProgress nếu tính ra nhỏ hơn

**Quan trọng:**
- Progress CHỈ tăng, KHÔNG BAO GIỜ giảm
- Đây là rule bắt buộc cho tất cả cases

### 3. Progress Mapping Formula

**Sai (cũ):**
- Fake 5% là offset
- Real progress chỉ chiếm 85% (5-90%)
- Fake không được tính đầy đủ

**Đúng (mới):**
- Fake 10% là BASE
- Real progress cộng thêm vào base
- Fake được tính đầy đủ 10%

**Impact:**
- Progress phản ánh chính xác API response
- Cho phép large jump nếu backend xử lý nhanh
- Không có limit step (progress tự nhiên theo API)

### 4. Memory Management (iOS RAM)

**Blob storage:**
- File download vào RAM (JavaScript blob)
- Lưu reference trong task state
- Download button dùng blob thay vì URL

**Cleanup khi cancel:**
- Set blob = null → Garbage collection
- Abort fetch stream
- Remove task khỏi state

**Quan trọng:**
- Không cleanup → Memory leak
- iOS nhạy cảm về memory hơn

### 5. Status Text Changes

**Processing phase:**
- "Processing mp4... 45%"
- "Processing mp3... 30%"

**Merging phase (MP3):**
```
60-70%:  "Encoding audio..."
70-80%:  "Optimizing quality..."
80-95%:  "Finalizing audio... (this may take a while)"
95-100%: "Almost ready..."
```

**Merging phase (MP4):**
- "Finalizing video... 95%"

**RAM download:**
- "Converting... 10 MB / 50 MB"

### 6. Polling Interval

**Timing:**
- Gọi API ngay lập tức (không đợi)
- Sau đó mỗi 2 giây gọi 1 lần
- Add jitter 0-500ms để tránh spike

**Tại sao 2 giây:**
- Đủ nhanh để UX mượt
- Không spam server
- Balance giữa responsiveness và load

### 7. Phase Transitions

**3 patterns:**

```
Pattern 1: Skip CONVERTING
EXTRACTING → SUCCESS
(Static, Other Stream)

Pattern 2: With CONVERTING
EXTRACTING → CONVERTING → SUCCESS
(iOS RAM, với trick giữ lại EXTRACTING)

Pattern 3: Full Flow
EXTRACTING → CONVERTING(processing) → CONVERTING(merging) → SUCCESS
(iOS Polling, Windows MP4)
```

### 8. Error Handling

**Cancel trong EXTRACTING:**
- Đơn giản: Chỉ cần đóng modal
- Không có cleanup phức tạp

**Cancel trong CONVERTING:**
- Abort fetch streams
- Clear RAM blobs
- Stop polling
- Remove task state
- Guard checks trong async callbacks

**Network errors:**
- Show error modal với message rõ ràng
- Cho phép retry
- Log errors để debug

---

## Testing Checklist

### Case 1: Static
- [ ] EXTRACTING → SUCCESS trong 3 giây
- [ ] Không thấy CONVERTING phase
- [ ] Download button hoạt động

### Case 2: iOS RAM
- [ ] Thấy 2 lần EXTRACTING phase
- [ ] EXTRACTING thứ 2 kéo dài ~1 giây
- [ ] Progress "X MB / Y MB" tăng liên tục
- [ ] Cancel giữa chừng không memory leak

### Case 3: iOS Polling
- [ ] Progress 0% → 5% instant (200ms)
- [ ] Progress 5% → 10% khi no_download
- [ ] Progress 10% → 90% theo API thật
- [ ] Progress KHÔNG BAO GIỜ lùi
- [ ] MP3: Merging phase 60% → 95% chậm
- [ ] MP4: Merging phase 90% instant
- [ ] Final: 90% → 100% trong 100ms

### Case 4: Windows MP4
- [ ] Giống iOS Polling
- [ ] Không có warning message

### Case 5: Other Stream
- [ ] EXTRACTING → SUCCESS nhanh
- [ ] Button text: "Download Stream (XMB)"

---

## Glossary (Thuật Ngữ)

**EXTRACTING phase:** Giai đoạn gọi API để lấy download URL

**CONVERTING phase:** Giai đoạn download/convert file thực tế

**Polling:** Gọi API nhiều lần để check progress (mỗi 2s)

**Fake progress:** Progress giả để UX mượt (không phải từ API)

**Real progress:** Progress thật từ API (video/audio progress)

**Never backwards:** Quy tắc progress chỉ tăng, không giảm

**RAM download:** Download vào memory (blob) thay vì direct download

**Merging:** Ghép video + audio thành 1 file

**no_download status:** API trả về khi backend đang prepare, chưa có progress

---

## File References (Tham Khảo Code)

**Main flow:**
- `src/script/features/downloader/convert-logic.js` - Logic chính, 5 cases routing

**Progress mapping:**
- `src/script/features/downloader/polling-progress-mapper.js` - Tính toán progress

**UI components:**
- `src/script/features/downloader/conversion-modal.js` - Modal UI, phase transitions

**Progress display:**
- `src/script/libs/downloader-lib-standalone/progressBar.js` - Progress text rendering

