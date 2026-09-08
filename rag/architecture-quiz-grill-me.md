# Architecture Drill & Challenge: Deployment & Database Migrations ("Grill-Me")

> **Mục đích:** Bộ câu hỏi thực chiến chuyên sâu (Scenario-based Technical Challenge) nhằm kiểm tra và củng cố kiến thức về toàn bộ quy trình Deploy Delo, Quản trị Database golang-migrate, xử lý sự cố Production và kiến trúc bảo vệ dữ liệu của Trustbase.

---

## 🎯 Thử thách 1: Sự cố "No such container: trustbase-postgres"

### Bối cảnh:
Sau khi deploy lên Staging VPS, một lập trình viên SSH vào server và gõ lệnh:
```bash
docker exec -it trustbase-postgres psql -U user -d trustbase -c "SELECT * FROM schema_migrations;"
```
Hệ thống báo lỗi ngay lập tức:
```
Error response from daemon: No such container: trustbase-postgres
```
Tuy nhiên, lệnh `docker ps` lại cho thấy các container sau đang chạy:
- `trustbase-admin-prod`
- `trustbase-customer-prod`
- `trustbase-redis-prod`
- `groonga/pgroonga:latest` (với tên container: `trustbase-postgres-prod` hoặc `trustbase-pgroonga-prod`)

### ❓ Câu hỏi:
1. Tại sao container Postgres trên VPS lại không mang tên `trustbase-postgres` như trong `infra/docker-compose.yml` local?
2. Có những cách nào để truy vấn nhanh bảng `schema_migrations` trên VPS mà không cần phụ thuộc vào tên container Docker?

<details>
<summary><b>💡 Xem Lời giải chi tiết</b></summary>

1. **Nguyên nhân:**
   - File `infra/docker-compose.yml` là cấu hình dành riêng cho môi trường **Local Development** (sử dụng container name `trustbase-postgres`).
   - Trên môi trường Staging/Production, các container được đặt tên có hậu tố môi trường (e.g. `trustbase-postgres-prod` hoặc sử dụng image chuyên dụng `groonga/pgroonga` hỗ trợ full-text search tiếng Việt).
2. **Cách truy vấn đúng:**
   - **Cách 1 (Qua Docker):** Tìm tên chính xác bằng `docker ps --filter "ancestor=groonga/pgroonga:latest" --format "{{.Names}}"` rồi chạy:
     ```bash
     docker exec -it <tên_container_chính_xác> psql -U $POSTGRES_USER -d trustbase -c "SELECT * FROM schema_migrations;"
     ```
   - **Cách 2 (Trực tiếp từ Host qua Node.js CLI):** Không cần đụng đến Docker, tận dụng file `.env` đã có sẵn trên VPS:
     ```bash
     cd /home/trustbase-project/api
     node -e "
       const pg = require('pg');
       require('dotenv').config();
       const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
       client.connect().then(() => client.query('SELECT * FROM schema_migrations;')).then(r => { console.table(r.rows); client.end(); });
     "
     ```
</details>

---

## 🎯 Thử thách 2: Bẫy Migration "Dirty State" lúc 2 giờ sáng

### Bối cảnh:
Bạn vừa thực hiện `pnpm delo deploy stg`. Quá trình deploy dừng đột ngột ở bước `migrate`:
```
error: relation "platform_vouchers" already exists
Dirty database version 49. Fix and force version.
```
Bất kỳ ai cố chạy lại `node dist/db/migrate.js` đều bị từ chối ngay lập tức.

### ❓ Câu hỏi:
1. Tại sao `golang-migrate` lại không tự động rollback hoặc chạy tiếp mà lại cố tình "đóng băng" (fail-closed) cơ sở dữ liệu?
2. Nêu chính xác 3 bước kỹ thuật bạn cần thực hiện trên server để đưa database trở về trạng thái sạch (`dirty = false`).

<details>
<summary><b>💡 Xem Lời giải chi tiết</b></summary>

1. **Ý đồ kiến trúc:**
   - Khi một câu lệnh DDL/DML gặp lỗi, hệ thống không thể biết chắc chắn dữ liệu đang nằm ở trạng thái nào (nửa cũ nửa mới).
   - Nếu tự động chạy tiếp hoặc tự động đoán cách sửa, nguy cơ hỏng dữ liệu (Data Corruption) hoặc mất tính toàn vẹn bảng kế toán/tiền tệ là rất cao.
   - Cơ chế `dirty=true` là một chốt an toàn có chủ đích: **buộc con người phải xác nhận và dọn dẹp trước khi cho phép mã nguồn mới can thiệp.**
2. **3 bước xử lý chuẩn:**
   - **Bước 1 (Dọn dẹp DB thực tế):** Kết nối vào DB qua `psql` và xóa sạch các bảng/cột bị tạo dở dang của migration 49:
     ```sql
     DROP TABLE IF EXISTS "platform_vouchers" CASCADE;
     ```
   - **Bước 2 (Gỡ cờ dirty):** Chạy lệnh `force` của golang-migrate binary để đặt version về migration trước đó (phiên bản 48):
     ```bash
     api/bin/migrate -path migrations -database "$DATABASE_URL" force 48
     ```
   - **Bước 3 (Thực thi lại):** Sửa lỗi trong file SQL (ví dụ thêm `IF NOT EXISTS` hoặc giải quyết xung đột), sau đó chạy lại:
     ```bash
     node dist/db/migrate.js
     ```
</details>

---

## 🎯 Thử thách 3: Thứ tự thực thi Deploy (Order of Execution)

### Bối cảnh:
Một kỹ sư đề xuất tối ưu hóa thời gian deploy của Delo bằng cách chạy song song:
`pm2 reload` đồng thời với `node dist/db/migrate.js`.

### ❓ Câu hỏi:
Tại sao việc reload code và chạy migration **tuyệt đối không được phép chạy song song hoặc đảo ngược thứ tự**, đặc biệt trong kiến trúc PM2 Cluster?

<details>
<summary><b>💡 Xem Lời giải chi tiết</b></summary>

- **Rủi ro Missing Columns / Tables:** Nếu PM2 reload trước hoặc song song, các worker mới sẽ khởi động và bắt đầu nhận request của người dùng. Các câu lệnh SQL được sinh ra bởi code mới (chứa các cột mới như `voucher_code`, `discount_ppm`) sẽ bắn vào database khi migration chưa chạy xong. Kết quả: Người dùng nhận hàng loạt lỗi `500 Internal Server Error` (`column "discount_ppm" does not exist`).
- **Nguyên tắc bất di bất dịch của Deploy:**
  $$\text{Database Schema Upgrade} \longrightarrow \text{Process Reload} \longrightarrow \text{Healthcheck Verification}$$
  Luôn luôn đảm bảo database đã ở trạng thái sẵn sàng đón nhận code mới trước khi bất kỳ tiến trình mới nào được lắng nghe (listen) trên cổng mạng.
</details>

---

## 🎯 Thử thách 4: Bài toán Zero Table Lock (`CHECK ... NOT VALID`)

### Bối cảnh:
Bảng `orders` trên Production có hơn 5.000.000 bản ghi. Bạn cần bổ sung ràng buộc:
Giá trị đơn hàng (`subtotal_ppm`) phải luôn lớn hơn hoặc bằng 0.

### ❓ Câu hỏi:
Nếu bạn viết câu lệnh sau trong file `.up.sql`:
```sql
ALTER TABLE orders ADD CONSTRAINT check_subtotal_positive CHECK (subtotal_ppm >= 0);
```
Điều gì sẽ xảy ra với trang web khi chạy migration trong giờ cao điểm? Cách sửa câu lệnh này như thế nào để đảm bảo không bị gián đoạn dịch vụ?

<details>
<summary><b>💡 Xem Lời giải chi tiết</b></summary>

1. **Hậu quả khi chạy câu lệnh cũ:**
   - PostgreSQL sẽ yêu cầu một khóa độc quyền cấp cao (**`ACCESS EXCLUSIVE lock`**) trên bảng `orders` trong suốt thời gian nó quét toàn bộ 5.000.000 dòng dữ liệu để kiểm tra tính hợp lệ.
   - Trong thời gian quét (có thể mất từ vài chục giây đến vài phút), toàn bộ các câu lệnh `SELECT`, `INSERT`, `UPDATE` vào bảng `orders` từ phía người dùng đều bị xếp hàng chờ (queued/blocked).
   - Kết quả: Connection pool bị tràn, API hết timeout và toàn bộ ứng dụng bị treo (Downtime diện rộng).
2. **Giải pháp chuẩn Zero-Downtime:**
   Chia làm 2 giai đoạn:
   - **Giai đoạn 1 (Trong migration `.up.sql`):** Thêm ràng buộc với từ khóa `NOT VALID`:
     ```sql
     ALTER TABLE orders ADD CONSTRAINT check_subtotal_positive CHECK (subtotal_ppm >= 0) NOT VALID;
     ```
     *Lợi ích:* Chỉ giữ `ACCESS EXCLUSIVE lock` trong vài mili-giây để ghi metadata vào catalog, không quét bảng, cho phép hệ thống hoạt động bình thường và lập tức bảo vệ các record mới.
   - **Giai đoạn 2 (Sau khi deploy):** Chạy lệnh xác thực bất đồng bộ không khóa bảng:
     ```sql
     ALTER TABLE orders VALIDATE CONSTRAINT check_subtotal_positive;
     ```
     *Lợi ích:* Chỉ lấy khóa `SHARE UPDATE EXCLUSIVE lock` — cho phép đọc và ghi dữ liệu đồng thời trong lúc quét bảng kiểm tra.
</details>

---

## 🎯 Thử thách 5: Thảm họa xoá nhầm DB khi chạy Test (`override: true`)

### Bối cảnh:
Trong module test backend, hàm teardown thường có cấu trúc:
```typescript
await db.execute(sql`TRUNCATE TABLE users, orders, shops CASCADE;`);
```
Trước đây, do file `api/src/config/env.ts` cấu hình `dotenv.config({ override: true })`, khi chạy kiểm thử local, biến `DATABASE_URL` từ file `.env.development` đôi khi đã vô tình ghi đè lên `.env.test`.

### ❓ Câu hỏi:
Làm thế nào Trustbase loại bỏ hoàn toàn nguy cơ một câu lệnh test có thể `TRUNCATE` nhầm database Development hoặc Production?

<details>
<summary><b>💡 Xem Lời giải chi tiết</b></summary>

Trustbase triển khai **2 lớp phòng vệ kiên cố (Defense-in-Depth)**:
1. **Lớp 1: Cấu hình nạp môi trường (`api/src/config/env.ts`):**
   Chỉ cho phép `override: true` khi biến môi trường `NODE_ENV !== 'test'`. Điều này đảm bảo khi test runner khởi động với cấu hình riêng, không có bất kỳ lệnh `dotenv` nào được phép can thiệp ghi đè.
2. **Lớp 2: Hàm chốt chặn kiểm tra tên Database ([`assertTestDb`](file:///c:/Users/MSI/Desktop/Trustbase/trustbase-project/api/test/integration/helpers/db.ts)):**
   Mọi helper tương tác với DB trong test đều bắt buộc phải đi qua hàm kiểm định:
   ```typescript
   export function assertTestDb(databaseUrl: string): void {
     const url = new URL(databaseUrl);
     const dbName = url.pathname.replace(/^\//, '');
     if (!dbName.endsWith('_test') && !dbName.includes('test')) {
       throw new Error(`CRITICAL GUARD: Target database "${dbName}" is NOT a dedicated test database! Aborting immediately to prevent data destruction.`);
     }
   }
   ```
   Nếu chuỗi kết nối không có chữ `test`, toàn bộ tiến trình test sẽ lập tức `throw Error` và dừng lại ngay trước khi câu lệnh `TRUNCATE` đầu tiên được gửi đi.
</details>

---

## 🎯 Thử thách 6: Cơ chế Zero-Downtime Legacy Adoption

### Bối cảnh:
Một dự án chuyển đổi công cụ di trú dữ liệu từ một ORM (ví dụ Prisma hoặc Drizzle) sang `golang-migrate`. Database Production đang chứa 34 bảng và hàng triệu dòng dữ liệu.

### ❓ Câu hỏi:
Nếu bạn chuyển giao mà không có cơ chế `adoptLegacyMigrations()`, điều gì sẽ xảy ra? Cơ chế này trong Trustbase giải quyết bài toán đó một cách tao nhã như thế nào?

<details>
<summary><b>💡 Xem Lời giải chi tiết</b></summary>

- **Hậu quả nếu thiếu:** `golang-migrate` dựa vào bảng `schema_migrations`. Khi kết nối vào DB đã có dữ liệu nhưng chưa có bảng này, nó sẽ coi đây là một database mới tinh và thực thi file `000001.up.sql`. Lệnh `CREATE TABLE users ...` sẽ đụng độ với bảng `users` đã tồn tại trên Production -> Lỗi crash ngay lập tức.
- **Cách giải quyết:** Hàm `adoptLegacyMigrations()`:
  1. Kiểm tra sự tồn tại của bảng metadata cũ (`drizzle.__drizzle_migrations`).
  2. Nếu có bảng cũ và bảng `schema_migrations` chưa có dữ liệu, hàm tự động tạo bảng `schema_migrations` và chèn vào:
     ```sql
     INSERT INTO "schema_migrations" ("version", "dirty") VALUES (34, false);
     ```
  3. Dọn dẹp bảng migration tạm nếu có.
  4. Nhờ đó, `golang-migrate` biết rằng các phiên bản từ 1 đến 34 đã hoàn tất và sẽ chỉ chạy tiếp từ file `000035` trở đi.
</details>
