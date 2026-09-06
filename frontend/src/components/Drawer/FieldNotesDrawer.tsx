import React, { useEffect, useState } from 'react';
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
    openDrawer,
    toggleExpandWithAiModal
  } = useGraphStore();

  // Tooltip cố định chống tràn mép (Fixed Collision-Free Floating Tooltip)
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    text: string;
    x: number;
    y: number;
    placement: 'top' | 'bottom';
  } | null>(null);

  const handleMouseOver = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('u[data-tooltip]');
    if (target) {
      const text = target.getAttribute('data-tooltip');
      if (text) {
        const rect = target.getBoundingClientRect();
        const tooltipWidth = 270;
        let x = rect.left + rect.width / 2 - tooltipWidth / 2;
        // Chống tràn mép phải màn hình
        if (x + tooltipWidth > window.innerWidth - 16) {
          x = window.innerWidth - tooltipWidth - 16;
        }
        // Chống tràn mép trái
        if (x < 16) {
          x = 16;
        }

        let y = rect.top - 8;
        let placement: 'top' | 'bottom' = 'top';
        if (rect.top < 100) {
          y = rect.bottom + 8;
          placement = 'bottom';
        }

        setHoveredTooltip({ text, x, y, placement });
      }
    }
  };

  const handleMouseOut = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('u[data-tooltip]');
    if (target) {
      setHoveredTooltip(null);
    }
  };

  const renderFixedTooltip = () => {
    if (!hoveredTooltip) return null;
    return (
      <div
        className="drawer-fixed-tooltip"
        style={{
          position: 'fixed',
          left: `${hoveredTooltip.x}px`,
          top: hoveredTooltip.placement === 'bottom' ? `${hoveredTooltip.y}px` : undefined,
          bottom: hoveredTooltip.placement === 'top' ? `${window.innerHeight - hoveredTooltip.y}px` : undefined,
          width: '270px',
          background: '#1A1D24',
          color: '#FAF7F0',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          fontWeight: 500,
          lineHeight: 1.45,
          padding: '8px 12px',
          borderRadius: '6px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 999999,
          pointerEvents: 'none',
          wordBreak: 'break-word'
        }}
      >
        {hoveredTooltip.text}
      </div>
    );
  };

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
        title="Mở Field Notes chi tiết"
      >
        <BookOpen size={14} />
        <span>FIELD NOTES</span>
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
        <aside
          className={`trang-so-ghi-chep ${!isDrawerOpen ? 'dong' : ''}`}
          id="panel-chi-tiet"
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        >
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
        {renderFixedTooltip()}
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
              title="Ẩn Field Notes (Esc)"
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
      <aside
        className={`trang-so-ghi-chep ${!isDrawerOpen ? 'dong' : ''}`}
        id="panel-chi-tiet"
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
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
                title="Ẩn Field Notes để xem toàn màn hình đồ thị (Esc)"
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

        {/* Khối 3: Unified Incident Post-Mortem & Failure Simulator (Hồ sơ sự cố khép kín theo từng Case) */}
        <div className="khoi-noi-dung">
          <div className="tieu-de-khoi" style={{ color: '#DC2626', justifyContent: 'space-between', display: 'flex' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle className="lucide-icon-sm" />
              <span>INCIDENT POST-MORTEM & FAILURE SIMULATOR</span>
            </div>
            <button
              onClick={toggleWhatBreaks}
              style={{
                background: isWhatBreaksActive ? '#DC2626' : '#FEF2F2',
                color: isWhatBreaksActive ? '#FFFFFF' : '#DC2626',
                border: '1px solid #DC2626',
                borderRadius: '4px',
                padding: '3px 9px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Mô phỏng hiệu ứng lan truyền sự cố (Failure Cascade) trên canvas"
            >
              <Zap size={12} />
              <span>{isWhatBreaksActive ? 'Tắt Mô Phỏng' : 'Mô Phỏng Sự Cố 🐛'}</span>
            </button>
          </div>

          {/* Danh sách các Incident Case độc lập khép kín (Accordion per Case) */}
          {c.incident_cases && c.incident_cases.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {c.incident_cases.map((item, caseIdx) => (
                <div
                  key={item.id || caseIdx}
                  style={{
                    border: '1.5px solid #FECACA',
                    borderRadius: '7px',
                    background: '#FEF2F2',
                    overflow: 'hidden'
                  }}
                >
                  {/* Case Header */}
                  <div
                    style={{
                      padding: '8px 12px',
                      background: '#FEE2E2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      borderBottom: '1px solid #FECACA'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800, color: '#991B1B' }}>
                      <AlertCircle size={14} color="#DC2626" />
                      <span>CASE {caseIdx + 1}: {item.title.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Case Body */}
                  <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                    <div>
                      <span style={{ fontWeight: 800, color: '#991B1B' }}>📊 TRAFFIC PROFILE & CONCURRENCY: </span>
                      <span style={{ color: '#7F1D1D' }}>{item.traffic_profile}</span>
                    </div>

                    <div>
                      <span style={{ fontWeight: 800, color: '#991B1B' }}>🔍 ROOT CAUSE ANALYSIS (RCA): </span>
                      <span style={{ color: '#7F1D1D' }}>{item.root_cause_analysis}</span>
                    </div>

                    <div>
                      <span style={{ fontWeight: 800, color: '#991B1B' }}>💥 BLAST RADIUS & BUSINESS IMPACT: </span>
                      <span style={{ color: '#7F1D1D' }}>{item.blast_radius}</span>
                    </div>

                    {item.cascading_failure_path && item.cascading_failure_path.length > 0 && (
                      <div style={{ marginTop: '2px', background: '#FFF1F2', padding: '8px 10px', borderRadius: '5px', border: '1px solid #FECDD3' }}>
                        <div style={{ fontWeight: 800, color: '#9F1239', marginBottom: '4px' }}>
                          🚨 CASCADING FAILURE PATH (LAN TRUYỀN SỰ CỐ):
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {item.cascading_failure_path.map((step, sIdx) => {
                            const cleanStep = step.replace(/^[\d\.]+\s*/, '').trim();
                            return (
                              <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '10.5px', color: '#881337' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  background: '#FECDD3',
                                  color: '#9F1239',
                                  fontSize: '9px',
                                  fontWeight: 800,
                                  marginTop: '1px'
                                }}>
                                  {sIdx + 1}
                                </span>
                                <span style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: enrichHtmlWithTooltips(cleanStep) }} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Hộp Đề Xuất Hướng Fix & Phòng Thủ */}
                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '5px', padding: '8px 10px', color: '#065F46', marginTop: '2px' }}>
                      <span style={{ fontWeight: 800 }}>🛡️ MITIGATION & RECOVERY STRATEGY: </span>
                      <span dangerouslySetInnerHTML={{ __html: enrichHtmlWithTooltips(item.mitigation_strategy) }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Fallback single incident dossier format */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {c.incident_dossier && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '10px 12px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>
                    <span style={{ fontWeight: 800, color: '#991B1B' }}>📊 TRAFFIC PROFILE & CONCURRENCY: </span>
                    <span style={{ color: '#7F1D1D' }}>{c.incident_dossier.boi_canh_tai}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, color: '#991B1B' }}>🔍 ROOT CAUSE ANALYSIS (RCA): </span>
                    <span style={{ color: '#7F1D1D' }}>{c.incident_dossier.nguyen_nhan_goc_re}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, color: '#991B1B' }}>💥 BLAST RADIUS: </span>
                    <span style={{ color: '#7F1D1D' }}>{c.incident_dossier.ban_kinh_anh_huong}</span>
                  </div>
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '5px', padding: '6px 8px', color: '#065F46', marginTop: '2px' }}>
                    <span style={{ fontWeight: 800 }}>🛡️ MITIGATION STRATEGY: </span>
                    <span dangerouslySetInnerHTML={{ __html: enrichHtmlWithTooltips(c.incident_dossier.chien_luoc_phong_thu) }} />
                  </div>
                </div>
              )}

              {c.ca_thuc_te && c.ca_thuc_te.length > 0 && (
                <ul className="danh-sach-chi-tiet">
                  {c.ca_thuc_te.map((item, idx) => (
                    <li key={idx} className="dong-chi-tiet su-co">
                      <ChevronRight className="lucide-icon-sm" />
                      <span dangerouslySetInnerHTML={{ __html: enrichHtmlWithTooltips(item) }} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Rủi ro tồn đọng cần kiểm soát */}
          {c.rui_ro && c.rui_ro.length > 0 && (
            <ul className="danh-sach-chi-tiet" style={{ marginTop: '8px' }}>
              {c.rui_ro.map((item, idx) => (
                <li key={idx} className="dong-chi-tiet rui-ro">
                  <AlertCircle className="lucide-icon-sm" />
                  <span dangerouslySetInnerHTML={{ __html: enrichHtmlWithTooltips(item) }} />
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Khối 5: Chuỗi 5 câu hỏi phản xạ kỹ sư thực chiến */}
        {isReflexQuizOpen && (node.trac_nghiem || node.trac_nghiem_list) && (
          <ReflexQuizCard quiz={node.trac_nghiem} quizList={node.trac_nghiem_list} />
        )}
      </div>

      <footer className="chan-trang-thao-tac">
        <button className="nut-kiem-tra" onClick={toggleReflexQuiz}>
          <HelpCircle className="lucide-icon-sm" />
          <span>{isReflexQuizOpen ? 'Đóng thử thách phản xạ' : 'Kiểm tra kiến thức phản xạ'}</span>
        </button>
      </footer>
      {renderFixedTooltip()}
    </aside>
    </>
  );
};

