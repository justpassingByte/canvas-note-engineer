# 📐 Canvas Note Engineer (Sổ Tay Kỹ Sư Kiến Trúc)

> **Interactive Engineering Knowledge Graph & Architecture Field Notebook**  
> Thiết kế đặc quyền cho Kỹ sư Phần mềm, Kiến trúc sư Hệ thống (System Architects) và Tích hợp Trợ lý Lập trình AI (**Antigravity / DeepSeek Harness**).

[![Tech Stack](https://img.shields.io/badge/Stack-React%2018%20%7C%20TypeScript%20%7C%20Zustand%20%7C%20Express%20%7C%20SQLite%20WAL-green)](#-cong-nghe-su-dung)
[![Tests](https://img.shields.io/badge/Tests-50%2F50%20Passed%20(100%25)-brightgreen)](#-kiem-thu-tu-dong-toan-dien)
[![Zero-Token Caching](https://img.shields.io/badge/AI-Zero--Token%20Cache-orange)](#-tinh-nang-dot-pha)
[![Architecture](https://img.shields.io/badge/Architecture-Domain%20%E2%86%92%20Cluster%20%E2%86%92%20Sub--Cluster-indigo)](#-kien-truc-phan-cap-hierarchical-architecture)

---

## 📖 Giới Thiệu Tổng Quan

**Canvas Note Engineer** là không gian làm việc số hóa mô phỏng **Sổ tay Kỹ sư thực chiến**. Hệ thống mổ xẻ các sự cố vận hành phân tán (Distributed Incidents), xung đột tương tranh (**Race Conditions**, **Deadlocks**, **Retry Storms**), và các mẫu thiết kế phòng thủ (**Idempotency**, **Distributed Lock**, **Message Queue Buffer**, **Zero-Trust PEP/PDP**, **Audit Trail Immutability**) trên mặt giấy kỹ thuật số vô hạn (Infinite Technical Grid Canvas).

Hệ thống được trang bị bộ máy **RAG Brainstorm Ingestion Engine**, cơ chế **Kiến trúc Phân Cấp Bounded Context (Domain $\to$ Service Cluster $\to$ Sub-Cluster)**, khả năng **Kéo Thả (Drag & Drop) Node & Cụm Tự Do**, cùng bộ nhớ đệm **0-Token SQLite WAL Persistence**.

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

## 🚀 Tính Năng Đột Phá

### 1. RAG Brainstorm Doc Ingestion Engine (Nạp & Tự Động Sinh Cụm)
Hệ thống tích hợp bộ máy phân tích tài liệu thiết kế kiến trúc thông minh tại thư mục `rag/`:
* **Tự động bóc tách sơ đồ Mermaid**: Phân tích cú pháp `flowchart TD` trong tài liệu RFC để tự động tạo Service Cluster, Database Sub-cluster, Redis Sub-cluster, Outbox Worker.
* **Nhận diện bảng Module Boundaries & Headings**: Tự động ánh xạ các module và phân quyền thành các Node và Cụm chuẩn.
* **Giao diện Modal 3 Chế Độ trên Toolbar**:
  1. 📁 **Folder `rag/`**: Duyệt danh sách các tài liệu `.md`, xem trước và 1-click **"Nạp & Tự Động Sinh Cụm"**.
  2. 📤 **Upload File**: Tải lên file `.md`, `.txt`, `.json` từ máy tính $\to$ tự động lưu vào `rag/` và sinh cụm.
  3. ✍️ **Dán Trực Tiếp**: Dán bản nháp Brainstorm text $\to$ nhấn **"Phân Tích & Sinh Cụm Lên Canvas"**.

### 2. Kéo Thả Node & Cụm Tự Do (Node & Cluster Drag & Drop + Auto-Persistence)
* **Kéo thả từng Node riêng lẻ**: Nhấn giữ chuột trái lên bất kỳ Node nào để di chuyển tự do trên mặt giấy.
* **Kéo thả cả Cụm Topic**: Nhấn giữ Header tiêu đề cụm để di chuyển đồng loạt toàn bộ các node bên trong.
* **Dây nối tự động thích ứng**: Đường cong Cubic Bezier S-Curves và nhãn giao thức tự động co giãn và tính toán lại cổng neo theo thời gian thực.
* **Tự động lưu vị trí (Auto-Persistence)**: Tọa độ mới được đồng bộ ngay xuống SQLite qua `POST /api/graph/update-positions`.

### 3. Chuẩn Hóa Tầng Công Nghệ (Architectural Layer Standard)
Thay thế số thứ tự bước tuyến tính cũ bằng các phân tầng chuẩn:
* `GATEWAY / INGRESS`: Cổng đón gói tin, Webhook Ingress, Reverse Proxy.
* `COMPUTE / CONCURRENCY`: Phân luồng xử lý, điểm xung đột tài nguyên song song.
* `SECURITY / IDEMPOTENCY`: Lá chắn khóa định danh UUID v4 chống trừ tiền lặp.
* `STORAGE / ACID DB`: Trụ bảo chứng toàn vẹn dữ liệu, Row Lock & Unique Index.
* `ASYNC / QUEUE BUFFER`: Hàng đợi điều tiết đỉnh tải (Kafka / RabbitMQ).
* `CACHE / DISTRIBUTED LOCK`: Khóa phân tán đơn luồng RAM 1ms (Redis SETNX).
* `EDGE / WAF RATE LIMIT`: Tường lửa ứng dụng và thuật toán Token Bucket chống DDoS.
* `SECURITY / ZERO-TRUST`: Xác thực mTLS & Phân quyền Policy Enforcement Point.
* `OBSERVABILITY / AUDIT LOG`: Sổ cái kiểm toán tài chính Append-Only bất biến.

### 4. Thu Gọn / Mở Rộng Nhánh Con Độc Lập (DAG-Safe Collapse Pill)
* Nút bấm Pill ở chân thẻ node (`.nut-thu-gon-pill`) cho phép thu gọn/mở rộng toàn bộ nhánh con phân cấp chỉ với 1 click.
* Thiết kế **DAG-Safe**: Trạng thái thu gọn chỉ lưu trên node cha, không can thiệp đè cờ lên các node con trong SQLite.

### 5. Chế Độ "Điều Gì Sụp Đổ" (What Breaks Cascade Visualization)
* Bấm nút **"Điều gì sụp đổ"** trên Drawer để kích hoạt hiệu ứng lan truyền sự cố (Failure Cascade):
  * Dây nối chuyển sang màu đỏ rực cảnh báo nguy cơ.
  * Node liên quan hiển thị hiệu ứng nhịp thở cảnh báo rủi ro dây chuyền.

### 6. Chế Độ Ôn Tập Phản Xạ (Recall Quiz Mode)
* Ẩn tên các node thành `[ ? ]` để luyện tập nhớ lại bản chất kỹ thuật trước khi click mở đáp án.

---

## 🛠️ Công Nghệ Sử Dụng

| Tầng | Công nghệ | Vai trò |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite SingleFile, Zustand, Lucide Icons | Canvas tương tác vô hạn, Drag & Drop, Cubic Bezier SVG, Responsive Drawer |
| **Backend** | Node.js, Express, TypeScript, Better-SQLite3 | REST API, RAG Ingestion Engine, Bounded Context Validator, WAL Persistence |
| **Lưu Trữ** | SQLite với Write-Ahead Logging (WAL) Mode | 0-Token Caching, lưu trữ đồ thị bất biến, hỗ trợ đa tiến trình |
| **Kiểm Thử** | Vitest | 50 automated tests (100% pass rate) cho unit, API, DB concurrency & RAG |

---

## 📋 Hướng Dẫn Sử Dụng

### 1. Khởi Động Ứng Dụng
```bash
# 1. Cài đặt dependencies (nếu mới clone)
npm install

# 2. Build toàn bộ frontend và backend
npm run build

# 3. Khởi chạy máy chủ backend
npm run start
```
Mở trình duyệt tại: `http://localhost:3001` (hoặc qua DeepSeek Harness Web GUI `http://127.0.0.1:3080`).

---

### 2. Sử Dụng Tính Năng RAG Brainstorm
1. Đặt các file bản thảo thiết kế (`.md`, `.txt`, `.json`) vào thư mục `rag/`.
2. Trên thanh công cụ nổi (Floating Toolbar), bấm nút **"RAG Brainstorm"**.
3. Trong tab **"Folder rag/"**, chọn tài liệu cần nạp $\to$ Bấm **"Nạp & Tự Động Sinh Cụm"**.
4. Hệ thống sẽ tự động bóc tách thành Cụm Dịch Vụ và các Cụm Con Hạ Tầng tương ứng, hiển thị ngay trên Canvas.

---

### 3. Thao Tác Trực Quan Trên Canvas
* **Kéo di chuyển Node**: Nhấn giữ chuột trái vào thẻ Node và kéo đến vị trí mong muốn.
* **Kéo di chuyển Cụm**: Nhấn giữ thẻ tiêu đề cụm (`⋮⋮ TÊN CỤM`) để dời toàn bộ cụm.
* **Xem chi tiết kỹ thuật**: Click vào bất kỳ Node nào để mở Sổ tay Ghi chép (Drawer) chứa Bản chất, Sơ đồ thực thi, Ca thực tế, Chuỗi sụp đổ và Trắc nghiệm phản xạ.
* **Thu gọn nhánh con**: Bấm nút `Thu gọn` ở chân thẻ node.
* **Tìm kiếm**: Gõ từ khóa vào ô tìm kiếm trên thanh công cụ để highlight node tức thì.
* **Xuất dữ liệu**: Bấm nút Download trên thanh công cụ để xuất sang **Obsidian (.md)**, **Mermaid Chart**, hoặc **JSON**.

---

## 🧪 Kiểm Thử Tự Động Toàn Diện

Hệ thống được bảo chứng bởi 11 test suites với 50 test cases:
```bash
npm run test
```

Kết quả kiểm thử:
* `hierarchicalClusterSpawning.test.ts`: Kiểm tra Multi-Cluster Spawning và Bounded Context Isolation.
* `brainstormRAG.test.ts`: Kiểm tra bộ bóc tách tài liệu RFC, Mermaid và Markdown.
* `edgeSanitizer.test.ts`: Kiểm tra 4 lớp kiểm duyệt liên kết, chống tự trỏ, chống chu trình và chống cross-wiring.
* `dynamicSpawnAndCapacity.test.ts`: Kiểm tra trần an toàn chống ảo giác AI (Saturation Cap).
* `realDatabaseIntegration.test.ts`: Kiểm tra SQLite WAL persistence và ACID transactions.
* `clusterEngine.test.ts` & `geometry.test.ts`: Kiểm tra thuật toán Bounding Box và Cubic Bezier Ports.
