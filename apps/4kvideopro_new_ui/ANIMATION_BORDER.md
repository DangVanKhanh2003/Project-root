# Tóm tắt cơ chế animation border line

## Cơ chế
- Dùng **3 lớp chồng nhau**: viền chạy (gradient), viền tĩnh (border), và lớp nội dung input.
- Viền chạy là **conic-gradient** có một “vệt sáng” và một đoạn “gap” trong suốt.
- Animate bằng **CSS custom property** `--angle` (khai báo qua `@property`) và `@keyframes` xoay từ `0deg` đến `360deg`.
- Thêm **blur** để tạo hiệu ứng glow mềm.
- Viền tĩnh giúp khung luôn hiện ngay cả khi gradient đi vào “gap”.

## Cách thực hiện (tóm tắt)
1) Wrapper ngoài: `position: relative; border-radius; isolation: isolate;`
2) `::before` cho gradient chạy:
   - `position: absolute; inset: -1px; border-radius: inherit;`
   - `background: conic-gradient(from var(--angle), ...)`
   - `animation: rotate 8s linear infinite;`
   - `filter: blur(2px);`
3) `::after` cho viền tĩnh:
   - `border: 1px solid ...; inset: 0; border-radius: inherit;`
4) Nội dung input nằm trên cùng (`z-index` cao hơn).

## Lưu ý
- Muốn “vệt sáng” mảnh hơn: thu hẹp tỉ lệ các stop màu trong conic-gradient.
- Muốn mượt hơn: chỉnh lại vị trí stop để điểm nối đầu/cuối không bị gãy.
