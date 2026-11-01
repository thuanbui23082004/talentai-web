export const inboxMessages = {
  Inbox: {
    title: 'Hộp thư', subtitle: 'Kết nối với ứng viên và đội ngũ tuyển dụng.', mock: 'Hộp thư mẫu · Thư chỉ được lưu trong phiên này, chưa gửi ra ngoài.',
    compose: 'Soạn thư', search: 'Tìm kiếm thư', searchPlaceholder: 'Tìm người gửi, tiêu đề, nội dung...', foldersLabel: 'Thư mục', labels: 'Nhãn', all: 'Tất cả', team: 'Nội bộ', candidate: 'Ứng viên',
    newMail: 'Thư mới', minimizeCompose: 'Thu nhỏ cửa sổ soạn thư', restoreCompose: 'Mở lại cửa sổ soạn thư', expandCompose: 'Phóng to cửa sổ soạn thư', shrinkCompose: 'Thu gọn cửa sổ soạn thư', closeCompose: 'Đóng cửa sổ soạn thư', discardCompose: 'Hủy thư đang soạn',
    cc: 'Cc', bcc: 'Bcc',
    editor: {
      formatting: 'Định dạng văn bản', undo: 'Hoàn tác', redo: 'Làm lại', bold: 'In đậm', italic: 'In nghiêng', underline: 'Gạch chân',
      left: 'Căn trái', center: 'Căn giữa', right: 'Căn phải', ordered: 'Danh sách đánh số', unordered: 'Danh sách dấu đầu dòng',
      font: 'Phông chữ', sans: 'Sans Serif', serif: 'Serif', mono: 'Monospace', size: 'Cỡ chữ', small: 'Nhỏ', normal: 'Vừa', large: 'Lớn', color: 'Màu chữ',
      colors: { text: 'Mặc định', primary: 'Tím', danger: 'Hồng', muted: 'Xám' }, attach: 'Đính kèm tệp', attachments: 'Tệp đính kèm',
      fileSize: '{size} KB', removeFile: 'Gỡ tệp {name}', fileLimit: 'Tối đa 10 tệp, mỗi tệp 10 MB và tổng dung lượng 25 MB.', imageType: 'Chọn ảnh PNG, JPG, WebP hoặc GIF.',
      link: 'Chèn liên kết', linkLabel: 'Văn bản hiển thị', linkUrl: 'Địa chỉ liên kết', invalidLink: 'Nhập văn bản hiển thị và liên kết http, https hoặc mailto hợp lệ.', insert: 'Chèn',
      emoji: 'Chèn biểu tượng cảm xúc', insertEmoji: 'Chèn {emoji}', image: 'Chèn ảnh', signature: 'Chèn chữ ký', signatureText: 'Trân trọng,\nĐội ngũ tuyển dụng',
    },
    folders: { inbox: 'Hộp thư đến', starred: 'Có gắn sao', sent: 'Đã gửi', drafts: 'Thư nháp', spam: 'Thư rác', trash: 'Thùng rác' },
    count: '{count} thư', unread: '{count} chưa đọc', star: 'Gắn sao', unstar: 'Bỏ gắn sao', remove: 'Chuyển vào thùng rác', restore: 'Khôi phục về hộp thư đến', back: 'Quay lại danh sách', reply: 'Trả lời', forward: 'Chuyển tiếp', previous: 'Thư trước', next: 'Thư tiếp theo', position: '{current} / {total}',
    empty: 'Chưa có thư trong mục này', noResults: 'Không tìm thấy thư phù hợp', emptyHint: 'Chọn thư mục khác hoặc soạn một thư mới.', select: 'Chọn một thư để đọc nội dung', reset: 'Xóa bộ lọc', to: 'Người nhận', subject: 'Tiêu đề', body: 'Nội dung', send: 'Gửi', saveDraft: 'Lưu nháp', cancel: 'Hủy', required: 'Vui lòng nhập email hợp lệ, tiêu đề và nội dung (tối đa 10.000 ký tự).', sentNotice: 'Đã chuyển thư mẫu vào mục Đã gửi. Không có email thật được gửi.', draftNotice: 'Đã lưu thư nháp trong phiên này.', deletedNotice: 'Đã chuyển thư vào thùng rác.', restoredNotice: 'Đã khôi phục thư về hộp thư đến.', replySubject: 'Trả lời: {subject}', forwardSubject: 'Chuyển tiếp: {subject}', me: 'Bạn', forwarded: 'Nội dung thư được chuyển tiếp',
    samples: {
      linh: { name: 'Hà Linh', subject: 'Xác nhận lịch phỏng vấn Frontend Developer', body: 'Kính gửi anh/chị,\n\nEm cảm ơn công ty đã tạo cơ hội tham gia phỏng vấn vị trí Frontend Developer. Em xác nhận có thể tham gia vào 09:00 ngày 29/10.\n\nAnh/chị vui lòng cho em biết những nội dung cần chuẩn bị trước buổi trao đổi. Em mong được tìm hiểu thêm về đội ngũ và sản phẩm của công ty.\n\nTrân trọng,\nHà Linh' },
      thao: { name: 'Thu Thảo', subject: 'Đề xuất kế hoạch tuyển dụng tháng 11', body: 'Chào anh/chị,\n\nMình gửi đề xuất kế hoạch tuyển dụng tháng 11 để đội ngũ cùng trao đổi. Dự kiến ưu tiên các vị trí phát triển sản phẩm và thiết kế trải nghiệm người dùng.\n\nNhờ anh/chị xem lại nhu cầu nhân sự của từng nhóm và phản hồi trước thứ Sáu để chúng ta thống nhất lịch đăng tuyển.\n\nCảm ơn anh/chị,\nThu Thảo\nPhòng Nhân sự' },
      an: { name: 'Mai An', subject: 'Bổ sung thông tin hồ sơ ứng tuyển', body: 'Kính gửi bộ phận tuyển dụng,\n\nEm xin bổ sung thông tin về kinh nghiệm phát triển ứng dụng với React và Node.js. Em đã tham gia xây dựng hệ thống quản lý công việc trong dự án mô phỏng gần đây.\n\nEm sẵn sàng trao đổi thêm nếu anh/chị cần thông tin.\n\nTrân trọng,\nMai An' },
      huy: { name: 'Gia Huy', subject: 'Hỏi về vòng trao đổi kỹ thuật', body: 'Chào anh/chị,\n\nEm muốn hỏi thêm về hình thức và thời lượng của vòng trao đổi kỹ thuật sắp tới. Em có cần chuẩn bị máy tính cá nhân không ạ?\n\nCảm ơn anh/chị đã hỗ trợ.\nGia Huy' },
      minh: { name: 'Minh Châu', subject: 'Tổng hợp phản hồi sau phỏng vấn', body: 'Chào đội ngũ tuyển dụng,\n\nMình đã tổng hợp phản hồi của các thành viên tham gia phỏng vấn tuần này. Nhờ mọi người cập nhật nhận xét chuyên môn để hoàn thiện hồ sơ đánh giá.\n\nChúng ta sẽ trao đổi và thống nhất bước tiếp theo trong cuộc họp chiều mai.\n\nTrân trọng,\nMinh Châu' },
      vy: { name: 'Khánh Vy', subject: 'Cảm ơn buổi trao đổi cùng TalentAI', body: 'Kính gửi anh/chị,\n\nEm cảm ơn anh/chị đã dành thời gian chia sẻ về vị trí và môi trường làm việc. Buổi trao đổi giúp em hiểu rõ hơn về định hướng sản phẩm và vai trò của mình trong nhóm.\n\nEm mong sớm nhận được phản hồi từ công ty.\n\nTrân trọng,\nKhánh Vy' },
    },
  },
};
