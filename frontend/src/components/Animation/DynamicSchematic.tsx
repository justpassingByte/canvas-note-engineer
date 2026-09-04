import React from 'react';
import { AnimationParams } from '../../types/graphTypes.js';

interface DynamicSchematicProps {
  params: AnimationParams;
}

export const DynamicSchematic: React.FC<DynamicSchematicProps> = ({ params }) => {
  const p = params.tham_so || {};

  switch (params.mau) {
    case 'chan_loc_khien':
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Actor Trái */}
          <rect x="20" y="32" width="75" height="58" rx="4" fill="#F3F4F6" stroke="#1A1D24" strokeWidth="1.8" />
          <text x="32" y="56" fontFamily="'JetBrains Mono', monospace" fontSize="9.5" fontWeight="800">{p.nguon || 'CLIENT'}</text>
          <text x="28" y="72" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fill="#6B7280">{p.chu_nguon || 'Gửi lệnh'}</text>

          {/* Luồng 1 (Hợp lệ qua khiên) */}
          <path d="M 95 48 L 220 48" stroke="#059669" strokeWidth="1.8" strokeDasharray="4 4" />
          <rect x="95" y="40" width="52" height="16" rx="3" fill="#059669">
            <animate attributeName="x" values="95;220;220" keyTimes="0;0.5;1" dur="4s" repeatCount="indefinite" />
          </rect>
          <text x="100" y="52" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#FFF" fontWeight="800">
            {p.goi_1 || 'GÓI 1'}
            <animate attributeName="x" values="100;225;225" keyTimes="0;0.5;1" dur="4s" repeatCount="indefinite" />
          </text>

          {/* Luồng 2 (Trùng lặp bị dội ngược) */}
          <path d="M 95 78 L 220 78" stroke="#DC2626" strokeWidth="1.8" strokeDasharray="4 4" />
          <rect x="95" y="70" width="52" height="16" rx="3" fill="#DC2626">
            <animate attributeName="x" values="95;220;140;140" keyTimes="0;0.5;0.75;1" dur="4s" repeatCount="indefinite" />
          </rect>
          <text x="100" y="82" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#FFF" fontWeight="800">
            {p.goi_2 || 'GÓI 2'}
            <animate attributeName="x" values="100;225;145;145" keyTimes="0;0.5;0.75;1" dur="4s" repeatCount="indefinite" />
          </text>

          {/* Khiên Chắn ở giữa */}
          <path d="M 230 28 L 290 28 L 290 75 Q 260 105 230 75 Z" fill="#D1FAE5" stroke="#059669" strokeWidth="2" />
          <text x="242" y="54" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800" fill="#065F46">{p.vat_can || 'KHIÊN'}</text>
          <text x="238" y="68" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="700" fill="#047857">{p.chu_vat_can || 'LOCK'}</text>

          {/* Actor Đích Phải */}
          <path d="M 290 52 L 350 52" stroke="#2563EB" strokeWidth="2" markerEnd="url(#mui-ten-den)" />
          <rect x="350" y="32" width="80" height="58" rx="4" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.8" />
          <text x="360" y="56" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800" fill="#1E40AF">{p.dich || 'DATABASE'}</text>
          <text x="356" y="72" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#059669" fontWeight="800">{p.ket_qua || 'GHI 1 LẦN'}</text>
        </svg>
      );

    case 'va_cham_song_song':
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          <rect x="20" y="18" width="80" height="34" rx="4" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
          <text x="28" y="39" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800" fill="#92400E">{p.luong_1 || 'LUỒNG A'}</text>

          <rect x="20" y="72" width="80" height="34" rx="4" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
          <text x="28" y="93" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800" fill="#92400E">{p.luong_2 || 'LUỒNG B'}</text>

          <path d="M 100 35 L 220 54" stroke="#D97706" strokeWidth="1.8" strokeDasharray="4 4" />
          <path d="M 100 89 L 220 70" stroke="#D97706" strokeWidth="1.8" strokeDasharray="4 4" />

          <circle r="6" fill="#D97706">
            <animateMotion path="M 100 35 L 220 54" dur="4.5s" repeatCount="indefinite" />
          </circle>
          <circle r="6" fill="#DC2626">
            <animateMotion path="M 100 89 L 220 70" dur="4.5s" repeatCount="indefinite" />
          </circle>

          {/* Vùng va chạm */}
          <circle cx="225" cy="62" r="28" fill="#FEE2E2" stroke="#DC2626" strokeWidth="2" strokeDasharray="3 3" />
          <text x="202" y="60" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#DC2626">VA CHẠM</text>
          <text x="206" y="72" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#991B1B">SỐ DƯ 10TR</text>

          <path d="M 255 62 L 340 62" stroke="#DC2626" strokeWidth="2" markerEnd="url(#mui-ten-den)" />
          <rect x="340" y="35" width="90" height="54" rx="4" fill="#FEF2F2" stroke="#DC2626" strokeWidth="1.8" />
          <text x="348" y="56" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fontWeight="800" fill="#DC2626">RÚT 16 TRIỆU</text>
          <text x="348" y="72" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#7F1D1D">ÂM -6 TRIỆU!</text>
        </svg>
      );

    case 'luu_tru_acid':
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          <rect x="25" y="35" width="85" height="55" rx="4" fill="#F3F4F6" stroke="#1A1D24" strokeWidth="1.8" />
          <text x="35" y="58" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800">{p.lenh || 'TX WRITE'}</text>
          <text x="32" y="74" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#6B7280">{p.chu_lenh || 'Ghi dữ liệu'}</text>

          <path d="M 110 62 L 230 62" stroke="#2563EB" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="110" cy="62" r="6" fill="#2563EB">
            <animate attributeName="cx" values="110;230" dur="3s" repeatCount="indefinite" />
          </circle>

          {/* Database Disk Pod */}
          <rect x="230" y="25" width="180" height="75" rx="6" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
          <text x="245" y="48" fontFamily="'JetBrains Mono', monospace" fontSize="10" fontWeight="900" fill="#1E40AF">B-TREE UNIQUE INDEX</text>
          <rect x="245" y="58" width="150" height="24" rx="3" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.2" />
          <text x="255" y="74" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fontWeight="800" fill="#1E40AF">ATOMIC COMMIT: 1 LẦN</text>
        </svg>
      );

    case 'hang_doi_dieu_tiet':
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          <rect x="15" y="32" width="75" height="58" rx="4" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.8" />
          <text x="22" y="55" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800" fill="#0369A1">{p.dau_vao || 'PRODUCER'}</text>
          <text x="24" y="71" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#DC2626" fontWeight="700">{p.tai_cao || '10k req/s'}</text>

          {/* Băng chuyền Queue */}
          <rect x="135" y="38" width="170" height="46" rx="6" fill="#F0F9FF" stroke="#0284C7" strokeWidth="2" />
          <text x="175" y="56" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800" fill="#0369A1">{p.vung_dem || 'QUEUE BUFFER'}</text>
          
          <rect x="145" y="64" width="20" height="12" rx="2" fill="#0284C7">
            <animate attributeName="x" values="145;275" dur="3s" repeatCount="indefinite" />
          </rect>
          <rect x="185" y="64" width="20" height="12" rx="2" fill="#0284C7">
            <animate attributeName="x" values="185;275;145" dur="3s" repeatCount="indefinite" />
          </rect>

          {/* Thợ Worker */}
          <rect x="350" y="32" width="80" height="58" rx="4" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          <text x="368" y="55" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800" fill="#065F46">{p.tho || 'WORKER'}</text>
          <text x="360" y="71" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#059669" fontWeight="800">{p.dieu_tiet || '100 req/s'}</text>
        </svg>
      );

    case 'doc_cache_nhanh':
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          <rect x="20" y="38" width="75" height="48" rx="4" fill="#F3F4F6" stroke="#1A1D24" strokeWidth="1.8" />
          <text x="32" y="66" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800">{p.yeu_cau || 'REQUEST'}</text>

          {/* Redis RAM */}
          <rect x="170" y="20" width="130" height="42" rx="5" fill="#FFEDD5" stroke="#EA580C" strokeWidth="2" />
          <text x="182" y="42" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="900" fill="#C2410C">{p.cache || 'REDIS CACHE'}</text>
          <text x="185" y="54" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#059669">{p.toc_do || 'RAM: 1ms'}</text>

          <path d="M 95 55 L 170 41" stroke="#EA580C" strokeWidth="2" strokeDasharray="3 3" />

          {/* DB Disk Bị Bỏ Qua */}
          <rect x="170" y="72" width="130" height="40" rx="5" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="195" y="94" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fill="#9CA3AF">{p.dia_cung || 'DB DISK'}</text>
          <text x="188" y="104" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6B7280">{p.trang_thai_db || 'Bỏ qua đĩa'}</text>
        </svg>
      );

    case 'zero_trust_pep':
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Client mTLS */}
          <rect x="15" y="32" width="80" height="58" rx="4" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="1.8" />
          <text x="24" y="55" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800" fill="#3730A3">{p.client || 'CLIENT mTLS'}</text>
          <text x="22" y="71" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#6366F1" fontWeight="700">mTLS Cert: OK</text>

          {/* Đường truyền Token */}
          <path d="M 95 61 L 180 61" stroke="#4F46E5" strokeWidth="2" strokeDasharray="4 4" />
          <circle r="5" fill="#4F46E5">
            <animateMotion path="M 95 61 L 180 61" dur="2.8s" repeatCount="indefinite" />
          </circle>

          {/* PEP Gateway Shield */}
          <path d="M 180 25 L 260 25 L 260 78 Q 220 108 180 78 Z" fill="#E0E7FF" stroke="#4338CA" strokeWidth="2" />
          <text x="195" y="52" fontFamily="'JetBrains Mono', monospace" fontSize="9.5" fontWeight="900" fill="#312E81">{p.gateway || 'PEP GATEWAY'}</text>
          <text x="192" y="68" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#059669">{p.status || 'JWT VERIFIED'}</text>

          {/* Đường sang PDP Policy Decision */}
          <path d="M 260 61 L 345 61" stroke="#059669" strokeWidth="2" markerEnd="url(#mui-ten-den)" />
          <circle r="5" fill="#059669">
            <animateMotion path="M 260 61 L 345 61" dur="2.8s" begin="1.4s" repeatCount="indefinite" />
          </circle>

          {/* PDP Auth / Keystore */}
          <rect x="345" y="32" width="90" height="58" rx="4" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          <text x="355" y="55" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800" fill="#065F46">{p.auth_server || 'PDP ENGINE'}</text>
          <text x="352" y="71" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#047857" fontWeight="800">{p.token || 'RBAC GRANTED'}</text>
        </svg>
      );

    case 'rate_limit_sliding':
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Client Requests Flood */}
          <rect x="15" y="25" width="80" height="70" rx="4" fill="#FEF2F2" stroke="#DC2626" strokeWidth="1.8" />
          <text x="24" y="50" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800" fill="#991B1B">{p.client || 'FLOOD TRAFFIC'}</text>
          <text x="22" y="68" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#DC2626" fontWeight="800">50.000 req/s</text>

          {/* Packet Hợp Lệ (Xanh) */}
          <path d="M 95 45 L 200 45" stroke="#059669" strokeWidth="1.8" strokeDasharray="3 3" />
          <rect x="95" y="38" width="45" height="14" rx="2" fill="#059669">
            <animate attributeName="x" values="95;200;200" keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite" />
          </rect>
          <text x="100" y="49" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#FFF" fontWeight="800">
            {p.pass || 'REQ OK'}
            <animate attributeName="x" values="100;205;205" keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite" />
          </text>

          {/* Packet Spam Bị Drop (Đỏ) */}
          <path d="M 95 75 L 200 75" stroke="#DC2626" strokeWidth="1.8" strokeDasharray="3 3" />
          <rect x="95" y="68" width="45" height="14" rx="2" fill="#DC2626">
            <animate attributeName="x" values="95;200;140;140" keyTimes="0;0.5;0.75;1" dur="3s" repeatCount="indefinite" />
          </rect>
          <text x="100" y="79" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#FFF" fontWeight="800">
            {p.drop || '429 DROP'}
            <animate attributeName="x" values="100;205;145;145" keyTimes="0;0.5;0.75;1" dur="3s" repeatCount="indefinite" />
          </text>

          {/* WAF Sliding Window Box */}
          <rect x="200" y="22" width="115" height="76" rx="6" fill="#F8FAFC" stroke="#4338CA" strokeWidth="2" />
          <text x="210" y="44" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="900" fill="#312E81">{p.waf || 'WAF RATE LIMIT'}</text>
          <rect x="210" y="52" width="95" height="18" rx="3" fill="#EEF2FF" stroke="#6366F1" strokeWidth="1" />
          <text x="216" y="65" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#4338CA">TOKEN BUCKET: 10/s</text>
          <text x="216" y="88" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#6B7280">{p.cache || 'Redis Key: IP:TTL'}</text>

          {/* Đích Nội Bộ */}
          <path d="M 315 45 L 360 45" stroke="#059669" strokeWidth="2" markerEnd="url(#mui-ten-den)" />
          <rect x="360" y="28" width="75" height="64" rx="4" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          <text x="370" y="52" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800" fill="#065F46">INTERNAL</text>
          <text x="368" y="68" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#059669" fontWeight="800">AN TOÀN</text>
        </svg>
      );

    case 'audit_hash_chain':
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Event Ingress */}
          <rect x="15" y="32" width="80" height="58" rx="4" fill="#F3F4F6" stroke="#1A1D24" strokeWidth="1.8" />
          <text x="22" y="55" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800">{p.event || 'TX EVENT'}</text>
          <text x="24" y="71" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#6B7280">Giao dịch mới</text>

          {/* Luồng ký số */}
          <path d="M 95 61 L 175 61" stroke="#059669" strokeWidth="2" strokeDasharray="3 3" />
          <circle r="5" fill="#059669">
            <animateMotion path="M 95 61 L 175 61" dur="2.5s" repeatCount="indefinite" />
          </circle>

          {/* Hasher Box */}
          <rect x="175" y="28" width="115" height="66" rx="6" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          <text x="185" y="50" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="900" fill="#065F46">{p.hash_node || 'SHA-256 HMAC'}</text>
          <rect x="185" y="58" width="95" height="20" rx="3" fill="#D1FAE5" stroke="#10B981" strokeWidth="1" />
          <text x="192" y="72" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#047857">HASH CHAIN LINK</text>

          {/* Chained to Immutable Append-only DB */}
          <path d="M 290 61 L 345 61" stroke="#2563EB" strokeWidth="2" markerEnd="url(#mui-ten-den)" />
          <rect x="345" y="25" width="90" height="72" rx="6" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
          <text x="355" y="48" fontFamily="'JetBrains Mono', monospace" fontSize="9.5" fontWeight="900" fill="#1E40AF">IMMUTABLE</text>
          <rect x="352" y="56" width="76" height="20" rx="3" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1" />
          <text x="358" y="70" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#1E40AF">APPEND-ONLY</text>
          <text x="356" y="88" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6B7280">B-Tree ACID Lock</text>
        </svg>
      );

    default:
      // LƯỢC ĐỒ HOẠT HỌA LAI TỰ THÍCH ỨNG (Adaptive Hybrid Pipeline)
      // Tự động kết xuất pipeline 3 pha với hiệu ứng chuyển động SVG cho bất kỳ Concept AI nào!
      const mainColor = p.mau_chu_dao || '#4F46E5';
      const actorName = p.nguon || p.client || 'TIẾP NHẬN ĐẦU VÀO';
      const engineName = p.quy_trinh || p.gateway || 'BỘ XỬ LÝ KIẾN TRÚC';
      const targetName = p.dich || p.tai_nguyen || 'DỮ LIỆU ĐÍCH / ACID';
      const statusLabel = p.ket_qua || p.status || 'THỰC THI HOÀN TẤT';

      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Khối 1: Ingress / Actor */}
          <rect x="15" y="32" width="85" height="58" rx="5" fill="#F8FAFC" stroke="#1A1D24" strokeWidth="1.8" />
          <text x="22" y="55" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fontWeight="800" fill="#1A1D24">{actorName}</text>
          <text x="24" y="72" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#6B7280">Request Stream</text>

          {/* Đường dẫn truyền hạt 1 */}
          <path d="M 100 61 L 180 61" stroke={mainColor} strokeWidth="2" strokeDasharray="4 4" />
          <circle r="5" fill={mainColor}>
            <animateMotion path="M 100 61 L 180 61" dur="2.6s" repeatCount="indefinite" />
          </circle>

          {/* Khối 2: Central Processing Engine */}
          <rect x="180" y="24" width="130" height="74" rx="6" fill="#F3F4F6" stroke={mainColor} strokeWidth="2.2" />
          <text x="190" y="46" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="900" fill={mainColor}>{engineName}</text>
          <rect x="190" y="54" width="110" height="22" rx="3" fill="#FFFFFF" stroke={mainColor} strokeWidth="1" />
          <text x="198" y="69" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#1A1D24">PIPELINE VERIFIED</text>
          <text x="194" y="90" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6B7280">Tự thích ứng theo Concept</text>

          {/* Đường dẫn truyền hạt 2 */}
          <path d="M 310 61 L 355 61" stroke="#059669" strokeWidth="2" markerEnd="url(#mui-ten-den)" />
          <circle r="5" fill="#059669">
            <animateMotion path="M 310 61 L 355 61" dur="2.6s" begin="1.3s" repeatCount="indefinite" />
          </circle>

          {/* Khối 3: Target Resource */}
          <rect x="355" y="30" width="82" height="62" rx="5" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          <text x="362" y="53" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fontWeight="800" fill="#065F46">{targetName}</text>
          <text x="364" y="70" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#059669" fontWeight="800">{statusLabel}</text>
        </svg>
      );
  }
};
