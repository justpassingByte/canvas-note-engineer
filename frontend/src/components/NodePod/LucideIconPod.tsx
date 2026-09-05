import React from 'react';
import { NodeBadgeType } from '../../types/graphTypes.js';

interface LucideIconPodProps {
  type: NodeBadgeType;
  className?: string;
}

export const LucideIconPod: React.FC<LucideIconPodProps> = ({ type, className = 'lucide-icon' }) => {
  switch (type) {
    // ------------------------------------------------------------------------
    // 1. DATABASE CYLINDER: CÁC ĐĨA TRÒN / KHỐI TRỤ 3 TẦNG CHỒNG LÊN NHAU
    // ------------------------------------------------------------------------
    case 'khoi_tru_database':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Đĩa trên cùng (Top Disc) */}
          <ellipse cx="16" cy="7" rx="10" ry="3.5" />
          {/* Thân tầng 1 */}
          <path d="M6 7v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5V7" />
          {/* Thân tầng 2 */}
          <path d="M6 13v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5v-6" />
          {/* Thân tầng đáy (Bottom Disc) */}
          <path d="M6 19v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5v-6" />
        </svg>
      );

    // ------------------------------------------------------------------------
    // 2. CPU MICROCHIP: CON CHIP VI XỬ LÝ HÌNH VUÔNG VỚI CHÂN BÁN DẪN 4 HƯỚNG
    // ------------------------------------------------------------------------
    case 'dong_co_pure_engine':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Thân chip vuông trung tâm */}
          <rect x="7" y="7" width="18" height="18" rx="2.5" />
          {/* Lõi Silicon bên trong */}
          <rect x="11" y="11" width="10" height="10" rx="1" fill="currentColor" fillOpacity="0.15" />
          {/* Chân chip phía trên (Top Pins) */}
          <path d="M11 2v5M16 2v5M21 2v5" />
          {/* Chân chip phía dưới (Bottom Pins) */}
          <path d="M11 25v5M16 25v5M21 25v5" />
          {/* Chân chip bên trái (Left Pins) */}
          <path d="M2 11h5M2 16h5M2 21h5" />
          {/* Chân chip bên phải (Right Pins) */}
          <path d="M25 11h5M25 16h5M25 21h5" />
        </svg>
      );

    // ------------------------------------------------------------------------
    // 3. IN-MEMORY CACHE / RAM: THANH BỘ NHỚ RAM VỚI CHIP BẢO TOÀN DỮ LIỆU
    // ------------------------------------------------------------------------
    case 'bo_nho_dem_cache':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Thân thanh RAM PCB */}
          <rect x="3" y="10" width="26" height="13" rx="2" />
          {/* Các chip nhớ RAM nhỏ trên thanh */}
          <rect x="6" y="13" width="4" height="4" rx="0.5" fill="currentColor" fillOpacity="0.2" />
          <rect x="12" y="13" width="4" height="4" rx="0.5" fill="currentColor" fillOpacity="0.2" />
          <rect x="18" y="13" width="4" height="4" rx="0.5" fill="currentColor" fillOpacity="0.2" />
          <rect x="24" y="13" width="3" height="4" rx="0.5" fill="currentColor" fillOpacity="0.2" />
          {/* Chân cắm tiếp xúc vàng (Gold Fingers) */}
          <path d="M6 23v3M10 23v3M14 23v3M18 23v3M22 23v3M26 23v3" />
        </svg>
      );

    // ------------------------------------------------------------------------
    // 4. SERVER RACK / SERVICE: TỦ SERVER PHIẾN VỚI KHE ĐĨA VÀ ĐÈN LED TÍN HIỆU
    // ------------------------------------------------------------------------
    case 'dieu_phoi_service':
    case 'thanh_toan_payment':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Phiến Server 1 */}
          <rect x="4" y="5" width="24" height="9" rx="2" />
          <line x1="8" y1="9.5" x2="16" y2="9.5" />
          <circle cx="22" cy="9.5" r="1.2" fill="currentColor" />
          {/* Phiến Server 2 */}
          <rect x="4" y="18" width="24" height="9" rx="2" />
          <line x1="8" y1="22.5" x2="16" y2="22.5" />
          <circle cx="22" cy="22.5" r="1.2" fill="currentColor" />
        </svg>
      );

    // ------------------------------------------------------------------------
    // 5. API GATEWAY / INGRESS ROUTER: BỘ ĐỊNH TUYẾN MẠNG PHÂN LUỒNG ĐA HƯỚNG
    // ------------------------------------------------------------------------
    case 'cong_gateway_ingress':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="12" />
          {/* Đường kinh tuyến / vĩ tuyến mạng */}
          <ellipse cx="16" cy="16" rx="5" ry="12" />
          <line x1="4" y1="16" x2="28" y2="16" />
          <path d="M6 10h20M6 22h20" strokeWidth="1.5" strokeDasharray="1 2" />
        </svg>
      );

    // ------------------------------------------------------------------------
    // 6. MESSAGE QUEUE / EVENT STREAM: HÀNG ĐỢI XẾP LỚP CÁC GÓI TIN BĂNG CHUYỀN
    // ------------------------------------------------------------------------
    case 'hang_doi_message_queue':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Lớp gói tin 1 (trên cùng) */}
          <path d="M16 4L3 10l13 6 13-6-13-6z" />
          {/* Lớp gói tin 2 (ở giữa) */}
          <path d="M3 16l13 6 13-6" />
          {/* Lớp gói tin 3 (dưới cùng) */}
          <path d="M3 22l13 6 13-6" />
        </svg>
      );

    // ------------------------------------------------------------------------
    // 7. BACKGROUND WORKER: BÁNH RĂNG CƠ KHÍ CHẠY TIẾN TRÌNH NỀN
    // ------------------------------------------------------------------------
    case 'tien_trinh_worker_pool':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Bánh răng lớn */}
          <circle cx="16" cy="16" r="4.5" />
          <path d="M16 2v3M16 27v3M2 16h3M27 16h3M6.1 6.1l2.1 2.1M23.8 23.8l2.1 2.1M6.1 25.9l2.1-2.1M23.8 8.2l2.1-2.1" />
        </svg>
      );

    // ------------------------------------------------------------------------
    // 8. PORTS & ADAPTERS: CHÂN CẮM / DÂY CÁP TÍCH HỢP ĐA MODULE
    // ------------------------------------------------------------------------
    case 'cong_ket_noi_port':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Phích cắm */}
          <rect x="7" y="10" width="12" height="12" rx="2" />
          {/* Chân cắm */}
          <path d="M11 4v6M15 4v6" />
          {/* Dây cáp ra */}
          <path d="M13 22v4c0 1.66 1.34 3 3 3h4" />
        </svg>
      );

    // ------------------------------------------------------------------------
    // 9. PROMO CODE / VOUCHER: THẺ VOUCHER GIẢM GIÁ VỚI VẾT CẮT BÁN NGUYỆT
    // ------------------------------------------------------------------------
    case 'khuyen_mai_voucher':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v4a3 3 0 0 0 0 6v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4a3 3 0 0 0 0-6V8z" />
          <line x1="16" y1="8" x2="16" y2="24" strokeDasharray="2 3" />
        </svg>
      );

    // ------------------------------------------------------------------------
    // 10. AUTHENTICATION & JWT: CHÌA KHÓA ĐỊNH DANH MÃ HÓA
    // ------------------------------------------------------------------------
    case 'dinh_danh_auth_token':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10.5" cy="16" r="6.5" />
          <path d="M17 16h11M23 16v4M27 16v3" />
        </svg>
      );

    // ------------------------------------------------------------------------
    // 11. REFRESH TOKEN ROTATION: XOAY VÒNG TOKEN 1 LẦN DÙNG (ROTATION CYCLE)
    // ------------------------------------------------------------------------
    case 'xoay_vong_token_rtr':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M28 6v8h-8" />
          <path d="M4 26v-8h8" />
          <path d="M26.2 12.5A11 11 0 0 0 8.3 7.8L4 12M28 20l-4.3 4.2A11 11 0 0 1 5.8 19.5" />
        </svg>
      );

    // ------------------------------------------------------------------------
    // 12. RBAC / POLICY PDP: CÁN CÂN CÔNG LÝ THẨM ĐỊNH QUYỀN HẠN
    // ------------------------------------------------------------------------
    case 'chinh_sach_rbac_pdp':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 3v24M4 8l12-3 12 3" />
          <path d="M4 8l-2 8a4 4 0 0 0 8 0L8 8" />
          <path d="M24 8l-2 8a4 4 0 0 0 8 0L28 8" />
          <line x1="12" y1="27" x2="20" y2="27" />
        </svg>
      );

    // ------------------------------------------------------------------------
    // 13. BLACKLIST / REVOCATION: KHIÊN KHÓA CHẶN JTI BỊ CẤM
    // ------------------------------------------------------------------------
    case 'danh_sach_den_blacklist':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="12" />
          <line x1="7.5" y1="7.5" x2="24.5" y2="24.5" />
        </svg>
      );

    // ------------------------------------------------------------------------
    // 14. AUDIT LOG & SỔ CÁI BẤT BIẾN: CUỐN SỔ TAY KÝ SỐ SHA-256
    // ------------------------------------------------------------------------
    case 'ghi_chep_so_sach':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5a3 3 0 0 1 3-3h18a2 2 0 0 1 2 2v23a2 2 0 0 1-2 2H7a3 3 0 0 1-3-3V5z" />
          <path d="M4 26a3 3 0 0 0 3 3h18" />
          <line x1="10" y1="9" x2="20" y2="9" />
          <line x1="10" y1="14" x2="20" y2="14" />
          <line x1="10" y1="19" x2="16" y2="19" />
        </svg>
      );

    // ------------------------------------------------------------------------
    // 15. SỰ CỐ / TIMEOUT CANH BÁO
    // ------------------------------------------------------------------------
    case 'su_co_canh_bao':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.27 4.14L2.39 24.57A2 2 0 0 0 4.12 27.5h23.76a2 2 0 0 0 1.73-2.93L17.73 4.14a2 2 0 0 0-3.46 0z" />
          <line x1="16" y1="12" x2="16" y2="18" />
          <circle cx="16" cy="22" r="1.2" fill="currentColor" />
        </svg>
      );

    // ------------------------------------------------------------------------
    // 16. XUNG ĐỘT TƯƠNG TRANH (RACE CONDITION)
    // ------------------------------------------------------------------------
    case 'tranh_chap_phan_nhanh':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="3.5" />
          <circle cx="8" cy="24" r="3.5" />
          <circle cx="24" cy="16" r="3.5" />
          <path d="M11.5 8h4a4 4 0 0 1 4 4v2" />
          <path d="M11.5 24h4a4 4 0 0 0 4-4v-2" />
          <line x1="19.5" y1="16" x2="20.5" y2="16" />
        </svg>
      );

    // Mặc định
    default:
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="5" width="24" height="9" rx="2" />
          <rect x="4" y="18" width="24" height="9" rx="2" />
        </svg>
      );
  }
};

