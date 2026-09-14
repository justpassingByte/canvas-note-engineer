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

export const MASTER_FULLSTACK_GRAPH: GraphData = {
  id: 'graph-interactive-workspace',
  topic: 'Fullstack 3 YoE Production Architecture (Client, Gateway, Compute, Storage, Observability)',
  nodes: [
    {
      id: 'node-ui-view',
      domain_id: 'domain-frontend',
      cluster_id: 'cum-client-tier',
      infra_type: 'service',
      is_public_interface: true,
      fully_explored: true,
      bieu_tuong: 'ui_component_view',
      tieu_de: 'React Client UI & State',
      nhan_buoc: 'GATEWAY / INGRESS',
      tom_tat: 'Cây component React, quản lý state, TanStack Query cache và tối ưu referential equality (useCallback, useMemo).',
      toa_do: { x: 80, y: 150 },
      tam: { x: 190, y: 222 },
      hoat_hoa: { mau: 'doc_cache_nhanh', tham_so: {} },
      chi_tiet: {
        phan_loai: 'TẦNG GIAO DIỆN CLIENT',
        tieu_de: 'React Client UI, Virtual DOM & State Management',
        ban_chat: 'Khung nhìn Client quản lý vòng đời render, Fiber Reconciliation, và tối ưu hóa hiệu năng bằng cách ổn định tham chiếu con trỏ hàm (useCallback) và ghi nhớ giá trị tính toán tốn kém (useMemo). Kết hợp TanStack Query quản lý Server State, tự động dedup request và stale-while-revalidate.',
        chu_thich_so_do: 'Mô hình Client tương tác trực tiếp với người dùng và kết nối tới Next.js Server Components.',
        ca_thuc_te: [
          'Dùng useCallback giữ nguyên tham chiếu function truyền xuống con bọc React.memo.',
          'TanStack Query cache dữ liệu API đơn hàng, hỗ trợ Optimistic Update khi người dùng bấm thích/hủy đơn.'
        ],
        rui_ro: [
          'Stale closure trong useEffect khi bỏ sót dependency array.',
          'Re-render dây chuyền toàn bộ cây DOM con khi lưu state ở quá cao (Prop Drilling).'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'useCallback có tác dụng tối ưu khi nào?',
        lua_chon: [
          'Khi truyền function xuống component con bọc bởi React.memo hoặc dùng trong dependency của hook khác',
          'Luôn giúp hàm chạy nhanh hơn gấp đôi trên mọi thẻ HTML thông thường'
        ],
        dung: 0,
        giai_thich: 'useCallback chỉ ổn định con trỏ hàm để ngăn React.memo re-render component con không cần thiết.'
      }
    },
    {
      id: 'node-rendering-ssr',
      domain_id: 'domain-nextjs',
      cluster_id: 'cum-client-tier',
      infra_type: 'service',
      is_public_interface: true,
      fully_explored: true,
      bieu_tuong: 'rendering_ssr_csr',
      tieu_de: 'Next.js App Router (RSC Boundary)',
      nhan_buoc: 'COMPUTE / CONCURRENCY',
      tom_tat: 'Ranh giới mạng giữa Server Components (zero bundle) và Client Components, SSR streaming và ISR.',
      toa_do: { x: 80, y: 480 },
      tam: { x: 190, y: 552 },
      hoat_hoa: { mau: 'truyen_song_dong_bo', tham_so: {} },
      chi_tiet: {
        phan_loai: 'TẦNG RENDER & SSR',
        tieu_de: 'React Server Components & Network Boundary',
        ban_chat: 'Server Components chạy 100% trên server, truy cập trực tiếp DB/secret mà không tốn byte JS bundle nào gửi về client. Client Components ("use client") được render trước trên server rồi hydrate trên browser để xử lý tương tác người dùng.',
        chu_thich_so_do: 'Ranh giới phân tách mã nguồn Server và Client an toàn, zero-bundle size.',
        ca_thuc_te: [
          'Tách trang Product Detail: Server Component fetch dữ liệu từ DB, Client Component chỉ bọc nút Mua Hàng.',
          'Sử dụng Suspense Streaming để stream từng phần HTML xuống trình duyệt, giảm chỉ số TTFB và FCP.'
        ],
        rui_ro: [
          'Đặt "use client" ở root layout biến toàn bộ app thành Client Component.',
          'Import database connection bên trong file Client Component gây lộ bí mật và lỗi build.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Server Component khác Client Component ở điểm nào?',
        lua_chon: [
          'Server Component không gửi JavaScript bundle về trình duyệt và không dùng được useState',
          'Server Component chỉ chạy ở Client còn Client Component chỉ chạy ở Server'
        ],
        dung: 0,
        giai_thich: 'Server Components chạy hoàn toàn trên server, loại bỏ dependencies khỏi client bundle.'
      }
    },
    {
      id: 'node-cong-gateway',
      domain_id: 'domain-gateway',
      cluster_id: 'cum-edge-ingress',
      infra_type: 'gateway',
      is_public_interface: true,
      fully_explored: true,
      bieu_tuong: 'cong_gateway_ingress',
      tieu_de: 'API Gateway & WAF Rate Limit',
      nhan_buoc: 'EDGE / WAF RATE LIMIT',
      tom_tat: 'Điểm tiếp nhận ingress, lọc request lặp bằng Idempotency-Key, Token Bucket rate limit và CORS.',
      toa_do: { x: 450, y: 150 },
      tam: { x: 560, y: 222 },
      hoat_hoa: { mau: 'kiem_tra_khoa', tham_so: {} },
      chi_tiet: {
        phan_loai: 'TẦNG GATEWAY & BẢO VỆ ĐẦU VÀO',
        tieu_de: 'API Gateway Ingress, Idempotency & Rate Limiting',
        ban_chat: 'Cổng tiếp nhận duy nhất cho toàn bộ traffic bên ngoài. Triển khai thuật toán Token Bucket / Leaky Bucket để chống tấn công từ chối dịch vụ (DDoS), kiểm tra header Idempotency-Key ngăn trùng lặp giao dịch thanh toán khi client retry.',
        chu_thich_so_do: 'Lớp bảo vệ vòng ngoài chặn đứng các cuộc gọi spam và bảo vệ hạ tầng phía sau.',
        ca_thuc_te: [
          'Lưu trữ idempotency key trạng thái PROCESSING trong DB hoặc Redis với TTL 120s.',
          'Áp dụng CORS whitelist cho phép domain Frontend gọi API an toàn.'
        ],
        rui_ro: [
          'Thiếu Unique Index ở DB dẫn tới Check-then-act race condition khi 2 request đến cùng mili-giây.',
          'Rate limiting không theo IP/User khiến người dùng hợp lệ bị chặn oan khi ở chung mạng văn phòng.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Tại sao API thanh toán bắt buộc phải có Idempotency Key?',
        lua_chon: [
          'Để khi mạng lag client retry lại, tiền không bao giờ bị trừ 2 lần',
          'Để nén kích thước file JSON trả về nhẹ hơn'
        ],
        dung: 0,
        giai_thich: 'Idempotency Key đảm bảo gọi nhiều lần cùng một payload thì trạng thái tài khoản chỉ trừ đúng 1 lần.'
      }
    },
    {
      id: 'node-auth-service',
      domain_id: 'domain-auth',
      cluster_id: 'cum-edge-ingress',
      infra_type: 'service',
      is_public_interface: true,
      fully_explored: true,
      bieu_tuong: 'dinh_danh_auth_token',
      tieu_de: 'Auth Service (JWT RTR & Session)',
      nhan_buoc: 'SECURITY / IDEMPOTENCY',
      tom_tat: 'Xác thực người dùng, Refresh Token Rotation (RTR), thu hồi Token Family và lưu HttpOnly Cookie.',
      toa_do: { x: 450, y: 480 },
      tam: { x: 560, y: 552 },
      hoat_hoa: { mau: 'kiem_tra_khoa', tham_so: {} },
      chi_tiet: {
        phan_loai: 'TẦNG BẢO MẬT & ĐỊNH DANH',
        tieu_de: 'Authentication, Refresh Token Rotation & Token Family',
        ban_chat: 'Hệ thống quản lý phiên an toàn: Access Token ngắn hạn (15 phút), Refresh Token dài hạn (7 ngày) lưu trong HttpOnly, Secure, SameSite Cookie. Áp dụng Refresh Token Rotation: mỗi lần cấp mới sẽ vô hiệu hóa token cũ; nếu phát hiện token cũ được gửi lại (reuse), lập tức thu hồi toàn bộ Token Family của tài khoản.',
        chu_thich_so_do: 'Triệt tiêu 100% rủi ro XSS đánh cắp token và phát hiện kẻ gian đột nhập phiên.',
        ca_thuc_te: [
          'Lưu refresh token hash trong PostgreSQL, đánh dấu family_id để thu hồi đồng loạt.',
          'Mã hóa mật khẩu bằng thuật toán Argon2id hoặc bcrypt có Salt ngẫu nhiên.'
        ],
        rui_ro: [
          'Lưu JWT vào localStorage tạo điều kiện cho mã độc XSS đọc trộm token.',
          'Không cài đặt SameSite Cookie khiến API bị tấn công Cross-Site Request Forgery (CSRF).'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Tại sao nên lưu token vào HttpOnly Cookie thay vì localStorage?',
        lua_chon: [
          'Vì JavaScript trong trình duyệt không thể đọc được HttpOnly Cookie, chống 100% rò rỉ qua XSS',
          'Vì localStorage chỉ lưu được tối đa 10 bytes dữ liệu'
        ],
        dung: 0,
        giai_thich: 'Thuộc tính HttpOnly ngăn chặn toàn bộ mã JavaScript đọc cookie, bảo vệ token khỏi hacker.'
      }
    },
    {
      id: 'node-backend-service',
      domain_id: 'domain-backend',
      cluster_id: 'cum-compute-tier',
      infra_type: 'service',
      is_public_interface: true,
      fully_explored: true,
      bieu_tuong: 'dieu_phoi_service',
      tieu_de: 'NestJS Core API Service',
      nhan_buoc: 'COMPUTE / CONCURRENCY',
      tom_tat: 'Pipeline xử lý nghiệp vụ: Middleware → Guard → Interceptor → Pipe → Filter, Dependency Injection.',
      toa_do: { x: 820, y: 150 },
      tam: { x: 930, y: 222 },
      hoat_hoa: { mau: 'tien_trinh_song_song', tham_so: {} },
      chi_tiet: {
        phan_loai: 'TẦNG DỊCH VỤ XỬ LÝ TRUNG TÂM',
        tieu_de: 'NestJS Request Lifecycle & Clean Architecture',
        ban_chat: 'Khung điều phối nghiệp vụ theo thứ tự chuẩn: Middleware gán correlation_id → Guard kiểm tra JWT/RBAC → Interceptor đo lường thời gian thực thi → Pipe validate DTO bằng class-validator → Controller gọi Domain Services → Exception Filter chuẩn hóa format lỗi JSON.',
        chu_thich_so_do: 'Kiến trúc Module hóa, Dependency Injection lỏng lẻo dễ dàng viết Unit & Integration Tests.',
        ca_thuc_te: [
          'Sử dụng Async/Await kết hợp Transactional Outbox Pattern để bắn event vào queue.',
          'Stream dữ liệu file lớn bằng Node.js Stream tránh cạn kiệt bộ nhớ Heap của tiến trình.'
        ],
        rui_ro: [
          'Chạy các tác vụ nặng ngốn CPU (như mã hóa ảnh, xuất file 1 triệu dòng) trên Event Loop chính làm block server.',
          'Quên giải phóng kết nối database trong block catch gây tràn connection pool.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Trong NestJS, thành phần nào chạy trước để kiểm tra quyền truy cập của người dùng?',
        lua_chon: [
          'Guard (chạy sau Middleware nhưng trước Pipe và Controller)',
          'Pipe (chạy sau Controller)'
        ],
        dung: 0,
        giai_thich: 'Guard chạy trước Pipe và Controller để từ chối ngay request không hợp lệ.'
      }
    },
    {
      id: 'node-s3-upload',
      domain_id: 'domain-storage',
      cluster_id: 'cum-compute-tier',
      infra_type: 'service',
      is_public_interface: true,
      fully_explored: true,
      bieu_tuong: 'khoi_tru_database',
      tieu_de: 'AWS S3 Storage & Presigned URLs',
      nhan_buoc: 'STORAGE / ACID DB',
      tom_tat: 'Client tải file trực tiếp lên S3 bằng Presigned PUT URL, không tốn RAM backend, bảo vệ bằng CDN CloudFront.',
      toa_do: { x: 820, y: 480 },
      tam: { x: 930, y: 552 },
      hoat_hoa: { mau: 'luu_tru_acid', tham_so: {} },
      chi_tiet: {
        phan_loai: 'TẦNG LƯU TRỮ ĐỐI TƯỢNG (CLOUD S3)',
        tieu_de: 'Direct-to-S3 Upload với Presigned URL',
        ban_chat: 'Client gửi request xin URL tạm thời → Server tạo S3 Presigned PUT URL có chữ ký mật mã (TTL 5 phút) → Trình duyệt upload trực tiếp file dữ liệu nhị phân lên thẳng S3 Bucket. Backend không phải trung chuyển file, tiết kiệm 100% RAM và băng thông.',
        chu_thich_so_do: 'Giải pháp chịu tải hàng triệu tệp tin mà không lo server API bị nghẽn.',
        ca_thuc_te: [
          'Kiểm tra định dạng file bằng Magic Bytes phía server trước khi cấp URL.',
          'Bucket luôn để Block Public Access, cấp CloudFront Signed URL khi người dùng cần tải file riêng tư.'
        ],
        rui_ro: [
          'Cho phép upload trực tiếp mà không giới hạn Content-Length dẫn tới người dùng upload file quá dung lượng cho phép.',
          'Chỉ kiểm tra đuôi file .png mà không quét Magic Bytes dính lỗ hổng thực thi mã độc.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Lợi ích lớn nhất của việc upload trực tiếp lên S3 bằng Presigned URL là gì?',
        lua_chon: [
          'Dữ liệu file không đi qua API Server, tiết kiệm tối đa RAM và băng thông cho backend',
          'S3 tự động sửa ảnh xấu thành ảnh đẹp'
        ],
        dung: 0,
        giai_thich: 'Client upload thẳng lên S3 giúp API Server không bị nghẽn I/O khi có nhiều người cùng upload file lớn.'
      }
    },
    {
      id: 'node-cache-redis',
      domain_id: 'domain-cache',
      cluster_id: 'cum-storage-tier',
      infra_type: 'redis',
      is_public_interface: true,
      fully_explored: true,
      bieu_tuong: 'bo_nho_dem_cache',
      tieu_de: 'Redis RAM Cache & Distributed Lock',
      nhan_buoc: 'CACHE / DISTRIBUTED LOCK',
      tom_tat: 'Bộ nhớ đệm Cache-Aside (~1ms), khóa phân tán Redlock bằng Lua script chống Cache Stampede.',
      toa_do: { x: 1200, y: 80 },
      tam: { x: 1310, y: 152 },
      hoat_hoa: { mau: 'doc_cache_nhanh', tham_so: {} },
      chi_tiet: {
        phan_loai: 'TẦNG BỘ NHỚ ĐỆM & KHÓA PHÂN TÁN',
        tieu_de: 'Redis Cache-Aside Pattern & Redlock Concurrency',
        ban_chat: 'Phục vụ dữ liệu đọc cực nhanh (<2ms). Sử dụng mô hình Cache-Aside: Ứng dụng đọc Redis trước, nếu miss mới đọc DB và ghi ngược lại vào Redis kèm TTL có Jitter ngẫu nhiên. Dùng lệnh SET NX EX kèm Lua Script nguyên tử để giành và giải phóng Distributed Lock an toàn.',
        chu_thich_so_do: 'Bảo vệ Database không bị quá tải khi có lượng truy cập đột biến (Cache Stampede).',
        ca_thuc_te: [
          'Giải phóng lock bằng Lua script: if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end.',
          'Thiết lập Circuit Breaker tự động hạ tải xuống DB nếu Redis server gặp sự cố.'
        ],
        rui_ro: [
          'Cài đặt cùng một TTL cố định cho hàng triệu bản ghi gây Cache Avalanche.',
          'Không kiểm tra token sở hữu khi del lock khiến tiến trình xóa nhầm khóa của request khác.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Tại sao giải phóng Redis Distributed Lock bắt buộc phải dùng Lua Script?',
        lua_chon: [
          'Để thao tác kiểm tra token sở hữu và lệnh xóa khóa diễn ra nguyên tử (Atomic), không bị race condition',
          'Vì Redis chỉ hiểu ngôn ngữ Lua'
        ],
        dung: 0,
        giai_thich: 'Lua script đảm bảo tính nguyên tử, ngăn việc xóa nhầm lock của request khác khi lock của mình đã hết hạn.'
      }
    },
    {
      id: 'node-tru-db',
      domain_id: 'domain-database',
      cluster_id: 'cum-storage-tier',
      infra_type: 'postgres',
      is_public_interface: true,
      fully_explored: true,
      bieu_tuong: 'khoi_tru_database',
      tieu_de: 'PostgreSQL ACID DB & B-Tree Index',
      nhan_buoc: 'STORAGE / ACID DB',
      tom_tat: 'Kho lưu trữ dữ liệu nguồn chân lý, bảo chứng ACID, MVCC isolation levels, EXPLAIN ANALYZE và Composite Index.',
      toa_do: { x: 1200, y: 320 },
      tam: { x: 1310, y: 392 },
      hoat_hoa: { mau: 'luu_tru_acid', tham_so: {} },
      chi_tiet: {
        phan_loai: 'TẦNG DỮ LIỆU NGUỒN CHÂN LÝ',
        tieu_de: 'PostgreSQL ACID, MVCC & Query Optimization',
        ban_chat: 'Cơ sở dữ liệu quan hệ trung tâm đảm bảo 4 tính chất ACID. Sử dụng MVCC (Multi-Version Concurrency Control) cho phép thao tác đọc không bao giờ khóa thao tác ghi và ngược lại. Tối ưu hóa truy vấn hàng chục triệu bản ghi bằng B-Tree Index, tuân thủ Leftmost Prefix Rule và phân tích chi phí qua EXPLAIN (ANALYZE, BUFFERS).',
        chu_thich_so_do: 'Trụ cột lưu trữ bền vững, đảm bảo toàn vẹn dữ liệu cho toàn bộ giao dịch.',
        ca_thuc_te: [
          'Khắc phục N+1 query bằng JOIN hoặc eager loading gom nhóm ID (WHERE id IN (...)).',
          'Sử dụng Cursor-based Pagination thay vì OFFSET lớn trên bảng hàng chục triệu dòng.'
        ],
        rui_ro: [
          'Tạo quá nhiều index bừa bãi làm chậm trầm trọng thao tác INSERT và UPDATE.',
          'Gặp lỗi cạn kiệt Connection Pool (max_connections) khi không dùng PgBouncer hoặc RDS Proxy.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Khi bảng có 10 triệu dòng, tại sao OFFSET 1000000 LIMIT 20 lại rất chậm?',
        lua_chon: [
          'Vì PostgreSQL vẫn phải đọc và loại bỏ 1 triệu dòng trước đó trước khi lấy 20 dòng',
          'Vì Database bị lỗi tràn bộ nhớ ổ cứng'
        ],
        dung: 0,
        giai_thich: 'OFFSET buộc database phải duyệt qua toàn bộ số dòng bỏ qua. Giải pháp là dùng Cursor-based Pagination (WHERE id > last_seen_id LIMIT 20).'
      }
    },
    {
      id: 'node-queue-kafka',
      domain_id: 'domain-queue',
      cluster_id: 'cum-storage-tier',
      infra_type: 'kafka',
      is_public_interface: true,
      fully_explored: true,
      bieu_tuong: 'hang_doi_message_queue',
      tieu_de: 'Message Queue & Worker (DLQ)',
      nhan_buoc: 'ASYNC / QUEUE BUFFER',
      tom_tat: 'Hàng đợi tin nhắn bất đồng bộ điều tiết lưu lượng (BullMQ / SQS), Dead Letter Queue (DLQ), Exponential Backoff.',
      toa_do: { x: 1200, y: 560 },
      tam: { x: 1310, y: 632 },
      hoat_hoa: { mau: 'hang_doi_dieu_tiet', tham_so: {} },
      chi_tiet: {
        phan_loai: 'TẦNG BẤT ĐỒNG BỘ & HÀNG ĐỢI',
        tieu_de: 'Message Queue, Idempotent Consumer & Dead Letter Queue (DLQ)',
        ban_chat: 'Tách rời (Decouple) các luồng xử lý nặng khỏi HTTP request. Đảm bảo tính chất At-least-once delivery, retry tự động với Exponential Backoff và Jitter ngẫu nhiên. Khi worker thất bại quá ngưỡng cho phép, message trôi vào Dead Letter Queue (DLQ) để kỹ sư điều tra mà không nghẽn hệ thống.',
        chu_thich_so_do: 'San phẳng đỉnh lưu lượng (Traffic Peak Shaving) và đảm bảo tính nhất quán cuối cùng.',
        ca_thuc_te: [
          'Tách riêng luồng trừ tiền và luồng gửi Email/SMS thông báo qua Queue.',
          'Consumer ghi nhận message_id đã xử lý vào database để chống duplicate processing.'
        ],
        rui_ro: [
          'Consumer không có tính Idempotent dẫn tới xử lý lặp lại tin nhắn khi mạng timeout lúc gửi ACK.',
          'Visibility timeout của queue quá ngắn khiến worker đang xử lý thì message bị coi là lỗi và giao cho worker khác.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Dead Letter Queue (DLQ) giải quyết vấn đề gì?',
        lua_chon: [
          'Chứa các message bị lỗi sau khi đã retry hết số lần cho phép để không làm tắc nghẽn queue chính',
          'Tự động xóa vĩnh viễn toàn bộ tin nhắn sau 1 giây'
        ],
        dung: 0,
        giai_thich: 'DLQ cách ly các tin nhắn lỗi dai dẳng, giúp hệ thống tiếp tục xử lý các tin nhắn khác bình thường.'
      }
    },
    {
      id: 'node-observability',
      domain_id: 'domain-observability',
      cluster_id: 'cum-observability-tier',
      infra_type: 'service',
      is_public_interface: true,
      fully_explored: true,
      bieu_tuong: 'khien_bao_ve',
      tieu_de: 'Telemetry Tracing & Correlation ID',
      nhan_buoc: 'OBSERVABILITY / AUDIT LOG',
      tom_tat: 'Thu thập Distributed Traces (OpenTelemetry), Correlation ID (X-Request-ID), P99 Latency và 4 Golden Signals.',
      toa_do: { x: 1580, y: 320 },
      tam: { x: 1690, y: 392 },
      hoat_hoa: { mau: 'audit_hash_chain', tham_so: {} },
      chi_tiet: {
        phan_loai: 'TẦNG QUAN SÁT & GIÁM SÁT HỆ THỐNG',
        tieu_de: 'Distributed Tracing & Systemic Root-Cause Debugging',
        ban_chat: 'Cung cấp khả năng quan sát toàn diện theo 4 Golden Signals: Latency (P95/P99), Traffic (RPS), Errors (5xx rate) và Saturation (CPU/RAM). Gán mã Correlation ID duy nhất tại Ingress Gateway và truyền dọc qua mọi microservice, queue và database để lần vết sự cố trong vài giây.',
        chu_thich_so_do: 'Mắt thần quan sát toàn bộ sức khỏe hệ thống phân tán trong môi trường Production.',
        ca_thuc_te: [
          'Dùng OpenTelemetry SDK tự động tạo trace span qua các tầng gọi HTTP và SQL.',
          'Cài đặt Alert PagerDuty khi tỷ lệ lỗi 5xx vượt quá 1% trong 5 phút liên tiếp.'
        ],
        rui_ro: [
          'Chỉ theo dõi độ trễ trung bình (Average) bỏ qua P99 khiến 1% người dùng quan trọng nhất chịu trải nghiệm tồi tệ.',
          'Ghi log quá nhiều thông tin nhạy cảm (mật khẩu, số thẻ tín dụng) vi phạm chuẩn bảo mật PCI-DSS.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Correlation ID (X-Request-ID) mang lại lợi ích lớn nhất là gì khi hệ thống gặp sự cố?',
        lua_chon: [
          'Cho phép tìm kiếm và lần theo toàn bộ hành trình của đúng 1 request qua tất cả các microservices và database',
          'Làm cho database tự động sửa lỗi SQL'
        ],
        dung: 0,
        giai_thich: 'Correlation ID xâu chuỗi toàn bộ log phân tán của một phiên giao dịch lại với nhau.'
      }
    },
    {
      id: 'node-websocket-realtime',
      domain_id: 'domain-17-websocket',
      cluster_id: 'cum-edge-ingress',
      infra_type: 'gateway',
      is_public_interface: true,
      fully_explored: true,
      bieu_tuong: 'cong_ket_noi_port',
      tieu_de: 'WebSocket & Realtime Gateway',
      nhan_buoc: 'ASYNC / QUEUE BUFFER',
      tom_tat: 'Kết nối 2 chiều WSS liên tục, Server-Sent Events (SSE), Heartbeat Ping-Pong và scale out với Redis Pub/Sub adapter.',
      toa_do: { x: 450, y: -160 },
      tam: { x: 560, y: -88 },
      hoat_hoa: { mau: 'truyen_song_dong_bo', tham_so: {} },
      chi_tiet: {
        phan_loai: 'TẦNG KẾT NỐI REALTIME',
        tieu_de: 'Bi-directional WebSocket Gateway & SSE Scaling',
        ban_chat: 'Duy trì kết nối socket WSS có trạng thái (stateful) với client. Sử dụng cơ chế Heartbeat ping/pong mỗi 30s để phát hiện socket chết do rớt mạng di động. Tích hợp Redis Pub/Sub Adapter để broadcast thông điệp xuyên qua nhiều instance microservice.',
        chu_thich_so_do: 'Truyền thông điệp thời gian thực (chat, thông báo đơn hàng, giá chứng khoán) độ trễ dưới 20ms.',
        ca_thuc_te: [
          'Cài đặt Heartbeat ping-pong chống rò rỉ file descriptors do ghost connections.',
          'Dùng Server-Sent Events (SSE) cho bảng tin thông báo 1 chiều để tiết kiệm tài nguyên so với WebSocket.'
        ],
        rui_ro: [
          'Không giới hạn số kết nối đồng thời làm cạn kiệt Linux file descriptors (ulimit 65535).',
          'Broadcasting payload quá lớn qua Redis Pub/Sub làm nghẽn băng thông mạng giữa các node.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Khi mở rộng WebSocket ra nhiều instance server, làm thế nào để server A gửi tin cho client đang kết nối vào server B?',
        lua_chon: [
          'Dùng Redis Pub/Sub hoặc Kafka làm message bus kết nối các instance server với nhau',
          'Bắt client phải ngắt kết nối và kết nối lại liên tục vào server A'
        ],
        dung: 0,
        giai_thich: 'Redis Pub/Sub là giải pháp chuẩn để đồng bộ broadcast tin nhắn giữa các instance WebSocket server.'
      }
    },
    {
      id: 'node-docker-linux',
      domain_id: 'domain-20-docker-linux',
      cluster_id: 'cum-compute-tier',
      infra_type: 'service',
      is_public_interface: false,
      fully_explored: true,
      bieu_tuong: 'tien_trinh_worker_pool',
      tieu_de: 'Docker Container & Linux Runtime',
      nhan_buoc: 'COMPUTE / CONCURRENCY',
      tom_tat: 'Multi-stage Dockerfile tối ưu kích thước image (<100MB), Linux Cgroups memory limit, SIGTERM graceful shutdown.',
      toa_do: { x: 820, y: -160 },
      tam: { x: 930, y: -88 },
      hoat_hoa: { mau: 'tien_trinh_song_song', tham_so: {} },
      chi_tiet: {
        phan_loai: 'TẦNG VẬN HÀNH CONTAINER',
        tieu_de: 'Containerization, Cgroups & Graceful Process Lifecycle',
        ban_chat: 'Đóng gói ứng dụng theo quy chuẩn Multi-stage build (tách biệt build stage và production runtime stage). Bắt tín hiệu SIGTERM từ Docker/Kubernetes để hoàn tất các request đang xử lý dở, đóng database pool trước khi tiến trình bị kết liễu bởi SIGKILL.',
        chu_thich_so_do: 'Môi trường cô lập an toàn, khởi động trong 1 giây và chống lỗi OOM Killer.',
        ca_thuc_te: [
          'Dockerfile chạy non-root user (USER node) tăng cường bảo mật container.',
          'Xử lý process.on("SIGTERM") đóng server http và database pool an toàn trong 30 giây.'
        ],
        rui_ro: [
          'Chạy tiến trình với PID 1 không chuyển tiếp tín hiệu SIGTERM dẫn đến container bị cưỡng chế tắt gây mất dữ liệu.',
          'Cấu hình memory limit Cgroups quá sát làm Linux OOM Killer bắn chết tiến trình đột ngột.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Tại sao cần xử lý tín hiệu SIGTERM trong ứng dụng Node.js container?',
        lua_chon: [
          'Để hoàn thành các request đang chạy dở và đóng kết nối DB một cách êm ái (Graceful Shutdown) trước khi container bị dừng',
          'Để ép CPU chạy ở xung nhịp cao nhất'
        ],
        dung: 0,
        giai_thich: 'Graceful shutdown xử lý nốt công việc và ngắt kết nối an toàn, chống rớt request khách hàng khi deploy.'
      }
    },
    {
      id: 'node-cicd-pipeline',
      domain_id: 'domain-21-cicd',
      cluster_id: 'cum-compute-tier',
      infra_type: 'service',
      is_public_interface: false,
      fully_explored: true,
      bieu_tuong: 'chinh_sach_rbac_pdp',
      tieu_de: 'CI/CD & Zero-Downtime Deploy',
      nhan_buoc: 'SECURITY / IDEMPOTENCY',
      tom_tat: 'GitHub Actions tự động Lint/Test/Build, Blue-Green / Canary deployment, database migration tương thích ngược.',
      toa_do: { x: 1200, y: -160 },
      tam: { x: 1310, y: -88 },
      hoat_hoa: { mau: 'kiem_tra_khoa', tham_so: {} },
      chi_tiet: {
        phan_loai: 'TẦNG TỰ ĐỘNG HÓA TRIỂN KHAI',
        tieu_de: 'Automated Delivery & Expand-Contract Database Migration',
        ban_chat: 'Quy trình kiểm soát chất lượng tự động: Mã nguồn qua pull request bắt buộc vượt qua Unit/E2E test trước khi merge. Áp dụng kỹ thuật Expand-Contract Pattern cho Database Migration: thêm cột mới trước, deploy code mới, rồi mới dọn dẹp cột cũ để đảm bảo Zero-Downtime hoàn toàn.',
        chu_thich_so_do: 'Triển khai liên tục không gián đoạn dịch vụ của người dùng.',
        ca_thuc_te: [
          'Cài đặt GitHub Actions matrix test trên nhiều phiên bản Node.js.',
          'Canary Deployment điều hướng 5% traffic vào bản build mới để giám sát tỷ lệ lỗi trước khi rollout 100%.'
        ],
        rui_ro: [
          'Chạy migration xóa hoặc đổi tên cột DB trực tiếp làm phiên bản app cũ đang chạy bị crash ngay lập tức.',
          'Thiếu cơ chế tự động Rollback khi tỷ lệ lỗi 5xx tăng vọt sau deployment.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Quy tắc vàng để thực hiện Database Migration mà không gây downtime (Zero-Downtime) là gì?',
        lua_chon: [
          'Áp dụng Expand-Contract: Thay đổi cơ sở dữ liệu phải luôn tương thích ngược với phiên bản code cũ đang chạy',
          'Tắt toàn bộ hệ thống lúc nửa đêm để chạy lệnh ALTER TABLE'
        ],
        dung: 0,
        giai_thich: 'Luôn đảm bảo code cũ và code mới cùng hoạt động được với database tại thời điểm chuyển giao.'
      }
    },
    {
      id: 'node-testing-qa',
      domain_id: 'domain-19-testing',
      cluster_id: 'cum-client-tier',
      infra_type: 'service',
      is_public_interface: false,
      fully_explored: true,
      bieu_tuong: 'regression_shield',
      tieu_de: 'Quality Assurance & E2E Shield',
      nhan_buoc: 'OBSERVABILITY / AUDIT LOG',
      tom_tat: 'Tháp kiểm thử tự động: Vitest Unit Tests → API Integration Tests → Playwright E2E UI Testing.',
      toa_do: { x: 80, y: -160 },
      tam: { x: 190, y: -88 },
      hoat_hoa: { mau: 'doc_cache_nhanh', tham_so: {} },
      chi_tiet: {
        phan_loai: 'TẦNG KIỂM SOÁT CHẤT LƯỢNG',
        tieu_de: 'Automated Testing Trophy & Flaky Test Prevention',
        ban_chat: 'Mô hình Testing Trophy tập trung trọng tâm vào Integration Tests và E2E Tests. Sử dụng Playwright kiểm thử trình duyệt thực tế, chụp ảnh màn hình so sánh và kiểm tra khả năng phục hồi lỗi của giao diện người dùng.',
        chu_thich_so_do: 'Lá chắn phòng ngự ngăn chặn hoàn toàn lỗi hồi quy (Regression Bugs).',
        ca_thuc_te: [
          'Viết E2E test cho luồng thanh toán và đăng nhập với Playwright Trace Viewer.',
          'Sử dụng Mock Service Worker (MSW) để mock API tầng mạng chuẩn xác trong Unit/Integration tests.'
        ],
        rui_ro: [
          'Chỉ viết Unit test cho hàm đơn giản mà bỏ qua Integration test làm các service ghép nối thất bại.',
          'Flaky Tests (test chạy lúc pass lúc fail do timeout mạng) làm xói mòn niềm tin vào CI/CD pipeline.'
        ]
      },
      trac_nghiem: {
        cau_hoi: 'Tại sao mô hình Testing Trophy lại ưu tiên Integration Tests hơn Unit Tests?',
        lua_chon: [
          'Vì Integration Tests kiểm tra sự phối hợp thực tế giữa các module, mang lại độ tin cậy cao hơn với chi phí bảo trì hợp lý',
          'Vì viết Integration Tests nhanh gấp 10 lần Unit Tests'
        ],
        dung: 0,
        giai_thich: 'Integration Tests xác minh toàn bộ luồng nghiệp vụ phối hợp giữa các thành phần thực tế.'
      }
    }
  ],
  edges: [
    {
      from: 'node-ui-view',
      to: 'node-rendering-ssr',
      nhan: 'RSC Payload / Hydration Stream',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'Dữ liệu và Virtual DOM được truyền qua ranh giới mạng giữa Server Components và Client Components.'
    },
    {
      from: 'node-rendering-ssr',
      to: 'node-cong-gateway',
      nhan: 'HTTPS / Reverse Proxy Ingress',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'Next.js chuyển tiếp các yêu cầu gọi dữ liệu qua API Gateway an toàn.'
    },
    {
      from: 'node-ui-view',
      to: 'node-cong-gateway',
      nhan: 'REST / TanStack Query Client Fetch',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'Trình duyệt gọi trực tiếp API Ingress cho các tác vụ lấy dữ liệu bất đồng bộ.'
    },
    {
      from: 'node-cong-gateway',
      to: 'node-auth-service',
      nhan: 'mTLS Delegation Token Verify',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'Gateway phối hợp với Auth Service xác thực tính hợp lệ của JWT và kiểm tra Refresh Token Rotation.'
    },
    {
      from: 'node-cong-gateway',
      to: 'node-backend-service',
      nhan: 'Validated DTO / Idempotency Header',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'Chuyển tiếp gói tin đã qua kiểm duyệt rate limit và chống duplicate sang Controller nghiệp vụ.'
    },
    {
      from: 'node-backend-service',
      to: 'node-cache-redis',
      nhan: 'Atomic Lock Check / Cache-Aside',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'Giành khóa phân tán Redlock và kiểm tra bộ nhớ đệm RAM trước khi chạm xuống đĩa cứng.'
    },
    {
      from: 'node-backend-service',
      to: 'node-tru-db',
      nhan: 'ACID Write / Unique Index',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'LUU_TRU',
      giai_thich: 'Ghi dữ liệu nguồn chân lý an toàn trong transaction bảo toàn tính nguyên tử.'
    },
    {
      from: 'node-backend-service',
      to: 'node-queue-kafka',
      nhan: 'Transactional Outbox Produce',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'DEM_LOC',
      giai_thich: 'Bắn các sự kiện bất đồng bộ vào hàng đợi để giảm áp lực cho tiến trình chính.'
    },
    {
      from: 'node-queue-kafka',
      to: 'node-backend-service',
      nhan: 'Idempotent Consumer Stream',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'Worker nhặt tin nhắn và xử lý tuần tự, có kiểm tra chống xử lý lặp.'
    },
    {
      from: 'node-backend-service',
      to: 'node-s3-upload',
      nhan: 'Presigned PUT Authorization',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'Cấp quyền và sinh URL tạm thời cho client upload file dung lượng lớn.'
    },
    {
      from: 'node-cong-gateway',
      to: 'node-observability',
      nhan: 'Async Audit Stream & Correlation ID',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'Phát sinh vết truy vết duy nhất truyền qua toàn bộ hệ sinh thái giám sát.'
    },
    {
      from: 'node-backend-service',
      to: 'node-observability',
      nhan: 'Distributed Tracing Span',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'Ghi nhận thời gian thực thi (latency span) và các ngoại lệ unhandled.'
    },
    {
      from: 'node-ui-view',
      to: 'node-websocket-realtime',
      nhan: 'WSS / Persistent Bi-directional Stream',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'Trình duyệt mở kết nối song công liên tục cho chat và dữ liệu thời gian thực.'
    },
    {
      from: 'node-websocket-realtime',
      to: 'node-cache-redis',
      nhan: 'Redis Pub/Sub Broadcast Adapter',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'Đồng bộ broadcast tin nhắn socket xuyên qua nhiều server instance.'
    },
    {
      from: 'node-docker-linux',
      to: 'node-backend-service',
      nhan: 'Containerized Linux Process & SIGTERM Handling',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'Linux cgroups cô lập tài nguyên CPU/RAM và điều phối vòng đời tiến trình backend.'
    },
    {
      from: 'node-cicd-pipeline',
      to: 'node-docker-linux',
      nhan: 'Automated Build, Test & Zero-Downtime Rollout',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'GitHub Actions tự động đóng gói image container và triển khai Blue-Green không gián đoạn.'
    },
    {
      from: 'node-testing-qa',
      to: 'node-ui-view',
      nhan: 'Automated Regression Shield & E2E Tracing',
      kieu: 'duong-xung-em-ai',
      loai_lien_ket: 'HOA_GIAI',
      giai_thich: 'Playwright & Vitest chạy kiểm thử tự động ngăn ngừa lỗi hồi quy trên UI và API.'
    }
  ]
};

