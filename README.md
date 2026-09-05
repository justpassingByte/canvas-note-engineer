# 📐 Canvas Note Engineer

> **Interactive Engineering Knowledge Graph, SRE Incident Simulator & Architecture Field Notebook**  
> Thiết kế đặc quyền cho Kỹ sư Phần mềm, Kiến trúc sư Hệ thống (System Architects) và Tích hợp Trợ lý Lập trình AI (**Antigravity / DeepSeek Harness**).

[![Tech Stack](https://img.shields.io/badge/Stack-React%2018%20%7C%20TypeScript%20%7C%20Zustand%20%7C%20Express%20%7C%20SQLite%20WAL-green)](#-cong-nghe-su-dung)
[![Tests](https://img.shields.io/badge/Tests-49%2F49%20Passed%20(100%25)-brightgreen)](#-kiem-thu-tu-dong-toan-dien)
[![Quality Gate](https://img.shields.io/badge/Quality%20Gate-2--Phase%20Self--Review-purple)](#-vong-lap-self-review--quality-gate-tu-danh-gia--hieu-chinh-kien-truc)
[![Zero-Token Caching](https://img.shields.io/badge/AI-Zero--Token%20Cache-orange)](#-tinh-nang-dot-pha)
[![Architecture](https://img.shields.io/badge/Architecture-Domain%20%E2%86%92%20Cluster%20%E2%86%92%20Sub--Cluster-indigo)](#-kien-truc-phan-cap-hierarchical-architecture)

---

## 📖 Giới Thiệu Tổng Quan

**Canvas Note Engineer** là không gian làm việc số hóa mô phỏng **Field Notes & Live SRE Disaster Simulator**. Hệ thống mổ xẻ các sự cố vận hành phân tán (Distributed Incidents), xung đột tương tranh (**Race Conditions**, **Deadlocks**, **Retry Storms**), và các mẫu thiết kế phòng thủ (**Idempotency**, **Distributed Lock**, **Message Queue Buffer**, **Zero-Trust PEP/PDP**, **Audit Trail Immutability**, **Two-Phase Reservation**, **Penny Rounding Protection**) trên mặt giấy kỹ thuật số vô hạn (Infinite Technical Grid Canvas).

Hệ thống được trang bị:
1. **RAG Brainstorm Ingestion Engine**: Nạp trực tiếp tài liệu RFC / Markdown / Mermaid và tự động bóc tách thành sơ đồ phân cấp DDD.
2. **Kiến trúc Phân Cấp Bounded Context**: Tách bạch rõ rệt giữa Domain $\to$ Service Cluster $\to$ Sub-Clusters hạ tầng chuyên biệt.
3. **Vòng lặp Self-Review & Quality Gate 2 Pha**: Tự động phát hiện và loại bỏ các anti-patterns (HTTP verbs, mã lỗi 200 OK, payload cookies) để nâng cấp thành các component kiến trúc chuẩn.
4. **Hồ Sơ Sự Cố Khép Kín (Unified Incident Case Dossiers)**: Gom nhóm bối cảnh tải (Traffic Profile), nguyên nhân gốc rễ (RCA), bán kính thiệt hại (Blast Radius), kịch bản lan truyền và giải pháp phòng thủ (Mitigation Strategy).
5. **Mô Phỏng Lan Truyền Sóng Sự Cố (Failure Cascade Simulator)**: Con bọ đỏ (🐛 Bug Vector Particle) bò dọc theo đường cong dây nối SVG theo chiều có hướng của đồ thị DAG.
6. **Chuỗi 5 Câu Hỏi Sát Hạch Đánh Đố (5-Step Continuous Reflex Drill)**: Thử thách phản xạ kiến trúc sư với các bẫy tư duy kỹ thuật sâu sắc.
7. **Kéo Thả Tự Do (Node & Cluster Drag & Drop)**: Di chuyển tự do từng Node hoặc toàn bộ Cụm kèm lưu trữ bền vững 0-token SQLite WAL.
8. **Biểu Tượng Quy Ước Quốc Tế (ISO/C4 Vector SVGs)**: Trụ Database 3 tầng, Chip CPU 4 hướng chân rết, Thanh RAM PCB...

---

## 🏛️ Kiến Trúc Phân Cấp (Hierarchical Architecture & Bounded Context)

Mô hình dữ liệu loại bỏ tư duy phẳng hóa (Flat Architecture), tổ chức hệ thống theo 3 cấp độ đóng gói chuẩn Domain-Driven Design:

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
                                    │  (Verify JWT via JWKS / mTLS)
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

### 1. Phân Tầng Mô Hình Dữ Liệu (`NodeEntity`)
* **`domain_id`**: Định danh Bounded Context miền nghiệp vụ (vd: `domain-auth`, `domain-payment`, `domain-shared-infra`).
* **`cluster_id`**: Định danh Cụm Dịch Vụ chính (vd: `cum-oidc-identity-service`, `cum-shared-infrastructure`).
* **`sub_cluster_id`**: Định danh Phân Hệ Hạ Tầng Cục Bộ (vd: `sub-auth-redis`, `sub-payment-lock`).
* **`is_public_interface`**: Đánh dấu Cổng Đối Ngoại công khai (PEP Gateway, JWKS Endpoint, Webhook Ingress).
* **`infra_type`**: Định danh hạ tầng thực tế (`redis`, `postgres`, `kafka`, `service`, `gateway`, `worker`).

### 2. Bộ Lọc Chống "Cross-Wiring" Xuyên Cụm (Bounded Context Isolation)
* **Chặn tuyệt đối** việc cắm dây từ Service của một Domain sang trực tiếp Sub-Cluster nội tạng của Domain khác (vd: cấm Payment chọc thẳng vào Token Revocation Blacklist của Auth).
* **Giao tiếp liên Domain** bắt buộc phải thông qua **Cổng Đối Ngoại Công Khai** (`is_public_interface: true`, vd: mTLS / JWKS) hoặc trỏ về **Cụm Hạ Tầng Dùng Chung** (`cum-shared-infrastructure`).

---

## 🛡️ Vòng Lặp Self-Review & Quality Gate (Tự Đánh Giá & Hiệu Chỉnh Kiến Trúc)

Nhằm giải quyết triệt để lỗi sinh node sai bản chất (nhầm lẫn giữa luồng truyền tin HTTP/Cookie/Tên hàm với Thành phần Kiến trúc), hệ thống tích hợp **Quy trình Ingestion 2 Pha (2-Phase Ingestion Quality Gate)**:

```text
[Tài Liệu Brainstorm / RFC / Mermaid]
                 │
                 ▼
       [Pha 1: Parser Thô]
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│ Pha 2: Self-Review & Quality Gate Auto-Correction      │
│                                                        │
│ 1. Bộ Lọc Anti-Pattern (Anti-Pollution Filter):        │
│    • Phát hiện & chặn các từ khóa phi kiến trúc:       │
│      - HTTP Verbs: POST /auth/login, GET /...          │
│      - HTTP Status: 200 OK, 401 Unauthorized, Reject   │
│      - Data Packets: Access cookie, Refresh cookie     │
│      - Function Signatures: authorize(), login()       │
│                                                        │
│ 2. Bộ Nâng Cấp Kiến Trúc (Architectural Elevation):    │
│    • Tự động nâng cấp sang Component DDD chuẩn mực:    │
│      - Route/Packet  ➔  Ingress Gateway (PEP Guard)    │
│      - Logic tính toán ➔ Pure Domain Engine (0 I/O)    │
│      - Lưu trữ/Đệm   ➔  Dedicated Sub-Clusters         │
│                                                        │
│ 3. Đánh Giá & Chấm Điểm Chất Lượng (Quality Score):   │
│    • Bounded Context & Public Interface Validation     │
│    • Sinh 100% Deep Details, Chuỗi Sụp Đổ & Reflex Quiz│
└────────────────────────────────────────────────────────┘
                 │
                 ▼ (Chỉ render khi Quality Score ≥ 95)
    [Canvas Render & SQLite WAL Persistence]
```

---

## 🚀 Tính Năng Đột Phá

### 1. RAG Brainstorm Doc Ingestion Engine (Nạp & Tự Động Sinh Cụm)
* **Tự động bóc tách sơ đồ Mermaid**: Phân tích cú pháp `flowchart TD/LR` và Sequence Diagrams trong tài liệu RFC để tự động tạo Service Cluster, Database Sub-cluster, Redis Sub-cluster, Outbox Worker.
* **Giao diện Modal 3 Chế Độ trên Toolbar**:
  1. 📁 **Folder `rag/`**: Duyệt danh sách các tài liệu `.md`, xem trước và 1-click **"Nạp & Tự Động Sinh Cụm"**.
  2. 📤 **Upload File**: Tải lên file `.md`, `.txt`, `.json` từ máy tính $\to$ tự động lưu vào `rag/` và sinh cụm.
  3. ✍️ **Dán Trực Tiếp**: Dán bản nháp Brainstorm text $\to$ nhấn **"Phân Tích & Sinh Cụm Lên Canvas"**.

### 2. Mô Phỏng Sóng Lan Truyền Sự Cố (🐛 Bug Particle Motion & 3-Cycle Auto-Freeze)
* Nhấn nút **"Mô Phỏng Sự Cố 🐛"** trên từng Thẻ Sự Cố để kích hoạt luồng mô phỏng:
  * **Con bọ đỏ Vector SVG (🐛 Bug Particle)** bò mượt mà dọc theo đường cong dây nối từ Node nguồn sang các Node phụ thuộc.
  * Tự động gắn các **Mini Stage Badges** (`🚨 1. TRIGGER`, `🔴 2. SATURATION`, `💥 3. BLAST RADIUS`) trên đầu các Node.
  * Tự động duy trì trạng thái mô phỏng khi người dùng click chuyển qua lại giữa các Node.

### 3. Kéo Thả Tự Do (Node & Cluster Drag & Drop + Auto-Persistence)
* Kéo di chuyển từng Node hoặc toàn bộ Cụm tự do.
* Tự động tính toán lại các đường cong Cubic Bezier S-Curves và lưu tọa độ bền vững vào SQLite WAL.
* Cơ chế phân biệt Drag vs Click chống hiện tượng nhảy zoom nhầm camera.

### 4. Hệ Thống Biểu Tượng Quy Ước Chuẩn Quốc Tế (ISO / C4 / UML SVGs)
* 🗄️ **Database**: Khối trụ đĩa từ 3 tầng elip xếp chồng.
* 🧠 **CPU Engine**: Con chip vi xử lý hình vuông với lõi Silicon và chân kim loại 4 hướng.
* ⚡ **RAM Cache**: Thanh RAM PCB với 4 chip nhớ và chân cắm vàng.
* 🖥️ **Service / Server**: Tủ Server phiến với đèn LED tín hiệu.
* 🌐 **Gateway Ingress**: Cầu nối mạng địa cầu định tuyến vĩ tuyến.
* 📨 **Message Queue**: Ống hàng đợi 3 lớp gói tin.
* ⚙️ **Worker**: Cụm bánh răng cơ khí.

### 5. Từ Điển Thuật Ngữ Tự Học (Self-Learning Dynamic Glossary)
* 80+ thuật ngữ vàng cốt lõi có sẵn.
* Tự động quét và nạp thêm thuật ngữ mới từ mọi file docs trong `rag/`.
* Thẻ Floating Edge Hover Card hiển thị từ khóa nổi bật màu vàng ánh kim (`#FDE047`) trên nền tối.

---

## 🛠️ Công Nghệ Sử Dụng

| Tầng | Công nghệ | Vai trò |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite SingleFile, Zustand, Lucide Icons | Canvas tương tác vô hạn, Drag & Drop, Cubic Bezier SVG, Field Notes Drawer |
| **Backend** | Node.js, Express, TypeScript, Better-SQLite3 | REST API, RAG Ingestion Engine, Self-Review Quality Gate, Bounded Context Validator |
| **Lưu Trữ** | SQLite với Write-Ahead Logging (WAL) Mode | 0-Token Caching, lưu trữ đồ thị bất biến, hỗ trợ đa tiến trình |
| **Kiểm Thử** | Vitest | 49 automated tests (100% pass rate) cho unit, API, DB concurrency & RAG |

---

## 📋 Hướng Dẫn Sử Dụng

### 1. Khởi Động Ứng Dụng
```bash
# 1. Cài đặt dependencies (nếu mới clone)
npm install

# 2. Build toàn bộ frontend và backend
npm run build

# 3. Khởi chạy máy chủ phát triển (cả frontend và backend)
npm run dev
```
Mở trình duyệt tại: `http://localhost:5173` (hoặc qua Express Production Server `http://localhost:3001` / DeepSeek Harness Web GUI `http://127.0.0.1:3080`).

---

### 2. Sử Dụng Tính Năng RAG Brainstorm
1. Đặt các file bản thảo thiết kế (`.md`, `.txt`, `.json`) vào thư mục `rag/`.
2. Trên thanh công cụ nổi (Floating Toolbar), bấm nút **"RAG Brainstorm"**.
3. Trong tab **"Folder rag/"**, chọn tài liệu cần nạp $\to$ Bấm **"Nạp & Tự Động Sinh Cụm"**.
4. Hệ thống sẽ tự động chạy qua **Self-Review Quality Gate**, bóc tách thành Cụm Dịch Vụ và các Cụm Con Hạ Tầng tương ứng, hiển thị ngay trên Canvas.

---

### 3. Thao Tác Trực Quan Trên Canvas
* **Kéo di chuyển Node**: Nhấn giữ chuột trái vào thẻ Node và kéo đến vị trí mong muốn.
* **Kéo di chuyển Cụm**: Nhấn giữ thẻ tiêu đề cụm (`⋮⋮ TÊN CỤM`) để dời toàn bộ cụm.
* **Xem chi tiết kỹ thuật**: Click vào bất kỳ Node nào để mở Field Notes Drawer chứa Bản chất, Sơ đồ thực thi, Hồ sơ sự cố khép kín (Incident Dossiers), và Chuỗi 5 câu hỏi sát hạch phản xạ.
* **Mô phỏng sự cố**: Bấm nút **"Mô Phỏng Sự Cố 🐛"** trên thẻ sự cố để xem con bọ đỏ bò dọc theo dây nối.
* **Thu gọn nhánh con**: Bấm nút `Thu gọn` ở chân thẻ node.
* **Tìm kiếm**: Gõ từ khóa vào ô tìm kiếm trên thanh công cụ để highlight node tức thì.
* **Xuất dữ liệu**: Bấm nút Download trên thanh công cụ để xuất sang **Obsidian (.md)**, **Mermaid Chart**, hoặc **JSON**.

---

## 🧪 Kiểm Thử Tự Động Toàn Diện

Hệ thống được bảo chứng bởi 11 test suites với 49 test cases:
```bash
npm run test
```

Kết quả kiểm thử:
* `brainstormRAG.test.ts`: Kiểm tra bộ bóc tách tài liệu RFC, Mermaid và Self-Review Quality Gate.
* `hierarchicalClusterSpawning.test.ts`: Kiểm tra Multi-Cluster Spawning và Bounded Context Isolation.
* `edgeSanitizer.test.ts`: Kiểm tra 4 lớp kiểm duyệt liên kết, chống tự trỏ, chống chu trình và chống cross-wiring.
* `dynamicSpawnAndCapacity.test.ts`: Kiểm tra trần an toàn chống ảo giác AI (Saturation Cap).
* `realDatabaseIntegration.test.ts`: Kiểm tra SQLite WAL persistence và ACID transactions.
* `clusterEngine.test.ts` & `geometry.test.ts`: Kiểm tra thuật toán Bounding Box và Cubic Bezier Ports.
