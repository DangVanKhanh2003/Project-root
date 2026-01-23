# Test SEO - Interactive Mode

Skill cho phép chọn tương tác site nào để test SEO.

## Cài đặt

```bash
cd skills/test-seo
npm install
```

## Sử dụng

Chạy từ thư mục root của project:

```bash
cd skills/test-seo && npm start
```

Hoặc:

```bash
npx tsx skills/test-seo/src/index.ts
```

## Cách hoạt động

1. Skill sẽ scan tất cả apps trong `apps/`
2. Tìm các apps có `skills/seo-checker`
3. Hiển thị checkbox để bạn chọn site(s) muốn test
4. Chạy SEO checker cho các sites được chọn
5. Hiển thị kết quả tổng hợp

## Controls

- `Space`: Chọn/bỏ chọn site
- `Enter`: Confirm và bắt đầu test
- `Ctrl+C`: Thoát
