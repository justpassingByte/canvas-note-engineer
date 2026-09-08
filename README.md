# Canvas Note Engineer

> **Interactive Engineering Knowledge Graph, SRE Incident Simulator & Architecture Field Notebook**  
> Thiết kế chuyên dụng cho **Kỹ sư Phần mềm (Software Engineers)**, **Kiến trúc sư Hệ thống (System Architects)** và **Nhà phát triển tích hợp Agentic AI (Antigravity, Claude Code, Cursor, DeepSeek)**.

[![Tech Stack](https://img.shields.io/badge/Stack-React%2018%20%7C%20TypeScript%20%7C%20Zustand%20%7C%20Express%20%7C%20SQLite%20WAL-green)](#-cong-nghe-su-dung)
[![Tests](https://img.shields.io/badge/Tests-42%2F42%20Integration%20Passed%20(100%25)-brightgreen)](#-kiem-thu-tu-dong-toan-dien)
[![Zero-Token Caching](https://img.shields.io/badge/AI-Zero--Token%20Cache%20(SQLite%20WAL)-orange)](#-luu-tru-va-du-lieu)
[![Architecture](https://img.shields.io/badge/Architecture-DDD%20Bounded%20Context%20%E2%86%92%20Cluster%20%E2%86%92%20Sub--Cluster-indigo)](#-kien-truc-phan-cap-4-tang-bounded-context)

<p align="center">
  <img src="public/canvas-testops-demo.png" alt="Canvas Note Engineer — Interactive Engineering Graph & SRE Incident Simulator" width="100%" />
</p>

> **Video Trực Quan Hóa Thực Tế (Screen Recording MP4)**: [Xem Video Thao Tác Canvas & Lan Truyền Sự Cố SRE](public/canvas-demo.mp4) *(Thao tác Zoom, Pan mượt mà, phân tách các Sub-Clusters và kích hoạt hạt xung lực lỗi Bug Vector Particle bò dọc dây nối DAG).*

---

## 1. Khái Niệm Cốt Lõi: Canvas Note Engineer Là Gì?

Khác với các ứng dụng vẽ sơ đồ phẳng (Miro, Excalidraw) hoặc ghi chú văn bản thuần túy (Obsidian, Notion), **Canvas Note Engineer** là một **Mặt Phẳng Không Gian Vô Cực Tương Tác (Interactive Spatial Canvas)** được lập trình dựa trên các nguyên lý chuẩn mực của **Domain-Driven Design (DDD)** và **Kỹ nghệ Độ tin cậy Hệ thống (SRE)**.

### Ba Giá Trị Khác Biệt Cốt Lõi:
1. **Phân Cấp Không Gian 4 Tầng (4-Tier Spatial Hierarchy)**: Không xếp chồng các khối hình phẳng hỗn loạn. Hệ thống tự động phân tách theo: `Domain (Bounded Context)` $\to$ `Service Cluster (Cụm Dịch Vụ Mẹ)` $\to$ `Sub-Cluster (Phân Cụm Hạ Tầng & Kiểm Thử)` $\to$ `Node Pods & Causal Edges`.
2. **Sơ Đồ Mạch Động (Dynamic Hardware/Protocol Schematics)**: Không dùng ảnh tĩnh. Mỗi node kỹ thuật sở hữu sơ đồ SVG hoạt họa mô phỏng trực tiếp nguyên lý phần cứng và giao thức (băng chuyền Kafka, ổ khóa Redis SETNX, piston ACID commit, bộ đếm Token Bucket).
3. **Mô Phỏng Sự Cố SRE & Cầu Nối TestOps**: Kích hoạt con bọ đỏ (Bug Vector Particle) bò dọc theo chuỗi DAG để thấy hiệu ứng domino khi dịch vụ sụp đổ, đồng thời tiếp nhận trực tiếp file kết quả từ **agentic-test-ops** để biến bug vô hình trên RAM thành bản đồ trực quan dễ hiểu.

---

## 2. Kiến Trúc Kỹ Thuật Toàn Cảnh (End-to-End Architecture)

```mermaid
flowchart TD
    subgraph ClientLayer ["Frontend: React 18 + SvgGridCanvas (Port :5173)"]
        UI["Infinite SvgGridCanvas (Pan, Zoom 0.25x - 2.5x)"]
        STORE["Zustand Store (useGraphStore)"]
        POD["ConceptNode & LucideIconPod (C4/ISO SVG Icons)"]
        SCHEMATIC["DynamicSchematic (SVG Animated Hardware Circuits)"]
        DRAWER["FieldNotesDrawer (RCA Dossier, 5-Step Reflex Drill)"]
        COLLISION["Client Cluster Engine (Bounding Box, Collision Avoidance)"]
        
        UI --> STORE
        STORE --> POD
        STORE --> SCHEMATIC
        STORE --> DRAWER
        STORE --> COLLISION
    end

    subgraph IngestionLayer ["Hai Nhánh Nạp Dữ Liệu (Dual Ingestion Engine)"]
        AST_BRANCH["Nhánh 1: Fast-Path Local AST Parser\n- Nạp file .canvas.json (0 token, ~5ms)\n- Bóc tách tag Markdown [DOMAIN], [CLUSTER]"]
        LLM_BRANCH["Nhánh 2: AI Semantic Ingestion\n- Chuột phải: Spawn Cluster / Brainstorm\n- Mở rộng kiến trúc, sinh ca kiểm thử"]
    end

    subgraph BackendLayer ["Backend: Express + Strategy Pattern + SQLite (Port :3001)"]
        API["Express API Server (/api/graph, /api/provider, /api/rag)"]
        STRATEGY["AI Provider Strategy (Anthropic, OpenAI, DeepSeek, Ollama, Mock)"]
        SQLITE["SQLite Database (data/knowledge.db)\n- WAL Mode (Write-Ahead Logging)\n- Zero-Token Cache (Idempotency Key SHA-256)"]
        
        API --> STRATEGY
        API --> SQLITE
    end

    AST_BRANCH -->|"Gửi Payload trực tiếp"| API
    LLM_BRANCH -->|"Gửi Prompt sinh kiến trúc"| STRATEGY
    STRATEGY -->|"Trả về GraphData (Nodes, Edges)"| API
    API -->|"Đồng bộ State (WebSocket / REST)"| STORE

    style ClientLayer fill:#f8fafc,stroke:#64748b,stroke-width:1px
    style IngestionLayer fill:#f0fdf4,stroke:#22c55e,stroke-width:1px
    style BackendLayer fill:#eff6ff,stroke:#3b82f6,stroke-width:1px
    style UI fill:#e2e8f0,stroke:#475569
    style STORE fill:#dbeafe,stroke:#3b82f6
    style AST_BRANCH fill:#dcfce7,stroke:#16a34a,stroke-width:2px
    style LLM_BRANCH fill:#ede9fe,stroke:#8b5cf6,stroke-width:2px
    style SQLITE fill:#fef3c7,stroke:#d97706
```

---

## 3. Kiến Trúc Phân Cấp 4 Tầng (Bounded Context Topology)

Hệ thống không sử dụng mô hình phẳng mà tổ chức không gian theo 4 cấp bậc rõ rệt:

```mermaid
flowchart TD
    subgraph DomainBoundary ["TẦNG 1: BOUNDED CONTEXT (Domain Nghiệp Vụ Tối Thượng)"]
        
        subgraph MasterCluster ["TẦNG 2: SERVICE CLUSTER (Cụm Dịch Vụ Mẹ)"]
            GATEWAY["Ingress API Gateway\n[GATEWAY / PEP]\nRate Limiting & Auth Token Verify"]
            ENGINE["Core Business Engine\n[CORE LOGIC]\nPure Invariant State Machine"]
            
            GATEWAY ==>|"Authenticated Payload"| ENGINE
        end

        subgraph InfraSubCluster ["TẦNG 3: SUB-CLUSTER (Phân Cụm Hạ Tầng Chuyên Biệt)"]
            REDIS["Distributed Lock & Cache\n[SUB-CLUSTER: REDIS]\nKey: lock:order:1001 (SETNX 10s)"]
            DB["ACID Ledger Database\n[SUB-CLUSTER: POSTGRES]\nTransaction Commit & Event Log"]
        end

        subgraph TestOpsSubCluster ["TẦNG 3 (Mở Rộng): SUB-CLUSTER KIỂM THỬ & SỰ CỐ"]
            TRACE["Playwright Browser Trace\n[playwright_trace]\nRoute: /checkout | Status: 500"]
            CDP["CDP RAM Heap State\n[root_cause_defect]\nsellerRank: null | file: orders.service.ts:142"]
            SHIELD["CI/CD Regression Shield\n[regression_shield]\nInvariant Guard Test Spec"]
            
            TRACE ==>|"DOM Error"| CDP
            CDP ==>|"Fix & Guard"| SHIELD
        end

        ENGINE -->|"Lock Resource"| REDIS
        ENGINE -->|"Persist State"| DB
    end

    style DomainBoundary fill:#fafafa,stroke:#64748b,stroke-dasharray: 5 5,stroke-width:2px
    style MasterCluster fill:#eff6ff,stroke:#3b82f6,stroke-width:1px
    style InfraSubCluster fill:#f0fdf4,stroke:#22c55e,stroke-width:1px
    style TestOpsSubCluster fill:#fff1f2,stroke:#f43f5e,stroke-width:1px
    style GATEWAY fill:#e0e7ff,stroke:#6366f1
    style ENGINE fill:#e0f2fe,stroke:#0284c7
    style REDIS fill:#ecfdf5,stroke:#059669
    style DB fill:#eff6ff,stroke:#2563eb
    style TRACE fill:#ecfeff,stroke:#06b6d4
    style CDP fill:#fff1f2,stroke:#f43f5e
    style SHIELD fill:#f5f3ff,stroke:#8b5cf6
```

### Ý Nghĩa Của Từng Tầng:
- **Tầng 1 - Bounded Context (Domain Boundary)**: Ranh giới nghiệp vụ độc lập (ví dụ: `Identity Platform`, `Payment Engine`, `TestOps E2E Suite`). Ngăn chặn rò rỉ trạng thái nội bộ sang các hệ thống khác.
- **Tầng 2 - Service Cluster (Cụm Dịch Vụ Mẹ)**: Bao bọc logic chính bao gồm các Gateway, Dispatcher, Business Logic Engine.
- **Tầng 3 - Sub-Clusters (Phân Cụm Hạ Tầng / Kiểm Thử)**: Các nhóm tài nguyên chuyên biệt nằm độc lập:
  - *Hạ tầng hệ thống*: `REDIS CACHE SUBSYSTEM`, `KAFKA MESSAGE STREAM`, `POSTGRES ACID LEDGER`.
  - *Kiểm thử TestOps*: `Ma Trận Kịch Bản (Test Scenarios)`, `Dấu Vết Trình Duyệt (Browser Trace)`, `Gốc Rễ RAM & Khiên Hồi Quy (RCA & Regression Shield)`.
- **Tầng 4 - Node Pods & Causal Edges**:
  - Từng thẻ bài đại diện cho một thành phần cụ thể với icon SVG chuẩn C4/ISO.
  - Các dây nối (Cubic Bezier Edges) thể hiện hướng luồng dữ liệu hoặc quan hệ nhân quả lỗi, có xung nhịp phát sáng chuyển động.

---

## 4. Cơ Chế Xử Lý Kép (Dual Ingestion Pipeline)

Hệ thống cung cấp hai cơ chế nạp tri thức độc lập, đáp ứng cả nhu cầu nạp nhanh tự động và sáng tạo bằng AI:

```mermaid
flowchart TD
    SOURCE["Nguồn Dữ Liệu Đầu Vào"] --> CHECK{"Loại Dữ Liệu?"}
    
    CHECK -->|"File .canvas.json hoặc Markdown có thẻ cấu trúc\n(Do TestOps, CLI, hoặc Script xuất ra)"| AST["Nhánh 1: Local AST Parser\n- Không gọi ra ngoài Internet\n- 0 Chi phí Tokens\n- Tốc độ xử lý: ~5 mili-giây\n- Đảm bảo 100% chính xác, không ảo giác"]
    
    CHECK -->|"Chuột phải trên Canvas -> 'Spawn Cluster'\nhoặc Gõ Prompt tự do (Brainstorm ý tưởng)"| LLM["Nhánh 2: LLM Provider Strategy\n- Cắm Claude, DeepSeek, OpenAI, Ollama\n- Phân tích ngữ nghĩa chuyên sâu (1-3s)\n- Tự sinh Bounded Context & Sub-Clusters\n- Tự tạo 5 câu hỏi sát hạch phản xạ kiến trúc"]

    AST --> LAYOUT["Thuật toán Tính Toán Bounding Box & Tránh Va Chạm (clusterEngine.ts)"]
    LLM --> LAYOUT
    
    LAYOUT --> RENDER["Hiển thị lên Mặt Phẳng Vô Cực (SvgGridCanvas)\n- Thẻ Node Pod & Dynamic Schematic SVG\n- Tự động lưu cache bền vững vào SQLite WAL"]

    style SOURCE fill:#f1f5f9,stroke:#64748b
    style AST fill:#dcfce7,stroke:#16a34a,stroke-width:2px
    style LLM fill:#eff6ff,stroke:#2563eb,stroke-width:2px
    style LAYOUT fill:#fef3c7,stroke:#d97706
    style RENDER fill:#fae8ff,stroke:#c026d3,stroke-width:2px
```

### Bảng So Sánh Hai Nhánh Xử Lý:

| Đặc Tính | Nhánh 1: Local AST Parser ("Fast-Path") | Nhánh 2: AI Semantic Ingestion |
|---|---|---|
| **Điều kiện kích hoạt** | Kéo thả file `.canvas.json` từ `agentic-test-ops` hoặc file Markdown chứa tag `[DOMAIN]`, `[CLUSTER]`. | Bấm chuột phải chọn `Spawn Cluster (Agent)` hoặc `Spawn Concept`. |
| **Tiêu tốn Token** | **0 Tokens** *(Hoàn toàn miễn phí)* | Tốn tokens gọi API LLM (OpenAI / Claude / DeepSeek). |
| **Thời gian nạp** | **~5 mili-giây** *(Tức thì, không độ trễ)* | 1.5s – 3.5s (Phụ thuộc mạng & LLM). |
| **Độ tin cậy** | **100% Deterministic** (Chính xác tuyệt đối theo schema). | Phụ thuộc độ hiểu ngữ cảnh của mô hình. |
| **Ứng dụng chính** | Hiển thị báo cáo kiểm thử TestOps, kiểm toán sự cố SRE. | Thiết kế kiến trúc mới, mở rộng ý tưởng hệ thống. |

---

## 5. Mô Phỏng Sự Cố SRE & Cầu Nối TestOps

### 5.1. Chuỗi Lan Truyền Sự Cố SRE (Cascading Failure Simulator)

```mermaid
flowchart LR
    INCIDENT["Kích hoạt Sự Cố: Click Con Bọ 🐛\n(Out of Memory / DB Timeout)"] -->|"Phát tán Bug Vector"| NODE_A["Node A: API Gateway\nTrạng thái: 504 Gateway Timeout"]
    
    NODE_A -->|"Lan truyền theo DAG"| NODE_B["Node B: Order Worker\nQueue Backlog tăng vọt (> 10k messages)"]
    
    NODE_B -->|"Quá tải kết nối"| NODE_C["Node C: PostgreSQL Primary DB\nActive Connections: 100% Max Pool"]
    
    NODE_A -.->|"Cơ chế Bảo Vệ (Circuit Breaker Tripped)"| ISOLATION["Cô Lập Lỗi Cục Bộ (Bounded Isolation)\n- Ngắt kết nối tới DB quá tải\n- Trả fallback response 429 / 503\n- Bảo vệ các Domain khác an toàn"]

    style INCIDENT fill:#fee2e2,stroke:#ef4444,stroke-width:2px
    style NODE_A fill:#fff1f2,stroke:#f43f5e
    style NODE_B fill:#fef3c7,stroke:#d97706
    style NODE_C fill:#fee2e2,stroke:#b91c1c
    style ISOLATION fill:#ecfdf5,stroke:#059669,stroke-width:2px
```

- Khi click vào nút **🐛** trên bất kỳ thẻ sự cố nào, hệ thống kích hoạt **Bug Vector Particle**: một hạt sáng đỏ chuyển động dọc theo các dây nối DAG sang các node hạ nguồn.
- Giúp trực quan hóa ngay lập tức: *Nếu Redis chết, dịch vụ nào sẽ sập tiếp theo? Liệu Circuit Breaker có kịp ngắt để cứu database hay không?*

---

### 5.2. Đồng Bộ Báo Cáo Kiểm Thử Với `agentic-test-ops`

Khi plugin kiểm thử **[justpassingByte/agentic-test-ops](https://github.com/justpassingByte/agentic-test-ops)** chạy xong kịch bản đơn luồng hoặc quét xuyên đêm (`/overnight`), file `.canvas.json` xuất ra sẽ được Canvas Note Engineer dựng thành các phân cụm trực quan:

```mermaid
flowchart TD
    TEST_RUN["agentic-test-ops: Chạy Test Suite / Overnight Sweep"] --> EXPORT["Tool: debug_export_rag_report / debug_export_overnight_report"]
    
    EXPORT -->|"1. Xuất file JSON"| JSON_FILE["rag/*.canvas.json\n(Chuẩn SpawnClusterPayload)"]
    
    JSON_FILE -->|"2. Kéo thả vào UI Canvas"| CANVAS_IN["Canvas Note Engineer: /api/rag/ingest"]
    
    CANVAS_IN --> RENDER_BOARD["Bản Đồ Trực Quan Tự Động Phân Cụm:"]
    
    subgraph VisualClusters ["Không Gian Trực Quan (3 hoặc 7 Sub-Clusters)"]
        SC1["📋 Sub-Cluster 1: Ma Trận Ca Kiểm Thử\n- Thẻ Xanh: TC Passed (200 OK, 112ms)\n- Thẻ Đỏ: TC Failed (500 Error, 315ms)"]
        SC2["🎭 Sub-Cluster 2: Dấu Vết Trình Duyệt\n- Route /cart, Click, Fill\n- Ảnh chụp lỗi Screenshot"]
        SC3["🔍 Sub-Cluster 3: Phân Tích Gốc Rễ RAM\n- Giá trị biến Heap: sellerRank = null\n- Con bọ bug đỏ chỉ file & dòng code\n- Khiên tím bảo vệ hồi quy CI/CD"]
    end
    
    RENDER_BOARD --> SC1
    RENDER_BOARD --> SC2
    RENDER_BOARD --> SC3

    style TEST_RUN fill:#f8fafc,stroke:#475569
    style EXPORT fill:#e0e7ff,stroke:#6366f1
    style JSON_FILE fill:#fae8ff,stroke:#d946ef
    style CANVAS_IN fill:#dcfce7,stroke:#16a34a
    style VisualClusters fill:#f8fafc,stroke:#94a3b8
    style SC1 fill:#eef2ff,stroke:#6366f1
    style SC2 fill:#ecfeff,stroke:#06b6d4
    style SC3 fill:#fff1f2,stroke:#f43f5e
```

### Bảng 5 Thẻ Pod Kiểm Thử Chuyên Biệt:

| Tên Badge Pod | Biểu Tượng SVG | Màu Sắc | Dữ Liệu Hiển Thị Bên Trong Thẻ |
|---|---|---|---|
| **`test_case_passed`** | CheckCircle2 | Xanh Emerald (`#10b981`) | Mã ca test, tên kịch bản, thời gian phản hồi (latency), kết quả PASS. |
| **`test_case_failed`** | AlertOctagon | Đỏ Rose (`#f43f5e`) | Mã ca test, mô tả ngoại lệ, mã HTTP 500, kết quả FAIL. |
| **`playwright_trace`** | AppWindow | Xanh Cyan (`#06b6d4`) | Route URL (`/cart`), hành động DOM (click, fill), đường dẫn ảnh chụp màn hình. |
| **`root_cause_defect`** | Beetle Bug | Đỏ Rose (`#ef4444`) | Tên file (`orders.service.ts`), dòng lỗi (`142`), hàm (`applyVoucher`), và **giá trị biến RAM heap** (`sellerRank = null`). |
| **`regression_shield`** | ShieldCheck | Tím Violet (`#8b5cf6`) | Tên file test hồi quy tự động sinh, trạng thái bảo vệ CI/CD Gate. |

---

## 6. Quick Start Trong 60 Giây (Zero-Bullshit Setup)

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

- 🌐 **Frontend Dev UI**: [`http://localhost:5173`](http://localhost:5173)
- 🚀 **Backend REST API**: [`http://localhost:3001`](http://localhost:3001)
- 🗄️ **Database SQLite WAL**: Tự động tạo tại `data/knowledge.db` (mở xem trực tiếp bằng DBeaver hoặc SQLite Viewer).

---

## 7. Thao Tác Chuột & Phím Tắt Nhanh (Canvas Cheat Sheet)

| Thao tác | Hành vi trên Canvas |
|---|---|
| **Chuột phải (Vùng trống)** | Mở Context Menu: Chọn `Spawn Cluster (Agent)` hoặc `Spawn Concept (Agent)` $\to$ Hiện popup nhập prompt $\to$ **Enter** để sinh cụm kiến trúc. |
| **Chuột phải (Lên Node)** | Mở Context Menu theo Node: Spawn cụm mới nối từ node này, mở Field Notes, thu gọn nhánh con, hoặc xóa node. |
| **Kéo rê chuột trái (Pan)** | Di chuyển góc nhìn camera trên mặt giấy vô hạn. |
| **Cuộn chuột (Zoom)** | Phóng to / Thu nhỏ mượt mà theo tâm con trỏ chuột (0.25x - 2.5x). |
| **Kéo thả Node** | Nhấn giữ chuột trái vào thẻ Node để dời vị trí $\to$ Tự động lưu tọa độ vào SQLite khi buông chuột. |
| **Kéo thả Cụm** | Nhấn giữ vào thẻ tiêu đề Cụm (`⋮⋮ TÊN CỤM`) để dời đồng loạt toàn bộ các node bên trong cụm. |
| **Click vào Node** | Mở **Field Notes Drawer**: Khám phá bản chất, sơ đồ động, hồ sơ sự cố (Incident Dossier) và chuỗi 5 câu hỏi sát hạch phản xạ kiến trúc sư. |
| **Click nút 🐛 trên Thẻ Sự cố** | Kích hoạt mô phỏng sóng lan truyền sự cố: Hạt xung lực đỏ (Bug Vector Particle) bò dọc theo dây nối DAG. |

---

## 8. Bản Đồ Codebase Dành Cho Hacker & Kỹ Sư (Hacker's Code Map)

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

## 9. Cắm AI / LLM Provider Của Riêng Bạn (Bring Your Own Model)

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

## 10. Hướng Dẫn Thêm Tính Năng Tự Vọc (Hacker's Extension Recipes)

### 1. Thêm một Biểu tượng Kỹ thuật SVG mới (Custom Icon)
- Mở `frontend/src/components/NodePod/LucideIconPod.tsx`.
- Thêm một `case` mới vào hàm `LucideIconPod` và vẽ SVG theo sở thích:
```tsx
case 'my_custom_service':
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="4" y="4" width="24" height="24" rx="4" />
      {/* Thêm các đường vector của bạn */}
    </svg>
  );
```

### 2. Thêm một Sơ đồ Mạch Động Mới (Custom Schematic Animation)
- Mở `frontend/src/components/Animation/DynamicSchematic.tsx`.
- Thêm một case mới tương ứng với mã hiệu trong thuộc tính hoạt họa:
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
- Mở `backend/src/tools/toolHandlers.ts`.
- Hàm `sanitizeNodeLayerLabel` quyết định nhãn badge màu sắc (`GATEWAY / INGRESS`, `EVENT STREAM / TOPIC`, `STORAGE / ACID DB`). Bạn có thể thêm từ khóa nhận diện mới chỉ với 2 dòng:
```ts
if (textToCheck.includes('my-custom-keyword')) {
  return 'CUSTOM / LAYER';
}
```

---

## 11. Bộ Lệnh Hữu Ích (Developer Cheatsheet)

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

## 12. Bản Quyền & Đóng Góp
Dự án được xây dựng dưới triết lý mã nguồn mở dành cho cộng đồng Kỹ sư Phần mềm yêu thích kiến trúc hệ thống, distributed systems và agentic workflows. Mọi đóng góp (PR, Issue, Ideas) đều được nhiệt liệt hoan nghênh!
