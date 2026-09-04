---
name: canvas-engineer
description: Multi-purpose Engineering Notebook & Interactive Knowledge Graph controller for Antigravity. Manages, opens, queries, expands, and exports architecture diagrams from the shared SQLite WAL database.
---

# Canvas Note Engineer Skill (Antigravity & DSH Dual-Profile)

Kỹ năng điều khiển Sổ tay Kỹ sư và Đồ thị Kiến trúc Tương tác. Hoạt động trên mô hình Dual-Profile, dùng chung máy chủ Backend (Port 3001) và cơ sở dữ liệu SQLite thực tế (`data/knowledge.db`) với DeepSeek Harness.

---

## 1. Hướng Dẫn Thực Thi Các Lệnh `/canvas`

Khi người dùng gõ lệnh `/canvas [subcommand] [args]`, tự động xác định nhánh lệnh và thực thi bằng script CLI trợ lực:

```powershell
node .agents/plugins/canvas-note-engineer/skills/canvas-engineer/scripts/canvas-cli.mjs [action] [param]
```

### A. Kiểm tra trạng thái: `/canvas status`
- Chạy:
  ```powershell
  node .agents/plugins/canvas-note-engineer/skills/canvas-engineer/scripts/canvas-cli.mjs status
  ```
- Trả về thông tin: Trạng thái kết nối Backend (Port 3001), Frontend (Port 5173), số lượng Node/Edge trong SQLite, và tỷ lệ bão hòa khai phá.

### B. Mở giao diện Canvas: `/canvas open` hoặc `/canvas open --agent`
- Mở trên trình duyệt mặc định:
  ```powershell
  node .agents/plugins/canvas-note-engineer/skills/canvas-engineer/scripts/canvas-cli.mjs open
  ```
  *(Nếu dev server chưa chạy, thông báo người dùng khởi động `npm run dev`)*.
- Mở bằng Antigravity Browser Automation (nếu có cờ `--agent`):
  - Khởi chạy subagent trình duyệt hoặc dùng Playwright để mở `http://localhost:5173`, cho phép chụp ảnh màn hình hoặc tương tác trực tiếp trên giao diện Canvas.

### C. Tra cứu tri thức kỹ thuật: `/canvas query <keyword>`
- Chạy:
  ```powershell
  node .agents/plugins/canvas-note-engineer/skills/canvas-engineer/scripts/canvas-cli.mjs query "<keyword>"
  ```
- Hiển thị danh sách node khớp với từ khóa dưới dạng thẻ Markdown trực quan (Tiêu đề, Phân loại kiến trúc, Bản chất kỹ thuật, Rủi ro thực chiến).

### D. Mở rộng nhánh con: `/canvas expand <node-id>`
- Chạy:
  ```powershell
  node .agents/plugins/canvas-note-engineer/skills/canvas-engineer/scripts/canvas-cli.mjs expand "<node-id>"
  ```
- Mở rộng 1-2 node delta mới (như RabbitMQ queue, Redis lock cache) và gắn trực tiếp vào đồ thị SQLite với chi phí 0-token nếu đã cache.

### E. Xuất sơ đồ: `/canvas export <mermaid|obsidian>`
- Xuất Mermaid:
  ```powershell
  node .agents/plugins/canvas-note-engineer/skills/canvas-engineer/scripts/canvas-cli.mjs export mermaid
  ```
- Xuất Obsidian Markdown kèm Wikilinks `[[...]]`:
  ```powershell
  node .agents/plugins/canvas-note-engineer/skills/canvas-engineer/scripts/canvas-cli.mjs export obsidian
  ```

---

## 2. Quy Tắc Tự Khởi Động Daemon

Nếu Backend (Port 3001) chưa hoạt động khi gọi các lệnh mở rộng hoặc kiểm thử:
1. Dùng lệnh `npm run dev:backend` hoặc `npm run dev:all` chạy ở chế độ daemon nền (`IsDaemon: true`).
2. Xác nhận cổng 3001 phản hồi HTTP 200 tại `/api/health`.
3. Tiếp tục thực thi tác vụ `/canvas`.
