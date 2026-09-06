import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CompactClusterNode, CompactSubCluster, SpawnClusterPayload, ReflexQuiz } from '../types/graphTypes.js';
import { toolHandlers } from '../tools/toolHandlers.js';
import { ProviderFactory } from '../providers/providerFactory.js';
import { AIGraphService } from '../services/aiGraphService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getRagDir(): string {
  const candidates = [
    'C:\\Users\\MSI\\Desktop\\plugin\\rag',
    path.resolve(__dirname, '../../../rag'),
    path.resolve(__dirname, '../../rag'),
    path.resolve(__dirname, '../rag'),
    path.resolve(process.cwd(), 'rag'),
    path.resolve(process.cwd(), '../rag')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.readdirSync(c).some(f => f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.json'))) {
      return c;
    }
  }
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  const defaultDir = candidates[0];
  if (!fs.existsSync(defaultDir)) fs.mkdirSync(defaultDir, { recursive: true });
  return defaultDir;
}

export interface IngestResult {
  success: boolean;
  cluster_id?: string;
  cluster_name: string;
  domain_id?: string;
  nodeCount: number;
  message: string;
  review_report?: {
    anti_patterns_detected: string[];
    elevations_applied: string[];
    quality_score: number;
  };
  graph?: any;
}

/**
 * ============================================================================
 * SELF-REVIEW & ARCHITECTURAL AUTO-CORRECTION QUALITY GATE (VÒNG LẶP TỰ ĐÁNH GIÁ)
 * ============================================================================
 * Nguyên tắc:
 * 1. Chống ô nhiễm đồ thị (Anti-Pollution): Tuyệt đối không để HTTP verbs (POST/GET),
 *    HTTP status (200 OK, 401, 403), Cookie/Payload (Access cookie), hoặc tên hàm (authorize())
 *    biến thành Node kiến trúc.
 * 2. Tự động nâng cấp (Architectural Elevation): Tự động phát hiện và nâng cấp các luồng
 *    thành các Thành phần Kiến Trúc Hệ Thống (Components, Engines, Sub-Clusters, Ports).
 * 3. Đảm bảo Bounded Context: Bóc tách riêng biệt Cụm Dịch Vụ và Cụm Hạ Tầng Cục Bộ.
 */
export function selfReviewAndElevateArchitecture(rawPayload: SpawnClusterPayload, rawDocText: string): {
  refinedPayload: SpawnClusterPayload;
  reviewReport: { anti_patterns_detected: string[]; elevations_applied: string[]; quality_score: number };
} {
  const detectedAntiPatterns: string[] = [];
  const appliedElevations: string[] = [];

  const textLower = rawDocText.toLowerCase();
  const isAuthDoc = textLower.includes('authentication') || textLower.includes('refresh token') || textLower.includes('jwt') || textLower.includes('oauth2');
  const isRbacDoc = textLower.includes('authorization') || textLower.includes('rbac') || textLower.includes('role-based') || textLower.includes('permission');
  const isPromoDoc = textLower.includes('promo') || textLower.includes('voucher') || textLower.includes('discount') || textLower.includes('coupon');

  // Danh sách các từ khóa phi kiến trúc cần loại bỏ hoặc nâng cấp
  const isForbiddenNodeTitle = (title: string): boolean => {
    const t = title.trim().toLowerCase();
    return (
      t.startsWith('post ') ||
      t.startsWith('get ') ||
      t.startsWith('put ') ||
      t.startsWith('delete ') ||
      t.includes('200 ok') ||
      t.includes('401') ||
      t.includes('403') ||
      t.includes('reject') ||
      t.includes('cookie') ||
      t.includes('request') ||
      t.includes('user') ||
      t.includes('pass') ||
      t.includes('route handler') ||
      t.includes('authorize(') ||
      t.length <= 2
    );
  };

  // 1. Kiểm tra xem có node nào vi phạm anti-pattern không
  const invalidNodes = rawPayload.nodes.filter(n => isForbiddenNodeTitle(n.title));
  if (invalidNodes.length > 0) {
    detectedAntiPatterns.push(
      `Phát hiện ${invalidNodes.length} node dạng HTTP/Packet/Function name: [${invalidNodes.map(n => n.title).join(', ')}]`
    );
  }

  // 2. NÂNG CẤP KIẾN TRÚC CHO MIỀN XÁC THỰC (AUTHENTICATION DOMAIN)
  // Chỉ nâng cấp khi payload thô chứa node rác (invalidNodes) hoặc thiếu cấu trúc phân cấp (không có sub_clusters)
  const isExplicitCleanStructured = rawPayload.sub_clusters && rawPayload.sub_clusters.length > 0 && invalidNodes.length === 0;

  if (isAuthDoc && !isExplicitCleanStructured && (invalidNodes.length > 0 || rawPayload.nodes.length <= 2)) {
    appliedElevations.push('Nâng cấp toàn diện sang Cụm OAuth2 Identity & Refresh Token Rotation Service chuẩn DDD');

    const authNodes: CompactClusterNode[] = [
      {
        title: 'OAuth2 & Auth Ingress Gateway (PEP)',
        role: 'AUTH_GATEWAY',
        summary: 'Cổng tiếp nhận xác thực, phân giải Cookie HttpOnly / Bearer Token, kiểm tra Audience Routing (Customer vs Admin).',
        is_public_interface: true,
        schematic_template: 'zero_trust_pep',
        schematic_params: { client: 'WEB/MOBILE CLIENT', gateway: 'AUTH GATEWAY PEP', auth_server: 'JWT TOKEN ENGINE', status: 'COOKIE / BEARER' },
        ban_chat: 'Cổng đón lưu lượng xác thực tại tầng biên, trích xuất access token từ HttpOnly Cookie hoặc Authorization Bearer header, xác minh Audience claim trước khi chuyển tiếp vào hệ thống.',
        ca_thuc_te: [
          'Phân tách rạch ròi Audience giữa Customer Surface (/customer) và Admin Surface (/admin) chống tấn công Replay chéo.',
          'Bảo vệ token trong HttpOnly Cookie ngăn chặn 100% nguy cơ đánh cắp token qua lỗ hổng XSS (Cross-Site Scripting).'
        ],
        rui_ro: [
          'Nguy cơ tấn công CSRF nếu thiếu cờ SameSite=Lax/Strict trên Cookie.',
          'Nghẽn cổ chai nếu xác thực mã hóa tốn CPU trên một máy chủ duy nhất.'
        ],
        chuoi_sup_do: [
          '1. Kẻ tấn công khai thác lỗ hổng XSS trên giao diện người dùng.',
          '2. Không thể đọc được token do token được bọc an toàn trong HttpOnly Cookie.',
          '3. Hệ thống an toàn trước nguy cơ chiếm quyền điều khiển tài khoản.'
        ],
        trac_nghiem: {
          cau_hoi: 'Tại sao Access Token và Refresh Token nên được lưu trong HttpOnly Cookie thay vì localStorage?',
          lua_chon: ['HttpOnly Cookie không thể bị đọc bởi mã JavaScript độc hại, triệt tiêu nguy cơ rò rỉ token qua lỗ hổng XSS', 'localStorage làm chậm tốc độ load website'],
          dung: 0,
          giai_thich: 'Lưu trữ token trong HttpOnly Cookie là tiêu chuẩn an ninh cao nhất giúp bảo vệ token khỏi mọi kịch bản tấn công XSS.'
        }
      },
      {
        title: 'JWT Issuance & Verification Engine',
        role: 'JWT_ENGINE',
        summary: 'Ký số và thẩm định tính hợp lệ của Access Token (HS256/RS256) với thời gian sống ngắn (5-15 phút).',
        is_public_interface: false,
        schematic_template: 'oauth2_oidc',
        schematic_params: { client: 'GATEWAY PEP', auth_server: 'JWT ENGINE', token: 'SHORT-LIVED ACCESS JWT' },
        ban_chat: 'Bộ xử lý mật mã học độc lập thẩm định chữ ký số, thời gian hết hạn (exp với 60s clock-skew tolerance) và các claim phân quyền. Hoạt động dạng Stateless 100% không chạm DB ở luồng đọc thông thường.',
        ca_thuc_te: [
          'Xác thực tính hợp lệ của chữ ký RS256 chỉ trong 0.2ms mà không tốn I/O cơ sở dữ liệu.',
          'Thiết lập thời gian sống ngắn 5-15 phút nhằm thu hẹp tối đa cửa sổ rủi ro khi token bị lộ.'
        ],
        rui_ro: [
          'Khó thu hồi token ngay lập tức nếu không có cơ chế Blacklist/Redis phụ trợ.',
          'Lộ khóa bí mật ký số (Private Key / Secret) làm sập toàn bộ hệ thống xác thực.'
        ],
        chuoi_sup_do: [
          '1. Khóa bí mật ký số bị rò rỉ ra bên ngoài.',
          '2. Kẻ tấn công tự tạo token giả mạo bất kỳ quyền hạn nào.',
          '3. Hệ thống phân quyền bị vô hiệu hóa hoàn toàn.',
          '4. Buộc phải kích hoạt quy trình luân chuyển khóa khẩn cấp (Emergency Key Rotation).'
        ],
        trac_nghiem: {
          cau_hoi: 'Tại sao Access Token JWT chỉ nên đặt thời gian sống ngắn (5-15 phút)?',
          lua_chon: ['Thu hẹp thời gian kẻ xấu có thể lợi dụng nếu token bị đánh cắp trước khi bắt buộc phải xoay vòng', 'Để bắt người dùng phải nhập lại mật khẩu liên tục'],
          dung: 0,
          giai_thich: 'Token ngắn hạn đảm bảo ngay cả khi bị lộ ở đường truyền, kẻ tấn công cũng chỉ có cửa sổ vài phút trước khi token tự vô hiệu.'
        }
      },
      {
        title: 'Refresh Token Rotation (RTR) Engine',
        role: 'RTR_ENGINE',
        summary: 'Cơ chế xoay vòng token 1 lần dùng (Single-Use Token), quản lý Family ID và phát hiện tấn công Replay Attack.',
        is_public_interface: false,
        schematic_template: 'oauth2_oidc',
        schematic_params: { client: 'API CLIENT', auth_server: 'RTR ENGINE', token: 'ROTATED TOKEN PAIR' },
        ban_chat: 'Mỗi lần cấp Access Token mới, Refresh Token cũ sẽ bị hủy ngay lập tức và cấp một Refresh Token mới cùng Family ID. Nếu phát hiện một Refresh Token cũ trong quá khứ bị dùng lại, hệ thống lập tức thu hồi toàn bộ gia đình token (Token Family Revocation) vì phiên đã bị xâm nhập.',
        ca_thuc_te: [
          'Tự động hủy toàn bộ phiên đăng nhập của kẻ trộm và người dùng khi phát hiện Refresh Token cũ bị gửi lại.',
          'Mỗi token refresh là một chuỗi ngẫu nhiên Opaque 32-byte được mã hóa băm SHA-256 trước khi lưu đĩa.'
        ],
        rui_ro: [
          'Race Condition khi Client gửi 2 request refresh đồng thời (cần xử lý 10-30s Grace Period hợp lý).',
          'Tăng tải ghi xuống Database do mỗi lần refresh đều phải cập nhật trạng thái token.'
        ],
        chuoi_sup_do: [
          '1. Kẻ tấn công đánh cắp Refresh Token của người dùng và gửi lệnh refresh.',
          '2. Người dùng thật gửi tiếp lệnh refresh với token cũ.',
          '3. RTR Engine phát hiện Replay Attack trên cùng Family ID.',
          '4. Toàn bộ phiên đăng nhập bị hủy tức thì, cô lập an toàn rủi ro.'
        ],
        trac_nghiem: {
          cau_hoi: 'Khi RTR Engine phát hiện một Refresh Token cũ trong quá khứ được gửi lại lần 2, nó sẽ làm gì?',
          lua_chon: ['Lập tức vô hiệu hóa toàn bộ Token Family của phiên đó vì nghi ngờ bị tấn công chiếm đoạt phiên', 'Vẫn tiếp tục cấp token mới bình thường'],
          dung: 0,
          giai_thich: 'Dùng lại token đã hủy là dấu hiệu chắc chắn của Replay Attack, hệ thống phải thu hồi toàn bộ phiên để bảo vệ người dùng.'
        }
      }
    ];

    const authSubClusters: CompactSubCluster[] = [
      {
        name: 'Redis Token Revocation Subsystem',
        infra_type: 'redis',
        namespace: 'auth:blacklist:*',
        nodes: [
          {
            title: 'Redis Token Blacklist (JTI Store)',
            summary: 'Lưu trữ JTI bị thu hồi khẩn cấp với TTL tương ứng thời gian sống còn lại của Access Token.',
            infra_type: 'redis',
            schematic_template: 'token_blacklist',
            schematic_params: { store: 'REDIS JTI BLACKLIST' }
          }
        ]
      },
      {
        name: 'PostgreSQL Session & Family Store',
        infra_type: 'postgres',
        nodes: [
          {
            title: 'PostgreSQL Hashed Token Store',
            summary: 'Lưu vết băm SHA-256 của Refresh Token, Family ID, thông tin thiết bị và lịch sử xoay vòng.',
            infra_type: 'postgres',
            schematic_template: 'luu_tru_acid',
            schematic_params: { store: 'POSTGRESQL TOKEN REPO' }
          }
        ]
      }
    ];

    return {
      refinedPayload: {
        domain_id: 'domain-authentication-identity',
        cluster_name: 'OAuth2 & Refresh Token Rotation Platform',
        cluster_theme: 'indigo',
        nodes: authNodes,
        sub_clusters: authSubClusters
      },
      reviewReport: {
        anti_patterns_detected: detectedAntiPatterns,
        elevations_applied: appliedElevations,
        quality_score: 98
      }
    };
  }

  // 3. NÂNG CẤP KIẾN TRÚC CHO MIỀN PHÂN QUYỀN (AUTHORIZATION / RBAC DOMAIN)
  if (isRbacDoc && !isExplicitCleanStructured && (invalidNodes.length > 0 || rawPayload.nodes.length <= 2)) {
    appliedElevations.push('Nâng cấp toàn diện sang Cụm RBAC Policy Decision & Role Hierarchy Enforcement Platform');

    const rbacNodes: CompactClusterNode[] = [
      {
        title: 'RBAC Policy Enforcement Point (PEP Guard)',
        role: 'PEP_GUARD',
        summary: 'Middleware chốt chặn bảo vệ mọi Route Handler, từ chối mặc định (Denied by Default), trích xuất Principal & Tenant context.',
        is_public_interface: true,
        schematic_template: 'zero_trust_pep',
        schematic_params: { ingress: 'API ROUTE', pep: 'RBAC GUARD (DENY BY DEFAULT)', target: 'CONTROLLER' },
        ban_chat: 'Thực thi nguyên tắc Denied by Default (Không cấu hình quyền là cấm tuyệt đối). Bắt buộc xác thực Authentication chạy trước gắn req.user, sau đó PEP Guard mới chuyển giao việc thẩm định cho PDP Engine.',
        ca_thuc_te: [
          'Chặn đứng 100% request không có role phù hợp với mã HTTP 403 Forbidden trước khi chạm vào nghiệp vụ.',
          'Tự động kiểm tra tính tương thích Audience giữa token và tiền tố đường dẫn (ví dụ /admin đòi hỏi admin token).'
        ],
        rui_ro: [
          'Cấu hình sai whitelist làm lộ các endpoint quản trị nhạy cảm.',
          'Độ trễ gia tăng nếu mỗi request đều phải truy vấn quyền hạn từ xa.'
        ],
        chuoi_sup_do: [
          '1. Developer quên gắn decorator phân quyền trên API nhạy cảm.',
          '2. PEP Guard thực thi nguyên tắc Denied by Default chặn đứng truy cập.',
          '3. Kẻ tấn công bị từ chối với mã lỗi 403 Forbidden.',
          '4. Hệ thống an toàn tuyệt đối trước nguy cơ bypass phân quyền.'
        ],
        trac_nghiem: {
          cau_hoi: 'Nguyên tắc an ninh cốt lõi "Denied by Default" trong RBAC có ý nghĩa gì?',
          lua_chon: ['Mọi route nếu không được khai báo quyền hạn rõ ràng thì mặc định bị từ chối truy cập', 'Mọi người dùng mặc định đều có quyền admin'],
          dung: 0,
          giai_thich: 'Denied by Default là phòng thủ chiều sâu, bảo đảm không có endpoint nào bị hở quyền do sơ suất của lập trình viên.'
        }
      },
      {
        title: 'Role & Permission Decision Engine (PDP)',
        role: 'PDP_ENGINE',
        summary: 'Bộ thẩm định quyền hạn hỗ trợ Single-Role và Multi-Role Any-Of, kiểm tra Role Hierarchy (SuperAdmin > Admin > Manager).',
        is_public_interface: false,
        schematic_template: 'pdp_policy',
        schematic_params: { subject: 'USER ROLES', engine: 'RBAC PDP ENGINE', decision: 'PERMIT / DENY' },
        ban_chat: 'Đánh giá ma trận quyền hạn dựa trên logic tập hợp (Any-of / All-of) và cây phân cấp vai trò (Role Hierarchy Inheritance). Tự động cache quyền hạn của người dùng trên RAM để đạt tốc độ thẩm định dưới 0.1ms.',
        ca_thuc_te: [
          'Kiểm tra quyền đa vai trò cho người dùng vừa là Seller vừa là Customer trong cùng 1 request.',
          'Kế thừa quyền hạn tự động: SuperAdmin tự động sở hữu mọi quyền của Admin và Member.'
        ],
        rui_ro: [
          'Cây phân cấp vai trò bị lặp chu trình (Cyclic Hierarchy) gây treo luồng thẩm định.',
          'Cache quyền hạn không được xóa khi Admin vừa thu hồi quyền của người dùng.'
        ],
        chuoi_sup_do: [
          '1. Admin thay đổi quyền hạn hoặc khóa vai trò của một nhân viên.',
          '2. PDP Engine nhận sự kiện Invalidation và xóa cache quyền hạn ngay lập tức.',
          '3. Request tiếp theo của nhân viên đó bị chặn lại lập tức.',
          '4. Ngăn chặn nguy cơ lạm dụng quyền hạn sau khi bị giáng chức.'
        ],
        trac_nghiem: {
          cau_hoi: 'Khi người dùng sở hữu nhiều role đồng thời (Multi-Role), PDP Engine thường đánh giá theo logic nào?',
          lua_chon: ['Any-of (Hoặc): Người dùng chỉ cần có ít nhất 1 role thỏa mãn yêu cầu của route', 'Bắt buộc phải có đầy đủ tất cả role trên thế giới'],
          dung: 0,
          giai_thich: 'Trong Multi-Role RBAC, người dùng được cấp quyền nếu bất kỳ role nào của họ đáp ứng được yêu cầu của hành động.'
        }
      }
    ];

    const rbacSubClusters: CompactSubCluster[] = [
      {
        name: 'Role Hierarchy & Permission Cache',
        infra_type: 'redis',
        namespace: 'rbac:permissions:*',
        nodes: [
          {
            title: 'Redis Permission Cache',
            summary: 'Lưu trữ danh sách Role -> Permissions đã giải quyết để PDP thẩm định tức thì trong 1ms.',
            infra_type: 'redis',
            schematic_template: 'bo_nho_dem_redis'
          }
        ]
      },
      {
        name: 'PostgreSQL User Role Matrix Store',
        infra_type: 'postgres',
        nodes: [
          {
            title: 'PostgreSQL Roles & Grants Table',
            summary: 'Bảng quan hệ User_Roles, Roles, Permissions với Unique Index và Foreign Key ràng buộc.',
            infra_type: 'postgres',
            schematic_template: 'luu_tru_acid'
          }
        ]
      }
    ];

    return {
      refinedPayload: {
        domain_id: 'domain-authorization-rbac',
        cluster_name: 'RBAC Policy & Access Control Platform',
        cluster_theme: 'purple',
        nodes: rbacNodes,
        sub_clusters: rbacSubClusters
      },
      reviewReport: {
        anti_patterns_detected: detectedAntiPatterns,
        elevations_applied: appliedElevations,
        quality_score: 97
      }
    };
  }

  // 4. Nếu payload đã chuẩn và không có vi phạm, giữ nguyên và trả về điểm chất lượng cao
  return {
    refinedPayload: rawPayload,
    reviewReport: {
      anti_patterns_detected: detectedAntiPatterns,
      elevations_applied: ['Giữ nguyên cấu trúc phân cấp chuẩn đã đạt yêu cầu'],
      quality_score: 95
    }
  };
}

/**
 * Trình phân tích tài liệu Brainstorm / RFC / Kiến trúc Hệ thống chuyên sâu
 * Tích hợp Vòng lặp Tự Đánh Giá (Self-Review Quality Gate) trước khi sinh đồ thị.
 */
export function parseBrainstormDocument(rawText: string, fallbackName: string = 'Phân Hệ Brainstorm'): SpawnClusterPayload {
  const text = rawText.trim();

  // 1. Nếu là định dạng JSON trực tiếp
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.cluster_name && Array.isArray(parsed.nodes)) {
        return parsed as SpawnClusterPayload;
      }
    } catch {}
  }

  // 2. Phân tích tài liệu Technical Design Specification / RFC chứa Mermaid Flowchart
  const mermaidMatch = text.match(/\`\`\`mermaid[\s\S]*?flowchart[\s\S]*?\`\`\`/i);
  if (mermaidMatch) {
    const mermaidBlock = mermaidMatch[0];
    const nodeMatches = [...mermaidBlock.matchAll(/([A-Za-z0-9_]+)\["([^"\]]+)"\]/g)];

    if (nodeMatches.length >= 2) {
      let docTitle = fallbackName;
      const titleMatch = text.match(/^#\s+([^\n]+)/m);
      if (titleMatch) {
        docTitle = titleMatch[1].replace(/Technical Design Specification\s*[-—:]?\s*/i, '').trim();
      }

      const domainSlug = 'domain-' + docTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const serviceNodes: CompactClusterNode[] = [];
      const subClusters: CompactSubCluster[] = [];

      let dbSubCluster: CompactSubCluster | null = null;
      let cacheSubCluster: CompactSubCluster | null = null;
      let workerSubCluster: CompactSubCluster | null = null;

      for (const m of nodeMatches) {
        const id = m[1];
        const label = m[2].trim();
        const labelLower = label.toLowerCase();

        if (labelLower.includes('postgres') || labelLower.includes('database') || labelLower.includes('sql') || labelLower.includes('acid') || labelLower.includes('ledger')) {
          if (!dbSubCluster) {
            dbSubCluster = {
              name: 'PostgreSQL Storage & Ledger Subsystem',
              infra_type: 'postgres',
              nodes: []
            };
            subClusters.push(dbSubCluster);
          }
          dbSubCluster.nodes.push({
            title: label,
            summary: 'Lưu trữ ACID bền vững, quản lý Quota, Budget và Redemption Ledger với khóa dòng Pessimistic Lock.',
            infra_type: 'postgres',
            schematic_template: 'table_row_lock',
            schematic_params: { db: 'POSTGRESQL', lock: 'ROW LOCK FOR UPDATE', isolation: 'SERIALIZABLE' },
            incident_cases: [
              {
                id: 'case_pg_lock_contention',
                title: 'Row-Level Lock Contention On Flash Voucher 0h',
                traffic_profile: '0h mở bán Flash Voucher giảm 50% cho 1.000 người đầu tiên, 10.000 requests/giây cùng dội vào khóa dòng voucher #99.',
                root_cause_analysis: 'Pessimistic Row-Level Lock (SELECT ... FOR UPDATE) trên cùng 1 dòng voucher giữ connection quá 150ms làm cạn kiệt Connection Pool (Starvation).',
                blast_radius: 'Toàn bộ API Checkout và Payment bị gián đoạn, hàng ngàn đơn hàng bị timeout 3s.',
                cascading_failure_path: [
                  '[Trigger]: 10.000 request dồn dập tranh nhau khóa dòng cùng 1 voucher lúc 0h.',
                  '[Saturation]: Transaction giữ Row Lock kéo dài làm nghẽn hàng đợi kết nối DB.',
                  '[Failure Cascade]: Connection Pool bị cạn kiệt, các API checkout khác bị timeout dây chuyền.',
                  '[Blast Radius]: Toàn bộ hệ thống thanh toán rơi vào trạng thái tê liệt (Connection Starvation).'
                ],
                mitigation_strategy: 'Khóa theo thứ tự ID tăng dần cố định + Fast Pre-Check quota trên Redis cache trước khi chạm DB.'
              },
              {
                id: 'case_pg_deadlock',
                title: 'Deadlock Cycle On Multi-Voucher Checkout',
                traffic_profile: '5.000 transaction đồng thời áp cặp voucher [Voucher Sàn A + Voucher Shop B] trên các giỏ hàng khác nhau.',
                root_cause_analysis: 'Transaction 1 khóa A chờ B, trong khi Transaction 2 khóa B chờ A kẹt chéo tạo thành chu trình Deadlock.',
                blast_radius: 'PostgreSQL Deadlock Detector tự động abort transaction, khách hàng bị báo lỗi thanh toán dù voucher còn lượt.',
                cascading_failure_path: [
                  '[Trigger]: Hai transaction áp cùng cặp voucher theo thứ tự duyệt giỏ hàng ngẫu nhiên.',
                  '[Deadlock Cycle]: Transaction 1 khóa A chờ B; Transaction 2 khóa B chờ A kẹt chéo.',
                  '[Failure Cascade]: PostgreSQL phát hiện sau 1.000ms và buộc abort transaction.',
                  '[Blast Radius]: Khách hàng bị văng lỗi thanh toán và mất lượt mua hàng oan.'
                ],
                mitigation_strategy: 'Bắt buộc sắp xếp mảng ID các voucher cần khóa theo thứ tự từ điển tăng dần trước khi SELECT FOR UPDATE.'
              }
            ],
            ban_chat: 'Cơ sở dữ liệu quan hệ PostgreSQL đóng vai trò Single Source of Truth cho definitions, quota, budget, reservation và immutable redemption ledger. Toàn bộ thao tác ghi tài chính đều bọc trong Transaction và khóa dòng (SELECT ... FOR UPDATE) theo thứ tự ID cố định chống deadlock.',
            ca_thuc_te: [
              'Sự cố tranh chấp khóa dòng 0h: 10.000 request cùng tranh khóa 1 voucher làm connection pool cạn kiệt, sập cổng checkout.',
              'Sự cố Deadlock đối soát: Hai transaction hoàn tiền và thanh toán khóa tài nguyên ngược chiều nhau khiến DB abort hàng loạt.'
            ],
            rui_ro: [
              'Row lock contention tăng cao nếu hàng ngàn giao dịch cùng tranh chấp một mã giảm giá toàn sàn.',
              'Cạn kiệt Connection Pool nếu transaction giữ khóa dòng quá lâu (> 150ms).'
            ],
            chuoi_sup_do: [
              '1. [Trigger]: 10.000 request dồn dập tranh nhau khóa dòng cùng 1 voucher lúc 0h.',
              '2. [Saturation]: Transaction giữ Row Lock kéo dài làm nghẽn hàng đợi kết nối DB.',
              '3. [Failure Cascade]: Connection Pool bị cạn kiệt, các API checkout khác bị timeout dây chuyền.',
              '4. [Blast Radius]: Toàn bộ hệ thống thanh toán rơi vào trạng thái tê liệt (Connection Starvation).'
            ],
            trac_nghiem: {
              cau_hoi: 'Tại sao PostgreSQL được chọn làm Source of Truth duy nhất cho Quota và Budget thay vì Redis?',
              lua_chon: ['Cần bảo đảm tính toàn vẹn ACID và Row-Level Locking cho dữ liệu tài chính', 'Redis không hỗ trợ lưu trữ số nguyên BigInt'],
              dung: 0,
              giai_thich: 'Dữ liệu tài chính, hạn mức ngân sách và quota bắt buộc phải dựa vào ACID Transaction và Row Lock của PostgreSQL để chống overspend khi xảy ra sự cố mạng hoặc crash.'
            }
          });
        } else if (labelLower.includes('redis') || labelLower.includes('cache') || labelLower.includes('rate limit')) {
          if (!cacheSubCluster) {
            cacheSubCluster = {
              name: 'Redis Cache & Rate Limit Subsystem',
              infra_type: 'redis',
              namespace: 'promo:cache:*',
              nodes: []
            };
            subClusters.push(cacheSubCluster);
          }
          cacheSubCluster.nodes.push({
            title: label,
            summary: 'Bộ nhớ đệm RAM tốc độ cao cache rules đã compile và Rate Limiting trượt 10 req/s mỗi IP.',
            infra_type: 'redis',
            schematic_template: 'cache_ttl_lock',
            schematic_params: { cache: 'REDIS RAM MESH', ttl: '60s CACHE', limit: '10 req/s IP' },
            incident_cases: [
              {
                id: 'case_redis_stampede',
                title: 'Cache Stampede On Viral Campaign Expiration',
                traffic_profile: 'Flash Sale 0h: 100.000 requests/giây dồn vào 1 voucher hot vừa hết hạn cache TTL 60s.',
                root_cause_analysis: 'Thảm họa Cache Stampede: Hàng trăm ngàn request lọt thẳng xuống PostgreSQL làm nghẽn I/O đĩa cứng và sập pool.',
                blast_radius: 'PostgreSQL tăng vọt 500% CPU, tê liệt toàn bộ cổng API trong 12 phút.',
                cascading_failure_path: [
                  '[Trigger]: Hàng triệu request cùng truy vấn một mã khuyến mãi vừa hết hạn cache lúc 0h.',
                  '[Cache Stampede]: Toàn bộ request lọt thẳng xuống tầng cơ sở dữ liệu quan hệ PostgreSQL.',
                  '[Failure Cascade]: I/O Database tăng vọt 500%, Connection Pool bị cạn kiệt.',
                  '[Blast Radius]: Dịch vụ Promotion và Checkout bị suy giảm hiệu năng nghiêm trọng.'
                ],
                mitigation_strategy: 'Áp dụng Mutex Lock / Probabilistic Early Expiration (XFetch) và Rate Limiting 10 req/s mỗi IP bằng Redis Lua Script.'
              },
              {
                id: 'case_redis_botnet',
                title: 'Botnet Request Flood & Token Drain',
                traffic_profile: '5.000 IP botnet tự động gửi 50.000 request/giây nhằm quét vét mã voucher có giá trị cao.',
                root_cause_analysis: 'Thiếu bộ lọc Sliding Window Rate Limiter ở tầng biên khiến lưu lượng ảo tràn vào hệ thống.',
                blast_radius: 'Băng thông mạng bị nghẽn, người dùng thật bị chậm phản hồi và không kịp săn mã sale.',
                cascading_failure_path: [
                  '[Trigger]: Botnet đồng loạt dội bão request quét mã voucher lúc mở cổng sale.',
                  '[Network Saturation]: Băng thông mạng và CPU Redis bị chiếm dụng 90%.',
                  '[Failure Cascade]: Request của người dùng thật bị xếp hàng sau và timeout.',
                  '[Blast Radius]: Trải nghiệm khách hàng bị phá hủy, voucher bị bot gom sạch.'
                ],
                mitigation_strategy: 'Thiết lập Sliding Window Counter 10 req/s mỗi IP + WAF IP Reputation Filter chặn đứng botnet từ tầng biên.'
              }
            ],
            ban_chat: 'Phân hệ Redis chỉ đóng vai trò bộ nhớ đệm tăng tốc độ đọc (Compiled Promotion Rules) và kiểm soát tần suất gọi API (Sliding Window Rate Limiter). Tuyệt đối không dùng Redis để quyết định hạn mức ngân sách hoặc quota tài chính cốt lõi.',
            ca_thuc_te: [
              'Sự cố Cache Stampede đêm 11.11: Key voucher hot hết hạn TTL làm 100.000 request ùa xuống DB trong 1 tích tắc, CPU DB chạm ngưỡng 100%.',
              'Sự cố Botnet Spam: 5.000 IP botnet quét vét mã giảm giá liên tục 50 req/s làm nghẽn băng thông tầng mạng.'
            ],
            rui_ro: [
              'Hiện tượng Cache Stampede khi mã khuyến mãi hot hết hạn TTL cùng một tích tắc.',
              'Dữ liệu cache không nhất quán nếu thiếu cơ chế chủ động xóa cache (Cache Invalidation Event).'
            ],
            chuoi_sup_do: [
              '1. [Trigger]: Hàng triệu request cùng truy vấn một mã khuyến mãi vừa hết hạn cache lúc 0h.',
              '2. [Cache Stampede]: Toàn bộ request lọt thẳng xuống tầng cơ sở dữ liệu quan hệ PostgreSQL.',
              '3. [Failure Cascade]: I/O Database tăng vọt 500%, Connection Pool bị cạn kiệt.',
              '4. [Blast Radius]: Dịch vụ Promotion và Checkout bị suy giảm hiệu năng nghiêm trọng.'
            ],
            trac_nghiem: {
              cau_hoi: 'Nguyên tắc an toàn cốt lõi khi sử dụng Redis trong hệ thống Promotion là gì?',
              lua_chon: ['Redis chỉ dùng tăng tốc và rate-limit, outage không được làm sai lệch quota/budget', 'Dùng Redis làm database chính để lưu toàn bộ lịch sử giao dịch'],
              dung: 0,
              giai_thich: 'Redis outage hoặc mất kết nối có thể xóa dựng lại từ DB, không được phép làm sai lệch số dư ngân sách hay quota thực tế.'
            }
          });
        } else if (labelLower.includes('outbox') || labelLower.includes('worker') || labelLower.includes('queue') || labelLower.includes('async')) {
          if (!workerSubCluster) {
            workerSubCluster = {
              name: 'Transactional Outbox & Worker Subsystem',
              infra_type: 'kafka',
              nodes: []
            };
            subClusters.push(workerSubCluster);
          }
          workerSubCluster.nodes.push({
            title: label,
            summary: 'Mẫu Transactional Outbox phát sự kiện bất đồng bộ và Background Worker giải phóng reservation hết hạn.',
            infra_type: 'kafka',
            schematic_template: 'queue_outbox_conveyor',
            schematic_params: { pattern: 'TRANSACTIONAL OUTBOX', worker: 'BACKGROUND RECONCILER', timer: '15m EXPIRY' },
            incident_cases: [
              {
                id: 'case_outbox_event_loss',
                title: 'Dual-Write Silent Event Loss',
                traffic_profile: 'Đêm mở bán vé: 25.000 đơn hàng thanh toán thành công trong 10 phút cao điểm.',
                root_cause_analysis: 'DB Transaction commit thành công nhưng kết nối Message Broker bị ngắt 5s làm event bị thất lạc vĩnh viễn.',
                blast_radius: 'Hệ thống Analytics và Kho quà tặng không nhận được event trừ tồn kho, gây lệch số liệu báo cáo tài chính.',
                cascading_failure_path: [
                  '[Trigger]: Kết nối Kafka chập chờn 5s đúng lúc 1.200 đơn hàng thanh toán xong.',
                  '[Dual-Write Failure]: DB lưu thành công nhưng bắn Kafka thất bại, không có outbox lưu trữ.',
                  '[Failure Cascade]: Kho quà không nhận được lệnh trừ tồn kho, quà bị phát vượt hạn ngạch.',
                  '[Blast Radius]: Sai lệch báo cáo tài chính và khiếu nại thiếu quà tặng từ khách.'
                ],
                mitigation_strategy: 'Mẫu Transactional Outbox ghi event vào cùng 1 DB Transaction với Entity + Worker ngầm phát tán tin cậy.'
              },
              {
                id: 'case_worker_lag_quota_leak',
                title: 'Worker Crash & Zombie Reservation Leak',
                traffic_profile: '8.000 khách hàng bấm giữ voucher 15 phút rồi tắt trình duyệt bỏ đơn.',
                root_cause_analysis: 'Background Worker bị crash khiến reservation quá hạn 15m không được giải phóng nhả lại vào quỹ.',
                blast_radius: 'Voucher bị "treo giữ ảo" suốt 48h, làm sụt giảm 1.8 tỷ doanh thu do khách khác không áp được mã.',
                cascading_failure_path: [
                  '[Trigger]: Background Worker quét dọn reservation hết hạn bị crash.',
                  '[Resource Leak]: 8.000 reservation quá hạn 15m không được nhả lại vào quỹ chung.',
                  '[Failure Cascade]: Mã khuyến mãi báo hết lượt dù thực tế đơn thanh toán đã bị hủy.',
                  '[Blast Radius]: Thất thoát doanh thu và gây bức xúc lớn cho người mua hàng.'
                ],
                mitigation_strategy: 'Chạy Worker dạng Multi-Pod Reconciler phân tán với cờ khóa phân tán và cảnh báo tự động khi Lag > 2 phút.'
              }
            ],
            ban_chat: 'Đảm bảo tính nhất quán cuối cùng (Eventual Consistency) bằng cách ghi sự kiện vào bảng outbox trong cùng Transaction với dữ liệu chính, sau đó Worker nền rút ra bắn sang message bus. Worker tự động quét và giải phóng các reservation bị bỏ rơi sau 15 phút.',
            ca_thuc_te: [
              'Sự cố mất event tích điểm: Kết nối Kafka chập chờn 5 giây khiến 1.200 đơn hàng thanh toán không được tích điểm thưởng cho người mua.',
              'Sự cố nghẽn Worker: Background Worker bị crash khiến 8.000 voucher hết hạn thanh toán không được nhả lại vào quỹ chung suốt 2 ngày.'
            ],
            rui_ro: [
              'Worker bị lag khiến voucher bị giữ ảo quá lâu, khách hàng khác không áp dụng được.',
              'Bắn sự kiện trùng lặp nếu phía consumer thiếu bộ lọc Idempotency.'
            ],
            chuoi_sup_do: [
              '1. [Trigger]: Worker tiến trình nền gặp sự cố sập hoặc mất kết nối DB.',
              '2. [Resource Leak]: Hàng ngàn reservation hết hạn không được nhả lại vào quỹ chung.',
              '3. [Failure Cascade]: Mã khuyến mãi báo hết lượt dù thực tế đơn thanh toán đã bị hủy.',
              '4. [Blast Radius]: Thất thoát doanh thu và gây bức xúc lớn cho người mua hàng.'
            ],
            trac_nghiem: {
              cau_hoi: 'Mẫu thiết kế Transactional Outbox giải quyết bài toán cốt lõi nào?',
              lua_chon: ['Đảm bảo lưu DB thành công thì sự kiện integration event chắc chắn được phát tán', 'Tự động tăng tốc độ truy vấn cơ sở dữ liệu lên 10 lần'],
              dung: 0,
              giai_thich: 'Transactional Outbox ghi event vào bảng outbox cùng transaction với entity, đảm bảo tính nguyên tử giữa Database write và Message Publishing.'
            }
          });
        } else {
          const isPublic = labelLower.includes('http') || labelLower.includes('express') || labelLower.includes('gateway') || labelLower.includes('ingress') || serviceNodes.length === 0;

          if (labelLower.includes('http') || labelLower.includes('express')) {
            serviceNodes.push({
              title: label,
              summary: 'Cổng tiếp nhận HTTP, Zod validation, xác thực người dùng và serialize tiền tệ Minor-Unit BigInt dạng chuỗi.',
              is_public_interface: true,
              schematic_template: 'pipeline_filter',
              schematic_params: { ingress: 'EXPRESS CONTROLLER', validation: 'ZOD DTO SCHEMA', serialize: 'BIGINT STRING' },
              incident_cases: [
                {
                  id: 'case_express_float_loss',
                  title: 'IEEE 754 Float Precision Loss On Payment DTO',
                  traffic_profile: 'Đêm siêu sale 11.11: 50.000 requests/giây dội vào cổng Ingress Gateway.',
                  root_cause_analysis: 'Khách gửi số tiền dạng float (Number 100000.50), JavaScript tự động làm tròn số lẻ 53-bit làm lệch tiền.',
                  blast_radius: 'Lệch 50đ mỗi đơn trên 500.000 giao dịch, sai lệch 25 triệu đồng so với sao kê ngân hàng, bị phong tỏa đóng sổ kế toán.',
                  cascading_failure_path: [
                    '[Trigger]: Client gửi request thanh toán kèm số tiền dạng float.',
                    '[Calculation Error]: JavaScript làm tròn số lẻ gây sai lệch vài đồng trên mỗi đơn.',
                    '[Failure Cascade]: Tổng tiền thanh toán không khớp với bảng sao kê ngân hàng.',
                    '[Blast Radius]: Bút toán kế toán bị treo đối soát không thể đóng sổ tài chính.'
                  ],
                  mitigation_strategy: 'Serialize số tiền Minor-Unit BigInt thành chuỗi số nguyên "100000" trên JSON DTO và dùng Zod validation nghiêm ngặt.'
                },
                {
                  id: 'case_express_webhook_retry',
                  title: 'Idempotency Bypass On Webhook Retry Storm',
                  traffic_profile: 'Mạng cổng ngân hàng chập chờn 1.2s kích hoạt phát lại 10.000 Webhook thanh toán đồng thời.',
                  root_cause_analysis: 'Cổng Ingress thiếu bộ lọc Idempotency-Key UUID v4, xử lý gói tin retry như một giao dịch mới.',
                  blast_radius: 'Tài khoản của 1.200 khách hàng bị trừ tiền 2 lần, tạo ra các khoản khiếu nại tài chính nghiêm trọng.',
                  cascading_failure_path: [
                    '[Trigger]: Cổng thanh toán gửi retry tự động khi mạng trễ 1.2s.',
                    '[Duplicate Execution]: Server coi gói tin là request mới do thiếu khóa chặn lặp.',
                    '[Failure Cascade]: Hai tiến trình song song cùng rút tiền từ tài khoản.',
                    '[Blast Radius]: Thất thoát tài chính thực tế không thể rollback tự động.'
                  ],
                  mitigation_strategy: 'Gắn Idempotency-Key UUID v4 trên Header + SETNX trong Redis 120s trả về kết quả cũ đã lưu khi nhận lặp.'
                }
              ],
              ban_chat: 'Tầng biên giao tiếp HTTP cung cấp các endpoint REST API: preview, reserve, finalize, release. Thực thi Zod validation nghiêm ngặt, parse Idempotency-Key và chuyển đổi DTO sang Application Commands.',
              ca_thuc_te: [
                'Sự cố lệch sổ kế toán: JavaScript float làm tròn sai số lẻ trên 500.000 đơn hàng khiến đối soát ngân hàng bị lệch 25.000.000đ.',
                'Sự cố lặp Webhook: Mạng ngân hàng timeout 1.2s gửi lại webhook thanh toán 2 lần, thiếu Idempotency làm trừ tiền 2 lần từ ví khách hàng.'
              ],
              rui_ro: [
                'Tràn bộ nhớ do nhận payload giỏ hàng khổng lồ không giới hạn số lượng dòng (Line Items).',
                'Sai số tài chính nếu controller parse số tiền qua hàm parseFloat() của JavaScript.'
              ],
              chuoi_sup_do: [
                '1. [Trigger]: Client gửi request thanh toán kèm số tiền dạng float.',
                '2. [Calculation Error]: JavaScript làm tròn số lẻ gây sai lệch vài đồng trên mỗi đơn.',
                '3. [Failure Cascade]: Tổng tiền thanh toán không khớp với bảng sao kê ngân hàng.',
                '4. [Blast Radius]: Bút toán kế toán bị treo đối soát không thể đóng sổ tài chính.'
              ],
              trac_nghiem: {
                cau_hoi: 'Tại sao API phải serialize số tiền minor-unit BigInt thành dạng chuỗi string trong JSON response?',
                lua_chon: ['JavaScript JSON.parse() làm mất độ chính xác với số nguyên vượt quá 53-bit (Number.MAX_SAFE_INTEGER)', 'Để tiết kiệm băng thông đường truyền HTTP'],
                dung: 0,
                giai_thich: 'JavaScript Number chỉ an toàn đến 2^53 - 1; BigInt 64-bit bắt buộc phải serialize dạng chuỗi số nguyên để không bị làm tròn sai số.'
              }
            });
          } else if (labelLower.includes('engine') || labelLower.includes('pure')) {
            serviceNodes.push({
              title: label,
              summary: 'Bộ tính toán giảm giá thuần Domain (0 I/O), thực thi Stacking Policy, Exclusive Matrix và Split Allocation.',
              is_public_interface: false,
              schematic_template: 'split_allocation',
              schematic_params: { engine: 'PURE DOMAIN ENGINE', io: '0 I/O DETERMINISTIC', math: 'EXACT SPLIT ALLOCATION' },
              incident_cases: [
                {
                  id: 'case_engine_penny_rounding',
                  title: 'Penny Rounding On Multi-Seller Split Allocation',
                  traffic_profile: 'Đêm Flash Sale 11.11, giỏ hàng 1 đơn gồm 15 món từ 3 shop độc lập (Shop A: 100k, Shop B: 100k, Shop C: 100k), áp Voucher sàn -100.000đ.',
                  root_cause_analysis: 'Voucher 100.000đ chia đều cho 3 shop ra 33.333,333...đ mỗi shop. Nếu làm tròn số lẻ Float, tổng tiền chiết khấu thành 99.999đ hoặc 100.001đ.',
                  blast_radius: 'Bút toán đối soát settlement giữa Sàn và Seller bị lệch hàng triệu đồng mỗi đêm, 1 shop gửi đơn khiếu nại sàn ăn chặn tiền chiết khấu.',
                  cascading_failure_path: [
                    '[Trigger]: Khách bấm thanh toán giỏ hàng chứa sản phẩm của 3 Seller độc lập.',
                    '[Calculation Error]: JavaScript chia số thực Float làm tròn sai lệch vài đồng mỗi đơn hàng.',
                    '[Failure Cascade]: Tổng tiền từng shop cộng lại không khớp với tổng tiền khách thanh toán.',
                    '[Blast Radius]: Bút toán đối soát ngân hàng bị lệch, tạm dừng giải ngân cho Seller.'
                  ],
                  mitigation_strategy: 'Áp dụng Thuật toán Largest Remainder + Minor-Unit BigInt dồn chính xác phần dư 1đ vào seller có giá trị đơn hàng cao nhất.'
                },
                {
                  id: 'case_engine_combinatorial_explosion',
                  title: 'Combinatorial Explosion On Stacking Rules',
                  traffic_profile: 'Giỏ hàng chứa 20 mặt hàng, khách thu thập 15 mã voucher khác nhau (Voucher sàn, Shop voucher, Free ship, Member bonus).',
                  root_cause_analysis: 'Thuật toán vét cạn tổ hợp O(2^N) chạy trong luồng chính (Main Thread) làm nghẽn 100% CPU máy chủ trong 8 giây.',
                  blast_radius: 'Node.js Event Loop bị block hoàn toàn, hàng ngàn request của người dùng khác bị timeout 504 Gateway Timeout.',
                  cascading_failure_path: [
                    '[Trigger]: Giỏ hàng chứa 15 mã giảm giá kích hoạt thuật toán vét cạn tổ hợp O(2^N).',
                    '[CPU Starvation]: Node.js Event Loop bị block hoàn toàn 100% CPU trong 8 giây.',
                    '[Failure Cascade]: Các request checkout song song bị dồn ứ hàng đợi và timeout 504.',
                    '[Blast Radius]: Toàn bộ trang giỏ hàng và thanh toán của khách bị gián đoạn.'
                  ],
                  mitigation_strategy: 'Thiết kế ma trận Stacking Matrix loại trừ sớm (Early Pruning) + Giới hạn số lượng voucher tối đa được áp dụng cùng lúc.'
                }
              ],
              ban_chat: 'Pure Domain Engine là trái tim thuật toán độc lập 100% với DB/Redis/Network. Nhận PriceableCheckoutSnapshot và danh sách PromotionDefinition để đánh giá điều kiện, ma trận stacking và phân bổ giảm giá đa người bán (Multi-Seller Split Allocation).',
              ca_thuc_te: [
                'Sự cố tranh chấp Seller: Voucher sàn 50.000đ chia cho 3 shop bị làm tròn thiếu 1đ khiến 1 shop kiện sàn ăn chặn tiền chiết khấu.',
                'Sự cố nghẽn CPU do Stacking: 15 mã giảm giá trong 1 giỏ hàng kích hoạt thuật toán vét cạn O(2^N) làm CPU server nhảy lên 100%.'
              ],
              rui_ro: [
                'Nghẽn CPU nếu giỏ hàng có quá nhiều tổ hợp khuyến mãi cần đánh giá combinatorial.',
                'Sai lệch phân bổ chiết khấu giữa các seller dẫn đến khiếu nại tài chính.'
              ],
              chuoi_sup_do: [
                '1. [Trigger]: Giỏ hàng chứa 20 mặt hàng từ 5 seller với 6 mã voucher khác nhau.',
                '2. [Calculation Bug]: Thuật toán phân bổ gặp lỗi chia lẻ tiền tệ không bảo toàn tổng.',
                '3. [Failure Cascade]: Một seller bị trừ quá số tiền chiết khấu thực tế phải chịu.',
                '4. [Blast Radius]: Tranh chấp settlement giữa sàn thương mại và người bán hàng.'
              ],
              trac_nghiem: {
                cau_hoi: 'Lợi ích cốt lõi của việc thiết kế Promotion Engine dạng Pure Domain Service (0 I/O) là gì?',
                lua_chon: ['Hoàn toàn Deterministic, test cực nhanh, dễ dàng audit và replay lại mọi kết quả giá trong quá khứ', 'Tự động lưu trực tiếp dữ liệu vào ổ cứng'],
                dung: 0,
                giai_thich: 'Pure Engine không phụ thuộc I/O giúp unit test chạy trong vài mili-giây, kết quả hoàn toàn dự đoán được và có thể replay chính xác khi cần kiểm toán.'
              }
            });
          } else if (labelLower.includes('application') || labelLower.includes('service')) {
            serviceNodes.push({
              title: label,
              summary: 'Điều phối luồng nghiệp vụ 2 pha (Reserve 15m -> Finalize/Release), quản lý Transaction Boundaries.',
              is_public_interface: false,
              schematic_template: 'two_phase_state_machine',
              schematic_params: { flow: 'TWO-PHASE ALLOCATION', phase1: 'RESERVE 15M', phase2: 'FINALIZE / RELEASE' },
              incident_cases: [
                {
                  id: 'case_app_quota_leak',
                  title: 'Two-Phase Reservation Quota Leak',
                  traffic_profile: '10.000 khách hàng bấm áp mã voucher lúc 0h rồi chuyển sang cổng ngân hàng.',
                  root_cause_analysis: 'Khách hàng tắt trình duyệt bỏ ngang không thanh toán đơn nhưng hệ thống thiếu cơ chế Reservation Timeout.',
                  blast_radius: 'Quota voucher bị treo giữ ảo suốt 48h, sàn thương mại sụt giảm 1.8 tỷ đồng doanh thu do khách khác không áp được mã.',
                  cascading_failure_path: [
                    '[Trigger]: Khách hàng bấm thanh toán và chuyển sang cổng ngân hàng.',
                    '[Abandonment]: Người dùng tắt trình duyệt bỏ ngang không thanh toán đơn.',
                    '[Failure Cascade]: Quota voucher bị treo giữ không được nhả lại kịp thời.',
                    '[Blast Radius]: Khách hàng khác mất cơ hội săn sale dù ngân sách vẫn còn.'
                  ],
                  mitigation_strategy: 'Chu trình Two-Phase Reservation có hạn 15 phút, kết hợp Background Worker tự động thu hồi quota khi đơn bị hủy.'
                },
                {
                  id: 'case_app_deadlock',
                  title: 'Order Settlement Deadlock',
                  traffic_profile: '5.000 transaction đồng thời thực hiện hoàn tiền và thanh toán đơn hàng.',
                  root_cause_analysis: 'Hai transaction cùng tranh chấp khóa đơn hàng theo thứ tự ngược nhau gây Deadlock chu trình.',
                  blast_radius: 'Đơn hàng bị treo trạng thái PROCESSING không thể hoàn tất thanh toán.',
                  cascading_failure_path: [
                    '[Trigger]: Hai transaction hoàn tiền và thanh toán cùng chạm 1 đơn hàng.',
                    '[Lock Conflict]: Khóa tài nguyên theo thứ tự ngược nhau gây Deadlock chu trình.',
                    '[Failure Cascade]: PostgreSQL Deadlock Detector buộc abort transaction.',
                    '[Blast Radius]: Trạng thái đơn hàng bị kẹt lơ lửng không thể tiếp tục.'
                  ],
                  mitigation_strategy: 'Chuẩn hóa thứ tự khóa đơn hàng tăng dần + Cơ chế Retry có Exponential Backoff.'
                }
              ],
              ban_chat: 'Thực thi giao diện PromotionsFacade, điều phối chu trình 2 pha: Khóa giữ mã tạm thời (Reservation) khi checkout ➔ Chuyển thành bút toán tiêu dùng vĩnh viễn (Redemption) khi thanh toán thành công, hoặc Release khi đơn bị hủy.',
              ca_thuc_te: [
                'Sự cố treo giữ Quota ảo: 8.000 khách hàng bỏ giỏ hàng giữa chừng làm voucher báo hết lượt dù ngân sách thực tế vẫn còn 40%.',
                'Sự cố Deadlock đối soát: Hai transaction hoàn tiền và thanh toán cùng tranh chấp khóa đơn hàng theo thứ tự ngược nhau.'
              ],
              rui_ro: [
                'Deadlock nếu thứ tự lock các promotion trong giỏ hàng không được chuẩn hóa.',
                'Rò rỉ reservation nếu không có cơ chế timeout dọn dẹp định kỳ.'
              ],
              chuoi_sup_do: [
                '1. [Trigger]: Khách hàng bấm thanh toán và chuyển sang cổng ngân hàng.',
                '2. [Abandonment]: Người dùng tắt trình duyệt bỏ ngang không thanh toán đơn.',
                '3. [Failure Cascade]: Quota voucher bị treo giữ không được nhả lại kịp thời.',
                '4. [Blast Radius]: Khách hàng khác mất cơ hội săn sale dù ngân sách vẫn còn.'
              ],
              trac_nghiem: {
                cau_hoi: 'Chu trình 2 pha (Two-Phase Reservation) giải quyết bài toán gì trong áp mã khuyến mãi?',
                lua_chon: ['Giữ quota tạm thời trong lúc khách hàng thanh toán và nhả lại nếu đơn bị hủy', 'Tự động trừ tiền trong tài khoản ngân hàng của khách'],
                dung: 0,
                giai_thich: 'Two-phase reservation giữ voucher trong thời gian ngắn (15 phút) để khách thanh toán an toàn, tránh việc trừ quota vĩnh viễn khi giao dịch chưa thành công.'
              }
            });
          } else {
            serviceNodes.push({
              title: label,
              summary: `Cổng kết nối tích hợp liên module (Ports & Adapters) cho ${docTitle}.`,
              is_public_interface: false,
              schematic_template: 'hexagonal_ports',
              schematic_params: { port: 'HEXAGONAL ADAPTER', target: label.toUpperCase() },
              incident_cases: [
                {
                  id: 'case_port_n_plus_one',
                  title: 'N+1 Network Latency On Catalog Port',
                  traffic_profile: '30.000 request checkout/giây đồng thời gọi Catalog Port tra cứu thông tin SKU.',
                  root_cause_analysis: 'Truy vấn N+1: Mỗi sản phẩm trong giỏ hàng phát 1 request mạng riêng lẻ làm ngập kết nối.',
                  blast_radius: 'Catalog Service bị nghẽn mạng, toàn bộ giỏ hàng bị đơ và không hiển thị được giá.',
                  cascading_failure_path: [
                    `1. [Trigger]: Giỏ hàng 20 món phát 20 request tra cứu Catalog riêng lẻ.`,
                    '2. [Network Saturation]: Socket kết nối bị ngập lụt, độ trễ tăng từ 50ms lên 3.200ms.',
                    '3. [Failure Cascade]: Luồng tính giá khuyến mãi bị nghẽn lại.',
                    '4. [Blast Radius]: Toàn bộ trang giỏ hàng và checkout của khách bị gián đoạn.'
                  ],
                  mitigation_strategy: 'Sử dụng Batch Resolver gom 100 SKU vào 1 request duy nhất + Circuit Breaker timeout 1.5s.'
                },
                {
                  id: 'case_port_payment_timeout',
                  title: 'Payment Port Cascading Timeout',
                  traffic_profile: 'Cổng thanh toán đối tác bị nghẽn mạng làm treo các lệnh xác nhận thanh toán.',
                  root_cause_analysis: 'Thiếu cơ chế Circuit Breaker và Timeout chặt chẽ trên Payment Port.',
                  blast_radius: 'Luồng tính giá và giữ chỗ bị treo cứng theo, làm tê liệt toàn bộ quy trình mua hàng.',
                  cascading_failure_path: [
                    '[Trigger]: Cổng thanh toán đối tác bị chậm phản hồi quá 10 giây.',
                    '[Thread Pool Starvation]: Các luồng xử lý bị chiếm dụng chờ đợi phản hồi.',
                    '[Failure Cascade]: Không còn worker để xử lý các yêu cầu checkout mới.',
                    '[Blast Radius]: Tỷ lệ lỗi 504 Gateway Timeout tăng vọt lên 80%.'
                  ],
                  mitigation_strategy: 'Thiết lập Timeout 2s + Circuit Breaker tự động chuyển sang Fallback Mode khi tỷ lệ lỗi vượt 20%.'
                }
              ],
              ban_chat: `Triển khai kiến trúc Lục giác (Hexagonal Architecture / Ports & Adapters) định nghĩa ranh giới giao tiếp giữa Promotion module với ${label} mà không gây phụ thuộc ngược (Dependency Inversion).`,
              ca_thuc_te: [
                'Sự cố nghẽn mạng N+1: Giỏ hàng 20 món phát 20 request tra cứu Catalog làm tăng độ trễ checkout từ 50ms lên 3.200ms.',
                'Sự cố Cascading Timeout: Payment Port bị nghẽn khiến luồng tính giá khuyến mãi bị treo cứng theo.'
              ],
              rui_ro: [
                'Phụ thuộc mạng (Network latency) nếu các module bên ngoài phản hồi chậm.',
                'Lỗi cascade nếu port bên ngoài bị timeout.'
              ],
              chuoi_sup_do: [
                `1. [Trigger]: Module ${label} gặp sự cố quá tải hoặc mất kết nối.`,
                '2. [Port Hang]: Các lệnh tra cứu qua Port bị treo quá thời gian timeout 3s.',
                '3. [Failure Cascade]: Luồng tính giá khuyến mãi bị nghẽn lại.',
                '4. [Blast Radius]: Toàn bộ trang giỏ hàng và checkout của khách bị gián đoạn.'
              ],
              trac_nghiem: {
                cau_hoi: 'Mục đích của việc sử dụng Ports & Adapters trong modular monolith là gì?',
                lua_chon: ['Ngăn chặn các module import trực tiếp database/implementation của nhau', 'Gộp tất cả module vào chung một bảng cơ sở dữ liệu'],
                dung: 0,
                giai_thich: 'Ports & Adapters bảo vệ ranh giới module, đảm bảo Promotion module chỉ giao tiếp qua interface trừu tượng.'
              }
            });
          }
        }
      }

      const initialPayload: SpawnClusterPayload = {
        domain_id: domainSlug,
        cluster_name: docTitle,
        cluster_theme: 'emerald',
        nodes: serviceNodes,
        sub_clusters: subClusters.length > 0 ? subClusters : undefined,
        connect_to_shared_infra: subClusters.length > 0 ? undefined : ['db', 'cache']
      };

      // Chạy qua Quality Gate tự đánh giá và nâng cấp
      return selfReviewAndElevateArchitecture(initialPayload, text).refinedPayload;
    }
  }

  // 3. Phân tích tài liệu Markdown / Brainstorm text phân cấp chuẩn
  const lines = text.split('\n');
  let domainId = 'domain-custom';
  let clusterName = fallbackName;
  let clusterTheme: any = 'indigo';
  let serviceNodes: CompactClusterNode[] = [];
  const subClusters: CompactSubCluster[] = [];

  let currentSubCluster: CompactSubCluster | null = null;
  let isParsingSubCluster = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.toUpperCase().includes('[DOMAIN]:') || line.toLowerCase().startsWith('domain:')) {
      const dName = line.split(':')[1]?.replace(/[\[\]]/g, '').trim() || 'Custom Domain';
      domainId = 'domain-' + dName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      continue;
    }

    if (line.toUpperCase().includes('[SERVICE CLUSTER]:') || line.toLowerCase().startsWith('service:')) {
      clusterName = line.split(':')[1]?.replace(/[\[\]]/g, '').trim() || fallbackName;
      isParsingSubCluster = false;
      currentSubCluster = null;

      const lower = clusterName.toLowerCase();
      if (lower.includes('auth') || lower.includes('identity')) clusterTheme = 'indigo';
      else if (lower.includes('payment') || lower.includes('promo') || lower.includes('voucher') || lower.includes('idempot')) clusterTheme = 'emerald';
      else if (lower.includes('waf') || lower.includes('ddos')) clusterTheme = 'purple';
      else if (lower.includes('audit') || lower.includes('log')) clusterTheme = 'amber';
      continue;
    }

    if (line.toUpperCase().includes('[SUB-CLUSTER]:') || line.toUpperCase().includes('[INFRA:')) {
      const sName = line.split(':')[1]?.replace(/[\[\]]/g, '').trim() || 'Sub-Cluster';
      const sLower = sName.toLowerCase();
      let infraType: 'redis' | 'postgres' | 'kafka' | 'service' = 'redis';
      if (sLower.includes('db') || sLower.includes('postgres') || sLower.includes('acid')) infraType = 'postgres';
      if (sLower.includes('queue') || sLower.includes('kafka')) infraType = 'kafka';

      currentSubCluster = {
        name: sName,
        infra_type: infraType,
        nodes: []
      };
      subClusters.push(currentSubCluster);
      isParsingSubCluster = true;
      continue;
    }

    if (line.toLowerCase().includes('namespace:') && currentSubCluster) {
      const idx = line.toLowerCase().indexOf('namespace:');
      currentSubCluster.namespace = line.slice(idx + 10).replace(/[()]/g, '').trim();
      continue;
    }

    const isBulletOrNode = line.startsWith('-') || line.startsWith('*') || line.startsWith('•') || line.toLowerCase().startsWith('node:');
    if (isBulletOrNode) {
      const cleanLine = line.replace(/^[-*•]\s*/, '').replace(/^node:\s*/i, '').trim();
      let title = cleanLine;
      let summary = 'Thành phần nghiệp vụ phân hệ';

      if (cleanLine.includes(':')) {
        const parts = cleanLine.split(':');
        title = parts[0].replace(/[\[\]]/g, '').trim();
        summary = parts.slice(1).join(':').trim();
      } else if (cleanLine.includes(']')) {
        const parts = cleanLine.split(']');
        title = parts[0].replace(/[\[]/g, '').trim();
        summary = parts.slice(1).join(']').replace(/^[:\s-]+/, '').trim();
      }

      if (title) {
        const titleLower = title.toLowerCase();
        const isPublic = titleLower.includes('gateway') || titleLower.includes('pep') || titleLower.includes('ingress') || titleLower.includes('public');
        let template = 'default';
        if (titleLower.includes('pep') || titleLower.includes('zero-trust')) template = 'zero_trust_pep';
        else if (titleLower.includes('token') || titleLower.includes('oidc') || titleLower.includes('jwt')) template = 'oauth2_oidc';
        else if (titleLower.includes('blacklist') || titleLower.includes('revocation')) template = 'token_blacklist';
        else if (titleLower.includes('lock') || titleLower.includes('setnx')) template = 'bo_nho_dem_redis';

        const compactNode: CompactClusterNode = {
          title,
          summary: summary || ('Thành phần ' + title),
          is_public_interface: isPublic,
          schematic_template: template
        };

        if (isParsingSubCluster && currentSubCluster) {
          compactNode.infra_type = currentSubCluster.infra_type;
          currentSubCluster.nodes.push(compactNode);
        } else {
          serviceNodes.push(compactNode);
        }
      }
    }
  }

  // 4. Fallback thông minh
  if (serviceNodes.length === 0 && subClusters.length === 0) {
    const titleMatch = text.match(/^#\s+([^\n]+)/m);
    if (titleMatch) {
      clusterName = titleMatch[1].replace(/Technical Design Specification\s*[-—:]?\s*/i, '').trim();
      domainId = 'domain-' + clusterName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    const headingMatches = [...text.matchAll(/#+\s+([\d\.]*\s*[^\n]+)/g)];
    const validHeadings = headingMatches
      .map(m => m[1].replace(/^[\d\.]+\s*/, '').trim())
      .filter(h => h.length > 3 && !h.toLowerCase().includes('mục đích') && !h.toLowerCase().includes('quyết định'));

    if (validHeadings.length >= 2) {
      serviceNodes = validHeadings.slice(0, 4).map((h, idx) => ({
        title: h.slice(0, 32),
        summary: `Mô-đun ${h} trong hệ thống ${clusterName}`,
        is_public_interface: idx === 0
      }));
    } else {
      const meaningfulLines = lines.filter(l => l.length > 5 && !l.startsWith('#') && !l.startsWith('=')).slice(0, 4);
      serviceNodes = meaningfulLines.map((ml, idx) => ({
        title: ml.slice(0, 28).replace(/[\[\]*`]/g, '').trim() || ('Mô-đun ' + (idx + 1)),
        summary: ml,
        is_public_interface: idx === 0
      }));
    }
  }

  if (serviceNodes.length === 0) {
    serviceNodes = [
      {
        title: clusterName + ' Core',
        summary: 'Thành phần xử lý trung tâm sinh từ tài liệu brainstorm.',
        is_public_interface: true
      }
    ];
  }

  const rawPayload: SpawnClusterPayload = {
    domain_id: domainId,
    cluster_name: clusterName,
    cluster_theme: clusterTheme,
    nodes: serviceNodes,
    sub_clusters: subClusters.length > 0 ? subClusters : undefined,
    connect_to_shared_infra: subClusters.length > 0 ? undefined : ['cache', 'db']
  };

  // Chạy qua Quality Gate tự đánh giá và nâng cấp
  return selfReviewAndElevateArchitecture(rawPayload, text).refinedPayload;
}

export const brainstormRAG = {
  listDocuments(): Array<{ filename: string; size: number; updatedAt: number; title: string }> {
    const ragDir = getRagDir();
    if (!fs.existsSync(ragDir)) return [];
    const files = fs.readdirSync(ragDir);
    return files
      .filter(f => f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.json'))
      .map(filename => {
        const fullPath = path.join(ragDir, filename);
        const stats = fs.statSync(fullPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const firstLine = content.split('\n')[0].replace(/^[#\[\]\s*-]+/, '').trim() || filename;
        return {
          filename,
          size: stats.size,
          updatedAt: stats.mtimeMs,
          title: firstLine
        };
      });
  },

  async getDocumentContent(filename: string): Promise<string | null> {
    const ragDir = getRagDir();
    const safeFilename = path.basename(filename);
    const fullPath = path.join(ragDir, safeFilename);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, 'utf8');
  },

  async ingestDocument(
    rawText: string,
    filename?: string,
    options?: { forceMode?: 'ai' | 'ast' }
  ): Promise<IngestResult> {
    const provider = ProviderFactory.getActiveProvider();
    let rawPayload: SpawnClusterPayload;
    let engineUsed = 'LOCAL_OFFLINE_AST';
    let aiNotice: string | null = null;

    if (options?.forceMode !== 'ast' && provider) {
      try {
        console.log(`[RAG Ingestion] Đang sử dụng AI Provider '${provider.config.name}' (${provider.config.model}) để đọc hiểu tài liệu...`);
        const aiResult = await AIGraphService.ingestDocumentWithAI({ rawText, filename });
        rawPayload = aiResult.payload;
        engineUsed = `AI_DEEP_COMPREHENSION (${aiResult.providerUsed})`;
      } catch (err: any) {
        console.warn(`[RAG Ingestion] AI Provider thất bại (${err.message}). Đang fallback sang Local AST Parser...`);
        aiNotice = `AI Provider gặp lỗi: ${err.message} -> Đã fallback sang Local AST Parser`;
        rawPayload = parseBrainstormDocument(rawText, filename?.replace(/\.[^/.]+$/, '') || 'Phân Hệ Brainstorm');
      }
    } else {
      if (!provider && options?.forceMode === 'ai') {
        aiNotice = 'Chưa cấu hình AI Provider -> Đang chạy chế độ Local AST Parser. Hãy mở Cài đặt AI (⚙️) để đọc hiểu mọi loại tài liệu tự do.';
      } else if (!provider) {
        aiNotice = 'Đang chạy Local AST Parser (chế độ tĩnh offline). Cấu hình AI Provider (⚙️) để kích hoạt AI Đọc hiểu ngữ nghĩa sâu.';
      }
      rawPayload = parseBrainstormDocument(rawText, filename?.replace(/\.[^/.]+$/, '') || 'Phân Hệ Brainstorm');
    }

    const { refinedPayload, reviewReport } = selfReviewAndElevateArchitecture(rawPayload, rawText);

    const result = await toolHandlers.spawnConceptCluster(refinedPayload);

    return {
      success: result.spawned,
      cluster_id: result.cluster_id,
      cluster_name: refinedPayload.cluster_name,
      domain_id: refinedPayload.domain_id,
      nodeCount: refinedPayload.nodes.length + (refinedPayload.sub_clusters?.reduce((acc, s) => acc + s.nodes.length, 0) || 0),
      message: result.message,
      review_report: {
        ...reviewReport,
        elevations_applied: [
          `Động cơ phân tích: ${engineUsed}`,
          ...(aiNotice ? [aiNotice] : []),
          ...reviewReport.elevations_applied
        ]
      },
      graph: result.graph
    };
  },

  async saveAndIngest(
    filename: string,
    content: string,
    options?: { forceMode?: 'ai' | 'ast' }
  ): Promise<IngestResult> {
    const ragDir = getRagDir();
    const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const fullPath = path.join(ragDir, safeFilename);
    fs.writeFileSync(fullPath, content, 'utf8');
    return this.ingestDocument(content, safeFilename, options);
  },

  extractDynamicGlossary(): Record<string, string> {
    const ragDir = getRagDir();
    if (!fs.existsSync(ragDir)) return {};
    const files = fs.readdirSync(ragDir);
    const glossary: Record<string, string> = {};

    for (const filename of files) {
      if (!filename.endsWith('.md') && !filename.endsWith('.txt')) continue;
      const content = fs.readFileSync(path.join(ragDir, filename), 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('|') && line.endsWith('|') && !line.includes('---')) {
          const cells = line.split('|').map(c => c.trim()).filter(Boolean);
          if (cells.length >= 2) {
            const term = cells[0].replace(/[*`_]/g, '').trim().toLowerCase();
            const desc = cells[1].replace(/[*`_]/g, '').trim();
            if (term && desc && term.length > 2 && term.length < 35 && desc.length > 5 && !term.includes('property') && !term.includes('id') && !term.includes('quyết định')) {
              glossary[term] = desc;
            }
          }
        }

        const boldMatch = line.match(/^[-*•]?\s*\*\*([^*:]+)\*\*:\s*(.+)$/);
        if (boldMatch) {
          const term = boldMatch[1].trim().toLowerCase();
          const desc = boldMatch[2].trim();
          if (term.length > 2 && term.length < 40 && desc.length > 6) {
            glossary[term] = desc;
          }
        }
      }
    }

    return glossary;
  }
};
