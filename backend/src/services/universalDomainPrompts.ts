export type DomainType =
  | 'technology'
  | 'healthcare'
  | 'legal'
  | 'business'
  | 'science'
  | 'universal';

export interface DomainMetadata {
  type: DomainType;
  displayName: string;
  badgeExamples: string[];
  protocolExamples: string[];
}

export const DOMAIN_PRESETS: Record<DomainType, DomainMetadata> = {
  technology: {
    type: 'technology',
    displayName: 'Công Nghệ & Kỹ Thuật Hệ Thống',
    badgeExamples: [
      'GATEWAY / INGRESS',
      'COMPUTE / CONCURRENCY',
      'SECURITY / IDEMPOTENCY',
      'STORAGE / ACID DB',
      'ASYNC / QUEUE BUFFER',
      'CACHE / DISTRIBUTED LOCK',
      'EDGE / WAF RATE LIMIT',
      'OBSERVABILITY / AUDIT LOG'
    ],
    protocolExamples: [
      'Webhook Timeout Retry',
      'Atomic Lock Check',
      'ACID Write / Unique Index',
      'Async Event Produce',
      'Distributed Lock Acquire'
    ]
  },
  healthcare: {
    type: 'healthcare',
    displayName: 'Y Tế, Dược Học & Sinh Học',
    badgeExamples: [
      'CHẨN ĐOÁN / LÂM SÀNG',
      'BỆNH SINH / CƠ CHẾ',
      'DƯỢC LÝ / TƯƠNG TÁC THUỐC',
      'BIẾN CHỨNG / NGUY CƠ',
      'PHÁC ĐỒ / ĐIỀU TRỊ',
      'THEO DÕI / CHỈ SỐ SINH HIỆU'
    ],
    protocolExamples: [
      'Tương tác đối kháng thụ thể',
      'Ức chế men chuyển',
      'Kích hoạt phản ứng viêm',
      'Hạ đường huyết cấp tính',
      'Xét nghiệm sinh hóa xác chuẩn'
    ]
  },
  legal: {
    type: 'legal',
    displayName: 'Luật Pháp, Pháp Chế & Hợp Đồng',
    badgeExamples: [
      'CHỦ THỂ / THẨM QUYỀN',
      'HỢP ĐỒNG / NGHĨA VỤ',
      'VI PHẠM / XÂM PHẠM',
      'RỦI RO / CHẾ TÀI',
      'TỐ TỤNG / TRỌNG TÀI',
      'TUÂN THỦ / KIỂM SOÁT'
    ],
    protocolExamples: [
      'Vi phạm điều khoản bảo mật',
      'Kích hoạt phạt vi phạm',
      'Tranh chấp quyền tài phán',
      'Bồi thường thiệt hại thực tế',
      'Thẩm tra pháp lý đối soát'
    ]
  },
  business: {
    type: 'business',
    displayName: 'Tài Chính, Kinh Doanh & Vận Hành',
    badgeExamples: [
      'THỊ TRƯỜNG / NHU CẦU',
      'VẬN HÀNH / CHUỖI CUNG ỨNG',
      'RỦI RO / THANH KHOẢN',
      'DÒNG TIỀN / CHI PHÍ',
      'CHIẾN LƯỢC / PHÒNG VỆ',
      'KIỂM TOÁN / ĐỐI SOÁT'
    ],
    protocolExamples: [
      'Đứt gãy chuỗi cung ứng',
      'Cạn kiệt dòng tiền ngắn hạn',
      'Phòng hộ tỷ giá Hedging',
      'Giao dịch ký quỹ Margin Call',
      'Kiểm toán đối soát số dư'
    ]
  },
  science: {
    type: 'science',
    displayName: 'Khoa Học Tự Nhiên & Nghiên Cứu',
    badgeExamples: [
      'HIỆN TƯỢNG / QUAN SÁT',
      'ĐỊNH LUẬT / NGUYÊN LÝ',
      'TÁC NHÂN / XÚC TÁC',
      'CÂN BẰNG / SAI SỐ',
      'THỰC NGHIỆM / ĐỐI CHỨNG'
    ],
    protocolExamples: [
      'Phản ứng nhiệt động học',
      'Khuếch tán nồng độ gradient',
      'Phân rã bán rã',
      'Tương tác trường điện từ'
    ]
  },
  universal: {
    type: 'universal',
    displayName: 'Phổ Quát / Đa Lĩnh Vực',
    badgeExamples: [
      'BỐI CẢNH / HIỆN TƯỢNG',
      'CƠ CHẾ / QUY LUẬT',
      'XUNG ĐỘT / NGUY CƠ',
      'GIẢI PHÁP / CAN THIỆP',
      'ĐÁNH GIÁ / KIỂM CHỨNG'
    ],
    protocolExamples: [
      'Kích hoạt xung đột nguyên nhân',
      'Lan truyền tác động thứ cấp',
      'Khóa đối ứng triệt tiêu',
      'Cơ chế tự điều hòa cân bằng'
    ]
  }
};

/**
 * Tự động phát hiện domain từ chủ đề và ngữ cảnh
 */
export function detectDomainFromTopic(topic: string): DomainType {
  const t = topic.toLowerCase();

  // Y tế / Sức khỏe
  if (
    t.includes('bệnh') ||
    t.includes('thuốc') ||
    t.includes('chẩn đoán') ||
    t.includes('tim mạch') ||
    t.includes('ung thư') ||
    t.includes('lâm sàng') ||
    t.includes('y học') ||
    t.includes('virus') ||
    t.includes('dược') ||
    t.includes('phác đồ')
  ) {
    return 'healthcare';
  }

  // Luật pháp / Pháp chế
  if (
    t.includes('luật') ||
    t.includes('hợp đồng') ||
    t.includes('pháp lý') ||
    t.includes('tố tụng') ||
    t.includes('tranh chấp') ||
    t.includes('sở hữu trí tuệ') ||
    t.includes('bản quyền') ||
    t.includes('nghĩa vụ') ||
    t.includes('gdpr')
  ) {
    return 'legal';
  }

  // Kinh doanh / Tài chính
  if (
    t.includes('tài chính') ||
    t.includes('kinh doanh') ||
    t.includes('chuỗi cung ứng') ||
    t.includes('ngân hàng') ||
    t.includes('thanh khoản') ||
    t.includes('lãi suất') ||
    t.includes('lạm phát') ||
    t.includes('đầu tư') ||
    t.includes('chi phí') ||
    t.includes('doanh thu')
  ) {
    return 'business';
  }

  // Khoa học tự nhiên
  if (
    t.includes('vật lý') ||
    t.includes('hóa học') ||
    t.includes('sinh học') ||
    t.includes('nhiệt động lực') ||
    t.includes('lượng tử') ||
    t.includes('vũ trụ') ||
    t.includes('khí hậu')
  ) {
    return 'science';
  }

  // Công nghệ thông tin
  if (
    t.includes('api') ||
    t.includes('database') ||
    t.includes('sql') ||
    t.includes('microservice') ||
    t.includes('backend') ||
    t.includes('frontend') ||
    t.includes('redis') ||
    t.includes('kafka') ||
    t.includes('auth') ||
    t.includes('cache') ||
    t.includes('server') ||
    t.includes('concurrency') ||
    t.includes('cloud') ||
    t.includes('docker')
  ) {
    return 'technology';
  }

  return 'universal';
}

/**
 * Xây dựng Universal System Prompt tuân thủ 100% quy tắc kiến trúc của repository
 */
export function buildUniversalSystemPrompt(domain: DomainType): string {
  const meta = DOMAIN_PRESETS[domain] || DOMAIN_PRESETS.universal;

  return `Bạn là một Kiến trúc sư Hệ thống & Chuyên gia Phân tích Đồ thị Tri thức Cao cấp (Senior Knowledge Graph Architect).
Nhiệm vụ của bạn là phân tích một chủ đề phức tạp, bài toán rủi ro hoặc một tình huống thực chiến và chuyển đổi thành Đồ thị Tri thức Tương tác (Interactive Knowledge Graph) gồm 3 đến 6 Nodes và các Cạnh (Edges) phân nhánh.

LĨNH VỰC CHUYÊN SÂU HIỆN TẠI: ${meta.displayName.toUpperCase()} (${domain})

===================================================================
QUY TẮC BẮT BUỘC KHÔNG ĐƯỢC VI PHẠM (ARCHITECTURAL INVARIANTS)
===================================================================

1. QUY TẮC NHÃN PHÂN TẦNG (NODE BADGE - 'nhan_buoc'):
   - BẮT BUỘC LÀ PHÂN TẦNG / DANH MỤC CHUYÊN MÔN VIẾT HOA.
     Ví dụ gợi ý: ${meta.badgeExamples.join(', ')}.
   - TUYỆT ĐỐI NGHIÊM CẤM: Không bao giờ dùng số thứ tự tuyến tính hoặc tiền tố như "BƯỚC 1 //", "BƯỚC 2 //", "Step 1:", "1.", "1.1." v.v. Đồ thị là một Directed Acyclic Graph (DAG) đa phân nhánh và đa nút cha, không phải danh sách bước tuần tự!

2. QUY TẮC NHÃN LUỒNG GIAO THỨC (EDGE LABEL - 'edges.nhan'):
   - BẮT BUỘC LÀ LUỒNG GIAO THỨC / QUY TRÌNH KỸ THUẬT RÕ RÀNG.
     Ví dụ gợi ý: ${meta.protocolExamples.join(', ')}.
   - TUYỆT ĐỐI NGHIÊM CẤM: Không bao giờ dùng tiền tố số thứ tự (ví dụ: "1. ", "2. ", "3.1. ") trên các liên kết.

3. NGUYÊN TẮC TÁI SỬ DỤNG TRỤ CỐT (ZERO-DUPLICATE GUARD):
   - Khi có các thành phần dùng chung (như cơ sở dữ liệu, sổ cái đối soát, tầng bảo mật, hoặc đơn vị thẩm tra), hãy trỏ nhiều cạnh vào cùng 1 Node dùng chung thay vì nhân bản nhiều Node trùng lặp.

4. CẤU TRÚC CHI TIẾT MỖI NODE:
   - 'id': chuỗi slug duy nhất, viết thường nối gạch ngang (vd: 'node-van-de-goc', 'node-co-che-trung-lap', 'node-bien-phap-phong-thu').
   - 'tieu_de': Tên ngắn gọn của khái niệm/thành phần (dưới 35 ký tự).
   - 'nhan_buoc': Nhãn phân tầng viết hoa theo quy tắc 1.
   - 'tom_tat': Tóm tắt ngắn 1 câu (hỗ trợ markdown nhấn mạnh **đậm** và <u>gạch chân</u> từ khóa).
   - 'chi_tiet':
       * 'phan_loai': Chuỗi mô tả phân loại thực tế.
       * 'tieu_de': Tiêu đề đầy đủ.
       * 'ban_chat': Bản chất vấn đề, giải thích sâu sắc nguyên lý.
       * 'chu_thich_so_do': Chú thích ngắn giải thích luồng tác động.
       * 'ca_thuc_te': Mảng 3-4 chuỗi tình huống thực tế hoặc ví dụ cụ thể.
       * 'rui_ro': Mảng 2-3 chuỗi rủi ro tiềm ẩn hoặc hậu quả nghiêm trọng.
       * 'chuoi_sup_do': Mảng 3-4 chuỗi mô tả từng mắt xích của chuỗi sự cố nếu không kiểm soát.
   - 'trac_nghiem': Bộ câu hỏi phản xạ gồm:
       * 'cau_hoi': Câu hỏi tình huống chuyên sâu hóc búa.
       * 'lua_chon': Mảng đúng 2 lựa chọn (1 sai mang bẫy tư duy, 1 đúng chuẩn chuyên gia).
       * 'dung': Index đáp án đúng (0 hoặc 1).
       * 'giai_thich': Giải thích logic tại sao lựa chọn đó đúng và bài học đắt giá.
       * 'phan_tang': Tên phân tầng liên quan.
   - 'bieu_tuong': Biểu tượng gợi ý ('su_co_canh_bao', 'tranh_chap_phan_nhanh', 'khoi_tru_database', 'bo_nho_dem_cache', 'hang_doi_message_queue', 'khiên_bao_mat', 'kiem_toan_log', 'mac_dinh').

5. ĐỊNH DẠNG ĐẦU RA (OUTPUT FORMAT):
   - BẮT BUỘC CHỈ TRẢ VỀ JSON HỢP LỆ (KHÔNG VIẾT CHỮ DẪN NHẬP, KHÔNG VIẾT MARKDOWN PHỦ BÊN NGOÀI NẾU KHÔNG ĐƯỢC YÊU CẦU).
   - Cấu trúc JSON:
   {
     "topic": "Tên chủ đề",
     "domain": "${domain}",
     "nodes": [ ... danh sách node ... ],
     "edges": [
       {
         "from": "id-node-nguon",
         "to": "id-node-dich",
         "nhan": "Tên luồng giao thức",
         "giai_thich": "Giải thích ngắn vì sao 2 thành phần này liên kết với nhau",
         "kieu": "duong-xung-em-ai",
         "loai_lien_ket": "HOA_GIAI" | "KICH_HOAT" | "XUNG_DOT"
       }
     ]
   }`;
}

export function buildExpandNodePrompt(
  nodeTitle: string,
  nodeSummary: string,
  existingNodeTitles: string[],
  domain: DomainType,
  expansionIntent?: string,
  userInstruction?: string
): string {
  const meta = DOMAIN_PRESETS[domain] || DOMAIN_PRESETS.universal;

  return `Bạn là Kiến trúc sư Đồ thị Tri thức.
Khái niệm hiện tại cần đào sâu mở rộng: "${nodeTitle}"
Tóm tắt hiện tại: "${nodeSummary}"
Các nút đã có trên bản đồ (KHÔNG ĐƯỢC TRÙNG LẶP): [${existingNodeTitles.join(', ')}]
Lĩnh vực: ${meta.displayName}
${expansionIntent ? `Hướng mở rộng mong muốn: ${expansionIntent}` : ''}
${userInstruction ? `Yêu cầu cụ thể từ người dùng: ${userInstruction}` : ''}

Hãy sinh ra ĐÚNG 1 ĐẾN 2 NODES MỚI và các EDGES liên kết từ node hiện tại đến các node mới này.
Tuân thủ nghiêm ngặt:
1. 'nhan_buoc': Bắt buộc là danh mục viết hoa (gợi ý: ${meta.badgeExamples.slice(0, 4).join(', ')}). CẤM dùng "BƯỚC 1 //", "1.", v.v.
2. 'edges.nhan': Bắt buộc là luồng giao thức kỹ thuật. CẤM dùng số thứ tự.
3. Trả về JSON:
{
  "new_nodes": [ ... 1-2 node ... ],
  "new_edges": [
    {
      "from": "${nodeTitle}",
      "to": "id-node-con-moi",
      "nhan": "Luồng tác động",
      "giai_thich": "Lý do",
      "kieu": "duong-xung-em-ai",
      "loai_lien_ket": "KICH_HOAT"
    }
  ]
}`;
}
