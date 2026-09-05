import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  GitMerge,
  RotateCcw,
  Search,
  EyeOff,
  Download,
  FileText,
  Share2,
  Code,
  ZoomIn,
  ZoomOut,
  Maximize
} from 'lucide-react';
import { useGraphStore } from '../../store/useGraphStore.js';

export const FloatingToolbar: React.FC = () => {
  const {
    graph,
    expandNode,
    isDomainLinkActive,
    toggleDomainLink,
    resetGraph,
    searchQuery,
    setSearchQuery,
    isRecallMode,
    toggleRecallMode,
    zoom,
    zoomIn,
    zoomOut,
    resetView
  } = useGraphStore();

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const visibleNodes = graph?.nodes.filter(n => !n.is_collapsed || n.parent_id === undefined) || [];
  const nodeKhien = graph?.nodes.find(n => n.id === 'node-khien-khoa');
  const isKhienExpanded = nodeKhien?.fully_explored;

  // Xuất Markdown kèm Obsidian Wikilinks (Section 47 & 48)
  const handleExportObsidian = () => {
    if (!graph) return;
    let md = `# ${graph.topic}\n\n`;
    md += `> Xuất từ DeepSeek Harness Interactive Knowledge Graph Plugin\n\n`;
    md += `## 1. Danh sách Khái niệm (Concept Nodes)\n\n`;

    graph.nodes.forEach(n => {
      md += `### [[${n.tieu_de}]]\n`;
      md += `- **Phân loại**: ${n.chi_tiet.phan_loai}\n`;
      md += `- **Bản chất**: ${n.chi_tiet.ban_chat.replace(/<[^>]*>?/gm, '')}\n`;
      if (n.chi_tiet.ca_thuc_te?.length) {
        md += `- **Tình huống thực tế**:\n`;
        n.chi_tiet.ca_thuc_te.forEach(c => md += `  - ${c.replace(/<[^>]*>?/gm, '')}\n`);
      }
      md += `\n`;
    });

    md += `## 2. Liên kết Kiến trúc (Architectural Relationships)\n\n`;
    graph.edges.forEach(e => {
      const fromNode = graph.nodes.find(n => n.id === e.from);
      const toNode = graph.nodes.find(n => n.id === e.to);
      md += `- [[${fromNode?.tieu_de || e.from}]] -->|${e.nhan}| [[${toNode?.tieu_de || e.to}]]\n`;
      if (e.giai_thich) {
        md += `  > *Lý do*: ${e.giai_thich}\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Knowledge_Graph_${graph.id}_Obsidian.md`;
    a.click();
    setIsExportMenuOpen(false);
  };

  // Xuất sơ đồ Mermaid (Section 47, 53)
  const handleExportMermaid = () => {
    if (!graph) return;
    let mermaid = '```mermaid\ngraph TD\n';
    graph.nodes.forEach(n => {
      const cleanId = n.id.replace(/-/g, '_');
      const safeTitle = n.tieu_de.replace(/["\n]/g, '');
      mermaid += `  ${cleanId}["${safeTitle}"]\n`;
    });
    mermaid += '\n';
    graph.edges.forEach(e => {
      const fromClean = e.from.replace(/-/g, '_');
      const toClean = e.to.replace(/-/g, '_');
      mermaid += `  ${fromClean} -->|${e.nhan}| ${toClean}\n`;
    });
    mermaid += '```\n';

    navigator.clipboard.writeText(mermaid);
    alert('Đã sao chép mã sơ đồ Mermaid vào Clipboard!');
    setIsExportMenuOpen(false);
  };

  // Xuất JSON
  const handleExportJson = () => {
    if (!graph) return;
    const jsonStr = JSON.stringify(graph, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge_graph_${graph.id}.json`;
    a.click();
    setIsExportMenuOpen(false);
  };

  return (
    <nav className="thanh-cong-cu-noi">
      <div className="nhom-tieu-de-noi">
        <span className="icon-so-tay">
          <Compass className="lucide-icon-sm" />
        </span>
        <span className="chu-tieu-de-noi">Sổ tay Kỹ sư</span>
        <span className="nhan-dem-node">{visibleNodes.length} Nodes</span>
      </div>

      <div className="vach-ngan-thanh"></div>

      {/* Điều khiển Thu phóng (Zoom) & Căn giữa (Pan) */}
      <div className="nhom-zoom-noi">
        <button
          className="nut-zoom-nho"
          onClick={zoomOut}
          title="Thu nhỏ bản đồ (hoặc lăn chuột xuống)"
        >
          <ZoomOut size={13} />
        </button>
        <span
          className="nhan-phan-tram-zoom"
          onClick={resetView}
          title="Bấm để đặt lại góc nhìn 100% ban đầu"
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          className="nut-zoom-nho"
          onClick={zoomIn}
          title="Phóng to bản đồ (hoặc lăn chuột lên)"
        >
          <ZoomIn size={13} />
        </button>
        <button
          className="nut-zoom-nho"
          onClick={resetView}
          title="Căn giữa & khôi phục tầm nhìn"
        >
          <Maximize size={13} />
        </button>
      </div>

      <div className="vach-ngan-thanh"></div>

      {/* Ô tìm kiếm khái niệm (Section 37) */}
      <div className="o-tim-kiem-wrap">
        <Search size={13} style={{ color: '#6B7280' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm khái niệm..."
          className="o-tim-kiem-input"
        />
        {searchQuery && (
          <button className="nut-xoa-tim" onClick={() => setSearchQuery('')}>×</button>
        )}
      </div>

      {/* Chế độ ôn tập Recall Mode (Section 18) */}
      <button
        className={`nut-thao-tac-noi ${isRecallMode ? 'dang-bat' : ''}`}
        onClick={toggleRecallMode}
        title="Chế độ Ôn tập: Ẩn tên các node thành [ ? ] để luyện phản xạ nhớ"
      >
        <EyeOff className="lucide-icon-sm" />
        <span>{isRecallMode ? 'Ôn tập: BẬT' : 'Ôn tập'}</span>
      </button>

      <div className="vach-ngan-thanh"></div>

      {/* Nút DeepSeek AI mở rộng node con */}
      <button
        className="nut-thao-tac-noi nut-sinh-node"
        onClick={() => expandNode(selectedNodeId || 'node-main')}
        title="Mở rộng thêm node con cho khái niệm đang chọn"
      >
        <Sparkles className="lucide-icon-sm" />
        <span>+ Mở rộng node con</span>
      </button>

      {/* Toggle cầu nối liên kết miền TMĐT */}
      <button
        className="nut-thao-tac-noi nut-lien-ket"
        onClick={toggleDomainLink}
        title="Bật/tắt đường nối cầu nối sang miền TMĐT"
      >
        <GitMerge className="lucide-icon-sm" />
        <span>Miền TMĐT: {isDomainLinkActive ? 'BẬT' : 'TẮT'}</span>
      </button>

      <div className="vach-ngan-thanh"></div>

      {/* Nút Xuất dữ liệu (Obsidian / Mermaid / JSON) (Section 47 & 48) */}
      <div style={{ position: 'relative' }}>
        <button
          className="nut-icon-phu"
          onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
          title="Xuất dữ liệu đồ thị (Obsidian Markdown, Mermaid, JSON)"
        >
          <Download className="lucide-icon-sm" />
        </button>

        {isExportMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '38px',
            right: 0,
            background: '#FFFFFF',
            border: '2px solid #1A1D24',
            borderRadius: '6px',
            boxShadow: '3px 3px 0px #1A1D24',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '220px',
            zIndex: 50
          }}>
            <button
              onClick={handleExportObsidian}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                border: 'none',
                background: 'transparent',
                fontFamily: 'JetBrains Mono',
                fontSize: '11px',
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <FileText size={14} color="#7C3AED" />
              <span>Xuất Obsidian (.md)</span>
            </button>

            <button
              onClick={handleExportMermaid}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                border: 'none',
                background: 'transparent',
                fontFamily: 'JetBrains Mono',
                fontSize: '11px',
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Code size={14} color="#059669" />
              <span>Copy sơ đồ Mermaid</span>
            </button>

            <button
              onClick={handleExportJson}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                border: 'none',
                background: 'transparent',
                fontFamily: 'JetBrains Mono',
                fontSize: '11px',
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Share2 size={14} color="#1A1D24" />
              <span>Tải file JSON</span>
            </button>
          </div>
        )}
      </div>

      {/* Nút Đặt lại đồ thị */}
      <button
        className="nut-icon-phu"
        onClick={resetGraph}
        title="Khôi phục lại 5 node gốc ban đầu (0 token)"
      >
        <RotateCcw className="lucide-icon-sm" />
      </button>
    </nav>
  );
};
