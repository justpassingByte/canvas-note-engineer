# 📐 Canvas Note Engineer (Sổ Tay Kỹ Sư Kiến Trúc)

> **Interactive Engineering Knowledge Graph & Architecture Field Notebook**  
> Thiết kế đặc quyền cho Kỹ sư Phần mềm, Kiến trúc sư Hệ thống (System Architects) và Tích hợp Trợ lý Lập trình AI (**Antigravity / DeepSeek Harness**).

[![GitHub](https://img.shields.io/badge/GitHub-justpassingByte%2Fcanvas--note--engineer-blue?logo=github)](https://github.com/justpassingByte/canvas-note-engineer)
[![Tech Stack](https://img.shields.io/badge/Stack-React%2018%20%7C%20TypeScript%20%7C%20Zustand%20%7C%20Express%20%7C%20SQLite%20WAL-green)](#-cong-nghe-su-dung)
[![Tests](https://img.shields.io/badge/Tests-55%2F55%20Passed%20(100%25)-brightgreen)](#-kiem-thu-tu-dong-toan-dien)
[![Zero-Token Caching](https://img.shields.io/badge/AI-Zero--Token%20Cache-orange)](#-tinh-nang-dot-pha)

---

## 📖 Giới Thiệu Tổng Quan

Thay vì tài liệu tĩnh dạng chữ dài dòng hoặc sơ đồ tư duy (mindmap) chung chung, **Canvas Note Engineer** là không gian làm việc số hóa mô phỏng **Sổ tay Kỹ sư thực chiến**. Hệ thống mổ xẻ các sự cố vận hành phân tán (Distributed Incidents), xung đột tương tranh (**Race Conditions**, **Deadlocks**, **Retry Storms**), và các mẫu thiết kế phòng thủ (**Idempotency**, **Distributed Lock**, **Message Queue Buffer**, **Zero-Trust PEP/PDP**, **Audit Trail Immutability**) trên mặt giấy kỹ thuật số vô hạn (Infinite Technical Grid Canvas).

---

## 🌟 Tính Năng Đột Phá

### 1. Chuẩn Hóa Tầng Công Nghệ (Architectural Layer Standard)
- **Tuyệt đối loại bỏ số thứ tự tuyến tính**: Đồ thị kiến trúc là đồ thị DAG đa nhánh, đa cha (Multi-Parent Directed Acyclic Graph). Tiền tố số bước tuyến tính cũ (`BƯỚC 1 //`, `BƯỚC 2 //`) đã được thay thế hoàn toàn bằng **Tầng Công Nghệ chuẩn mực**:
  - `GATEWAY / INGRESS`: Cổng đón gói tin, Webhook Ingress, Reverse Proxy.
  - `COMPUTE / CONCURRENCY`: Phan luồng xử lý, điểm xung đột tài nguyên song song.
  - `SECURITY / IDEMPOTENCY`: Lá chắn khóa định danh UUID v4 chống trừ tiền lặp.
  - `STORAGE / ACID DB`: Trụ bảo chứng toàn vẹn dữ liệu, Row Lock & Unique Index.
  - `ASYNC / QUEUE BUFFER`: Hàng đợi điều tiết đỉnh tải (Kafka / RabbitMQ).
  - `CACHE / DISTRIBUTED LOCK`: Khóa phân tán đơn luồng RAM 1ms (Redis SETNX).
  - `EDGE / WAF RATE LIMIT`: Tường lửa ứng dụng và thuật toán Token Bucket chống DDoS.
  - `SECURITY / ZERO-TRUST`: Xác thực mTLS & Phân quyền Policy Enforcement Point.
  - `OBSERVABILITY / AUDIT LOG`: Sổ cái kiểm toán tài chính Append-Only bất biến.
  - `DOMAIN / E-COMMERCE`: Miền nghiệp vụ thực tế (Flash Sale tranh mua vé).

### 2. Luồng Giao Thức Kỹ Thuật (Technical Protocol Flows)
- Nhãn trên các dây liên kết (`edges.nhan`) định danh chính xác giao thức tương tác thực tế thay cho các số thứ tự gây nhầm lẫn:
  - `Webhook Timeout Retry`
  - `Atomic Lock Check`
  - `ACID Write / Unique Index`
  - `Async Event Produce`
  - `Batched DB Flush`
  - `Distributed Lock Acquire`
  - `Async Audit Stream`
  - `Cryptographic Hash Verification`

### 3. Cơ Chế 3 Lớp Chặn Số Bước Cho Agent (Auto-Sanitizer Runtime)
Đảm bảo mọi Agent AI (Antigravity, DeepSeek, Gemini) khi sinh (spawn) hoặc mở rộng (expand) đồ thị kiến trúc đều tự động tuân thủ:
1. **Lớp 1 (Chỉ thị Agent & Skill)**: [`GEMINI.md`](GEMINI.md) và [`SKILL.md`](.agents/plugins/canvas-note-engineer/skills/canvas-engineer/SKILL.md) cấm tuyệt đối sinh tiền tố số bước.
2. **Lớp 2 (Runtime Sanitization Engine)**: Bộ lọc `sanitizeNodeLayerLabel` và `sanitizeProtocolEdgeLabel` tại [`backend/src/tools/toolHandlers.ts`](backend/src/tools/toolHandlers.ts) tự động cắt bỏ số thứ tự và map về Layer & Protocol Flow chuẩn.
3. **Lớp 3 (Chốt chặn SQLite Persistence)**: [`backend/src/db/sqliteClient.ts`](backend/src/db/sqliteClient.ts) tự động làm sạch mọi nhãn trước khi ghi vào đĩa cứng.

### 4. Chặn Trùng Lặp Tuyệt Đối (Zero-Duplicate Guard)
- Khi mở rộng hoặc sinh thêm các thành phần như Audit Log, WAF, Zero-Trust, Database, Cache, hoặc Queue, hệ thống tái sử dụng trực tiếp các trụ hạ tầng cốt lõi sẵn có thông qua quan hệ **Multi-Parent DAG**, chống phân mảnh và tránh trùng lặp thị giác.

### 5. Thu Gọn / Mở Rộng Nhánh Con Độc Lập (DAG-Safe 1-Click Collapse Pill)
- Nút bấm Pill ở chân thẻ node (`.nut-thu-gon-pill`) cho phép thu gọn/mở rộng toàn bộ nhánh con phân cấp chỉ với 1 click.
- Thiết kế **DAG-Safe**: Trạng thái thu gọn chỉ lưu trên node cha, không can thiệp đè cờ lên các node con trong SQLite. Giữ nguyên vẹn tính hiển thị của các nhánh khi reload trang (`F5`).
- Gỡ bỏ nút `+` trên góc Icon Pod để tránh hoàn toàn việc bấm nhầm.

### 6. Sinh Cụm Phân Hệ Song Song (Compact Intent Schema)
- Menu chuột phải trên Canvas cung cấp 2 chế độ:
  - ⚡ **Sinh Cụm Phân Hệ Hoàn Chỉnh**: Cụm WAF & Rate Limiting, Cụm Xác thực Zero-Trust, Cụm Kiểm Toán & Ký Số.
  - ➕ **Sinh Node Đơn Lẻ**: Bổ sung linh hoạt từng thành phần độc lập.
- **Compact Intent Schema**: Agent chỉ cần phát intent ngắn gọn, hệ thống tự động tính toán layout 2D, viền bounding box và cắm dây liên kết với hạ tầng dùng chung, tiết kiệm **>85% token**.

### 7. Tự Động Gắn Tooltip Thuật Ngữ 0-Token (Hybrid Auto-Linker)
- Hơn **70+ thuật ngữ kỹ thuật chuyên sâu** (WAF, Token Bucket, Sliding Window, mTLS, PEP, PDP, Merkle Tree, Hash Chain, Row Lock, ACID, SETNX...).
- Frontend tự động quét từ khóa trong văn bản thuần bên ngoài thẻ HTML để bọc `<u data-tooltip="...">`. Người dùng rê chuột (hover) là thấy ngay định nghĩa cốt lõi mà Agent **tiêu thụ 0 token**.

### 8. Lược Đồ Chuyển Động Trực Quan (Dynamic Schematics)
- Drawer ghi chép kỹ thuật (520px) tích hợp hoạt họa SVG tương tác mô phỏng gói tin: va chạm tranh chấp, chắn lọc khiên, hàng đợi đệm, chuỗi băm Merkle bất biến.

### 9. Ôn Tập Phản Xạ (Active Recall Mode) & Reflex Quiz
- Bật chế độ "Ôn tập" trên thanh công cụ: Tiêu đề các node lập tức ẩn thành `[ ? ]`. Click vào node để kiểm tra trí nhớ.
- Đi kèm câu hỏi trắc nghiệm tình huống thực chiến tại chân Drawer.

---

## 🛠️ Công Nghệ Sử Dụng

| Tầng | Công nghệ cốt lõi | Vai trò |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite | Giao diện đồ thị SVG Canvas, Cubic Bezier routing, CSS Token Design |
| **State Management** | Zustand | Quản lý trạng thái đồ thị, Active Recall, Zoom/Pan, Drawer, Liveness |
| **Backend** | Node.js, Express, TypeScript | REST API, Dynamic Spawning Engine, 3-Layer Edge Sanitizer |
| **Database** | SQLite (`better-sqlite3`) | Lưu trữ WAL journal mode, ACID transaction, Zero-Token caching |
| **Testing** | Vitest, Playwright | 44 Unit/Integration tests, 11 End-to-End browser tests |
| **AI Integration** | Antigravity, DeepSeek Harness | Slash command router (`/canvas`, `/test`, `/e2e`, `/commit`...) |

---

## 📁 Cấu Trúc Thư Mục

```text
canvas-note-engineer/
├── .agents/                               # Antigravity Skills & Plugin Configs
│   ├── plugins/canvas-note-engineer/      # Kỹ năng /canvas điều khiển đồ thị
│   │   └── skills/canvas-engineer/
│   │       ├── SKILL.md                   # Quy chuẩn sinh Node & Edge cho Agent
│   │       └── scripts/canvas-cli.mjs     # CLI controller (status, open, expand, export)
│   └── skills/                            # Các kỹ năng bổ trợ (e2e-test-engine, git-assistant...)
├── backend/                               # Máy chủ Backend & Cơ sở dữ liệu SQLite
│   ├── data/
│   │   └── knowledge.db                   # SQLite WAL Database (Persistent Graph State)
│   └── src/
│       ├── __tests__/                     # Bộ test tích hợp (Database, Spawning, Sanitizer)
│       ├── data/defaultGraph.ts           # Đồ thị hạt giống chuẩn kiến trúc (Seed Graph)
│       ├── db/sqliteClient.ts             # SQLite Client với cơ chế DAG-Safe Collapse
│       ├── tools/toolHandlers.ts          # Auto-Sanitizer & Cluster Spawning Engine
│       └── types/graphTypes.ts            # TypeScript Interfaces & Compact Schemas
├── frontend/                              # Ứng dụng Webview Client
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas/SvgGridCanvas.tsx   # Mặt giấy vẽ SVG, Bounding Box, Context Menu
│   │   │   ├── Drawer/FieldNotesDrawer.tsx# Sổ tay kỹ thuật chi tiết & Dynamic Schematic
│   │   │   ├── NodePod/ConceptNode.tsx    # Card kiến trúc, Layer badge, Collapse Pill
│   │   │   └── Toolbar/FloatingToolbar.tsx# Zoom, Active Recall, Export, Sinh Node
│   │   ├── data/initialGraph.ts           # Dữ liệu đồ thị client fallback
│   │   ├── dictionary/technicalDictionary.ts # Từ điển 70+ thuật ngữ kỹ thuật
│   │   ├── store/useGraphStore.ts         # Zustand Global Store & DAG Liveness
│   │   └── styles/                        # canvas.css, drawer.css, node.css
├── tests/e2e/canvas_drawer.spec.ts        # Bộ test Playwright E2E 100% tự động
├── GEMINI.md                              # Hướng dẫn định tuyến lệnh & quy tắc Agent
└── package.json                           # Root scripts điều phối toàn bộ dự án
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Yêu Cầu Môi Trường
- **Node.js** >= 18.0.0
- **npm** (đi kèm Node.js)

### 2. Cài Đặt Dependencies
Chạy lệnh cài đặt đồng thời cho Root, Frontend và Backend:

```bash
# Cài đặt tại thư mục gốc
npm install

# Cài đặt cho frontend và backend
npm run --prefix frontend install
npm run --prefix backend install
```

### 3. Khởi Chạy Môi Trường Phát Triển (Development)
Chạy lệnh duy nhất để bật song song cả máy chủ Backend và giao diện Frontend:

```bash
npm run dev
# hoặc:
npm run dev:all
```

* **Frontend Webview**: [`http://localhost:5173`](http://localhost:5173)
* **Backend REST API**: [`http://localhost:3001`](http://localhost:3001)

### 4. Build Bản Phân Phối (Production Build)
```bash
npm run build
```
Lệnh này sẽ biên dịch TypeScript backend và đóng gói ứng dụng frontend vào thư mục `frontend/dist/`.

---

## 🧪 Kiểm Thử Tự Động Toàn Diện

Dự án sở hữu ma trận kiểm thử 2 tầng hoàn chỉnh, đảm bảo không có bất kỳ hồi quy (regression) nào:

```bash
# Chạy toàn bộ test (Vitest Unit/Integration + Playwright E2E)
npm run test:all

# Chạy riêng Unit & Integration Tests (Vitest)
npm test

# Chạy riêng End-to-End Tests trên trình duyệt thật (Playwright)
npm run test:e2e
```

### Ma Trận Kết Quả Kiểm Thử (55/55 Tests Xanh Lá)

| Bộ Kiểm Thử | Số Lượng | Trạng Thái | Nội Dung Kiểm Chứng |
| :--- | :--- | :--- | :--- |
| **Backend REST API** | 7 tests | **PASS (100%)** | `health`, `current`, `expand`, `prune`, `spawn`, `spawn-cluster`, `reset` |
| **Database Real SQLite WAL** | 5 tests | **PASS (100%)** | Ghi đĩa thực, chế độ WAL, ACID transaction, DAG-Safe collapse |
| **Dynamic Spawning & Capacity**| 7 tests | **PASS (100%)** | Chống DDoS, Audit Log (`ghi_chep_so_sach`), Capacity Cap (12 nodes) |
| **SQLite Cache Integration** | 4 tests | **PASS (100%)** | Delta nodes, Saturation lock, xóa đệ quy mồ côi |
| **3-Layer Edge Sanitizer** | 5 tests | **PASS (100%)** | Chống tự trỏ, chống ID ma, chống chu trình A $\to$ B $\to$ A, chuẩn hóa nhãn |
| **Spawn Cluster Integration** | 2 tests | **PASS (100%)** | Compact schema, liên kết nội bộ, tự động nối hạ tầng dùng chung |
| **Geometry Bezier Curves** | 6 tests | **PASS (100%)** | Auto-anchor 4 cổng thẻ, đường cong mượt mà không va chạm |
| **Cluster Engine Bounding Box** | 4 tests | **PASS (100%)** | Bounding box 2D, cô lập không gian, theme màu nhận diện |
| **Technical Dictionary** | 4 tests | **PASS (100%)** | 70+ từ khóa, quét tự động văn bản thuần, không bọc đúp |
| **Playwright E2E Test Suite** | 11 tests | **PASS (100%)** | Seed nodes, Drawer, Zoom, Recall, 1-Click Collapse Pill, Multi-Parent DAG, Cluster Spawning, **Architectural Layer Badges & Protocol Flows Without Step Numbers / No Plus Button** |
| **TỔNG CỘNG** | **55 tests** | **100% GREEN** | **Không có lỗi, không có warning rò rỉ bộ nhớ!** |

---

## 🎮 Hướng Dẫn Sử Dụng

### Thao Tác Trực Tiếp Trên Canvas
1. **Xem Chi Tiết Khái Niệm**: Bấm vào bất kỳ thẻ node nào để trượt mở Sổ Tay Kỹ Thuật (Drawer) bên phải, xem lược đồ chuyển động và phân tích rủi ro.
2. **Thu Gọn / Mở Nhánh Con**: Bấm nút Pill ở chân node cha (ví dụ: `Thu gọn (3)`) để giấu hoặc hiện các nhánh con phụ thuộc.
3. **Mở Rộng Nhánh Mới**: Bấm nút `+ Mở rộng nhánh` trên thanh công cụ để bổ sung Queue và Cache vào hệ thống (tiết kiệm token).
4. **Sinh Cụm Kiến Trúc Bằng Chuột Phải**: Nhấp chuột phải vào bất kỳ khoảng trống nào trên mặt giấy Canvas để mở Context Menu, chọn sinh cụm phân hệ WAF, Zero-Trust hoặc Audit Log.
5. **Chế Độ Ôn Tập (Active Recall)**: Bấm nút `Ôn tập` trên toolbar, toàn bộ tên khối sẽ bị che mờ bằng `[ ? ]`. Bấm vào khối để mở đáp án ghi nhớ.
6. **Xuất Báo Cáo**: Bấm nút `Xuất` trên toolbar để sao chép sơ đồ Mermaid hoặc mã nguồn Obsidian Markdown có sẵn `[[Wikilinks]]`.

### Điều Khiển Qua Antigravity Slash Commands
Trong cửa sổ trò chuyện với trợ lý AI, sử dụng các lệnh tắt:
- `/canvas status`: Xem số lượng Node/Edge, dung lượng SQLite và tỷ lệ bão hòa khai phá.
- `/canvas open`: Khởi chạy trình duyệt mở Canvas.
- `/canvas query <từ_khóa>`: Tra cứu nhanh phân loại, bản chất kỹ thuật và rủi ro của khái niệm.
- `/canvas expand <node-id>`: Yêu cầu mở rộng nhánh delta trực tiếp vào SQLite.
- `/canvas export mermaid`: Xuất sơ đồ sang định dạng Mermaid copy-paste.
- `/canvas export obsidian`: Xuất toàn bộ sổ tay kiến trúc thành tài liệu Obsidian Markdown.
- `/test`: Tự động chạy bộ test Vitest.
- `/e2e`: Khởi chạy Playwright kiểm thử trình duyệt thực tế.

---

## 📜 Giấy Phép (License)

Dự án được phân phối dưới giấy phép **MIT License** © 2026 [justpassingByte](https://github.com/justpassingByte). Phát triển với sự hỗ trợ đắc lực từ mô hình đôi cặp lập trình **Antigravity**.
