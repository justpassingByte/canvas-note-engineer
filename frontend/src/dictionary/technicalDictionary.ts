export const TECHNICAL_DICTIONARY: Record<string, string> = {
  // Concurrency & Locks
  "race condition": "Tranh chấp đồng thời khi nhiều luồng cùng đọc và sửa 1 bản ghi trong cùng một mili-giây dẫn đến sai lệch số dư.",
  "idempotency": "Tính lũy thừa: Thực thi nhiều lần vẫn chỉ sinh ra kết quả của đúng một lần duy nhất (f(f(x)) = f(x)), bảo vệ toàn vẹn tài chính.",
  "idempotency key": "Chuỗi UUID duy nhất đính kèm HTTP Header để máy chủ nhận diện lệnh lặp và hoàn trả kết quả cũ mà không trừ tiền lần 2.",
  "distributed lock": "Cơ chế khóa đồng bộ tài nguyên dùng chung giữa nhiều máy chủ phân tán (qua Redis hoặc Zookeeper).",
  "redlock": "Thuật toán khóa phân tán trên cụm nhiều node Redis độc lập của tác giả Antirez, đảm bảo an toàn chịu lỗi.",
  "setnx": "Lệnh Redis 'SET if Not eXists' - chỉ gán giá trị nếu key chưa tồn tại, tạo khóa phân tán siêu tốc 1ms trên RAM.",
  "ttl": "Time-To-Live: Thời hạn tự động giải phóng khóa trên RAM để chống rơi vào bẫy Deadlock khi tiến trình thợ bị crash.",
  "deadlock": "Tình huống hai transaction cùng giữ tài nguyên của nhau và chờ nhau vô tận, làm tê liệt hoàn toàn hệ thống.",
  "row lock": "Khóa mức dòng (SELECT FOR UPDATE) trong cơ sở dữ liệu, buộc các transaction sau phải xếp hàng chờ cho tới khi commit.",
  "optimistic locking": "Khóa lạc quan dùng cột version để kiểm tra: Nếu version thay đổi giữa lúc đọc và ghi thì từ chối giao dịch.",
  "pessimistic locking": "Khóa bi quan: Giữ chặt bản ghi ngay từ đầu không cho ai đọc/sửa cho tới khi kết thúc transaction.",

  // Database & Storage
  "unique index": "Cấu trúc B-Tree trên đĩa cứng cơ sở dữ liệu đảm bảo không bao giờ có 2 dòng trùng khóa được ghi nhận thành công.",
  "acid": "4 thuộc tính vàng của DB: Nguyên tử (Atomicity), Nhất quán (Consistency), Cô lập (Isolation) và Bền vững (Durability).",
  "atomic commit": "Ghi nhận giao dịch nguyên tử: Tất cả các bước đều thành công trọn vẹn hoặc rollback về trạng thái ban đầu.",
  "uuid v4": "Chuỗi định danh ngẫu nhiên 128-bit độc nhất toàn cầu, xác suất trùng lặp gần như bằng 0 (1 trên hàng tỷ).",
  "isolation level": "Mức độ cô lập giao dịch trong DB (Read Committed, Repeatable Read, Serializable) để cân bằng tốc độ và tính đúng đắn.",
  "wal": "Write-Ahead Logging: Kỹ thuật ghi nhật ký trước khi ghi đĩa giúp tăng tốc độ ghi và phục hồi sau sự cố sập nguồn.",

  // Network & Transport
  "webhook": "Cơ chế HTTP callback tự động gửi gói tin JSON từ cổng thanh toán/đối tác sang máy chủ khi phát sinh sự kiện.",
  "automatic retry": "Cơ chế tự động phát lại gói tin khi phát hiện timeout hoặc chập chờn kết nối mạng.",
  "retry storm": "Cơn bão gửi lại yêu cầu dồn dập từ hàng triệu client khi hệ thống chập chờn, đánh sập hoàn toàn backend.",
  "exponential backoff": "Thuật toán lùi lũy thừa thời gian chờ (1s, 2s, 4s, 8s...) giữa các lần thử lại để giảm tải cho máy chủ.",
  "jitter": "Độ trễ ngẫu nhiên cộng thêm vào thời gian retry để phân tán lưu lượng, chống các client cùng dội request một lúc.",
  "timeout": "Giới hạn thời gian tối đa chờ phản hồi từ dịch vụ ngoài trước khi chủ động ngắt kết nối.",

  // Architecture & Messaging
  "message queue": "Hàng đợi tin nhắn (Kafka / RabbitMQ) đệm và san phẳng lưu lượng truy cập cao điểm, bảo vệ database phía sau.",
  "worker pool": "Nhóm tiến trình thợ chạy ngầm rút từng gói tác vụ trong hàng đợi ra xử lý tuần tự theo nhịp độ an toàn.",
  "overselling": "Sự cố bán vượt quá tồn kho thực tế do nhiều khách hàng cùng thanh toán món hàng cuối cùng mà thiếu khóa đồng thời.",
  "circuit breaker": "Bộ ngắt mạch: Tự động ngắt kết nối đến service đang bị sập để tránh làm tê liệt dây chuyền toàn bộ hệ thống.",
  "cache aside": "Mô hình đọc cache trước: Nếu miss thì đọc database rồi ghi ngược lại vào cache.",
  "cache hit": "Dữ liệu được tìm thấy ngay trên bộ nhớ RAM đệm, phản hồi tức thì trong mili-giây.",
  "cache miss": "Dữ liệu không có trên RAM, hệ thống buộc phải đọc đĩa cứng Database mất nhiều thời gian hơn.",
  "eventual consistency": "Tính nhất quán cuối cùng: Dữ liệu giữa các node phân tán có thể lệch nhau vài giây nhưng chắc chắn sẽ đồng nhất.",

  // Edge Defense & Rate Limiting (Mới)
  "waf": "Web Application Firewall: Lá chắn tường lửa tầng ứng dụng L7 phát hiện và chặn đứng tấn công độc hại trước khi đến Gateway.",
  "ddos": "Distributed Denial of Service: Tấn công từ chối dịch vụ phân tán dội hàng triệu request ảo nhằm đánh sập máy chủ.",
  "rate limiting": "Kỹ thuật kiểm soát lưu lượng request từ mỗi IP hoặc User trong một đơn vị thời gian để bảo vệ máy chủ.",
  "rate limit": "Giới hạn tần suất: Ngưỡng trần số lượng yêu cầu được phép gửi trong một khung thời gian xác định.",
  "token bucket": "Thuật toán xô thẻ: Cho phép xử lý lưu lượng bùng phát tức thời (burst traffic) nếu xô còn thẻ tích lũy.",
  "sliding window": "Thuật toán cửa sổ trượt: Đếm số lượng request chính xác theo thời gian thực trượt, triệt tiêu lỗi biên thời gian.",
  "leaky bucket": "Thuật toán xô rò rỉ: Rót request vào xô và xử lý đầu ra với tốc độ cố định hoàn toàn phẳng.",

  // Zero-Trust & Security Auth (Mới)
  "zero-trust": "Kiến trúc an ninh Zero-Trust: Nguyên tắc 'Never Trust, Always Verify' - xác thực mọi truy cập từ trong lẫn ngoài mạng.",
  "zero trust": "Kiến trúc an ninh Zero-Trust: Nguyên tắc 'Never Trust, Always Verify' - xác thực mọi truy cập từ trong lẫn ngoài mạng.",
  "mtls": "Mutual TLS: Giao thức mã hóa 2 chiều, cả client và server đều phải trình chứng chỉ số X.509 để xác thực lẫn nhau.",
  "pep": "Policy Enforcement Point: Điểm thực thi chính sách ở tầng biên, kiểm tra token và chuyển tiếp hoặc chặn yêu cầu.",
  "pdp": "Policy Decision Point: Máy chủ trung tâm thẩm định quyền hạn người dùng dựa trên luật phân quyền RBAC/ABAC.",
  "jwt": "JSON Web Token: Chuỗi mã hóa ký số chứa danh tính người dùng và quyền hạn truy cập truyền qua HTTP Header.",
  "token revocation list": "Danh sách thu hồi token: Danh sách đen (blacklist) trên RAM Redis lưu các JWT bị vô hiệu hóa trước hạn.",
  "lateral movement": "Hành vi leo thang di chuyển ngang của hacker bên trong mạng nội bộ sau khi chiếm được 1 máy chủ biên.",

  // Audit Log & Cryptographic Ledger (Mới)
  "audit log": "Nhật ký kiểm toán: Bản ghi bất biến ghi chép chi tiết ai đã thao tác gì, vào thời điểm nào và thay đổi ra sao.",
  "merkle tree": "Cây Merkle: Cấu trúc cây mã hóa băm nhị phân giúp xác thực tính toàn vẹn của hàng triệu bản ghi chỉ bằng Merkle Root.",
  "hmac sha-256": "Thuật toán băm có khóa bí mật (Hash-based Message Authentication Code) dùng SHA-256 đảm bảo tính chống giả mạo.",
  "hmac": "Mã xác thực thông điệp có khóa bí mật, đảm bảo dữ liệu không bị sửa đổi trên đường truyền.",
  "hash chain": "Chuỗi băm: Mỗi bản ghi mới chứa mã băm của bản ghi trước đó, hễ sửa 1 ký tự thì toàn bộ chuỗi bị gãy vụn.",
  "append-only": "Mô hình chỉ cho phép ghi nối tiếp vào cuối file/bảng, nghiêm cấm tuyệt đối thao tác sửa (UPDATE) hoặc xóa (DELETE).",
  "tamper-proof": "Khả năng chống can thiệp trái phép: Mọi hành vi sửa đổi dữ liệu dù là 1 byte đều lập tức bị phát hiện."
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Tạo regex tổng hợp quét tất cả từ khóa, ưu tiên từ dài trước
const SORTED_KEYS = Object.keys(TECHNICAL_DICTIONARY).sort((a, b) => b.length - a.length);
const KEYWORD_REGEX = new RegExp(`\\b(${SORTED_KEYS.map(escapeRegex).join('|')})\\b`, 'gi');

/**
 * Tự động gắn tooltip cho các thẻ <u>Thuật ngữ</u> và tự động phát hiện từ khóa trong text thuần.
 * Chạy 100% cục bộ trên client, 0 token, 0 độ trễ (Hybrid Zero-Token).
 */
export function enrichHtmlWithTooltips(htmlText: string): string {
  if (!htmlText) return '';

  // Bước 1: Làm giàu các thẻ <u> đã có sẵn trong văn bản
  const step1 = htmlText.replace(/<u(?:\s+data-tooltip="([^"]*)")?>(.*?)<\/u>/gi, (match, existTooltip, content) => {
    if (existTooltip) {
      return match;
    }
    const cleanKey = content.trim().toLowerCase();
    const definition = TECHNICAL_DICTIONARY[cleanKey];
    if (definition) {
      return `<u data-tooltip="${definition}">${content}</u>`;
    }
    return match;
  });

  // Bước 2: Tự động quét từ khóa trong các đoạn văn bản thuần bên ngoài thẻ HTML
  const tokens = step1.split(/(<[^>]+>)/g);
  let inUTag = false;

  const enrichedTokens = tokens.map((token) => {
    if (!token) return '';

    // Kiểm tra nếu là thẻ HTML
    if (token.startsWith('<') && token.endsWith('>')) {
      const lower = token.toLowerCase();
      if (lower.startsWith('<u ') || lower === '<u>') {
        inUTag = true;
      } else if (lower === '</u>') {
        inUTag = false;
      }
      return token;
    }

    // Nếu đang nằm trong thẻ <u>, không bọc lồng thêm thẻ <u> khác
    if (inUTag) {
      return token;
    }

    // Quét và bọc tự động từ khóa chưa có thẻ
    return token.replace(KEYWORD_REGEX, (match) => {
      const cleanKey = match.trim().toLowerCase();
      const definition = TECHNICAL_DICTIONARY[cleanKey];
      if (definition) {
        return `<u data-tooltip="${definition}">${match}</u>`;
      }
      return match;
    });
  });

  return enrichedTokens.join('');
}
