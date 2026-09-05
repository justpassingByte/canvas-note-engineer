import React from 'react';
import { AnimationParams } from '../../types/graphTypes.js';

interface DynamicSchematicProps {
  params: AnimationParams;
}

/**
 * Hàm hỗ trợ ngắt dòng thông minh trong SVG:
 * Không cắt cụt từ (không dùng slice/truncate), tự động chia 2 dòng cân đối và căn giữa (textAnchor="middle").
 */
function renderSvgMultiLine(
  rawText: string | undefined,
  centerX: number,
  centerY: number,
  color: string,
  fontSize = 8.5,
  fontWeight = 800,
  maxLine1 = 14
) {
  if (!rawText) return null;
  const clean = rawText.trim();
  const words = clean.split(/\s+/);

  let line1 = '';
  let line2 = '';

  for (const w of words) {
    if (!line1 || (line1 + ' ' + w).length <= maxLine1) {
      line1 = (line1 ? line1 + ' ' + w : w);
    } else {
      line2 = (line2 ? line2 + ' ' + w : w);
    }
  }

  if (!line2) {
    return (
      <text
        x={centerX}
        y={centerY}
        textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize={fontSize}
        fontWeight={fontWeight}
        fill={color}
      >
        {line1}
      </text>
    );
  }

  return (
    <text
      x={centerX}
      y={centerY - 5}
      textAnchor="middle"
      fontFamily="'JetBrains Mono', monospace"
      fontSize={fontSize}
      fontWeight={fontWeight}
      fill={color}
    >
      <tspan x={centerX} dy="0">{line1}</tspan>
      <tspan x={centerX} dy="11">{line2}</tspan>
    </text>
  );
}

export const DynamicSchematic: React.FC<DynamicSchematicProps> = ({ params }) => {
  const p = params?.tham_so || {};
  const mau = params?.mau || 'default';

  switch (mau) {
    case 'chan_loc_khien': {
      const actorLabel = p.nguon || p.actor || 'CLIENT';
      const shieldLabel = p.vat_can || p.component || 'KHIÊN LOCK';
      const targetLabel = p.dich || p.target || 'DATABASE';

      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Actor Trái */}
          <rect x="15" y="32" width="85" height="58" rx="4" fill="#F3F4F6" stroke="#1A1D24" strokeWidth="1.8" />
          {renderSvgMultiLine(actorLabel, 57.5, 54, '#1A1D24', 8.5, 800, 11)}
          <text x="57.5" y="78" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#6B7280">{p.chu_nguon || 'Gửi lệnh'}</text>

          {/* Luồng 1 (Hợp lệ qua khiên) */}
          <path d="M 100 48 L 220 48" stroke="#059669" strokeWidth="1.8" strokeDasharray="4 4" />
          <rect x="100" y="40" width="52" height="16" rx="3" fill="#059669">
            <animate attributeName="x" values="100;220;220" keyTimes="0;0.5;1" dur="4s" repeatCount="indefinite" />
          </rect>
          <text x="105" y="52" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#FFF" fontWeight="800">
            {p.goi_1 || 'GÓI 1'}
            <animate attributeName="x" values="105;225;225" keyTimes="0;0.5;1" dur="4s" repeatCount="indefinite" />
          </text>

          {/* Luồng 2 (Trùng lặp bị dội ngược) */}
          <path d="M 100 78 L 220 78" stroke="#DC2626" strokeWidth="1.8" strokeDasharray="4 4" />
          <rect x="100" y="70" width="52" height="16" rx="3" fill="#DC2626">
            <animate attributeName="x" values="100;220;140;140" keyTimes="0;0.5;0.75;1" dur="4s" repeatCount="indefinite" />
          </rect>
          <text x="105" y="82" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#FFF" fontWeight="800">
            {p.goi_2 || 'GÓI 2'}
            <animate attributeName="x" values="105;225;145;145" keyTimes="0;0.5;0.75;1" dur="4s" repeatCount="indefinite" />
          </text>

          {/* Khiên Chắn ở giữa */}
          <path d="M 220 25 L 290 25 L 290 78 Q 255 110 220 78 Z" fill="#D1FAE5" stroke="#059669" strokeWidth="2" />
          {renderSvgMultiLine(shieldLabel, 255, 52, '#065F46', 8.5, 900, 10)}
          <text x="255" y="78" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="700" fill="#047857">{p.chu_vat_can || 'IDEMPOTENT'}</text>

          {/* Actor Đích Phải */}
          <path d="M 290 52 L 345 52" stroke="#2563EB" strokeWidth="2" markerEnd="url(#mui-ten-den)" />
          <rect x="345" y="32" width="90" height="58" rx="4" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.8" />
          {renderSvgMultiLine(targetLabel, 390, 54, '#1E40AF', 8.5, 800, 11)}
          <text x="390" y="78" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#059669" fontWeight="800">{p.ket_qua || 'GHI 1 LẦN'}</text>
        </svg>
      );
    }

    case 'va_cham_song_song': {
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          <rect x="15" y="18" width="85" height="34" rx="4" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
          <text x="57.5" y="39" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800" fill="#92400E">{p.luong_1 || 'LUỒNG A'}</text>

          <rect x="15" y="72" width="85" height="34" rx="4" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
          <text x="57.5" y="93" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800" fill="#92400E">{p.luong_2 || 'LUỒNG B'}</text>

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
          <text x="225" y="60" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#DC2626">VA CHẠM</text>
          <text x="225" y="72" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#991B1B">SỐ DƯ 10TR</text>

          <path d="M 255 62 L 340 62" stroke="#DC2626" strokeWidth="2" markerEnd="url(#mui-ten-den)" />
          <rect x="340" y="35" width="95" height="54" rx="4" fill="#FEF2F2" stroke="#DC2626" strokeWidth="1.8" />
          <text x="387.5" y="56" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fontWeight="800" fill="#DC2626">RÚT 16 TRIỆU</text>
          <text x="387.5" y="72" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#7F1D1D">ÂM -6 TRIỆU!</text>
        </svg>
      );
    }

    case 'luu_tru_acid': {
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          <rect x="15" y="35" width="90" height="55" rx="4" fill="#F3F4F6" stroke="#1A1D24" strokeWidth="1.8" />
          <text x="60" y="58" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800">{p.lenh || 'TX WRITE'}</text>
          <text x="60" y="74" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#6B7280">{p.chu_lenh || 'Ghi dữ liệu'}</text>

          <path d="M 105 62 L 220 62" stroke="#2563EB" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="105" cy="62" r="6" fill="#2563EB">
            <animate attributeName="cx" values="105;220" dur="3s" repeatCount="indefinite" />
          </circle>

          {/* Database Disk Pod */}
          <rect x="220" y="25" width="200" height="75" rx="6" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
          <text x="320" y="48" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9.5" fontWeight="900" fill="#1E40AF">B-TREE UNIQUE INDEX</text>
          <rect x="235" y="58" width="170" height="24" rx="3" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.2" />
          <text x="320" y="74" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fontWeight="800" fill="#1E40AF">ATOMIC COMMIT: 1 LẦN</text>
        </svg>
      );
    }

    case 'hang_doi_dieu_tiet': {
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          <rect x="15" y="32" width="80" height="58" rx="4" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.8" />
          <text x="55" y="55" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800" fill="#0369A1">{p.dau_vao || 'PRODUCER'}</text>
          <text x="55" y="71" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#DC2626" fontWeight="700">{p.tai_cao || '10k req/s'}</text>

          {/* Băng chuyền Queue */}
          <rect x="125" y="38" width="180" height="46" rx="6" fill="#F0F9FF" stroke="#0284C7" strokeWidth="2" />
          <text x="215" y="56" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800" fill="#0369A1">{p.vung_dem || 'QUEUE BUFFER'}</text>
          
          <rect x="135" y="64" width="22" height="12" rx="2" fill="#0284C7">
            <animate attributeName="x" values="135;275" dur="3s" repeatCount="indefinite" />
          </rect>
          <rect x="185" y="64" width="22" height="12" rx="2" fill="#0284C7">
            <animate attributeName="x" values="185;275;135" dur="3s" repeatCount="indefinite" />
          </rect>

          {/* Thợ Worker */}
          <rect x="335" y="32" width="95" height="58" rx="4" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          <text x="382.5" y="55" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="800" fill="#065F46">{p.tho || 'WORKER'}</text>
          <text x="382.5" y="71" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#059669" fontWeight="800">{p.dieu_tiet || '100 req/s'}</text>
        </svg>
      );
    }

    case 'doc_cache_nhanh':
    case 'bo_nho_dem_redis':
    case 'bo_nho_dem_cache':
    case 'redis_cache': {
      const reqLabel = p.yeu_cau || p.actor || 'REQUEST';
      const cacheLabel = p.cache || p.component || 'REDIS RAM CACHE';

      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          <rect x="15" y="38" width="85" height="48" rx="4" fill="#F3F4F6" stroke="#1A1D24" strokeWidth="1.8" />
          {renderSvgMultiLine(reqLabel, 57.5, 64, '#1A1D24', 8.5, 800, 11)}

          {/* Redis RAM */}
          <rect x="155" y="18" width="165" height="44" rx="5" fill="#FFEDD5" stroke="#EA580C" strokeWidth="2" />
          {renderSvgMultiLine(cacheLabel, 237.5, 36, '#C2410C', 8.5, 900, 15)}
          <text x="237.5" y="52" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#059669">{p.toc_do || p.status || 'RAM LATENCY: 1ms'}</text>

          <path d="M 100 55 L 155 40" stroke="#EA580C" strokeWidth="2" strokeDasharray="3 3" />

          {/* DB Disk Bị Bỏ Qua */}
          <rect x="155" y="70" width="165" height="42" rx="5" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="237.5" y="88" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#9CA3AF">{p.dia_cung || 'DATABASE DISK'}</text>
          <text x="237.5" y="102" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6B7280">{p.trang_thai_db || 'Bỏ qua đĩa (0 I/O Load)'}</text>
        </svg>
      );
    }

    case 'zero_trust_pep': {
      const clientLabel = p.client || p.actor || 'CLIENT mTLS';
      const gatewayLabel = p.gateway || p.component || 'PEP GATEWAY';
      const authServerLabel = p.auth_server || p.target || 'INTERNAL MESH';

      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Client mTLS */}
          <rect x="15" y="30" width="90" height="62" rx="4" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="1.8" />
          {renderSvgMultiLine(clientLabel, 60, 52, '#3730A3', 8, 800, 11)}
          <text x="60" y="78" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6366F1" fontWeight="700">mTLS Cert: OK</text>

          {/* Đường truyền Token */}
          <path d="M 105 61 L 175 61" stroke="#4F46E5" strokeWidth="2" strokeDasharray="4 4" />
          <circle r="5" fill="#4F46E5">
            <animateMotion path="M 105 61 L 175 61" dur="2.8s" repeatCount="indefinite" />
          </circle>

          {/* PEP Gateway Shield */}
          <path d="M 175 24 L 265 24 L 265 78 Q 220 110 175 78 Z" fill="#E0E7FF" stroke="#4338CA" strokeWidth="2" />
          {renderSvgMultiLine(gatewayLabel, 220, 48, '#312E81', 8, 900, 12)}
          <text x="220" y="74" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#059669">{p.status || 'JWT VERIFIED'}</text>

          {/* Đường sang Internal Mesh */}
          <path d="M 265 61 L 335 61" stroke="#059669" strokeWidth="2" markerEnd="url(#mui-ten-den)" />
          <circle r="5" fill="#059669">
            <animateMotion path="M 265 61 L 335 61" dur="2.8s" begin="1.4s" repeatCount="indefinite" />
          </circle>

          {/* Internal Mesh Destination */}
          <rect x="335" y="30" width="100" height="62" rx="4" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          {renderSvgMultiLine(authServerLabel, 385, 52, '#065F46', 8, 800, 12)}
          <text x="385" y="78" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#047857" fontWeight="800">SECURE BUS</text>
        </svg>
      );
    }

    case 'oauth2_oidc':
    case 'oauth2_token_server': {
      const clientLabel = p.client || 'CLIENT APP';
      const authServerLabel = p.auth_server || p.component || 'OIDC PROVIDER';
      const tokenLabel = p.token || 'JWT TOKENS';

      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Client Application */}
          <rect x="15" y="30" width="90" height="62" rx="4" fill="#F8FAFC" stroke="#1A1D24" strokeWidth="1.8" />
          {renderSvgMultiLine(clientLabel, 60, 52, '#1A1D24', 8, 800, 11)}
          <text x="60" y="78" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6B7280">Login / Auth Code</text>

          {/* Luồng gọi cấp token */}
          <path d="M 105 61 L 175 61" stroke="#7C3AED" strokeWidth="2" strokeDasharray="4 4" />
          <circle r="5" fill="#7C3AED">
            <animateMotion path="M 105 61 L 175 61" dur="2.6s" repeatCount="indefinite" />
          </circle>

          {/* OIDC Identity Provider Box */}
          <rect x="175" y="20" width="145" height="78" rx="6" fill="#F5F3FF" stroke="#7C3AED" strokeWidth="2" />
          {renderSvgMultiLine(authServerLabel, 247.5, 42, '#5B21B6', 8.5, 900, 14)}
          <rect x="185" y="52" width="125" height="18" rx="3" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="1" />
          <text x="247.5" y="65" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#6D28D9">RS256 KEY SIGNING</text>
          <text x="247.5" y="88" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#7C3AED">JWKS Key Keystore</text>

          {/* Luồng trả Access Token */}
          <path d="M 320 61 L 345 61" stroke="#059669" strokeWidth="2" markerEnd="url(#mui-ten-den)" />
          <circle r="5" fill="#059669">
            <animateMotion path="M 320 61 L 345 61" dur="2.6s" begin="1.3s" repeatCount="indefinite" />
          </circle>

          {/* Issued Token Box */}
          <rect x="345" y="30" width="95" height="62" rx="4" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          {renderSvgMultiLine(tokenLabel, 392.5, 50, '#065F46', 8, 900, 11)}
          <text x="392.5" y="68" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#059669" fontWeight="800">EXP: 3600S</text>
          <text x="392.5" y="80" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="#047857">Claims: sub, jti</text>
        </svg>
      );
    }

    case 'token_blacklist':
    case 'redis_blacklist': {
      const tokenLabel = p.token_jti || 'BEARER TOKEN';
      const cacheLabel = p.cache_store || p.component || 'REDIS BLACKLIST';

      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Bearer Token Input */}
          <rect x="15" y="30" width="90" height="62" rx="4" fill="#F8FAFC" stroke="#1A1D24" strokeWidth="1.8" />
          {renderSvgMultiLine(tokenLabel, 60, 52, '#1A1D24', 8, 800, 11)}
          <text x="60" y="78" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6B7280">JTI: UUID-v4</text>

          {/* Đường dẫn tới Redis */}
          <path d="M 105 61 L 165 61" stroke="#EA580C" strokeWidth="2" strokeDasharray="4 4" />
          <circle r="5" fill="#EA580C">
            <animateMotion path="M 105 61 L 165 61" dur="2.2s" repeatCount="indefinite" />
          </circle>

          {/* Redis Blacklist Cache */}
          <rect x="165" y="20" width="150" height="80" rx="6" fill="#FFF7ED" stroke="#EA580C" strokeWidth="2" />
          {renderSvgMultiLine(cacheLabel, 240, 42, '#C2410C', 8.5, 900, 14)}
          <rect x="175" y="54" width="130" height="20" rx="3" fill="#FED7AA" stroke="#F97316" strokeWidth="1" />
          <text x="240" y="68" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#9A3412">O(1) JTI LOOKUP: &lt;1MS</text>
          <text x="240" y="90" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="#EA580C">Revocation Check</text>

          {/* Nhánh 1: Bị Revoke (Đỏ) */}
          <path d="M 315 42 L 350 32" stroke="#DC2626" strokeWidth="1.8" strokeDasharray="3 3" />
          <rect x="350" y="20" width="90" height="34" rx="3" fill="#FEF2F2" stroke="#DC2626" strokeWidth="1.5" />
          <text x="395" y="36" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="900" fill="#991B1B">401 REVOKED</text>
          <text x="395" y="48" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="#DC2626">Từ chối truy cập</text>

          {/* Nhánh 2: Hợp Lệ (Xanh) */}
          <path d="M 315 78 L 350 86" stroke="#059669" strokeWidth="1.8" />
          <rect x="350" y="70" width="90" height="34" rx="3" fill="#ECFDF5" stroke="#059669" strokeWidth="1.5" />
          <text x="395" y="86" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="900" fill="#065F46">200 ALLOW</text>
          <text x="395" y="98" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="#059669">Chuyển tiếp API</text>
        </svg>
      );
    }

    case 'pdp_policy':
    case 'policy_decision_point': {
      const subjectLabel = p.subject || 'USER CLAIMS';
      const pdpEngineLabel = p.engine || p.component || 'PDP POLICY ENGINE';
      const decisionLabel = p.decision || 'PERMIT ACCESS';

      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* User Subject Claims */}
          <rect x="15" y="30" width="90" height="62" rx="4" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="1.8" />
          {renderSvgMultiLine(subjectLabel, 60, 52, '#3730A3', 8, 800, 11)}
          <text x="60" y="78" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6366F1">Role, Dept, IP</text>

          {/* Luồng sang PDP */}
          <path d="M 105 61 L 165 61" stroke="#4F46E5" strokeWidth="2" strokeDasharray="4 4" />
          <circle r="5" fill="#4F46E5">
            <animateMotion path="M 105 61 L 165 61" dur="2.5s" repeatCount="indefinite" />
          </circle>

          {/* PDP Decision Engine */}
          <rect x="165" y="20" width="150" height="80" rx="6" fill="#F0FDF4" stroke="#16A34A" strokeWidth="2" />
          {renderSvgMultiLine(pdpEngineLabel, 240, 42, '#15803D', 8.5, 900, 14)}
          <rect x="175" y="54" width="130" height="20" rx="3" fill="#DCFCE7" stroke="#22C55E" strokeWidth="1" />
          <text x="240" y="68" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#166534">RBAC &amp; ABAC REGO RULES</text>
          <text x="240" y="90" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="#16A34A">Least Privilege Evaluation</text>

          {/* Luồng ra kết quả */}
          <path d="M 315 61 L 345 61" stroke="#16A34A" strokeWidth="2" markerEnd="url(#mui-ten-den)" />
          <circle r="5" fill="#16A34A">
            <animateMotion path="M 315 61 L 345 61" dur="2.5s" begin="1.2s" repeatCount="indefinite" />
          </circle>

          {/* Decision Outcome */}
          <rect x="345" y="30" width="95" height="62" rx="4" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          {renderSvgMultiLine(decisionLabel, 392.5, 52, '#065F46', 8, 900, 11)}
          <text x="392.5" y="78" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#059669" fontWeight="800">ENFORCE ACTION</text>
        </svg>
      );
    }

    case 'rate_limit_sliding': {
      const clientLabel = p.client || p.actor || 'FLOOD TRAFFIC';
      const wafLabel = p.waf || p.component || 'WAF RATE LIMIT';

      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Client Requests Flood */}
          <rect x="15" y="25" width="85" height="70" rx="4" fill="#FEF2F2" stroke="#DC2626" strokeWidth="1.8" />
          {renderSvgMultiLine(clientLabel, 57.5, 48, '#991B1B', 8.5, 800, 11)}
          <text x="57.5" y="74" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#DC2626" fontWeight="800">50.000 req/s</text>

          {/* Packet Hợp Lệ (Xanh) */}
          <path d="M 100 45 L 185 45" stroke="#059669" strokeWidth="1.8" strokeDasharray="3 3" />
          <rect x="100" y="38" width="45" height="14" rx="2" fill="#059669">
            <animate attributeName="x" values="100;185;185" keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite" />
          </rect>
          <text x="105" y="49" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#FFF" fontWeight="800">
            {p.pass || 'REQ OK'}
            <animate attributeName="x" values="105;190;190" keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite" />
          </text>

          {/* Packet Spam Bị Drop (Đỏ) */}
          <path d="M 100 75 L 185 75" stroke="#DC2626" strokeWidth="1.8" strokeDasharray="3 3" />
          <rect x="100" y="68" width="45" height="14" rx="2" fill="#DC2626">
            <animate attributeName="x" values="100;185;135;135" keyTimes="0;0.5;0.75;1" dur="3s" repeatCount="indefinite" />
          </rect>
          <text x="105" y="79" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#FFF" fontWeight="800">
            {p.drop || '429 DROP'}
            <animate attributeName="x" values="105;190;140;140" keyTimes="0;0.5;0.75;1" dur="3s" repeatCount="indefinite" />
          </text>

          {/* WAF Sliding Window Box */}
          <rect x="185" y="20" width="145" height="78" rx="6" fill="#F8FAFC" stroke="#4338CA" strokeWidth="2" />
          {renderSvgMultiLine(wafLabel, 257.5, 42, '#312E81', 8.5, 900, 14)}
          <rect x="195" y="52" width="125" height="18" rx="3" fill="#EEF2FF" stroke="#6366F1" strokeWidth="1" />
          <text x="257.5" y="65" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#4338CA">TOKEN BUCKET: 10/s</text>
          <text x="257.5" y="88" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6B7280">{p.cache || 'Redis Key: IP:TTL'}</text>

          {/* Đích Nội Bộ */}
          <path d="M 330 45 L 360 45" stroke="#059669" strokeWidth="2" markerEnd="url(#mui-ten-den)" />
          <rect x="360" y="28" width="80" height="64" rx="4" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          <text x="400" y="52" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fontWeight="800" fill="#065F46">INTERNAL</text>
          <text x="400" y="68" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#059669" fontWeight="800">AN TOÀN</text>
        </svg>
      );
    }

    case 'audit_hash_chain': {
      const eventLabel = p.event || p.actor || 'TX EVENT';
      const hashLabel = p.hash_node || p.component || 'SHA-256 HMAC';

      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Event Ingress */}
          <rect x="15" y="32" width="85" height="58" rx="4" fill="#F3F4F6" stroke="#1A1D24" strokeWidth="1.8" />
          {renderSvgMultiLine(eventLabel, 57.5, 54, '#1A1D24', 8.5, 800, 11)}
          <text x="57.5" y="76" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6B7280">Giao dịch mới</text>

          {/* Luồng ký số */}
          <path d="M 100 61 L 165 61" stroke="#059669" strokeWidth="2" strokeDasharray="3 3" />
          <circle r="5" fill="#059669">
            <animateMotion path="M 100 61 L 165 61" dur="2.5s" repeatCount="indefinite" />
          </circle>

          {/* Hasher Box */}
          <rect x="165" y="26" width="140" height="70" rx="6" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          {renderSvgMultiLine(hashLabel, 235, 46, '#065F46', 8.5, 900, 14)}
          <rect x="175" y="58" width="120" height="20" rx="3" fill="#D1FAE5" stroke="#10B981" strokeWidth="1" />
          <text x="235" y="72" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#047857">HASH CHAIN LINK</text>

          {/* Chained to Immutable Append-only DB */}
          <path d="M 305 61 L 345 61" stroke="#2563EB" strokeWidth="2" markerEnd="url(#mui-ten-den)" />
          <rect x="345" y="25" width="95" height="72" rx="6" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
          <text x="392.5" y="48" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="900" fill="#1E40AF">IMMUTABLE</text>
          <rect x="352" y="56" width="80" height="20" rx="3" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1" />
          <text x="392.5" y="70" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#1E40AF">APPEND-ONLY</text>
          <text x="392.5" y="88" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6B7280">B-Tree ACID</text>
        </svg>
      );
    }

    default: {
      const mainColor = p.mau_chu_dao || '#4F46E5';
      const actorName = p.nguon || p.client || p.actor || 'TIẾP NHẬN';
      const engineName = p.quy_trinh || p.gateway || p.component || 'BỘ XỬ LÝ';
      const targetName = p.dich || p.tai_nguyen || p.target || 'TẦNG DỮ LIỆU';
      const statusLabel = p.ket_qua || p.status || 'THỰC THI XONG';

      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Khối 1: Ingress / Actor */}
          <rect x="15" y="30" width="90" height="62" rx="5" fill="#F8FAFC" stroke="#1A1D24" strokeWidth="1.8" />
          {renderSvgMultiLine(actorName, 60, 52, '#1A1D24', 8, 800, 11)}
          <text x="60" y="76" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6B7280">Request Stream</text>

          {/* Đường dẫn truyền hạt 1 */}
          <path d="M 105 61 L 165 61" stroke={mainColor} strokeWidth="2" strokeDasharray="4 4" />
          <circle r="5" fill={mainColor}>
            <animateMotion path="M 105 61 L 165 61" dur="2.6s" repeatCount="indefinite" />
          </circle>

          {/* Khối 2: Central Processing Engine */}
          <rect x="165" y="22" width="150" height="78" rx="6" fill="#F3F4F6" stroke={mainColor} strokeWidth="2.2" />
          {renderSvgMultiLine(engineName, 240, 44, mainColor, 8.5, 900, 14)}
          <rect x="175" y="54" width="130" height="22" rx="3" fill="#FFFFFF" stroke={mainColor} strokeWidth="1" />
          <text x="240" y="69" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#1A1D24">PIPELINE VERIFIED</text>
          <text x="240" y="90" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6B7280">Auto-Adaptive Engine</text>

          {/* Đường dẫn truyền hạt 2 */}
          <path d="M 315 61 L 345 61" stroke="#059669" strokeWidth="2" markerEnd="url(#mui-ten-den)" />
          <circle r="5" fill="#059669">
            <animateMotion path="M 315 61 L 345 61" dur="2.6s" begin="1.3s" repeatCount="indefinite" />
          </circle>

          {/* Khối 3: Target Resource */}
          <rect x="345" y="30" width="95" height="62" rx="5" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          {renderSvgMultiLine(targetName, 392.5, 52, '#065F46', 8, 800, 12)}
          <text x="392.5" y="76" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#059669" fontWeight="800">{statusLabel}</text>
        </svg>
      );
    }
  }
};
