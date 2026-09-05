/**
 * BẢNG TỪ ĐIỂN THUẬT NGỮ KỸ THUẬT CỐT LÕI (CORE TECHNICAL GLOSSARY)
 * 80+ Thuật ngữ chuẩn ngành cho Hệ thống Phân tán, Xác thực, Phân quyền, Tài chính & Khuyến mãi.
 */
export const TECHNICAL_DICTIONARY: Record<string, string> = {
  // Concurrency & Distributed Locks
  "race condition": "Tranh chấp đồng thời khi nhiều luồng cùng đọc và sửa 1 bản ghi trong cùng một mili-giây dẫn đến sai lệch số dư.",
  "idempotency": "Tính lũy thừa: Thực thi nhiều lần vẫn chỉ sinh ra kết quả của đúng một lần duy nhất (f(f(x)) = f(x)), bảo vệ toàn vẹn tài chính.",
  "idempotency-key": "Chuỗi UUID duy nhất đính kèm HTTP Header để máy chủ nhận diện lệnh lặp và hoàn trả kết quả cũ mà không trừ tiền lần 2.",
  "idempotency key": "Chuỗi UUID duy nhất đính kèm HTTP Header để máy chủ nhận diện lệnh lặp và hoàn trả kết quả cũ mà không trừ tiền lần 2.",
  "distributed lock": "Cơ chế khóa đồng bộ tài nguyên dùng chung giữa nhiều máy chủ phân tán (qua Redis hoặc Zookeeper).",
  "redlock": "Thuật toán khóa phân tán trên cụm nhiều node Redis độc lập của tác giả Antirez, đảm bảo an toàn chịu lỗi.",
  "setnx": "Lệnh Redis 'SET if Not eXists' - chỉ gán giá trị nếu key chưa tồn tại, tạo khóa phân tán siêu tốc 1ms trên RAM.",
  "ttl": "Time-To-Live: Thời hạn tự động giải phóng khóa trên RAM để chống rơi vào bẫy Deadlock khi tiến trình thợ bị crash.",
  "deadlock": "Tình huống hai transaction cùng giữ tài nguyên của nhau và chờ nhau vô tận, làm tê liệt hoàn toàn hệ thống.",
  "row lock": "Khóa mức dòng (SELECT FOR UPDATE) trong cơ sở dữ liệu, buộc các transaction sau phải xếp hàng chờ cho tới khi commit.",
  "row-level locking": "Khóa mức dòng trong cơ sở dữ liệu ngăn chặn transaction khác sửa đổi dòng đang xử lý.",
  "optimistic locking": "Khóa lạc quan dùng cột version để kiểm tra: Nếu version thay đổi giữa lúc đọc và ghi thì từ chối giao dịch.",
  "pessimistic locking": "Khóa bi quan: Giữ chặt bản ghi ngay từ đầu không cho ai đọc/sửa cho tới khi kết thúc transaction.",
  "pessimistic lock": "Khóa bi quan khóa cứng bản ghi tại tầng cơ sở dữ liệu trong suốt thời gian transaction.",
  "overselling": "Sự cố bán vượt quá tồn kho thực tế do nhiều khách hàng cùng thanh toán món hàng cuối cùng mà thiếu khóa đồng thời.",
  "two-phase commit": "Giao thức cam kết 2 pha đảm bảo giao dịch phân tán giữa nhiều cơ sở dữ liệu cùng commit hoặc cùng rollback.",
  "two-phase reservation": "Chu trình 2 pha: Khóa giữ tạm thời quota voucher (15 phút) khi checkout và chuyển thành redemption vĩnh viễn khi thanh toán.",

  // Database & Storage & Transactions
  "unique index": "Cấu trúc B-Tree trên đĩa cứng cơ sở dữ liệu đảm bảo không bao giờ có 2 dòng trùng khóa được ghi nhận thành công.",
  "unique constraint": "Ràng buộc duy nhất tại tầng cơ sở dữ liệu ngăn chặn ghi trùng lặp dữ liệu.",
  "acid": "4 thuộc tính vàng của DB: Nguyên tử (Atomicity), Nhất quán (Consistency), Cô lập (Isolation) và Bền vững (Durability).",
  "atomic commit": "Ghi nhận giao dịch nguyên tử: Tất cả các bước đều thành công trọn vẹn hoặc rollback về trạng thái ban đầu.",
  "uuid v4": "Chuỗi định danh ngẫu nhiên 128-bit độc nhất toàn cầu, xác suất trùng lặp gần như bằng 0 (1 trên hàng tỷ).",
  "isolation level": "Mức độ cô lập giao dịch trong DB (Read Committed, Repeatable Read, Serializable) để cân bằng tốc độ và tính đúng đắn.",
  "wal": "Write-Ahead Logging: Kỹ thuật ghi nhật ký trước khi ghi đĩa giúp tăng tốc độ ghi và phục hồi sau sự cố sập nguồn.",
  "source of truth": "Nguồn chân lý dữ liệu duy nhất và có thẩm quyền cao nhất của toàn hệ thống (Single Source of Truth).",
  "connection pool": "Tập hợp các kết nối cơ sở dữ liệu được mở sẵn để tái sử dụng, tránh chi phí thiết lập kết nối TCP liên tục.",
  "connection starvation": "Hiện tượng cạn kiệt connection pool khiến các yêu cầu API mới bị timeout và sập hàng loạt.",

  // Financial, Money & Promotion Domain
  "minor-unit": "Đơn vị tiền tệ nhỏ nhất (vd: xu, hào, đồng) dùng kiểu số nguyên BigInt để triệt tiêu hoàn toàn sai số làm tròn float.",
  "minor-unit bigint": "Lưu trữ và tính toán tiền tệ bằng số nguyên 64-bit BigInt thay vì số thực Number để không bị sai lệch số dư.",
  "basis points": "Đơn vị phần vạn (1 basis point = 0.01%, 10.000 bps = 100%), dùng biểu diễn tỷ lệ chiết khấu chính xác tuyệt đối.",
  "basispoints": "Đơn vị phần vạn (10.000 basis points = 100%) dùng trong tính toán chiết khấu và lãi suất tài chính.",
  "stacking policy": "Chính sách xếp chồng khuyến mãi: Quy định những voucher/benefit nào được phép áp dụng đồng thời trong cùng 1 đơn hàng.",
  "exclusive matrix": "Ma trận loại trừ: Bảng quy tắc ngăn chặn các voucher cùng phân loại hoặc xung đột được kích hoạt chung.",
  "split allocation": "Thuật toán phân bổ chiết khấu: Chia sẻ số tiền giảm giá của voucher sàn cho nhiều người bán (Multi-Seller) bảo toàn tổng tiền.",
  "penny rounding": "Kỹ thuật làm tròn bảo toàn số lẻ (Penny Rounding Balance): Bù trừ số dư chênh lệch vào dòng hàng cuối cùng để tổng chiết khấu luôn khớp 100%.",
  "redemption ledger": "Sổ cái tiêu dùng khuyến mãi bất biến (Immutable Ledger): Ghi nhận bút toán áp mã thực tế phục vụ đối soát tài chính.",
  "reservation": "Hành động giữ chỗ/khóa tạm thời hạn mức voucher trong lúc người dùng thực hiện thanh toán (thời hạn 15 phút).",
  "quota": "Hạn ngạch số lần sử dụng tối đa của mã khuyến mãi trên toàn hệ thống hoặc cho từng khách hàng.",
  "budget": "Tổng ngân sách tối đa được phân bổ cho chiến dịch khuyến mãi, kiểm soát chặt chẽ chống bội chi (Overspend).",
  "priceable snapshot": "Ảnh chụp trạng thái giỏ hàng và giá cố định bất biến tại thời điểm đánh giá, phục vụ kiểm toán và hoàn tiền.",

  // Authentication & Tokens
  "jwt": "JSON Web Token: Chuỗi mã hóa stateless chứa chữ ký số (Signature) và các Claims phân quyền mang theo trong request.",
  "access token": "Mã truy cập ngắn hạn (5-15 phút) dùng để xác thực các cuộc gọi API thông thường.",
  "refresh token": "Mã làm mới dài hạn (ngày/tuần) dùng để cấp Access Token mới mà không bắt người dùng đăng nhập lại.",
  "httponly": "Cờ bảo mật Cookie: Ngăn chặn hoàn toàn mã JavaScript truy cập vào cookie, triệt tiêu nguy cơ đánh cắp token qua XSS.",
  "samesite": "Thuộc tính Cookie (Strict/Lax/None) kiểm soát việc gửi cookie trong các yêu cầu chéo trang (Cross-Site), chống tấn công CSRF.",
  "audience": "Claim 'aud' trong JWT chỉ định đích đến hợp lệ của token (ví dụ: surface 'customer' hay 'admin').",
  "audience claim": "Xác định bề mặt ứng dụng hợp lệ mà token được phép sử dụng, ngăn chặn token khách hàng dùng trộm vào cổng quản trị.",
  "clock skew": "Độ lệch đồng hồ chấp nhận được (thường 60 giây) giữa máy chủ cấp token và máy chủ xác thực chữ ký.",
  "rtr": "Refresh Token Rotation: Cơ chế tự động hủy Refresh Token cũ và phát hành cặp token mới trong mỗi lần refresh.",
  "refresh token rotation": "Cơ chế xoay vòng token 1 lần dùng: Phát hiện Replay Attack và lập tức vô hiệu hóa toàn bộ Token Family.",
  "family id": "Mã định danh chuỗi phả hệ của Refresh Token giúp theo dõi dòng xoay vòng và thu hồi toàn bộ khi bị lộ.",
  "token family": "Tập hợp các refresh token thuộc cùng một phiên đăng nhập, được liên kết bởi Family ID.",
  "replay attack": "Tấn công phát lại: Kẻ xấu đánh cắp token hoặc gói tin cũ và gửi lại để mạo danh người dùng.",
  "jti": "JWT ID: Khóa định danh UUID duy nhất của mỗi token, dùng làm key để tra cứu trạng thái thu hồi trong Redis Blacklist.",
  "oauth2": "OAuth 2.0: Khung giao thức ủy quyền tiêu chuẩn ngành cho phép ứng dụng truy cập an toàn tài nguyên qua Access Token.",
  "oidc": "OpenID Connect: Tầng định danh xây dựng trên OAuth 2.0 cung cấp ID Token chứa thông tin người dùng được ký số.",
  "rs256": "RSA Signature SHA-256: Thuật toán ký số bất đối xứng với Private Key trên Auth Server và Public Key công khai qua JWKS.",
  "es256": "ECDSA P-256 Signature SHA-256: Thuật toán chữ ký số đường cong elip siêu nhẹ và bảo mật cao.",
  "jwks": "JSON Web Key Set: Endpoint công khai chứa các khóa công khai để các dịch vụ tự động thẩm định chữ ký JWT mà không cần gọi auth server.",
  "bearer token": "Mã xác thực Bearer: Bất kỳ ai sở hữu token này đều được cấp quyền tương ứng qua Header 'Authorization: Bearer <token>'.",
  "blacklist": "Danh sách đen: Cơ chế lưu trữ các JTI bị thu hồi trước hạn trên RAM Redis để từ chối truy cập ngay lập tức.",

  // Authorization & Zero-Trust
  "rbac": "Role-Based Access Control: Mô hình kiểm soát truy cập dựa trên vai trò tĩnh của người dùng trong hệ thống.",
  "role-based access control": "Phân quyền dựa trên vai trò: Gán quyền cho vai trò (Role) và gán vai trò cho người dùng.",
  "abac": "Attribute-Based Access Control: Phân quyền động theo ngữ cảnh và thuộc tính (IP, thời gian, thiết bị, phòng ban).",
  "denied by default": "Nguyên tắc an ninh: Mọi yêu cầu nếu không được cấp quyền rõ ràng thì mặc định bị từ chối truy cập (403 Forbidden).",
  "pep": "Policy Enforcement Point: Điểm kiểm soát và thực thi chính sách bảo mật ở tầng biên (Gateway / Middleware).",
  "policy enforcement point": "Chốt chặn biên kiểm tra xác thực và ủy quyền trước khi chuyển tiếp yêu cầu vào dịch vụ nội bộ.",
  "pdp": "Policy Decision Point: Bộ máy trung tâm đánh giá ma trận chính sách và trả về quyết định PERMIT hoặc DENY.",
  "policy decision point": "Hệ thống chuyên trách thẩm định quyền hạn dựa trên Roles, Claims và ngữ cảnh thực tế.",
  "role hierarchy": "Cây phân cấp vai trò: Vai trò cấp cao (SuperAdmin) tự động kế thừa toàn bộ quyền hạn của các vai trò cấp thấp (Admin, Member).",
  "mtls": "Mutual TLS: Giao thức mã hóa 2 chiều yêu cầu cả Client và Server đều phải xuất trình chứng chỉ số X.509 để xác minh danh tính.",
  "zero-trust": "Kiến trúc Không Tin Tưởng: 'Never Trust, Always Verify' - Mọi yêu cầu từ trong lẫn ngoài mạng nội bộ đều phải xác thực.",

  // Architecture & Engineering Patterns
  "pure domain engine": "Bộ xử lý nghiệp vụ thuần túy 100% 0 I/O (không gọi DB/Redis/Network), hoàn toàn Deterministic và dễ kiểm toán.",
  "deterministic": "Tính tiền định: Với cùng một đầu vào, hàm luôn trả về cùng một đầu ra duy nhất mà không có tác dụng phụ (Side Effect).",
  "transactional outbox": "Mẫu thiết kế lưu sự kiện vào bảng outbox trong cùng DB Transaction với entity để đảm bảo tính phát tán tin cậy.",
  "outbox": "Bảng lưu trữ tạm thời các integration event trước khi được worker ngầm đẩy sang message broker.",
  "ports and adapters": "Kiến trúc Lục giác (Hexagonal Architecture): Tách biệt domain lõi khỏi các chi tiết hạ tầng qua Interfaces/Ports.",
  "hexagonal architecture": "Kiến trúc Lục giác giúp domain service không bị phụ thuộc vào database hay HTTP framework cụ thể.",
  "batch resolver": "Kỹ thuật gom nhiều truy vấn đơn lẻ thành 1 truy vấn hàng loạt (Batch Query) để giải quyết vấn đề N+1.",
  "zod": "Thư viện TypeScript-first schema validation kiểm tra tính toàn vẹn và ép kiểu an toàn cho DTO ở tầng HTTP.",
  "message queue": "Hàng đợi tin nhắn (Kafka / RabbitMQ) đệm và san phẳng lưu lượng truy cập cao điểm, bảo vệ database phía sau.",
  "circuit breaker": "Bộ ngắt mạch: Tự động ngắt kết nối đến service đang bị sập để tránh làm tê liệt dây chuyền toàn bộ hệ thống.",
  "cache stampede": "Hiện tượng hàng ngàn request cùng ùa xuống Database khi một khóa cache phổ biến bị hết hạn cùng một thời điểm.",

  // Edge Defense & Rate Limiting
  "waf": "Web Application Firewall: Lá chắn tường lửa tầng ứng dụng L7 phát hiện và chặn đứng tấn công độc hại trước khi đến Gateway.",
  "ddos": "Distributed Denial of Service: Tấn công từ chối dịch vụ phân tán dội hàng triệu request ảo nhằm đánh sập máy chủ.",
  "rate limiting": "Kỹ thuật kiểm soát lưu lượng request từ mỗi IP hoặc User trong một đơn vị thời gian để bảo vệ máy chủ.",
  "rate limit": "Giới hạn tần suất: Ngưỡng trần số lượng yêu cầu được phép gửi trong một khung thời gian xác định.",
  "token bucket": "Thuật toán xô thẻ: Cho phép xử lý lưu lượng bùng phát tức thời (burst traffic) nếu xô còn thẻ tích lũy.",
  "sliding window": "Thuật toán cửa sổ trượt: Đếm số lượng request chính xác theo thời gian thực trượt, triệt tiêu lỗi biên thời gian.",
  "leaky bucket": "Thuật toán xô rò rỉ: Rót request vào xô và xử lý đầu ra với tốc độ cố định hoàn toàn phẳng.",

  // Audit Log & Cryptographic Ledger
  "audit log": "Nhật ký kiểm toán: Bản ghi bất biến ghi chép chi tiết ai đã thao tác gì, vào thời điểm nào và thay đổi ra sao.",
  "merkle tree": "Cây Merkle: Cấu trúc cây mã hóa băm nhị phân giúp xác thực tính toàn vẹn của hàng triệu bản ghi chỉ bằng Merkle Root.",
  "hmac sha-256": "Thuật toán băm có khóa bí mật (Hash-based Message Authentication Code) dùng SHA-256 đảm bảo tính chống giả mạo.",
  "hmac": "Mã xác thực thông điệp có khóa bí mật, đảm bảo dữ liệu không bị sửa đổi trên đường truyền.",
  "hash chain": "Chuỗi băm: Mỗi bản ghi mới chứa mã băm của bản ghi trước đó, hễ sửa 1 ký tự thì toàn bộ chuỗi bị gãy vụn.",
  "append-only": "Mô hình chỉ cho phép ghi nối tiếp vào cuối file/bảng, nghiêm cấm tuyệt đối thao tác sửa (UPDATE) hoặc xóa (DELETE).",
  "tamper-proof": "Khả năng chống can thiệp trái phép: Mọi hành vi sửa đổi dữ liệu dù là 1 byte đều lập tức bị phát hiện."
};

/**
 * Danh sách từ điển động được trích xuất từ tài liệu RAG nạp vào runtime
 */
let DYNAMIC_DICTIONARY: Record<string, string> = {};

export function setDynamicDictionary(dynamicTerms: Record<string, string>): void {
  DYNAMIC_DICTIONARY = { ...dynamicTerms };
  rebuildRegex();
}

let SORTED_KEYS: string[] = [];
let KEYWORD_REGEX: RegExp = new RegExp('');

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rebuildRegex(): void {
  const mergedKeys = Array.from(new Set([
    ...Object.keys(TECHNICAL_DICTIONARY),
    ...Object.keys(DYNAMIC_DICTIONARY)
  ])).sort((a, b) => b.length - a.length);

  SORTED_KEYS = mergedKeys;
  if (mergedKeys.length > 0) {
    KEYWORD_REGEX = new RegExp(`\\b(${mergedKeys.map(escapeRegex).join('|')})\\b`, 'gi');
  }
}

rebuildRegex();

export function getTechnicalTermDefinition(term: string): string | undefined {
  const clean = term.trim().toLowerCase();
  return DYNAMIC_DICTIONARY[clean] || TECHNICAL_DICTIONARY[clean];
}

/**
 * Tự động gắn tooltip cho các thẻ <u>Thuật ngữ</u> và tự động phát hiện từ khóa trong text thuần.
 */
export function enrichHtmlWithTooltips(htmlText: string): string {
  if (!htmlText) return '';

  // Bước 1: Làm giàu các thẻ <u> đã có sẵn trong văn bản
  const step1 = htmlText.replace(/<u(?:\s+data-tooltip="([^"]*)")?>(.*?)<\/u>/gi, (match, existTooltip, content) => {
    if (existTooltip) {
      return match;
    }
    const cleanKey = content.trim().toLowerCase();
    const definition = getTechnicalTermDefinition(cleanKey);
    if (definition) {
      return `<u data-tooltip="${definition}">${content}</u>`;
    }
    return match;
  });

  if (!KEYWORD_REGEX || SORTED_KEYS.length === 0) {
    return step1;
  }

  // Bước 2: Tự động quét từ khóa trong các đoạn văn bản thuần bên ngoài thẻ HTML
  const tokens = step1.split(/(<[^>]+>)/g);
  let inUTag = false;

  const enrichedTokens = tokens.map((token) => {
    if (!token) return '';

    if (token.startsWith('<') && token.endsWith('>')) {
      const lower = token.toLowerCase();
      if (lower.startsWith('<u ') || lower === '<u>') {
        inUTag = true;
      } else if (lower === '</u>') {
        inUTag = false;
      }
      return token;
    }

    if (inUTag) {
      return token;
    }

    return token.replace(KEYWORD_REGEX, (matched) => {
      const def = getTechnicalTermDefinition(matched);
      if (def) {
        return `<u data-tooltip="${def}">${matched}</u>`;
      }
      return matched;
    });
  });

  return enrichedTokens.join('');
}
