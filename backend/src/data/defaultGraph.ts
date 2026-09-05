import { GraphData, NodeEntity } from '../types/graphTypes.js';

export const INITIAL_PAYMENT_GRAPH: GraphData = {
  id: 'graph-payment-idempotency',
  topic: 'Idempotency in Distributed Payment Systems',
  nodes: [
    {
      id: 'node-su-co',
      domain_id: 'domain-payment',
      cluster_id: 'cum-webhook-gateway',
      is_public_interface: true,
      infra_type: 'gateway',
      fully_explored: true,
      bieu_tuong: 'su_co_canh_bao',
      tieu_de: 'Lặp Webhook trừ tiền 2 lần',
      nhan_buoc: 'GATEWAY / INGRESS',
      tom_tat: 'Cổng thanh toán tự động gửi lại <u>Webhook</u> do timeout làm **trừ tiền 2 lần**!',
      toa_do: { x: 100, y: 100 },
      tam: { x: 210, y: 180 },
      hoat_hoa: {
        mau: 'lap_su_co',
        tham_so: {
          nguon: 'GATEWAY',
          loi: 'Timeout 1.2s',
          nhan_1: 'Gói tin 1',
          nhan_2: 'Gói Retry 2',
          dich: 'SERVER',
          ket_qua: 'NHÂN BẢN LỆNH'
        }
      },
      chi_tiet: {
        phan_loai: 'SỰ CỐ VẬN HÀNH THỰC TẾ',
        tieu_de: 'Sự cố gửi lặp Webhook rút tiền',
        ban_chat: 'Khi cổng thanh toán gặp nghẽn mạng tạm thời (**timeout 1.2s**), cơ chế tự động gửi lại (<u>automatic retry</u>) sẽ phát gói tin Webhook lần 2. Nếu máy chủ xử lý song song mà thiếu <u>Idempotency</u>, tài khoản sẽ bị **cộng tiền 2 lần liên tiếp**.',
        chu_thich_so_do: 'Mô phỏng: Cổng thanh toán gửi Webhook lần 1 gặp timeout giả định, phát tiếp Webhook lần 2 làm **nhân bản lệnh chi tiền**!',
        ca_thuc_te: [
          'Cổng thanh toán quốc tế gửi Webhook báo đơn chi tiền **10 triệu đồng**.',
          'Mạng chập chờn đúng **1.2 giây** kích hoạt cơ chế retry tự động.',
          'Hai tiến trình nền cùng chạy song song, đọc thấy đủ số dư và **chi tiền 2 lần**!',
          'Giải pháp sống còn: Khóa <u>Idempotency Key</u> kèm <u>Unique Index</u>.'
        ],
        rui_ro: [
          'Thất thoát tài chính trực tiếp, cực kỳ khó thu hồi từ tài khoản người nhận.',
          'Tạo ra các bút toán chênh lệch số dư kế toán nghiêm trọng.'
        ],
        chuoi_sup_do: [
          '1. Cổng thanh toán gửi retry tự động khi mạng trễ 1.2s.',
          '2. Máy chủ coi gói tin là request mới do thiếu khóa chặn lặp.',
          '3. Hai tiến trình song song cùng rút 10 triệu đồng từ tài khoản.',
          '4. Thất thoát tài chính thực tế không thể rollback tự động.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Khi cổng thanh toán gặp timeout 1.2s và tự động phát lại (retry) Webhook, điều gì xảy ra nếu server thiếu Idempotency?',
        lua_chon: [
          'Hai tiến trình nền cùng xử lý song song và trừ/cộng tiền 2 lần',
          'Cổng thanh toán tự nhận biết lỗi mạng và hủy giao dịch thứ 2'
        ],
        dung: 0,
        giai_thich: 'Nếu thiếu Idempotency, server coi gói retry như một lệnh mới và xử lý tiếp, dẫn đến trừ hoặc cộng tiền 2 lần.'
      }
    },
    {
      id: 'node-tranh-chap',
      domain_id: 'domain-payment',
      cluster_id: 'cum-idempotency-app',
      infra_type: 'service',
      parent_id: 'node-su-co',
      fully_explored: true,
      bieu_tuong: 'tranh_chap_phan_nhanh',
      tieu_de: 'Tranh chấp khi kiểm tra số dư',
      nhan_buoc: 'COMPUTE / CONCURRENCY',
      tom_tat: 'Hai luồng cùng đọc một số dư trước khi kịp trừ: **rút 16 triệu từ ví 10 triệu**!',
      toa_do: { x: 100, y: 520 },
      tam: { x: 210, y: 600 },
      hoat_hoa: {
        mau: 'va_cham_song_song',
        tham_so: {
          luong_1: 'LUỒNG A',
          luong_2: 'LUỒNG B',
          diem_va_cham: 'VA CHẠM GHI SỐ DƯ',
          tai_nguyen: 'SỐ DƯ: 10TR',
          canh_bao: 'CÙNG RÚT 8TR'
        }
      },
      chi_tiet: {
        phan_loai: 'PHÂN LUỒNG XUNG ĐỘT ĐỒNG THỜI',
        tieu_de: 'Tranh chấp ghi khi kiểm tra số dư (Race Condition)',
        ban_chat: '<u>Race Condition</u> xảy ra khi hai luồng xử lý cùng đọc số dư tại cùng một mili-giây. Cả hai đều thấy số dư còn **10 triệu** nên cùng phê duyệt lệnh chi, khiến số dư thực tế bị **âm 6 triệu** sau khi hoàn tất.',
        chu_thich_so_do: 'Mô phỏng: Luồng A và Luồng B cùng lao vào đọc số dư 10 triệu cùng lúc. Cả 2 đều tưởng tiền còn nguyên vẹn nên đều duyệt chi!',
        ca_thuc_te: [
          'Hai lệnh rút **8 triệu** gửi tới tài khoản có **10 triệu** cùng một tích tắc.',
          'Luồng A đọc: còn **10 triệu** → Hợp lệ.',
          'Luồng B đọc: còn **10 triệu** → Hợp lệ.',
          'Cả hai cùng trừ: Tài khoản bị **rút 16 triệu**, số dư âm **-6 triệu**!'
        ],
        rui_ro: [
          'Số dư tài khoản bị âm, phá vỡ tính toàn vẹn <u>ACID</u> của hệ thống.',
          'Giao dịch không thể rollback an toàn nếu tiền mặt đã ra khỏi cổng ngân hàng.'
        ],
        chuoi_sup_do: [
          '1. Luồng A và Luồng B cùng đọc số dư ví 10 triệu tại cùng 1 tích tắc.',
          '2. Cả hai đều kiểm tra hợp lệ vì chưa có luồng nào kịp trừ tiền.',
          '3. Cả hai lệnh rút 8 triệu đều được thực thi xuống tài khoản ngân hàng.',
          '4. Số dư ví thực tế bị âm -6 triệu, vi phạm toàn vẹn dữ liệu ACID.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Vì sao hai luồng cùng rút 8 triệu từ tài khoản 10 triệu lại rút được tổng cộng 16 triệu?',
        lua_chon: [
          'Do Race Condition: Cả 2 luồng đọc số dư 10 triệu cùng lúc trước khi luồng kia kịp ghi trừ tiền',
          'Do tài khoản ngân hàng được cấp hạn mức thấu chi ngầm tự động'
        ],
        dung: 0,
        giai_thich: 'Hai luồng cùng đọc tại cùng một mili-giây nên cùng thấy số dư 10 triệu hợp lệ và cùng duyệt chi.'
      }
    },
    {
      id: 'node-khien-khoa',
      domain_id: 'domain-payment',
      cluster_id: 'cum-idempotency-app',
      infra_type: 'service',
      parent_id: 'node-tranh-chap',
      fully_explored: false,
      bieu_tuong: 'khien_bao_ve',
      tieu_de: 'Cơ chế Khóa Idempotency Key',
      nhan_buoc: 'SECURITY / IDEMPOTENCY',
      tom_tat: 'Gắn <u>UUID v4</u> duy nhất: 100 lần gửi lại vẫn **chỉ trừ tiền duy nhất 1 lần**!',
      toa_do: { x: 600, y: 520 },
      tam: { x: 710, y: 600 },
      hoat_hoa: {
        mau: 'chan_loc_khien',
        tham_so: {
          nguon: 'CLIENT',
          chu_nguon: 'Gửi lệnh',
          vat_can: 'KHIÊN',
          chu_vat_can: 'LOCK',
          dich: 'DATABASE',
          ket_qua: 'LƯU VÉ 1',
          goi_1: 'GÓI 1',
          goi_2: 'GÓI 2'
        }
      },
      chi_tiet: {
        phan_loai: 'MẪU THIẾT KẾ PHÒNG THỦ',
        tieu_de: 'Cơ chế Khóa Idempotency Key',
        ban_chat: 'Khách hàng tạo một mã <u>UUID v4</u> ngẫu nhiên cho mỗi giao dịch và truyền qua Header <u>Idempotency-Key</u>. Máy chủ lưu khóa này kèm trạng thái; nếu nhận lại cùng mã khóa thì trả ngay kết quả cũ mà **không thực hiện giao dịch lại**.',
        chu_thich_so_do: 'Mô phỏng: Gói 1 mang chìa khóa hợp lệ đi qua khiên bảo vệ vào DB. Gói 2 gửi lặp bị lá chắn phản hồi kết quả cũ ngay lập tức!',
        ca_thuc_te: [
          'Tạo chuỗi <u>UUID v4</u> duy nhất tại thiết bị người dùng trước khi gửi thanh toán.',
          'Kiểm tra và lưu khóa bằng lệnh <u>SETNX</u> trong <u>Redis</u> với thời gian sống **120 giây**.',
          'Nếu khóa đã tồn tại trong Redis, trả ngay mã **409 Conflict** hoặc kết quả đã lưu.'
        ],
        rui_ro: [
          'Nếu máy chủ lưu khóa bị sập giữa chừng, các yêu cầu tiếp theo có thể bị xử lý lặp.',
          'Cần cơ chế dọn rác <u>TTL</u> hợp lý để tránh làm đầy bộ nhớ đệm <u>RAM</u>.'
        ],
        chuoi_sup_do: [
          '1. Mất lá chắn Idempotency Key ở tầng cổng API.',
          '2. Toàn bộ các yêu cầu gửi lặp lọt thẳng xuống tầng Database.',
          '3. I/O Database tăng vọt, các luồng tranh nhau khóa hàng loạt bảng ghi.',
          '4. Hệ thống rơi vào thắt cổ chai và xử lý trùng lặp giao dịch.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Vai trò cốt lõi của việc truyền Idempotency-Key (UUID v4) trong Header yêu cầu thanh toán là gì?',
        lua_chon: [
          'Giúp server nhận diện request đã từng xử lý chưa, tránh thực thi lại lần thứ hai',
          'Mã hóa đường truyền mạng an toàn hơn giao thức HTTPS tiêu chuẩn'
        ],
        dung: 0,
        giai_thich: 'Idempotency Key đóng vai trò định danh duy nhất cho một ý định giao dịch, đảm bảo n lần gửi chỉ thực thi đúng 1 lần.'
      }
    },
    {
      id: 'node-tru-db',
      domain_id: 'domain-shared-infra',
      cluster_id: 'cum-shared-infrastructure',
      is_public_interface: true,
      infra_type: 'postgres',
      parent_id: 'node-khien-khoa',
      fully_explored: true,
      bieu_tuong: 'khoi_tru_database',
      tieu_de: 'Bảo chứng ACID & Khóa dòng',
      nhan_buoc: 'STORAGE / ACID DB',
      tom_tat: 'Dùng <u>Row Lock</u> & <u>Unique Constraint</u>: chốt chặn cuối cùng ngăn số dư âm.',
      toa_do: { x: 600, y: 940 },
      tam: { x: 710, y: 1020 },
      hoat_hoa: {
        mau: 'luu_tru_acid',
        tham_so: {
          khoa: 'ROW LOCK',
          tinh_trang: 'CHỜ THỨ TỰ',
          trang_thai: 'ACID COMMITTED',
          bao_ve: 'UNIQUE INDEX'
        }
      },
      chi_tiet: {
        phan_loai: 'TOÀN VẸN DỮ LIỆU CỐT LÕI',
        tieu_de: 'Bảo chứng ACID & Ràng buộc Unique',
        ban_chat: 'Dù tầng ứng dụng có gặp lỗi, tầng cơ sở dữ liệu quan hệ với các nguyên lý <u>ACID</u> và chỉ mục <u>Unique Constraint</u> là bức tường phòng thủ vững chắc cuối cùng ngăn chặn mọi hành vi ghi đè hoặc số dư âm.',
        chu_thich_so_do: 'Mô phỏng: Cơ chế Row Lock bắt các tiến trình xếp hàng tuần tự; Unique Index triệt tiêu mọi hành vi ghi trùng.',
        ca_thuc_te: [
          'Dùng câu lệnh `SELECT ... FOR UPDATE` để khóa hàng số dư trong lúc tính toán.',
          'Tạo chỉ mục `UNIQUE INDEX` trên cột `idempotency_key` trong bảng giao dịch.',
          'Toàn bộ chuỗi thao tác được bọc trong một <u>Transaction</u> có mức cô lập cao.'
        ],
        rui_ro: [
          'Nếu khóa dòng quá lâu có thể dẫn đến hiện tượng nghẽn cổ chai hoặc <u>Deadlock</u>.',
          'Làm giảm thông lượng xử lý của toàn bộ hệ thống thanh toán nếu không tối ưu index.'
        ],
        chuoi_sup_do: [
          '1. Gỡ bỏ Row Lock và Unique Constraint ở tầng Database.',
          '2. Khi ứng dụng scale nhiều máy chủ (multi-pod), khóa RAM bị bypass.',
          '3. Hai transaction cùng insert một mã giao dịch thành công.',
          '4. Bút toán kế toán bị nhân bản, hệ số đối soát tài chính bị sai lệch nghiêm trọng.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Tại sao cần đặt UNIQUE INDEX trên cột idempotency_key ở Database ngay cả khi đã dùng Redis?',
        lua_chon: [
          'DB là chốt chặn phòng thủ cuối cùng phòng khi Redis sập hoặc hết bộ nhớ',
          'Để cơ sở dữ liệu tự động gửi email thông báo cho kế toán'
        ],
        dung: 0,
        giai_thich: 'Cơ sở dữ liệu với Unique Index và ACID là bảo chứng kiên cố nhất phòng ngừa mọi trường hợp tầng cache bị fail.'
      }
    },
    {
      id: 'node-tmdt',
      domain_id: 'domain-ecommerce',
      cluster_id: 'cum-tmdt-domain',
      is_public_interface: true,
      infra_type: 'service',
      parent_id: 'node-tranh-chap',
      fully_explored: true,
      bieu_tuong: 'hop_kien_hang_domain',
      tieu_de: 'Flash Sale mở bán chớp nhoáng',
      nhan_buoc: 'DOMAIN / E-COMMERCE',
      tom_tat: '10.000 khách tranh mua 1 món hàng: chung bản chất <u>Race Condition</u> ghi tồn kho.',
      toa_do: { x: 1300, y: 100 },
      tam: { x: 1410, y: 180 },
      hoat_hoa: {
        mau: 'giao_thoa_domain',
        tham_so: {
          domain: 'FLASH SALE',
          ap_luc: '10.000 khách tranh mua',
          giao_diem: 'ĐIỂM TRANH CHẤP',
          nguyen_ly: 'Chung cốt lõi Payout'
        }
      },
      chi_tiet: {
        phan_loai: 'SÀN THƯƠNG MẠI ĐIỆN TỬ',
        tieu_de: 'Khóa tồn kho mở bán Flash Sale',
        ban_chat: 'Hàng nghìn người cùng bấm thanh toán một chiếc điện thoại duy nhất lúc 0h. Về bản chất kỹ thuật, bài toán này hệt như bài toán số dư chi trả: đều là <u>Race Condition</u> trên một tài nguyên có hạn.',
        chu_thich_so_do: 'Mô phỏng: 10.000 khách đặt lệnh Flash Sale cùng lúc dẫn vào điểm tranh chấp ghi tồn kho giống hệt kiến tắc thanh toán.',
        ca_thuc_te: [
          'Mở bán **100 chiếc vé** ca nhạc trong vòng **10 giây**.',
          'Nếu thiếu <u>Row Lock</u> và <u>Idempotency</u>, hệ thống sẽ bán thành công cho **120 người** gây thiếu hàng.'
        ],
        rui_ro: [
          'Bán vượt số lượng tồn kho (<u>Overselling</u>).',
          'Chi phí bồi thường và khủng hoảng niềm tin từ khách hàng.'
        ],
        chuoi_sup_do: [
          '1. 10.000 khách mua Flash Sale cùng tranh chấp số lượng hàng tồn kho.',
          '2. Thiếu cơ chế khóa dòng đồng thời khiến nhiều order cùng đọc thấy còn hàng.',
          '3. Hệ thống bán vượt số lượng thực có (Overselling 120/100 món).',
          '4. Khủng hoảng bồi thường và thương hiệu đối với khách mua hàng.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Hiện tượng Overselling (bán âm kho) trong sự kiện flash-sale thường do nguyên nhân cốt lõi nào?',
        lua_chon: [
          'Nhiều đơn hàng thanh toán đồng thời mà thiếu khóa dòng (Row Lock) hoặc khóa phân tán',
          'Do khách hàng cố tình tạo nhiều tài khoản ảo cùng lúc'
        ],
        dung: 0,
        giai_thich: 'Thiếu khóa đồng thời khiến nhiều transaction cùng đọc thấy còn hàng và cùng trừ tồn kho xuống số âm.'
      }
    }
  ],
  edges: [
    {
      from: 'node-su-co',
      to: 'node-tranh-chap',
      nhan: 'Webhook Timeout Retry',
      kieu: 'duong-xung-su-co',
      loai_lien_ket: 'KICH_HOAT',
      giai_thich: 'Webhook bị gửi lặp do timeout mạng (1.2s) khiến 2 luồng xử lý cùng chạy song song, trực tiếp kích hoạt Race Condition khi kiểm tra số dư ví.'
    },
    {
      from: 'node-tranh-chap',
      to: 'node-khien-khoa',
      nhan: 'Atomic Lock Check',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'Để triệt tiêu Race Condition từ nguồn, Idempotency Key đóng vai trò lá chắn khóa chặn mọi yêu cầu trùng lặp trước khi đụng vào số dư.'
    },
    {
      from: 'node-khien-khoa',
      to: 'node-tru-db',
      nhan: 'ACID Write / Unique Index',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'LUU_TRU',
      giai_thich: 'Khiên Idempotency bắt buộc phải được neo chặt bởi Unique Constraint và ACID Transaction ở tầng Database để đảm bảo an toàn tuyệt đối ngay cả khi máy chủ crash.'
    },
    {
      from: 'node-tmdt',
      to: 'node-tranh-chap',
      nhan: 'Flash Sale Race Condition',
      kieu: 'duong-xung-tmdt',
      loai_lien_ket: 'GIAO_THOA',
      giai_thich: 'Dù ở domain Sàn Thương Mại (Flash Sale), việc 10.000 khách tranh mua 1 món hàng chia sẻ chung 100% bản chất kỹ thuật với bài toán Race Condition kiểm tra số dư ví.'
    }
  ]
};

// Dữ liệu mở rộng delta cho Queue & Cache
export const DELTA_NODES_QUEUE_CACHE: { nodes: NodeEntity[]; edges: any[] } = {
  nodes: [
    {
      id: 'node-queue',
      domain_id: 'domain-shared-infra',
      cluster_id: 'cum-shared-infrastructure',
      is_public_interface: true,
      infra_type: 'kafka',
      parent_id: 'node-khien-khoa',
      fully_explored: false,
      bieu_tuong: 'hang_doi_message_queue',
      tieu_de: 'Hàng đợi Message Queue',
      nhan_buoc: 'ASYNC / QUEUE BUFFER',
      tom_tat: 'Điều tiết **10.000 req/s** thành **100 req/s** êm ái qua <u>Message Queue</u>.',
      toa_do: { x: 1100, y: 380 },
      tam: { x: 1210, y: 460 },
      hoat_hoa: {
        mau: 'hang_doi_dieu_tiet',
        tham_so: {
          dau_vao: 'PRODUCER',
          tai_cao: '10k req/s',
          vung_dem: 'QUEUE BUFFER',
          tho: 'WORKER',
          dieu_tiet: '100 req/s'
        }
      },
      chi_tiet: {
        phan_loai: 'MÔ HÌNH BĂNG CHUYỀN HÀNG ĐỢI',
        tieu_de: 'Hàng đợi tin nhắn (Message Queue)',
        ban_chat: 'Thay vì xử lý trực tiếp gây sập cơ sở dữ liệu, yêu cầu được đưa vào hàng đợi tin nhắn (<u>Message Queue</u>) để nhóm tiến trình thợ (<u>Worker Pool</u>) rút ra xử lý tuần tự từng gói một.',
        chu_thich_so_do: 'Mô phỏng: Client gửi dồn dập **10.000 req/s** vào Queue Buffer. Worker phía sau rút ra êm ả **100 req/s**, bảo vệ hệ thống không bao giờ nghẽn.',
        ca_thuc_te: [
          '**10.000 yêu cầu rút tiền** dồn vào cùng 1 giây khi có sự kiện mở cổng.',
          'Queue đệm các lệnh lại và điều tiết nhóm thợ rút **100 lệnh/giây**.',
          'Hệ thống vận hành êm ả, **không bao giờ nghẽn kết nối database**.'
        ],
        rui_ro: [
          'Nếu Queue bị sập mà không bật cơ chế lưu đĩa (Persistence), giao dịch sẽ bị thất lạc hoàn toàn.'
        ],
        chuoi_sup_do: [
          '1. Message Queue ngừng hoạt động hoặc bị tràn bộ nhớ đệm.',
          '2. 10.000 req/s đổ ập trực tiếp vào các transaction Database.',
          '3. Cạn kiệt Connection Pool và Database sập hoàn toàn.',
          '4. Mất khả năng xử lý đơn thanh toán trong toàn hệ thống.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Vai trò lớn nhất của Message Queue (Kafka / RabbitMQ) trong hệ thống chịu tải cao là gì?',
        lua_chon: [
          'San phẳng đỉnh tải (Rate Limiting / Buffering) để bảo vệ database phía sau',
          'Thay thế hoàn toàn cơ sở dữ liệu đĩa cứng để lưu trữ vĩnh viễn'
        ],
        dung: 0,
        giai_thich: 'Message Queue đóng vai trò đệm và điều tiết tốc độ, ngăn chặn Database bị quá tải khi có bão request.'
      }
    },
    {
      id: 'node-cache',
      domain_id: 'domain-shared-infra',
      cluster_id: 'cum-shared-infrastructure',
      is_public_interface: true,
      infra_type: 'redis',
      parent_id: 'node-khien-khoa',
      fully_explored: false,
      bieu_tuong: 'bo_nho_dem_cache',
      tieu_de: 'Khóa phân tán Redis Cache',
      nhan_buoc: 'CACHE / DISTRIBUTED LOCK',
      tom_tat: 'Khóa nhanh bằng lệnh <u>SETNX</u> trên RAM Redis chỉ mất **1ms** trước khi gọi DB.',
      toa_do: { x: 1100, y: 680 },
      tam: { x: 1210, y: 760 },
      hoat_hoa: {
        mau: 'doc_cache_nhanh',
        tham_so: {
          yeu_cau: 'REQUEST',
          cache: 'REDIS CACHE',
          toc_do: 'RAM: 1ms',
          dia_cung: 'DB DISK',
          trang_thai_db: 'Bỏ qua đĩa'
        }
      },
      chi_tiet: {
        phan_loai: 'BỘ NHỚ ĐỆM TỐC ĐỘ CAO',
        tieu_de: 'Khóa phân tán Redis (Distributed Lock)',
        ban_chat: 'Sử dụng lệnh <u>SETNX</u> trên Redis để tạo <u>Distributed Lock</u> trong vài mili-giây. Tiến trình nào giành được khóa mới được quyền kiểm tra số dư và trừ tiền.',
        chu_thich_so_do: 'Mô phỏng: Request đọc và khóa trực tiếp trên RAM Redis chỉ mất **1ms**, không chạm xuống đĩa cứng DB.',
        ca_thuc_te: [
          'Dùng thuật toán <u>Redlock</u> đảm bảo an toàn giữa cụm Redis đa node.',
          'Tự động giải phóng khóa qua <u>TTL</u> nếu tiến trình thợ bị treo giữa chừng.'
        ],
        rui_ro: [
          'Nếu quên đặt thời gian sống <u>TTL</u>, hệ thống sẽ rơi vào kẹt khóa vĩnh viễn (<u>Deadlock</u>).'
        ],
        chuoi_sup_do: [
          '1. Khóa phân tán Redis bị mất hoặc cụm Redis gặp split-brain.',
          '2. Nhiều máy chủ cùng giành được lock tài khoản một lúc.',
          '3. Kiểm tra số dư cùng thời điểm và cùng trừ tiền.',
          '4. Số dư tài khoản rơi vào trạng thái âm nghiêm trọng.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Tại sao lệnh SETNX trên Redis lại được dùng phổ biến để tạo Distributed Lock?',
        lua_chon: [
          'Xử lý đơn luồng trên RAM cực nhanh (~1ms) và đảm bảo tính nguyên tử (Atomic)',
          'Tự động đồng bộ sang mọi Database quan hệ mà không cần lập trình'
        ],
        dung: 0,
        giai_thich: 'SETNX thực thi atomic trên RAM đơn luồng của Redis nên không bao giờ xảy ra Race Condition khi giành khóa.'
      }
    }
  ],
  edges: [
    {
      from: 'node-khien-khoa',
      to: 'node-queue',
      nhan: 'Async Event Produce',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'DEM_LOC',
      giai_thich: 'Sau khi kiểm tra Idempotency hợp lệ, gói tin được đẩy vào Message Queue để điều tiết tốc độ xử lý, bảo vệ database phía sau.'
    },
    {
      from: 'node-khien-khoa',
      to: 'node-cache',
      nhan: 'Distributed Lock Acquire',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'Thay vì để các luồng tranh chấp tranh nhau khóa đĩa cứng, Distributed Lock trên RAM Redis chặn xung đột ở tốc độ 1ms.'
    }
  ]
};
