**START PROMT ADD LOGIC**
nói chung là nhiệm vụ tiếp theo là ghép logic.
  vậy thì nó gồm gì:
  + button copy/paste
  + button submit( submit keyword / submit url)
  + show list item search result( skeleton nữa)
  + load more list item search result
  + show fake data khi submit url( rất phức tạp)
  + ấn button convert thì show popup

  bây giờ tổng quan bạn đã nắm được rồi thì tôi không muốn bạn overload nên tôi chỉ yêu
  cầu là bạn hiểu tổng quan rồi thì cùng tôi trò chuyện để có định hướng
  làm từng cái một. Đầu tiên ta thảo luận làm button copy/paste. Và tôi nhấn mạnh là từ giờ bạn là một solution architech chứ không phải là người implement nên 
  câu chuyện giữa tôi và bạn rất hạn chế có code. chỉ định hướng và lên kế hoạch hoặc mang tính chất hướng dẫn định hướng thôi cấm code



**TEMPLATE PROMT DISCARD VS MAKE PLAN**
okey giờ đến bướ 2 là bước triển khai submitkeyword vs search result. 
mục tiêu khi user gõ keyword và ấn enter thì show skeleton và đợi api trả về thì hiển
thị list item. logic có sẵn rồi bạn chỉ đọc lại và nghiên cứu xem áp dụng ra sao 
thôi. đọc thêm tài liệu sau đây để hiểu hơn việc bạn cần làm

 
**TEMPLATE PROMT STEP DOCUMENT**
tóm lại thì giờ tôi cần bạn làm tài liệu B2-submit-keyword-vs-search-result.md.
bạn cũng phải làm rõ cho AI cli hiểu rằng những gì project này đã làm được, hướng dẫn AI cli đọc các tài liệu hướng dẫn như là project-clone-guide.md.
nhưng không để AI cli lạc vào project-clone-guide.md vì nó hướng dẫn từ đâu cách copy project mà. chỉ bảo AI cli đọc để hiểu.
xong hướng dẫn AI cli tiến hành làm bước tiếp theo là  là thêm action submit cho sự kiện click button vs enter. sau đó chỉ ra cho tôi biết việc show skeleton vs 
list item result vs load more thì phải thực hiện ra sao. Đặc biệt bạn phải đọc hiểu nội dung các phần logic có liên quan để AI hiểu là phải triển khai như thế nào.

lưu ý là vì tính chất project là khác nhau nên một số class như đã đề cập ở file hướng dẫn đang chưa có thì bạn cũng phải đề xuất xem phải thêm như thế nào cho hợp lý




**TEMPLATE PROMT START IMPLEMENT STEP**
tóm lại thì giờ tôi cần bạn làm tài liệu B2-submit-keyword-vs-search-result.md.
bạn cũng phải làm rõ cho AI cli hiểu rằng những gì project này đã làm được, hướng dẫn AI cli đọc các tài liệu hướng dẫn như là project-clone-guide.md.
nhưng không để AI cli lạc vào project-clone-guide.md vì nó hướng dẫn từ đâu cách copy project mà. chỉ bảo AI cli đọc để hiểu.
xong hướng dẫn AI cli tiến hành làm bước tiếp theo là  là thêm action submit cho sự kiện click button vs enter. sau đó chỉ ra cho tôi biết việc show skeleton vs 
list item result vs load more thì phải thực hiện ra sao. Đặc biệt bạn phải đọc hiểu nội dung các phần logic có liên quan để AI hiểu là phải triển khai như thế nào.

lưu ý là vì tính chất project là khác nhau nên một số class như đã đề cập ở file hướng dẫn đang chưa có thì bạn cũng phải đề xuất xem phải thêm như thế nào cho hợp lý




