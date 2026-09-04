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

    default:
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          <rect x="30" y="35" width="390" height="55" rx="6" fill="#F9FAFB" stroke="#1A1D24" strokeWidth="1.5" />
          <text x="140" y="66" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="800" fill="#1A1D24">
            LƯỢC ĐỒ HOẠT HỌA LAI
          </text>
        </svg>
      );
  }
};
