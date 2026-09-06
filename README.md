# 📐 Canvas Note Engineer

> **Interactive Engineering Knowledge Graph, SRE Incident Simulator & Architecture Field Notebook**  
> Thiết kế đặc quyền cho **Kỹ sư Phần mềm**, **Kiến trúc sư Hệ thống (System Architects)** và **Anh em thích vọc vạch / mở rộng công cụ lập trình AI (Antigravity, DeepSeek Harness, Claude Code, Cursor)**.

[![Tech Stack](https://img.shields.io/badge/Stack-React%2018%20%7C%20TypeScript%20%7C%20Zustand%20%7C%20Express%20%7C%20SQLite%20WAL-green)](#-cong-nghe-su-dung)
[![Tests](https://img.shields.io/badge/Tests-42%2F42%20Integration%20Passed%20(100%25)-brightgreen)](#-kiem-thu-tu-dong-toan-dien)
[![Zero-Token Caching](https://img.shields.io/badge/AI-Zero--Token%20Cache%20(SQLite%20WAL)-orange)](#-luu-tru-va-du-lieu)
[![Architecture](https://img.shields.io/badge/Architecture-DDD%20Bounded%20Context%20%E2%86%92%20Cluster%20%E2%86%92%20Sub--Cluster-indigo)](#-kien-truc-phan-cap-bounded-context)

---

## ⚡ Quick Start Trong 60 Giây (Zero-Bullshit Setup)

```bash
# 1. Clone repository
git clone https://github.com/justpassingByte/canvas-note-engineer.git
cd canvas-note-engineer

# 2. Cài đặt toàn bộ dependencies (Root + Frontend + Backend)
npm install
npm run --prefix frontend install
npm run --prefix backend install

# 3. Tạo file .env từ template (tùy chọn cắm key AI, mặc định có Mock Provider chạy offline 0đ)
cp .env.example .env

# 4. Khởi chạy song song cả Frontend (Vite) và Backend (Express)
npm run dev
```

* 🌐 **Frontend Dev UI**: [`http://localhost:5173`](http://localhost:5173)
* 🚀 **Backend REST API**: [`http://localhost:3001`](http://localhost:3001)
* 🗄️ **Database SQLite WAL**: Tự động tạo tại `data/knowledge.db` (mở xem trực tiếp bằng DBeaver hoặc SQLite Viewer).

---

## 🧭 Bản Đồ Codebase Dành Cho Anh Em Vọc Vạch (Hacker's Code Map)

Nếu bạn muốn nhảy vào sửa code, thêm tính năng, hay cắm mô hình AI của riêng bạn, đây là các file trọng yếu:

```text
canvas-note-engineer/
├── frontend/src/
│   ├── components/Canvas/
│   │   └── SvgGridCanvas.tsx         # Trái tim Canvas: Pan, Zoom, Cubic Bezier, Chuột phải & Prompt Popup
│   ├── components/NodePod/
│   │   ├── ConceptNode.tsx           # Thẻ Node: Badges, tiêu đề, tóm tắt, collapse pill, hover effect
│   │   └── LucideIconPod.tsx         # Vẽ Icon SVG kỹ thuật chuẩn ISO/C4 (Database, CPU, RAM, Gateway...)
│   ├── components/Animation/
│   │   └── DynamicSchematic.tsx      # Sơ đồ mạch động SVG (Kafka conveyor, Redis lock, ACID cylinder...)
│   ├── components/Drawer/
│   │   └── FieldNotesDrawer.tsx      # Sổ tay kỹ thuật: Phân tích chuyên sâu, 5 câu hỏi sát hạch, Incident dossier
│   ├── utils/
│   │   ├── clusterEngine.ts          # Thuật toán tính Cụm Mẹ / Cụm Con theo Bounded Context & auto Bounding Box
│   │   └── geometry.ts               # Thuật toán tính toán đường cong dây nối Cubic Bezier mượt mà
│   └── store/
│       └── useGraphStore.ts          # Zustand Store quản lý toàn bộ State: Zoom, Pan, Nodes, Edges, AI actions
│
├── backend/src/
│   ├── providers/                    # Chiến lược cắm rút AI đa nhà cung cấp (Strategy Pattern)
│   │   ├── providerStrategy.ts       # Interface AIProviderStrategy chuẩn mực
│   │   ├── openaiCompatibleProvider.ts # Tương thích OpenAI, DeepSeek, Minimax, Ollama localhost
│   │   ├── anthropicProvider.ts      # Hỗ trợ Claude 3.5 Sonnet / Claude 3 Opus
│   │   └── mockProvider.ts           # Chạy offline 100% không tốn token, dùng cho unit test & vọc UI
│   ├── tools/
│   │   └── toolHandlers.ts           # Core Engine xử lý đồ thị: spawn cluster, bóc tách layer, reflex drill
│   ├── services/
│   │   └── aiGraphService.ts         # Service kết nối LLM Provider sinh đồ thị & mở rộng kiến trúc
│   ├── db/
│   │   └── sqliteClient.ts           # SQLite3 WAL Mode: Khóa Idempotency, lưu trữ đồ thị 0-token, provider config
│   └── index.ts                      # Express API Server phục vụ REST endpoint & Static build
│
├── data/
│   └── knowledge.db                  # Database SQLite file thực tế (WAL mode)
└── rag/                              # Thư mục nạp tài liệu RFC, Markdown, Mermaid cho tính năng RAG Brainstorm
```

---

## 🤖 Cắm AI / LLM Provider Của Riêng Bạn (Bring Your Own Model)

Hệ thống thiết kế theo kiến trúc **Strategy Pattern** độc lập, cho phép bạn cắm bất kỳ nhà cung cấp AI nào (OpenAI, Anthropic Claude, DeepSeek, Minimax, hoặc Ollama chạy Local).

### Cách 1: Cấu hình qua file `.env`
Mở file `.env` ở thư mục gốc:

```env
# Chọn Provider mặc định: 'anthropic' | 'openai' | 'deepseek' | 'custom' | 'mock'
DEFAULT_AI_PROVIDER=anthropic

# Cấu hình Anthropic Claude (hoặc proxy Minimax / OpenAI-compatible)
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Cấu hình DeepSeek hoặc OpenAI
DEEPSEEK_API_KEY=sk-...
OPENAI_API_KEY=sk-...

# Chạy mô hình Local với Ollama (0 chi phí)
CUSTOM_BASE_URL=http://localhost:11434/v1
CUSTOM_API_KEY=ollama
CUSTOM_MODEL=llama3.2
```

### Cách 2: Cấu hình động ngay trên giao diện Web UI (Không cần restart server)
1. Bấm vào icon **Bánh răng (⚙️)** trên thanh công cụ nổi (Floating Toolbar).
2. Chọn Preset có sẵn (Claude, OpenAI, DeepSeek, Ollama, Minimax) hoặc chọn **Custom Endpoint**.
3. Điền `Base URL`, `API Key`, `Model Name` $\to$ Bấm **"Lưu & Kích hoạt"**. Cấu hình sẽ tự động lưu bền vững vào bảng `provider_configs` trong SQLite.

---

## 🎨 Hướng Dẫn Thêm Tính Năng Tự Vọc (Hacker's Extension Recipes)

### 1. Thêm một Biểu tượng Kỹ thuật SVG mới (Custom Icon)
* Mở [frontend/src/components/NodePod/LucideIconPod.tsx](file:///c:/Users/MSI/Desktop/plugin/frontend/src/components/NodePod/LucideIconPod.tsx).
* Thêm một `case` mới vào hàm `LucideIconPod` và vẽ SVG theo sở thích:
```tsx
case 'my_custom_service':
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="4" y="4" width="24" height="24" rx="4" />
      {/* Thêm các đường vẽ vector của bạn */}
    </svg>
  );
```

### 2. Thêm một Sơ đồ Mạch Động Mới (Custom Schematic Animation)
* Mở [frontend/src/components/Animation/DynamicSchematic.tsx](file:///c:/Users/MSI/Desktop/plugin/frontend/src/components/Animation/DynamicSchematic.tsx).
* Thêm một case mới tương ứng với mã hiệu `mau` trong `hoat_hoa`:
```tsx
case 'my_stream_pipeline': {
  return (
    <svg width="100%" height="100%" viewBox="0 0 450 125">
      {/* Tạo các phần tử SVG kèm <animate> cho hiệu ứng chuyển động */}
      <circle cx="50" cy="62" r="8" fill="#3B82F6">
        <animate attributeName="cx" values="50;400;50" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
```

### 3. Tùy biến Quy tắc Phân tầng Kiến trúc (Layer Sanitizer)
* Mở [backend/src/tools/toolHandlers.ts](file:///c:/Users/MSI/Desktop/plugin/backend/src/tools/toolHandlers.ts#L118).
* Hàm `sanitizeNodeLayerLabel` quyết định nhãn badge màu sắc (`GATEWAY / INGRESS`, `EVENT STREAM / TOPIC`, `STORAGE / ACID DB`). Bạn có thể thêm từ khóa nhận diện mới chỉ với 2 dòng `if (textToCheck.includes(...))`.

---

## 🖱️ Thao Tác Chuột & Phím Tắt Nhanh (Canvas Cheat Sheet)

| Thao tác | Hành vi trên Canvas |
|---|---|
| **Chuột phải (Vùng trống)** | Mở Context Menu: Chọn `⚡ Spawn Cluster (Agent)` hoặc `💡 Spawn Concept (Agent)` $\to$ Hiện floating prompt tại con trỏ $\to$ Nhập prompt $\to$ **Enter** để sinh cụm kiến trúc. |
| **Chuột phải (Lên Node)** | Mở Context Menu theo Node: Spawn cụm mới nối từ node này, mở Field Notes, thu gọn nhánh con, hoặc xóa node vĩnh viễn. |
| **Kéo rê chuột trái (Pan)** | Di chuyển camera trên mặt giấy vô hạn. |
| **Cuộn chuột (Zoom)** | Phóng to / Thu nhỏ mượt mà theo tâm con trỏ chuột (0.25x - 2.5x). |
| **Kéo thả Node** | Nhấn giữ chuột trái vào thẻ Node để dời vị trí $\to$ Tự động lưu tọa độ vào SQLite khi buông chuột. |
| **Kéo thả Cụm** | Nhấn giữ vào thẻ tiêu đề Cụm (`⋮⋮ TÊN CỤM`) để dời đồng loạt toàn bộ các node bên trong cụm. |
| **Click vào Node** | Mở **Field Notes Drawer**: Khám phá bản chất, sơ đồ động, hồ sơ sự cố (Incident Dossier) và chuỗi 5 câu hỏi sát hạch phản xạ kiến trúc sư. |
| **Click nút 🐛 trên Thẻ Sự cố** | Kích hoạt mô phỏng sóng lan truyền sự cố: Con bọ đỏ (Bug Vector Particle) bò dọc theo dây nối DAG. |

---

## 🏛️ Kiến Trúc Phân Cấp & Bounded Context (Không Hardcode)

Hệ thống không sử dụng mô hình phẳng (Flat Architecture) mà tổ chức phân cấp theo tiêu chuẩn **Domain-Driven Design (DDD)**:

```text
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║  [DOMAIN]: AUTHENTICATION & IDENTITY PLATFORM                                                     ║
║                                                                                                    ║
║  ┌── [SERVICE CLUSTER]: OIDC IDENTITY SERVICE ────────┐   ┌── [SUB-CLUSTER]: AUTH REDIS CLUSTER ──┐║
║  │                                                    │   │  (Namespace: auth:*)                  │║
║  │  [API Gateway (PEP)] ──> [OIDC Provider Server]    │──>│  ┌──────────────────────────────────┐ │║
║  │                                                    │   │  │ Node: Token Revocation Blacklist │ │║
║  │                                                    │   │  │ (Key: auth:blacklist:<jti>)      │ │║
║  │                                                    │   │  └──────────────────────────────────┘ │║
║  └────────────────────────────────────────────────────┘   └───────────────────────────────────────┘║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
                                    │
                                    │  [PUBLIC CONTRACT INTERFACE]
                                    ▼
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║  [DOMAIN]: PAYMENT & FINANCIAL PLATFORM                                                           ║
║                                                                                                    ║
║  ┌── [SERVICE CLUSTER]: WEBHOOK INGRESS ──────────────┐   ┌── [SUB-CLUSTER]: PAYMENT REDIS CLUSTER ║
║  │                                                    │   │  (Namespace: payment:lock:*)          ║
║  │  [Webhook Receiver] ──> [Idempotency Filter]       │──>│  ┌──────────────────────────────────┐ ║
║  │                                                    │   │  │ Node: Distributed Lock (SETNX)   │ ║
║  └────────────────────────────────────────────────────┘   │  └──────────────────────────────────┘ ║
║                                                           └───────────────────────────────────────┘║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

1. **Cụm Dịch Vụ Chính (Service Cluster)**: Chứa các node thực thi logic chính (Gateways, Pure Engines, Dispatchers, Workers).
2. **Cụm Hạ Tầng Chuyên Biệt (Sub-Clusters)**: Chứa các tài nguyên nội bộ độc lập của phân hệ (ví dụ: `MEDIA LIFECYCLE & CLEANUP QUEUE`, `POSTGRESQL STORAGE & LEDGER SUBSYSTEM`, `REDIS CACHE SUBSYSTEM`).
3. **Chống Cross-Wiring Xuyên Cụm**: Dịch vụ của cụm này **bị chặn tuyệt đối** không được cắm dây trực tiếp vào phần cứng nội tạng của cụm khác mà phải giao tiếp qua Public Contract (Gateway/PEP).

---

## 🧪 Bộ Lệnh Hữu Ích (Developer Cheatsheet)

```bash
# Chạy toàn bộ kiểm thử tích hợp (10 test suites, 42 tests)
npm run test:integration

# Chạy kiểm thử đơn vị frontend
npm run test:unit

# Build bundle frontend (Vite SingleFile)
npm run build:frontend

# Build toàn bộ dự án
npm run build

# Dọn sạch Database về trạng thái Canvas tinh khôi (chạy bằng Node trực tiếp)
node -e "const db=require('better-sqlite3')('data/knowledge.db'); db.exec('DELETE FROM knowledge_graphs; DELETE FROM idempotency_keys; VACUUM;'); console.log('DB Cleaned!');"
```

---

## 📄 Bản Quyền & Đóng Góp
Dự án được xây dựng dưới triết lý mã nguồn mở dành cho cộng đồng Kỹ sư Phần mềm Việt Nam yêu thích kiến trúc hệ thống, distributed systems và agentic workflows. Mọi đóng góp (PR, Issue, Ideas) đều được nhiệt liệt hoan nghênh!
