import React, { useEffect } from 'react';
import {
  BookOpen,
  Activity,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Trash2,
  Minimize2,
  Maximize2,
  GitCommit,
  X,
  Zap
} from 'lucide-react';
import { useGraphStore } from '../../store/useGraphStore.js';
import { LucideIconPod } from '../NodePod/LucideIconPod.js';
import { DynamicSchematic } from '../Animation/DynamicSchematic.js';
import { ReflexQuizCard } from '../Quiz/ReflexQuizCard.js';
import { enrichHtmlWithTooltips } from '../../dictionary/technicalDictionary.js';

export const FieldNotesDrawer: React.FC = () => {
  const {
    graph,
    selectedNodeId,
    selectedEdge,
    selectEdge,
    expandNode,
    deleteNode,
    toggleCollapse,
    isReflexQuizOpen,
    toggleReflexQuiz,
    isWhatBreaksActive,
    toggleWhatBreaks,
    isDrawerOpen,
    closeDrawer,
    openDrawer
  } = useGraphStore();

  // Phím tắt Esc để thu gọn/ẩn nhanh Sổ tay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  const renderOpenTab = () => {
    if (isDrawerOpen) return null;
    return (
      <button
        className="the-mo-drawer-noi"
        onClick={openDrawer}
        title="Mở Sổ tay Kỹ sư chi tiết"
      >
        <BookOpen size={14} />
        <span>SỔ TAY</span>
      </button>
    );
  };

  // 1. Nếu đang chọn một Cạnh (Edge), hiển thị Edge Inspector "Why Connected?" (Section 57)
  if (selectedEdge) {
    const fromNode = graph?.nodes.find(n => n.id === selectedEdge.from);
    const toNode = graph?.nodes.find(n => n.id === selectedEdge.to);

    return (
      <>
        {renderOpenTab()}
        <aside className={`trang-so-ghi-chep ${!isDrawerOpen ? 'dong' : ''}`} id="panel-chi-tiet">
          <div className="noi-dung-ghi-chep">
            <div className="dau-trang-chi-tiet">
              <div className="dau-trang-ben-trai">
                <div className="dau-trang-icon" style={{ borderColor: 'var(--vang-ky-thuat)' }}>
                  <GitCommit className="lucide-icon-sm" style={{ color: 'var(--vang-ky-thuat)' }} />
                </div>
                <div className="dau-trang-chu">
                  <div className="the-phan-loai-dau" style={{ color: 'var(--vang-ky-thuat)' }}>
                    LÝ DO LIÊN KẾT KIẾN TRÚC (WHY CONNECTED?)
                  </div>
                  <h2 className="tieu-de-chi-tiet">{selectedEdge.nhan}</h2>
                </div>
              </div>

              <div className="dau-trang-nhom-nut">
                <button
                  className="nut-thao-tac-phu-drawer nut-dong-drawer"
                  onClick={() => {
                    selectEdge(null);
                    closeDrawer();
                  }}
                  title="Đóng bảng giải thích đường nối (Esc)"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

          <div className="khoi-noi-dung" style={{ borderLeft: '3px solid var(--vang-ky-thuat)' }}>
            <div className="tieu-de-khoi">
              <BookOpen className="lucide-icon-sm" />
              <span>HAI KHÁI NIỆM LIÊN QUAN</span>
            </div>
            <p className="van-ban-chinh">
              <strong>Từ:</strong> {fromNode?.tieu_de || selectedEdge.from}
              <br />
              <strong>Đến:</strong> {toNode?.tieu_de || selectedEdge.to}
            </p>
          </div>

          <div className="khoi-noi-dung">
            <div className="tieu-de-khoi">
              <Activity className="lucide-icon-sm" />
              <span>BẢN CHẤT KỸ THUẬT CỦA LIÊN KẾT</span>
            </div>
            <p
              className="van-ban-chinh"
              dangerouslySetInnerHTML={{
                __html: enrichHtmlWithTooltips(
                  selectedEdge.giai_thich ||
                  'Hai khái niệm này có mối quan hệ phụ thuộc nhân - quả trực tiếp trong kiến trúc phân tán.'
                )
              }}
            />
          </div>
        </div>

        <footer className="chan-trang-thao-tac">
          <button className="nut-kiem-tra" onClick={() => selectEdge(null)}>
            <span>Quay lại xem chi tiết Node</span>
          </button>
        </footer>
      </aside>
      </>
    );
  }

  // 2. Nếu đang chọn Node, hiển thị Node Inspector
  const node = graph?.nodes.find(n => n.id === selectedNodeId);
  if (!node) {
    return (
      <>
        {renderOpenTab()}
        <aside className={`trang-so-ghi-chep ${!isDrawerOpen ? 'dong' : ''}`} id="panel-chi-tiet">
          <div className="noi-dung-ghi-chep" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
            <button
              className="nut-thao-tac-phu-drawer nut-dong-drawer"
              onClick={closeDrawer}
              style={{ position: 'absolute', top: 16, right: 16 }}
              title="Ẩn Sổ tay (Esc)"
            >
              <X size={15} />
            </button>
            <BookOpen size={36} style={{ color: '#9CA3AF', marginBottom: '12px' }} />
            <p style={{ color: 'var(--net-muc-mo)', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>
              Vui lòng chọn một node trên bản đồ để xem ghi chép thực chiến.
            </p>
          </div>
        </aside>
      </>
    );
  }

  const c = node.chi_tiet;
  const childNodes = graph?.nodes.filter(n => n.parent_id === node.id) || [];
  const hasChildren = childNodes.length > 0;
  const isCollapsed = node.is_collapsed || false;

  const handleDelete = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn node '${node.tieu_de}' và các nhánh con liên quan khỏi đồ thị không?`)) {
      deleteNode(node.id);
    }
  };

  return (
    <>
      {renderOpenTab()}
      <aside className={`trang-so-ghi-chep ${!isDrawerOpen ? 'dong' : ''}`} id="panel-chi-tiet">
        <div className="noi-dung-ghi-chep">
          {/* Đầu trang chi tiết có Icon Pod thanh mảnh + Nút Mở rộng & Thao tác */}
          <div className="dau-trang-chi-tiet">
            <div className="dau-trang-ben-trai">
              <div className="dau-trang-icon">
                <LucideIconPod type={node.bieu_tuong} className="lucide-icon-sm" />
              </div>
              <div className="dau-trang-chu">
                <div className="the-phan-loai-dau">{c.phan_loai}</div>
                <h2 className="tieu-de-chi-tiet" title={c.tieu_de}>{c.tieu_de}</h2>
              </div>
            </div>

            <div className="dau-trang-nhom-nut">
              {/* Nút mở rộng node con */}
              <button
                className="nut-mo-rong-drawer"
                onClick={() => expandNode(node.id)}
                title="Mở rộng thêm các node con liên quan"
              >
                <Sparkles className="lucide-icon-sm" />
                <span>+ Mở rộng node con</span>
              </button>

              {/* Nút thu gọn / bung ra nếu có node con */}
              {hasChildren && (
                <button
                  className="nut-thao-tac-phu-drawer"
                  onClick={() => toggleCollapse(node.id)}
                  title={isCollapsed ? 'Bung các nhánh con ra' : 'Thu gọn các nhánh con'}
                >
                  {isCollapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
              )}

              {/* Nút xóa vĩnh viễn */}
              <button
                className="nut-thao-tac-phu-drawer"
                onClick={handleDelete}
                title="Xóa vĩnh viễn node này và các đường nối liên quan"
              >
                <Trash2 size={14} />
              </button>

              {/* Nút Đóng / Ẩn Sổ tay (Esc) */}
              <button
                className="nut-thao-tac-phu-drawer nut-dong-drawer"
                onClick={closeDrawer}
                title="Ẩn Sổ tay để xem toàn màn hình đồ thị (Esc)"
              >
                <X size={15} />
              </button>
            </div>
          </div>

        {/* Khối 1: Bản chất cốt lõi có icon BookOpen */}
        <div className="khoi-noi-dung">
          <div className="tieu-de-khoi">
            <BookOpen className="lucide-icon-sm" />
            <span>BẢN CHẤT KỸ THUẬT CỐT LÕI</span>
          </div>
          <p
            className="van-ban-chinh"
            dangerouslySetInnerHTML={{ __html: enrichHtmlWithTooltips(c.ban_chat) }}
          />
        </div>

        {/* Khối 2: Lược đồ hoạt họa sinh theo Template lai */}
        <div className="khoi-noi-dung">
          <div className="tieu-de-khoi">
            <Activity className="lucide-icon-sm" />
            <span>LƯỢC ĐỒ MÔ PHỎNG HOẠT ĐỘNG</span>
          </div>
          <div className="khung-luoc-do-dong">
            <div className="luoc-do-svg-box">
              <DynamicSchematic params={node.hoat_hoa} />
            </div>
            <div className="chu-thich-luoc-do">
              {c.chu_thich_so_do || 'Mô phỏng luồng chuyển động thực tế của dữ liệu trong hệ thống.'}
            </div>
          </div>
        </div>

        {/* Khối 3: Ca sự cố thực chiến */}
        <div className="khoi-noi-dung">
          <div className="tieu-de-khoi" style={{ color: '#DC2626' }}>
            <AlertTriangle className="lucide-icon-sm" />
            <span>TÌNH HUỐNG SỰ CỐ THỰC CHIẾN</span>
          </div>
          <ul className="danh-sach-chi-tiet">
            {c.ca_thuc_te.map((item, idx) => (
              <li key={idx} className="dong-chi-tiet su-co">
                <ChevronRight className="lucide-icon-sm" />
                <span dangerouslySetInnerHTML={{ __html: enrichHtmlWithTooltips(item) }} />
              </li>
            ))}
          </ul>
        </div>

        {/* Khối 4: Rủi ro sụp đổ & Tính năng "What breaks if..." (Section 56) */}
        <div className="khoi-noi-dung">
          <div className="tieu-de-khoi" style={{ color: '#D97706', justifyContent: 'space-between', display: 'flex' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert className="lucide-icon-sm" />
              <span>RỦI RO NẾU THIẾU THÀNH PHẦN NÀY</span>
            </div>
            <button
              onClick={toggleWhatBreaks}
              style={{
                background: isWhatBreaksActive ? '#DC2626' : '#FEF2F2',
                color: isWhatBreaksActive ? '#FFFFFF' : '#DC2626',
                border: '1px solid #DC2626',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Mô phỏng chuỗi sụp đổ dây chuyền trên canvas"
            >
              <Zap size={12} />
              <span>{isWhatBreaksActive ? 'Tắt sụp đổ' : 'Điều gì sụp đổ?'}</span>
            </button>
          </div>

          {/* Nếu chế độ What Breaks đang bật, hiển thị kịch bản sụp đổ dây chuyền */}
          {isWhatBreaksActive && c.chuoi_sup_do && (
            <div style={{
              background: '#FFF1F2',
              border: '1px solid #FECDD3',
              borderRadius: '6px',
              padding: '10px 12px',
              marginBottom: '12px',
              fontSize: '12.5px',
              lineHeight: '1.5'
            }}>
              <div style={{ fontWeight: 700, color: '#9F1239', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} />
                <span>KỊCH BẢN SỤP ĐỔ DÂY CHUYỀN (CASCADE FAILURE)</span>
              </div>
              <ol style={{ margin: 0, paddingLeft: '18px', color: '#881337' }}>
                {c.chuoi_sup_do.map((step, sIdx) => (
                  <li key={sIdx} style={{ marginBottom: '4px' }}>
                    <span dangerouslySetInnerHTML={{ __html: enrichHtmlWithTooltips(step) }} />
                  </li>
                ))}
              </ol>
            </div>
          )}

          <ul className="danh-sach-chi-tiet">
            {c.rui_ro.map((item, idx) => (
              <li key={idx} className="dong-chi-tiet rui-ro">
                <AlertCircle className="lucide-icon-sm" />
                <span dangerouslySetInnerHTML={{ __html: enrichHtmlWithTooltips(item) }} />
              </li>
            ))}
          </ul>
        </div>

        {/* Khối 5: Thử thách phản xạ kỹ sư */}
        {isReflexQuizOpen && node.trac_nghiem && (
          <ReflexQuizCard quiz={node.trac_nghiem} />
        )}
      </div>

      <footer className="chan-trang-thao-tac">
        <button className="nut-kiem-tra" onClick={toggleReflexQuiz}>
          <HelpCircle className="lucide-icon-sm" />
          <span>{isReflexQuizOpen ? 'Đóng thử thách phản xạ' : 'Kiểm tra kiến thức phản xạ'}</span>
        </button>
      </footer>
    </aside>
    </>
  );
};

