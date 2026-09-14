import { InterviewTopicEntity } from '../types/interviewTypes.js';

export const SEED_TOPICS_PART3: InterviewTopicEntity[] = [
  // ==========================================
  // DOMAIN 20: DOCKER & LINUX OPS
  // ==========================================
  {
    id: 'topic-docker-multistage-caching',
    domain_id: 'domain-20-docker-linux',
    domain_title: 'Domain 20 — Docker & Linux Ops',
    title: 'Multi-stage Builds, Layer Caching & SIGTERM Handling',
    target_intent: 'Đánh giá kỹ năng đóng gói container production: tối ưu dung lượng image, tốc độ build CI/CD và xử lý tắt ứng dụng an toàn (Graceful Shutdown).',
    trigger_keywords: ['Multi-stage Build', 'Layer Caching', 'Alpine vs Distroless', 'SIGTERM vs SIGKILL', 'Graceful Shutdown', 'Non-root User'],
    recall_5s: 'Dùng Multi-stage build để tách môi trường build nặng khỏi container runtime nhẹ (giảm image từ 1GB xuống 60MB). Copy package.json trước khi copy source code để tận dụng layer cache. Lắng nghe process.on("SIGTERM") để đóng kết nối DB trước khi container bị dừng.',
    interview_answer: 'Khi đóng gói Docker cho Node.js production, tôi áp dụng 3 quy tắc: (1) Multi-stage Build: Dùng stage 1 (Node đầy đủ kèm devDependencies, TypeScript compiler) để build code, sau đó ở stage 2 (dùng Node Alpine hoặc Google Distroless siêu nhẹ) chỉ copy compiled `/dist` và production `node_modules` sang. Điều này giảm dung lượng image từ 1.2GB xuống dưới 80MB và loại bỏ các công cụ build rủi ro; (2) Tối ưu Docker Layer Caching: Lệnh `COPY package*.json ./` và `npm ci --only=production` phải đặt TRƯỚC lệnh `COPY . .`. Khi lập trình viên chỉ sửa code logic, Docker sẽ tái sử dụng cache layer của node_modules, giúp CI/CD build trong 10 giây thay vì 5 phút; (3) Bắt tín hiệu SIGTERM từ Kubernetes/Docker để thực hiện Graceful Shutdown: dừng nhận request mới, đợi các request dở dang hoàn thành (trong 15s), đóng kết nối DB và Redis rồi mới exit 0.',
    deep_dive: 'Một lỗi bảo mật nghiêm trọng là chạy container dưới quyền user `root` mặc định. Trong Dockerfile, luôn thêm `USER node` ở stage cuối để nếu container bị tấn công qua lỗ hổng RCE, hacker không thể chiếm quyền root của host OS.',
    practical_example: {
      title: 'Dockerfile Multi-stage tối ưu cho ứng dụng Node.js',
      code: `# Stage 1: Build & Compile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Runtime siêu nhẹ & Bảo mật
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist

# Chạy bằng user không có quyền root
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]`,
      scenario: 'Image siêu nhỏ gọn, thời gian kéo (image pull) trên Kubernetes chỉ mất 2 giây khi scale pod.'
    },
    trade_offs: {
      when_use: 'Bắt buộc cho mọi môi trường Staging và Production.',
      when_not_use: 'Trong môi trường local development, dùng Docker Compose mount volume trực tiếp để hot-reload nhanh.',
      pros: ['Tốc độ pull và deploy siêu nhanh', 'Bảo mật cao nhờ loại bỏ attack surface'],
      cons: ['Dockerfile dài hơn và cần hiểu cơ chế cache của Docker engine'],
      alternatives: ['Cloud Native Buildpacks (Pack CLI)']
    },
    follow_ups: [
      {
        question: 'Tại sao dùng `npm ci` thay vì `npm install` trong Dockerfile?',
        answer_skeleton: '`npm ci` bắt buộc phải có `package-lock.json` và cài đặt chính xác tuyệt đối các phiên bản, đồng thời xóa node_modules cũ trước khi cài, đảm bảo môi trường build có tính tất định (deterministic) 100%.'
      }
    ],
    common_traps: [
      'Copy toàn bộ source code vào trước khi chạy npm install (làm mất hoàn toàn cache layer của node_modules khi sửa 1 dòng code).',
      'Không cấu hình file `.dockerignore` khiến thư mục local `node_modules` và `.git` bị tống vào build context hàng GB.'
    ],
    active_recall: [
      'Hai lợi ích lớn nhất của Docker Multi-stage Build là gì?',
      'Tại sao cần bắt tín hiệu SIGTERM trong ứng dụng Node.js chạy trên container?'
    ],
    layers: {
      l1_junior: 'Docker đóng gói code và dependencies vào một container chạy được ở mọi nơi.',
      l2_middle: 'Sử dụng Multi-stage build và tối ưu thứ tự các lệnh COPY để tận dụng layer caching.',
      l3_senior: 'Ở mức 3 YoE, thành thạo Graceful Shutdown xử lý SIGTERM, bảo mật non-root user, multi-arch builds (ARM64 vs AMD64), và tối ưu Linux cgroups limits.'
    },
    why_ladder: [
      { question: 'Tại sao image 1GB lại có hại?', answer: 'Tốn dung lượng lưu trữ ECR, làm chậm thời gian tải image khi Kubernetes autoscaling làm tăng độ trễ phục vụ.' },
      { question: 'Tại sao Docker cache theo từng dòng lệnh?', answer: 'Mỗi lệnh sinh ra một read-only layer; nếu layer trước không đổi, Docker dùng lại cache để không phải chạy lại lệnh tốn thời gian.' },
      { question: 'Chuyện gì xảy ra nếu không xử lý SIGTERM?', answer: 'Docker/K8s đợi 30s rồi gửi SIGKILL ép dừng đột ngột, khiến các giao dịch đang ghi dở vào database bị hỏng.' }
    ],
    code_reaction: {
      code: `// Thiếu xử lý SIGTERM:
const server = app.listen(3000);
// Khi Docker stop, process bị giết tức thì khi đang ghi DB!`,
      question: 'Làm thế nào để thêm Graceful Shutdown chuẩn vào đoạn code trên?',
      explanation: 'Cần lắng nghe tín hiệu SIGTERM, gọi server.close() để ngừng nhận request mới, chờ các request hiện tại chạy xong rồi đóng kết nối DB.',
      fix: `process.on('SIGTERM', async () => {
  server.close(async () => {
    await db.$disconnect();
    process.exit(0);
  });
});`
    }
  },

  // ==========================================
  // DOMAIN 21: CI/CD PIPELINES
  // ==========================================
  {
    id: 'topic-cicd-blue-green-migrations',
    domain_id: 'domain-21-cicd',
    domain_title: 'Domain 21 — CI/CD Pipelines',
    title: 'Blue-Green vs Canary Deployments & Safe Zero-Downtime Migrations',
    target_intent: 'Đánh giá kinh nghiệm triển khai phần mềm không gián đoạn dịch vụ (Zero-Downtime) và kỹ năng thực hiện Database Migration tương thích ngược (Expand and Contract).',
    trigger_keywords: ['Blue-Green Deployment', 'Canary Deployment', 'Zero Downtime', 'Expand and Contract Pattern', 'Database Migration Safety', 'Rollback Strategy'],
    recall_5s: 'Blue-Green chạy 2 môi trường song song rồi chuyển router 100%. Canary chuyển dần 5% → 25% → 100% để thăm dò lỗi. Database Migration an toàn tuyệt đối không được xóa/đổi tên cột ngay; phải dùng Expand and Contract pattern.',
    interview_answer: 'Để đạt chuẩn Zero-Downtime Deployment, ta có 2 chiến lược: Blue-Green (chạy phiên bản mới trên cụm Green độc lập, kiểm tra xong thì tráo đổi Router/Load Balancer 100% lưu lượng) và Canary (chuyển 5% traffic của người dùng thật sang bản mới để theo dõi tỷ lệ lỗi và độ trễ trên CloudWatch/DataDog, nếu ổn định mới tăng dần lên 100%). Thách thức lớn nhất của Zero-Downtime nằm ở Database Migration: nếu bản Green chạy migration xóa hoặc đổi tên cột trong khi bản Blue vẫn đang nhận 95% traffic, bản Blue sẽ sập ngay lập tức. Để khắc phục, ta áp dụng mô hình "Expand and Contract": (1) Bước 1 (Expand): Thêm cột mới `full_name`, giữ nguyên cột cũ `first_name, last_name`. Code ghi vào cả hai; (2) Bước 2: Chạy background script migrate dữ liệu cũ; (3) Bước 3: Đổi code đọc từ cột mới; (4) Bước 4 (Contract): Ở đợt deploy tuần sau, mới xóa cột cũ an toàn.',
    deep_dive: "Trong PostgreSQL, một số câu lệnh DDL (như \`ALTER TABLE ADD COLUMN ... DEFAULT 'abc'\` trên các bản Postgres cũ, hoặc thêm index không có CONCURRENTLY) sẽ chiếm Exclusive Table Lock, chặn đứng mọi câu lệnh SELECT/INSERT và làm treo toàn bộ ứng dụng production. Bắt buộc phải dùng \`CREATE INDEX CONCURRENTLY\`.",
    practical_example: {
      title: 'Mẫu Expand and Contract Pattern cho Database Migration',
      code: `-- BƯỚC 1 (Deploy tuần này): THÊM CỘT MỚI (EXPAND)
-- Tuyệt đối không xóa hay đổi tên cột cũ!
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);

-- BƯỚC 2 (Code deploy): Ghi đồng thời cả 2 cột (Dual-write)
-- Đọc ưu tiên cột mới, fallback cột cũ.

-- BƯỚC 3 (Deploy tuần sau): XÓA CỘT CŨ (CONTRACT)
-- Chỉ xóa khi 100% traffic đã chuyển sang code mới ổn định.
ALTER TABLE users DROP COLUMN first_name, DROP COLUMN last_name;`,
      scenario: 'Cả 2 phiên bản cũ và mới của ứng dụng cùng chạy đồng thời trong quá trình chuyển giao mà không có bất kỳ request nào bị lỗi 500.'
    },
    trade_offs: {
      when_use: 'Bắt buộc cho các hệ thống có SLA 99.9% trở lên và có người dùng 24/7.',
      when_not_use: 'Ứng dụng nội bộ có cửa sổ bảo trì (Maintenance Window ban đêm) có thể chấp nhận dừng vài phút để migrate trực tiếp.',
      pros: ['Người dùng hoàn toàn không cảm nhận được thời gian chết (0ms downtime)', 'Rollback tức thì chỉ mất vài giây'],
      cons: ['Chi phí hạ tầng tăng gấp đôi trong thời gian deploy Blue-Green', 'Quy trình migration kéo dài qua nhiều sprint'],
      alternatives: ['Rolling Deployment (cập nhật từng container một)']
    },
    follow_ups: [
      {
        question: 'Tại sao cần thêm chỉ mục bằng `CREATE INDEX CONCURRENTLY` trong Postgres production?',
        answer_skeleton: 'Lệnh `CREATE INDEX` thông thường khóa ghi toàn bảng (SHARE lock). Thêm từ khóa `CONCURRENTLY` cho phép Postgres quét bảng 2 lần mà không khóa ghi, đảm bảo các giao dịch bán hàng vẫn diễn ra bình thường.'
      }
    ],
    common_traps: [
      'Chạy `prisma migrate deploy` đổi tên cột trực tiếp khiến container cũ đang chạy bị chết hàng loạt.',
      'Không kiểm tra kịch bản Rollback: Nếu code mới lỗi phải rollback về bản cũ, database đã bị migrate ngược khiến bản cũ cũng sập theo.'
    ],
    active_recall: [
      'Giải thích 3 giai đoạn của mẫu thiết kế Expand and Contract trong Database Migration?',
      'Khác biệt cốt lõi giữa Blue-Green Deployment và Canary Deployment là gì?'
    ],
    layers: {
      l1_junior: 'CI/CD tự động hóa việc build, test và deploy code lên máy chủ.',
      l2_middle: 'Blue-Green chuyển đổi toàn bộ traffic; Canary chuyển dần từng phần trăm traffic để thăm dò lỗi.',
      l3_senior: 'Ở mức 3 YoE, thành thạo Zero-downtime Database Migrations (Expand/Contract), DDL locks avoidance, và tự động rollback dựa trên SLO/Error Budget alerts.'
    },
    why_ladder: [
      { question: 'Tại sao không thể vừa deploy vừa tắt server bảo trì?', answer: 'Trong thương mại điện tử toàn cầu, mỗi phút downtime có thể gây thiệt hại hàng chục ngàn USD và làm mất niềm tin của khách hàng.' },
      { question: 'Tại sao migration DB lại là điểm nghẽn của Zero-Downtime?', answer: 'Vì Database là nguồn chân lý duy nhất (Stateful), không thể nhân bản tức thì như server ứng dụng (Stateless).' },
      { question: 'Làm sao đảm bảo an toàn tuyệt đối?', answer: 'Mọi thay đổi database phải luôn tương thích ngược (Backward Compatible) với cả phiên bản code trước đó.' }
    ],
    code_reaction: {
      code: `-- Migration nguy hiểm chạy thẳng trên bảng 10 triệu dòng:
ALTER TABLE orders RENAME COLUMN amount TO total_price;`,
      question: 'Khi lệnh migration trên vừa chạy xong ở DB, chuyện gì xảy ra với các server phiên bản cũ đang phục vụ khách hàng?',
      explanation: 'Toàn bộ câu lệnh SQL của phiên bản cũ đang truy vấn cột `amount` sẽ sụp đổ ngay lập tức với lỗi "column amount does not exist" -> Tỷ lệ lỗi 500 tăng vọt 100%.',
      fix: 'Áp dụng Expand-Contract: Giữ `amount`, thêm `total_price`, đồng bộ dữ liệu, deploy code mới rồi mới drop `amount`.'
    }
  },

  // ==========================================
  // DOMAIN 22: AWS CLOUD ARCHITECTURE
  // ==========================================
  {
    id: 'topic-aws-fullstack-architecture',
    domain_id: 'domain-22-aws-cloud',
    domain_title: 'Domain 22 — AWS Cloud Architecture',
    title: 'Deploying High-Availability Next.js + NestJS + RDS on AWS VPC',
    target_intent: 'Đánh giá năng lực thiết kế kiến trúc đám mây chuẩn sản phẩm: phân vùng mạng an toàn (VPC Subnets), điều phối tải (ALB), bảo vệ cơ sở dữ liệu và tối ưu CDN.',
    trigger_keywords: ['AWS VPC', 'Public vs Private Subnet', 'NAT Gateway', 'Application Load Balancer (ALB)', 'ECS Fargate', 'RDS Multi-AZ', 'CloudFront Origin'],
    recall_5s: 'Kiến trúc AWS chuẩn: Internet → Route 53 → CloudFront (CDN) → ALB ở Public Subnet. ECS Fargate (Next.js/NestJS) và RDS PostgreSQL nằm ở Private Subnet an toàn. Private Subnet ra ngoài internet qua NAT Gateway. RDS Multi-AZ tự động failover < 60s.',
    interview_answer: 'Khi triển khai hệ thống Fullstack (Next.js + NestJS + PostgreSQL) trên AWS với độ sẵn sàng cao (High Availability), tôi thiết kế theo mô hình VPC đa vùng sẵn sàng (Multi-AZ): (1) VPC gồm 2 Availability Zones (AZ) độc lập; (2) Public Subnet chỉ chứa Internet Gateway, Application Load Balancer (ALB) và NAT Gateway; (3) Private Subnet chứa các container ECS Fargate (chạy Next.js frontend và NestJS backend) và cụm RDS PostgreSQL. Các tài nguyên này không có Public IP, hoàn toàn miễn nhiễm với các cuộc quét cổng trên internet. Khi container cần gọi ra ngoài (như gọi Stripe API), nó đi qua NAT Gateway ở Public Subnet. (4) Cụm RDS PostgreSQL bật Multi-AZ: có 1 instance Master ở AZ-1 và 1 instance Standby đồng bộ ở AZ-2, nếu AZ-1 gặp sự cố thiên tai, AWS tự động chuyển hướng DNS sang Standby dưới 60 giây mà không mất dữ liệu; (5) Phía trước ALB, tôi đặt CloudFront CDN để cache tài nguyên tĩnh của Next.js tại các Edge Location sát người dùng nhất và tích hợp AWS WAF chống DDoS.',
    deep_dive: 'Security Group tuân thủ nguyên tắc Least Privilege: Security Group của RDS chỉ mở cổng 5432 và CHỈ chấp nhận nguồn từ Security Group ID của ECS Backend. Tuyệt đối không bao giờ mở `0.0.0.0/0` cho cơ sở dữ liệu.',
    practical_example: {
      title: 'Mô hình luồng truy cập mạng (Network Traffic Flow)',
      code: `[Browser] 
   │
   ▼ HTTPS
[AWS CloudFront CDN + WAF] ──(Cache Hit: Trả ngay static assets)
   │ (Cache Miss / API)
   ▼
[Internet Gateway]
   │
   ▼
[Public Subnet: ALB (Application Load Balancer)]
   │ (Path-based routing: /api/* -> NestJS, /* -> Next.js)
   ▼
[Private Subnet: ECS Fargate Containers] (No Public IP)
   │
   ▼ (Port 5432 - Chỉ cho phép Security Group của ECS)
[Private Isolated Subnet: RDS PostgreSQL Multi-AZ]`,
      scenario: 'Toàn bộ cơ sở dữ liệu và logic nghiệp vụ được bảo vệ nhiều lớp trong mạng nội bộ, hacker không thể dò thấy IP của database từ internet.'
    },
    trade_offs: {
      when_use: 'Chuẩn mực kiến trúc cho mọi hệ thống SaaS, E-commerce và Fintech trong sản xuất.',
      when_not_use: 'Dự án demo hoặc startup giai đoạn đầu ít vốn có thể dùng dịch vụ PaaS như Render, Vercel, Railway để tiết kiệm chi phí NAT Gateway (~35$/tháng).',
      pros: ['Độ sẵn sàng 99.99%', 'Bảo mật chuẩn ngân hàng và tuân thủ PCI-DSS'],
      cons: ['Chi phí duy trì NAT Gateway, ALB, Multi-AZ cao hơn', 'Đòi hỏi kiến thức DevOps vận hành'],
      alternatives: ['Serverless hoàn toàn với AWS Lambda + API Gateway + Aurora Serverless']
    },
    follow_ups: [
      {
        question: 'Tại sao RDS PostgreSQL không bao giờ được đặt ở Public Subnet dù có đặt mật khẩu cực mạnh?',
        answer_skeleton: 'Vì đặt ở Public Subnet sẽ bị phơi bày IP công khai, dễ bị tấn công brute-force mật khẩu, khai thác lỗ hổng zero-day của database engine và bị tấn công từ chối dịch vụ (DDoS) làm cạn kiệt kết nối kết hợp chi phí mạng tăng vọt.'
      }
    ],
    common_traps: [
      'Cấu hình Security Group của RDS mở cổng 5432 cho IP `0.0.0.0/0` để dev ở nhà tiện kết nối vào (cực kỳ nguy hiểm; phải dùng AWS SSM Session Manager hoặc VPN Bastion Host).',
      'Đặt ECS container trong Private Subnet nhưng quên tạo NAT Gateway khiến container không thể tải npm packages hay gọi API thanh toán bên ngoài.'
    ],
    active_recall: [
      'Làm thế nào để các container trong Private Subnet có thể truy cập ra internet mà bên ngoài không thể truy cập ngược vào chúng?',
      'Cơ chế Multi-AZ của AWS RDS bảo vệ hệ thống khỏi sự cố phần cứng như thế nào?'
    ],
    layers: {
      l1_junior: 'Deploy ứng dụng lên cloud dùng các dịch vụ EC2, RDS và S3 của Amazon.',
      l2_middle: 'Phân tách mạng thành Public Subnet (ALB, NAT) và Private Subnet (App, DB). Thiết lập CloudFront và Security Groups.',
      l3_senior: 'Ở mức 3 YoE, thành thạo kiến trúc VPC Multi-AZ, IaC bằng Terraform/CDK, RDS Read Replicas kết hợp connection pooling qua AWS RDS Proxy, và giám sát hạ tầng với CloudWatch Container Insights.'
    },
    why_ladder: [
      { question: 'Tại sao cần chia Public và Private Subnet?', answer: 'Để tạo vùng đệm bảo vệ (DMZ); các tài nguyên chứa dữ liệu nhạy cảm không được có Public IP.' },
      { question: 'Tại sao cần NAT Gateway?', answer: 'Nó cho phép máy trong mạng riêng gửi request ra ngoài internet nhưng chặn tất cả các kết nối lạ từ ngoài cố tình xâm nhập vào.' },
      { question: 'Tại sao cần Multi-AZ cho RDS?', answer: 'Nếu nguyên một trung tâm dữ liệu (Datacenter) của Amazon bị cháy hoặc mất điện, database tự động chuyển sang datacenter thứ hai mà không mất dữ liệu.' }
    ],
    code_reaction: {
      code: `// Cấu hình Terraform Security Group nguy hiểm:
resource "aws_security_group_rule" "rds_ingress" {
  type        = "ingress"
  from_port   = 5432
  to_port     = 5432
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"] // <-- LỖ HỔNG CHẾT NGƯỜI
  security_group_id = aws_security_group.rds.id
}`,
      question: 'Lỗ hổng bảo mật nghiêm trọng trong đoạn code Terraform trên là gì?',
      explanation: 'Mở cổng database 5432 cho toàn bộ thế giới (0.0.0.0/0), tạo điều kiện cho botnet quét và tấn công brute-force.',
      fix: 'Thay `cidr_blocks` bằng `source_security_group_id = aws_security_group.backend_ecs.id` (chỉ cho phép container backend kết nối).'
    },
    cross_link_node_id: 'node-cong-gateway'
  },

  // ==========================================
  // DOMAIN 23: SYSTEM DESIGN (3 YoE)
  // ==========================================
  {
    id: 'topic-system-design-flash-sale',
    domain_id: 'domain-23-system-design',
    domain_title: 'Domain 23 — System Design (3 YoE)',
    title: 'E-Commerce Flash Sale & Inventory Concurrency Control',
    target_intent: 'Đánh giá năng lực thiết kế hệ thống chịu tải đột biến (Spike Traffic): chống bán vượt số lượng tồn kho (Overselling) và bảo vệ cơ sở dữ liệu không bị sập.',
    trigger_keywords: ['Flash Sale', 'Overselling Prevention', 'Pessimistic vs Optimistic Locking', 'Redis Atomic DECR', 'Rate Limiting', 'Queue Buffer'],
    recall_5s: 'Flash Sale: Không để hàng triệu request cùng chạm trực tiếp vào Database để trừ kho (gây deadlock và sập DB). Dùng Redis với Lua script nguyên tử để trừ kho trước (`DECR`), chỉ những người trừ kho thành công mới được đẩy vào Queue tạo đơn hàng trong DB.',
    interview_answer: 'Thiết kế hệ thống Flash Sale (ví dụ 1.000 iPhone giá 1$ cho 100.000 người mua đồng thời) phải giải quyết 2 bài toán: Chống bán quá tồn kho (Overselling) và Ngăn sập cơ sở dữ liệu. Nếu dùng SQL truyền thống `SELECT FOR UPDATE`, hàng chục ngàn transaction sẽ xếp hàng khóa dòng dữ liệu, gây nghẽn kết nối và deadlock. Kiến trúc nhiều lớp chuẩn gồm: (1) Lớp Ingress: CloudFront cache các thông tin tĩnh của sản phẩm (ảnh, mô tả), chặn request từ bot bằng AWS WAF và Rate Limiter; (2) Lớp Cắt Giảm Lưu Lượng (Traffic Shedding): Nạp trước số lượng tồn kho vào Redis. Khi user bấm Mua, ta chạy một đoạn Lua Script nguyên tử trên Redis để kiểm tra `stock > 0` và trừ tồn kho `DECR`. Toàn bộ thao tác này diễn ra trong RAM chỉ mất < 2ms. (3) 99.000 người đến sau nhận kết quả "Hết hàng" ngay tại Redis mà không tốn 1 truy vấn SQL nào. (4) Đúng 1.000 người trừ kho thành công được đẩy message vào Kafka/RabbitMQ để worker xử lý tạo đơn hàng và trừ tiền theo thứ tự một cách êm ái trong Database.',
    deep_dive: 'Xử lý khi người dùng không thanh toán: Đơn hàng đặt giữ chỗ có TTL 15 phút. Nếu sau 15 phút user không thanh toán, Delay Queue (hoặc Redis Key Expiration event) sẽ tự động cộng lại tồn kho vào Redis và hủy đơn.',
    practical_example: {
      title: 'Lua Script trừ tồn kho nguyên tử trên Redis',
      code: `local stockKey = KEYS[1]
local userKey = KEYS[2]

-- Kiểm tra xem user này đã mua chưa (chống 1 người gom hàng)
if redis.call("EXISTS", userKey) == 1 then
  return -1 -- Lỗi: Đã mua rồi
end

-- Đọc tồn kho hiện tại
local currentStock = tonumber(redis.call("GET", stockKey) or "0")
if currentStock <= 0 then
  return 0 -- Lỗi: Đã hết hàng
end

-- Trừ kho và đánh dấu user đã mua một cách ATOMIC tuyệt đối
redis.call("DECR", stockKey)
redis.call("SET", userKey, "1", "EX", 900) -- Khóa 15 phút
return 1 -- Thành công: Đủ điều kiện tạo đơn hàng`,
      scenario: '100.000 người cùng bấm nút đúng lúc 00:00:00, kho hàng đúng 1.000 chiếc được bán sạch mà không bao giờ bị âm kho (-1) hay sập hệ thống.'
    },
    trade_offs: {
      when_use: 'Sự kiện flash sale, mở bán vé ca nhạc, đặt chỗ giờ vàng có lượng truy cập đột biến gấp 100 lần bình thường.',
      when_not_use: 'Trang mua sắm thông thường hàng ngày có lưu lượng ổn định (dùng Optimistic Locking trong SQL là đủ đơn giản).',
      pros: ['Bảo vệ 100% Database cốt lõi', 'Tránh triệt để Overselling mà response cực nhanh (< 10ms)'],
      cons: ['Phức tạp trong việc đồng bộ ngược nếu người dùng hủy thanh toán'],
      alternatives: ['Pessimistic Locking `SELECT FOR UPDATE` (chỉ chạy tốt dưới 100 req/s)']
    },
    follow_ups: [
      {
        question: 'Optimistic Locking khác Pessimistic Locking ở điểm nào và khi nào nên dùng cái nào?',
        answer_skeleton: 'Pessimistic Locking (khóa bi quan) dùng `SELECT ... FOR UPDATE` khóa dòng dữ liệu ngay từ đầu, an toàn nhưng làm nghẽn hiệu năng khi tương tranh cao. Optimistic Locking (khóa lạc quan) thêm cột `version`, khi UPDATE kiểm tra `WHERE version = old_version`; nếu thất bại thì retry, thích hợp khi tỷ lệ xung đột thấp (Read-heavy).'
      }
    ],
    common_traps: [
      'Đọc tồn kho bằng code ứng dụng `if (stock > 0)` rồi mới chạy `UPDATE stock = stock - 1` (Race condition kinh điển khiến kho bị âm).',
      'Dùng Redis GET rồi sau đó DECR bằng 2 lệnh riêng biệt mà không dùng Lua Script (vẫn bị race condition giữa 2 lệnh).'
    ],
    active_recall: [
      'Tại sao `SELECT FOR UPDATE` trong SQL lại không chịu được tải của các đợt Flash Sale lớn?',
      'Tại sao bắt buộc phải dùng Lua Script khi kiểm tra và trừ tồn kho trên Redis?'
    ],
    layers: {
      l1_junior: 'Flash sale bán hàng số lượng ít cho nhiều người, cần chống mua quá số lượng.',
      l2_middle: 'Sử dụng Redis và Queue để đệm yêu cầu, không cho request chạm thẳng vào Database.',
      l3_senior: 'Ở mức 3 YoE, thành thạo Lua Scripting nguyên tử trên Redis, cơ chế Delay Queue hoàn trả kho, và phân tầng Traffic Shedding tại API Gateway.'
    },
    why_ladder: [
      { question: 'Tại sao Database bị treo khi Flash Sale?', answer: 'Hàng ngàn connection cố gắng giành giật Row-Level Lock trên cùng 1 dòng sản phẩm, làm nghẽn thread pool và tràn RAM.' },
      { question: 'Tại sao Redis chịu được?', answer: 'Redis xử lý in-memory đơn luồng nguyên tử, có thể xử lý 100.000 phép trừ kho mỗi giây mà không cần lock tranh chấp.' },
      { question: 'Queue đóng vai trò gì sau khi trừ kho Redis thành công?', answer: 'Nó biến dòng traffic lũ quét thành dòng chảy ổn định để Database ghi đơn hàng với tốc độ vừa phải.' }
    ],
    code_reaction: {
      code: `// Xử lý trừ kho ngây thơ trong SQL:
const product = await db.product.findUnique({ where: { id } });
if (product.stock > 0) {
  // Khoảng hở Race Condition 10ms ở đây!
  await db.product.update({
    where: { id },
    data: { stock: product.stock - 1 }
  });
}`,
      question: 'Khi có 100 request đồng thời chạy đoạn code trên lúc stock = 1, chuyện gì xảy ra?',
      explanation: 'Tất cả 100 request cùng đọc được stock = 1, sau đó cả 100 request cùng trừ thành công -> Bán ra 100 chiếc dù kho chỉ có 1 (Bán vượt kho - Overselling thảm họa).',
      fix: 'Dùng câu lệnh atomic trong SQL: `UPDATE products SET stock = stock - 1 WHERE id = $1 AND stock > 0;` hoặc xử lý trên Redis Lua script.'
    },
    cross_link_node_id: 'node-tru-db'
  },

  // ==========================================
  // DOMAIN 24: OBSERVABILITY & MONITORING
  // ==========================================
  {
    id: 'topic-observability-three-pillars',
    domain_id: 'domain-24-observability',
    domain_title: 'Domain 24 — Observability & Monitoring',
    title: 'Three Pillars: Logs, Metrics & Distributed Tracing (Correlation ID)',
    target_intent: 'Đánh giá khả năng điều tra sự cố trong hệ thống phân tán: lần theo dấu vết request qua nhiều microservices bằng Correlation ID và phân tích P99 Latency.',
    trigger_keywords: ['Three Pillars of Observability', 'Structured Logging', 'Correlation ID / Trace ID', 'Distributed Tracing (OpenTelemetry)', 'P99 / P95 Latency', 'RED Metrics'],
    recall_5s: '3 trụ cột Observability: Metrics (biết KHI NÀO có lỗi/chậm), Logs (biết TẠI SAO bị lỗi), Traces (biết lỗi xảy ra Ở ĐÂU qua chuỗi dịch vụ). Bắt buộc phải gắn Correlation ID xuyên suốt từ API Gateway qua các microservices.',
    interview_answer: 'Để giám sát và chẩn đoán một hệ thống phân tán, ta kết hợp 3 trụ cột Observability: (1) Metrics: Các chỉ số định lượng theo thời gian (RED method: Rate - throughput, Errors - tỷ lệ lỗi 5xx, Duration - P99 latency). Tôi luôn theo dõi P99 thay vì độ trễ trung bình Average, vì Average che giấu các trường hợp người dùng bị treo lâu; (2) Structured Logging: Log dạng JSON (timestamp, level, context) để Elasticsearch hoặc Grafana Loki dễ lọc; (3) Distributed Tracing: Khi một request của khách hàng đi qua Gateway → Auth Service → Order Service → Database → Payment Gateway, ta gắn một mã `x-correlation-id` (hoặc Trace ID theo chuẩn W3C TraceContext) ngay tại cửa ngõ. Mã này được truyền qua HTTP Headers và gán vào mọi dòng log và span. Khi có sự cố, ta chỉ cần gõ Trace ID là thấy ngay toàn bộ biểu đồ ngọn lửa (Flame Graph), chỉ ra chính xác service nào làm chậm mất 3 giây.',
    deep_dive: 'Tại sao phải đo P99 Latency mà không đo Average? Nếu 99 request mất 10ms nhưng 1 request mất 10.000ms (10s), độ trễ trung bình chỉ là 110ms (nhìn rất đẹp), nhưng thực tế cứ 100 khách hàng thì có 1 khách hàng bị treo trang 10s dẫn tới mất đơn hàng.',
    practical_example: {
      title: 'Middleware tự động gắn Correlation ID xuyên suốt request',
      code: `import { v4 as uuidv4 } from 'uuid';

export function correlationIdMiddleware(req, res, next) {
  // Lấy ID từ client gửi lên hoặc tự sinh mới
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  // Gắn correlationId vào mọi log context
  req.logger = {
    info: (msg, meta) => console.log(JSON.stringify({ level: 'INFO', correlationId, msg, ...meta })),
    error: (msg, meta) => console.error(JSON.stringify({ level: 'ERROR', correlationId, msg, ...meta }))
  };

  next();
}`,
      scenario: 'Khi khách hàng khiếu nại báo lỗi giao dịch, nhân viên CSKH chỉ cần lấy mã correlation-id trên màn hình là dev tìm ra đúng 100% dòng log liên quan trong 2 giây.'
    },
    trade_offs: {
      when_use: 'Bắt buộc cho mọi kiến trúc Microservices và REST API production.',
      when_not_use: 'Không log toàn bộ payload nhạy cảm (mật khẩu, số thẻ tín dụng CVV, access token) vào log vì vi phạm bảo mật PCI-DSS.',
      pros: ['Giảm thời gian tìm nguyên nhân gốc rễ (MTTR - Mean Time to Resolution) từ vài tiếng xuống vài phút'],
      cons: ['Chi phí lưu trữ log khổng lồ nếu không có Sampling (chỉ lưu trace 10% request bình thường và 100% request lỗi)'],
      alternatives: ['OpenTelemetry (OTel)', 'Sentry cho Error Tracking']
    },
    follow_ups: [
      {
        question: 'Làm thế nào để truyền Correlation ID khi giao tiếp qua Message Queue (RabbitMQ/Kafka)?',
        answer_skeleton: 'Gắn `correlationId` vào trường headers metadata của message (ví dụ Kafka Record Headers hoặc AMQP message properties). Consumer khi nhận message sẽ lấy ID đó đưa vào logger context.'
      }
    ],
    common_traps: [
      'Dùng `console.log("here")` không có cấu trúc JSON và không có correlationId trên production.',
      'Log toàn bộ thông tin thẻ ngân hàng hoặc token bí mật vào file log.'
    ],
    active_recall: [
      'Mỗi trụ cột trong 3 trụ cột Observability (Logs, Metrics, Traces) trả lời câu hỏi gì trong điều tra sự cố?',
      'Tại sao trong giám sát hiệu năng web, chỉ số P99 Latency luôn quan trọng hơn chỉ số Average Latency?'
    ],
    layers: {
      l1_junior: 'Ghi log để biết server đang làm gì và báo lỗi ở đâu.',
      l2_middle: 'Sử dụng Structured JSON logging và Correlation ID để truy vết request qua nhiều dịch vụ.',
      l3_senior: 'Ở mức 3 YoE, thành thạo OpenTelemetry spans, thiết lập SLO/SLI alerts dựa trên P99 latency, và tối ưu hóa chi phí logging bằng Trace Sampling.'
    },
    why_ladder: [
      { question: 'Tại sao log đơn lẻ không đủ trong Microservices?', answer: 'Vì một request đi qua 5 server khác nhau, log nằm phân tán ở 5 nơi không biết ghép lại như thế nào nếu không có ID chung.' },
      { question: 'Correlation ID giải quyết bằng cách nào?', answer: 'Nó đóng vai trò như mã vé duy nhất đi cùng request qua mọi trạm, cho phép lọc ra toàn bộ hành trình bằng 1 truy vấn.' },
      { question: 'Tracing khác Logging ở điểm nào?', answer: 'Tracing đo lường chính xác khoảng thời gian (duration) của từng bước con, thể hiện trực quan dưới dạng sơ đồ hình cây (Waterfall).' }
    ],
    code_reaction: {
      code: `// Gọi microservice tiếp theo mà quên truyền ID:
async function forwardOrder(order, req) {
  // BUG: Không truyền header
  await axios.post('http://payment-service/charge', { amount: order.total });
}`,
      question: 'Tại sao việc không truyền Correlation ID sang payment-service làm tê liệt khả năng debug khi thanh toán lỗi?',
      explanation: 'Chuỗi Distributed Tracing bị đứt gãy. Khi payment-service báo lỗi, không ai biết lỗi đó bắt nguồn từ đơn hàng nào của order-service.',
      fix: `await axios.post('http://payment-service/charge', { amount: order.total }, {
  headers: { 'x-correlation-id': req.correlationId }
});`
    }
  },

  // ==========================================
  // DOMAIN 25: SYSTEMATIC DEBUGGING
  // ==========================================
  {
    id: 'topic-debugging-systematic-framework',
    domain_id: 'domain-25-debugging',
    domain_title: 'Domain 25 — Systematic Debugging',
    title: '"I Don\'t Know — But I Know How to Debug" Framework & 502 Spike Investigation',
    target_intent: 'Đánh giá bản lĩnh và phương pháp luận giải quyết vấn đề khi đối mặt với sự cố lạ chưa từng gặp (Senior Mental Framework vs Guesswork).',
    trigger_keywords: ['Systematic Debugging', 'Clarify → Reproduce → Observe', 'Hypothesis Testing', '502 Bad Gateway', 'Upstream Timeout', 'Root Cause Analysis (RCA)'],
    recall_5s: 'Quy trình 8 bước debug chuẩn: 1. Làm rõ triệu chứng → 2. Tái hiện lỗi → 3. Quan sát logs/metrics → 4. Thu hẹp phạm vi → 5. Đưa giả thuyết → 6. Thử nghiệm giả thuyết → 7. Sửa & Kiểm chứng → 8. Chặn lỗi hồi quy.',
    interview_answer: 'Khi gặp một câu hỏi hoặc sự cố mà tôi chưa từng thấy trước đây, tôi không đoán mò mà trả lời dựa trên Nguyên lý cơ bản (First Principles) và Khung tư duy Debug có hệ thống. Ví dụ với sự cố: "API thi thoảng trả về 502 Bad Gateway ngẫu nhiên": (1) Làm rõ: 502 có nghĩa là Edge/Nginx/ALB không nhận được phản hồi hợp lệ từ upstream server phía sau; (2) Quan sát Metrics: Kiểm tra CPU, RAM, Connection Pool và độ trễ response của Node.js backend tại đúng thời điểm xuất hiện 502; (3) Thu hẹp phạm vi: 502 xảy ra trên toàn bộ API hay chỉ một endpoint cụ thể? Có trùng với thời điểm cron job chạy hay traffic tăng đột biến không? (4) Giả thuyết 1: Node.js bị Event Loop Lag do dính tác vụ nặng CPU, làm request bị timeout quá ngưỡng 60s của ALB; Giả thuyết 2: Node.js process bị OOM crash và Docker khởi động lại (restart loop); Giả thuyết 3: Connection Pool của PostgreSQL bị cạn kiệt khiến request bị treo. (5) Thử nghiệm: Kiểm tra `docker events` xem có container exit 137 (OOM) không, kiểm tra log Nginx error.log. Khi tìm ra nguyên nhân, tôi sửa tận gốc và viết thêm alert/test để ngăn chặn tái phát.',
    deep_dive: 'Câu trả lời mẫu vàng khi phỏng vấn gặp câu hỏi không biết: "Em chưa từng trực tiếp làm việc với công nghệ X, nhưng dựa trên bản chất của tầng mạng/hệ điều hành, em sẽ tiếp cận điều tra theo các bước sau..." - Người phỏng vấn đánh giá tư duy logic và khả năng tự học của ứng viên cao hơn nhiều so với việc cố tình bịa chuyện.',
    practical_example: {
      title: 'Sơ đồ cây phán đoán sự cố 502 Bad Gateway',
      code: `Mã lỗi 502 Bad Gateway xuất hiện!
  │
  ├──► 1. Kiểm tra Docker / Process Status
  │     ├── Có Restart liên tục không? ──► YES ──► Kiểm tra OOM (Exit 137) hoặc Uncaught Exception
  │     └── NO (Process vẫn sống)
  │
  ├──► 2. Kiểm tra Event Loop Lag & CPU
  │     ├── CPU 100%? ──► YES ──► Đang chạy vòng lặp vô tận, Regex ReDoS, hoặc JSON.parse khổng lồ
  │     └── NO
  │
  └──► 3. Kiểm tra Hạ tầng phụ thuộc (Dependencies)
        ├── DB connection pool bị đầy? ──► Request chờ mòn mỏi quá 60s -> Nginx tự ngắt trả 502!
        └── Third-party API (Stripe, SMS) bị treo không có timeout.`,
      scenario: 'Tiếp cận từng nhánh logic để loại trừ các khả năng, tìm ra thủ phạm chính xác trong 10 phút thay vì restart server trong vô vọng.'
    },
    trade_offs: {
      when_use: 'Áp dụng cho mọi sự cố production (Incident Response) và khi trả lời các câu hỏi khó trong buổi phỏng vấn.',
      when_not_use: 'Không suy diễn phức tạp hóa cho các lỗi cơ bản đã có thông báo rõ ràng trong stack trace (như sai password DB).',
      pros: ['Được interviewer đánh giá cao về độ chín chắn và tư duy khoa học', 'Tránh việc sửa mò làm phát sinh thêm lỗi mới'],
      cons: ['Đòi hỏi sự bình tĩnh cao dưới áp lực sập hệ thống'],
      alternatives: ['Post-Mortem 5 Whys Analysis']
    },
    follow_ups: [
      {
        question: 'Khác biệt giữa mã lỗi 502 Bad Gateway và 504 Gateway Timeout là gì?',
        answer_skeleton: '502 là Gateway nhận phản hồi không hợp lệ (hoặc backend đóng socket đột ngột khi chưa gửi response). 504 là Gateway đợi quá thời gian cấu hình (timeout, ví dụ 60s) mà backend hoàn toàn không trả lời.'
      }
    ],
    common_traps: [
      'Đoán mò: "Chắc do server yếu, khởi động lại là xong" (vừa mất dấu vết log để debug, vừa chắc chắn sẽ bị sập lại sau vài tiếng).',
      'Nói "Em không biết" rồi im lặng hoàn toàn trong buổi phỏng vấn.'
    ],
    active_recall: [
      'Nêu thứ tự 8 bước trong khung tư duy Systematic Debugging Framework?',
      'Mã lỗi 502 Bad Gateway chỉ ra vấn đề nằm ở thành phần nào trong kiến trúc web?'
    ],
    layers: {
      l1_junior: 'Khi có lỗi thì đọc log, tìm dòng báo đỏ và tra Google/StackOverflow.',
      l2_middle: 'Biết tái hiện lỗi trên máy local, cô lập biến số và kiểm tra logs của các dịch vụ liên quan.',
      l3_senior: 'Ở mức 3 YoE, suy luận từ nguyên lý cơ bản (First Principles), sử dụng phương pháp loại trừ giả thuyết khoa học, và viết Incident Post-Mortem với RCA phòng thủ.'
    },
    why_ladder: [
      { question: 'Tại sao không nên restart server ngay khi có sự cố?', answer: 'Restart sẽ xóa sạch dữ liệu trong RAM, heap dump và trạng thái socket đang bị nghẽn, làm mất cơ hội tìm ra nguyên nhân gốc rễ.' },
      { question: 'Tại sao cần đưa ra giả thuyết trước khi sửa?', answer: 'Để tránh việc thử nghiệm bừa bãi làm hệ thống rối loạn thêm; mỗi thay đổi phải nhằm kiểm chứng 1 giả thuyết cụ thể.' },
      { question: 'Tại sao interviewer thích hỏi câu hỏi tình huống debug?', answer: 'Vì nó phản ánh chân thực năng lực giải quyết vấn đề dưới áp lực thật khi vào dự án.' }
    ],
    code_reaction: {
      code: `// Tác vụ ngầm không có timeout:
app.post('/webhook', async (req, res) => {
  // Gọi bên thứ ba không có timeout:
  await axios.post('https://partner.com/notify', req.body);
  res.json({ ok: true });
});`,
      question: 'Khi đối tác partner.com bị treo hệ thống, server của bạn sẽ gặp lỗi gì?',
      explanation: 'Tất cả các request gọi vào endpoint này sẽ bị treo vô thời hạn (Socket hang up). Khi số kết nối chờ vượt quá giới hạn, server hết sạch socket và Load Balancer trả về lỗi 502/504 hàng loạt.',
      fix: 'Luôn luôn đặt timeout cho mọi HTTP call ra ngoài: `axios.post(url, data, { timeout: 3000 })` và chuyển sang queue xử lý bất đồng bộ.'
    }
  },

  // ==========================================
  // DOMAIN 26: RAPID FIRE REFLEX BANK
  // ==========================================
  {
    id: 'topic-rapid-fire-blitz',
    domain_id: 'domain-26-rapid-fire',
    domain_title: 'Domain 26 — Rapid Fire Reflex Bank',
    title: 'Rapid-Fire 15-Second Blitz: High-Frequency Questions',
    target_intent: 'Luyện phản xạ tốc độ cao: bật ra định nghĩa và mental model chính xác trong vòng 10–15 giây cho các câu hỏi phỏng vấn phổ biến nhất.',
    trigger_keywords: ['Closure', 'Virtual DOM', 'useCallback', 'Index', 'Transaction', 'Idempotency', 'JWT vs Session', 'CORS'],
    recall_5s: 'Phản xạ tức thì: Closure (hàm nhớ scope cha) | VDOM (cây ảo so diff) | Index (B-Tree O(logN)) | ACID (nguyên tử, nhất quán, cô lập, bền vững) | Idempotency (gọi N lần kết quả không đổi).',
    interview_answer: 'Bộ 5 phản xạ chớp nhoáng: (1) Closure là gì? Là hàm ghi nhớ lexical scope của nơi sinh ra nó dù hàm cha đã kết thúc; (2) Tại sao cần Index trong SQL? Để chuyển tìm kiếm tuần tự O(N) thành tìm kiếm cây B-Tree O(log N); (3) Idempotency là gì? Là tính chất của API mà dù client gọi 1 lần hay gọi lại 10 lần thì trạng thái dữ liệu trên hệ thống chỉ thay đổi đúng 1 lần; (4) JWT khác Session ở đâu? JWT là stateless lưu trên client, Session là stateful lưu trên server/Redis; (5) CORS là gì? Là cơ chế bảo mật của trình duyệt chặn website lạ đọc dữ liệu từ domain khác nếu thiếu header Access-Control-Allow-Origin.',
    deep_dive: 'Mục tiêu của vòng Rapid-Fire là kiểm tra nền tảng tự nhiên của ứng viên. Không ấp úng, không dùng từ đệm "ờ, à", trả lời dứt khoát trong 2 câu: Câu 1 nêu bản chất, Câu 2 nêu mục đích tồn tại.',
    trade_offs: {
      when_use: 'Dành cho các vòng phỏng vấn sàng lọc ban đầu (Screening Call) hoặc khi interviewer hỏi dồn dập kiểm tra phản xạ.',
      when_not_use: 'Không áp dụng kiểu trả lời ngắn cụt lủn này cho vòng System Design chuyên sâu (cần phân tích trade-offs mở rộng).',
      pros: ['Tạo ấn tượng kiến thức cực kỳ vững vàng và tự tin'],
      cons: ['Nếu không kiểm soát dễ biến thành học vẹt nếu thiếu ví dụ'],
      alternatives: ['STAR method cho câu hỏi kinh nghiệm']
    },
    layers: {
      l1_junior: 'Nắm được khái niệm cơ bản của từng thuật ngữ.',
      l2_middle: 'Bật ra câu trả lời chuẩn xác trong 10-15 giây không cần suy nghĩ lâu.',
      l3_senior: 'Sẵn sàng mở rộng ngay lập tức sang trade-off và failure scenario nếu interviewer hỏi sâu tiếp.'
    },
    code_reaction: {
      code: `// Đoán nhanh trong 5s:
console.log(typeof null);
console.log([] == ![]);`,
      question: 'Kết quả in ra là gì?',
      explanation: '`typeof null` in "object" (lỗi lịch sử của JS engine). `[] == ![]` in true (vì ![] là false -> so sánh [] == 0 -> [].toString() là "" -> Number("") là 0 -> 0 == 0).',
      fix: 'Luôn dùng `===` để tránh ép kiểu ngầm định tai hại của `==`.'
    }
  },

  // ==========================================
  // DOMAIN 27: SCENARIO QUESTIONS
  // ==========================================
  {
    id: 'topic-scenario-payment-email-fail',
    domain_id: 'domain-27-scenario-questions',
    domain_title: 'Domain 27 — Production Scenarios',
    title: 'Production Scenario: Payment Succeeded but Email/Order Fulfillment Failed',
    target_intent: 'Đánh giá khả năng xử lý thảm họa thương mại điện tử: tiền đã trừ của khách nhưng hệ thống bị lỗi giữa chừng, cách thiết kế tự phục hồi (Self-healing).',
    trigger_keywords: ['Partial Failure', 'Compensation Transaction (Saga)', 'Eventual Consistency', 'Reconciliation Job', 'Dead Letter Queue', 'Webhook Retries'],
    recall_5s: 'Tiền đã trừ nhưng gửi email/tạo đơn lỗi: Tuyệt đối không hoàn tiền ngay bằng code đồng bộ. Đẩy sự kiện vào Queue có retry + Dead Letter Queue. Định kỳ chạy Reconciliation Cron đối soát với Stripe/Ngân hàng để phát hiện các đơn hàng mồ côi.',
    interview_answer: 'Đây là bài toán Thất bại Cục bộ (Partial Failure) kinh điển trong hệ thống phân tán: Thanh toán đã thành công tại Payment Gateway nhưng dịch vụ gửi email hoặc fulfillment bị sập. Cách xử lý chuyên nghiệp gồm 3 tầng: (1) Phân tách luồng bằng Transactional Outbox & Queue: Ngay khi nhận Webhook thanh toán thành công từ cổng thanh toán, ta lưu đơn hàng trạng thái PAID và lưu event vào Outbox. Tác vụ gửi email và thông báo kho được đưa vào Message Queue độc lập; (2) Cơ chế Retry thông minh: Nếu dịch vụ email chết tạm thời, queue tự động retry với Exponential Backoff (1m, 5m, 15m). Nếu sau 5 lần vẫn chết, chuyển sang Dead Letter Queue (DLQ) và bắn alert về Slack cho On-call engineer; (3) Reconciliation Job (Đối soát tự động): Mỗi đêm lúc 2h sáng, một cron job chạy đối soát giữa dữ liệu ngân hàng và database nội bộ. Nếu phát hiện giao dịch có tiền mà đơn hàng chưa hoàn tất, hệ thống tự động bù trừ (Saga Compensation) hoặc tự kích hoạt lại tiến trình fulfillment mà không làm mất quyền lợi của khách hàng.',
    deep_dive: 'Quy tắc vàng: Tuyệt đối không dựa vào Client Redirect để xác nhận thanh toán (người dùng tắt tab hoặc mất mạng trước khi chuyển về trang cảm ơn). Chỉ xác nhận thanh toán thông qua Server-to-Server Webhook có kiểm tra chữ ký bí mật (Webhook Signature HMAC).',
    practical_example: {
      title: 'Mẫu Webhook Idempotency an toàn cho cổng thanh toán',
      code: `app.post('/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;

    // 1. Kiểm tra chống xử lý trùng lặp (Idempotency)
    const processed = await db.processedEvents.findUnique({ where: { id: event.id } });
    if (processed) return res.json({ received: true });

    // 2. Chạy trong ACID transaction
    await db.$transaction(async (tx) => {
      await tx.order.update({ where: { id: paymentIntent.metadata.orderId }, data: { status: 'PAID' } });
      await tx.processedEvents.create({ data: { id: event.id } });
      // 3. Đẩy sang Queue gửi email (bất đồng bộ)
      await queue.add('send_receipt_email', { orderId: paymentIntent.metadata.orderId });
    });
  }

  res.json({ received: true });
});`,
      scenario: 'Khách hàng tắt trình duyệt ngay khi vừa nhập OTP thành công, đơn hàng vẫn được tự động kích hoạt an toàn 100%.'
    },
    trade_offs: {
      when_use: 'Mọi hệ thống xử lý thanh toán thực tế.',
      when_not_use: 'Không cố gắng làm mọi thứ đồng bộ trong 1 request HTTP duy nhất.',
      pros: ['Đảm bảo tính nhất quán cuối cùng (Eventual Consistency)', 'Hệ thống tự phục hồi mà không cần can thiệp thủ công'],
      cons: ['Email có thể đến trễ vài phút nếu dịch vụ email đối tác bị chậm'],
      alternatives: ['Saga Pattern Choreography']
    },
    layers: {
      l1_junior: 'Gặp lỗi thì ghi log lại để dev vào kiểm tra tay.',
      l2_middle: 'Tách việc gửi email sang hàng đợi để retry tự động khi dịch vụ email sống lại.',
      l3_senior: 'Ở mức 3 YoE, thành thạo Webhook Signature verification, Transactional Outbox, và đối soát tự động Reconciliation Job.'
    }
  },

  // ==========================================
  // DOMAIN 28: MIXED MOCK INTERVIEW
  // ==========================================
  {
    id: 'topic-mixed-mock-session',
    domain_id: 'domain-28-mixed-mock',
    domain_title: 'Domain 28 — Mixed Mock Interview',
    title: 'Cross-Domain Middle Mock Interview Session (Frontend ↔ Backend ↔ AWS)',
    target_intent: 'Mô phỏng buổi phỏng vấn thật: các câu hỏi được trộn lẫn bất ngờ giữa React, SQL, Node, AWS và Security để kiểm tra khả năng nhảy ngữ cảnh (Context Switching).',
    trigger_keywords: ['Context Switching', 'Fullstack Synthesis', 'End-to-End Reasoning', 'Production Trade-offs'],
    recall_5s: 'Phỏng vấn thực tế không báo trước topic. Tư duy xâu chuỗi: Frontend (State, Bundle, INP) ↔ Backend (Lifecycle, Event Loop, Idempotency) ↔ Database (Index, Transaction) ↔ AWS (VPC, S3, ALB).',
    interview_answer: 'Một Middle Fullstack Engineer 3 YoE không chỉ biết từng công nghệ riêng lẻ mà có khả năng xâu chuỗi toàn bộ luồng dữ liệu End-to-End: Khi người dùng bấm nút Mua Hàng trên React: (1) Frontend dùng TanStack Query gửi POST request kèm Idempotency-Key; (2) Request qua CloudFront WAF và ALB vào NestJS container trong Private Subnet; (3) NestJS Guard kiểm tra JWT, Pipe validate dữ liệu bằng Zod; (4) Backend gọi Lua script trên Redis kiểm tra tồn kho và giành Distributed Lock; (5) Transactional Outbox ghi nhận đơn hàng vào PostgreSQL ACID DB và đẩy message sang RabbitMQ; (6) Worker nén hóa đơn lưu vào S3 và gửi email; (7) Nếu có sự cố, hệ thống truy vết bằng Correlation ID trên CloudWatch. Tôi có thể đi sâu vào bất kỳ mắt xích nào trong chuỗi này.',
    deep_dive: 'Khả năng kết nối các mảng kiến thức là yếu tố số 1 phân biệt giữa một lập trình viên Junior làm theo mẫu và một kỹ sư Middle có thể độc lập gánh vác tính năng sản phẩm.',
    trade_offs: {
      when_use: 'Luyện tập tổng hợp trước ngày phỏng vấn thật 3–7 ngày.',
      when_not_use: 'Không luyện mixed khi chưa nắm vững các domain cơ bản.',
      pros: ['Loại bỏ cảm giác bỡ ngỡ khi interviewer chuyển chủ đề đột ngột'],
      cons: ['Đòi hỏi sự tập trung cao độ trong 60 phút'],
      alternatives: ['Peer Mock Interview với bạn bè']
    },
    layers: {
      l1_junior: 'Biết làm từng phần tách biệt.',
      l2_middle: 'Hiểu cách frontend gọi API backend và lưu vào database.',
      l3_senior: 'Ở mức 3 YoE, có bức tranh toàn cảnh End-to-End từ browser đến hạ tầng cloud, giải thích được bottleneck ở từng mắt xích.'
    }
  },

  // ==========================================
  // DOMAIN 29: 30-DAY SPACED REPETITION
  // ==========================================
  {
    id: 'topic-spaced-repetition-plan',
    domain_id: 'domain-29-spaced-repetition',
    domain_title: 'Domain 29 — 30-Day Spaced Repetition',
    title: '30-Day Active Recall Master Plan & Daily Routine Execution',
    target_intent: 'Hệ thống hóa kỷ luật ôn luyện: chuyển đổi kiến thức ngắn hạn thành phản xạ bản năng dài hạn bằng đường cong quên (Ebbinghaus Forgetting Curve).',
    trigger_keywords: ['Spaced Repetition', 'Active Recall', 'Forgetting Curve', 'Explain Out Loud', 'Gap Map Tracking'],
    recall_5s: 'Không học dồn (cramming). Chia nhỏ 60 phút mỗi ngày: 10m Flashcard tốc độ → 20m Đọc sâu L3/Why → 20m Phân tích sự cố Scenario → 10m Luyện nói thành tiếng. Ôn lại ở các mốc Ngày 1, 3, 7, 14, 30 để nhớ vĩnh viễn.',
    interview_answer: 'Não bộ con người quên 70% kiến thức sau 48 giờ nếu chỉ đọc thụ động. Để chuyển kiến thức thành phản xạ bản năng khi phỏng vấn, tôi tuân thủ nguyên tắc Active Recall kết hợp Spaced Repetition: Mỗi ngày dành đúng 60 phút chia làm 4 chặng: (1) 10 phút đầu luyện phản xạ Flashcard 10–20s để đánh thức trí nhớ; (2) 20 phút đào sâu 1 topic trọng tâm ở tầng L3 và vẽ lại Bậc thang Why-ladder; (3) 20 phút giải quyết một bài toán tình huống sự cố thực tế; (4) 10 phút cuối cùng BẮT BUỘC phải là "Explain Out Loud" (bật đồng hồ 30s và giải thích to thành tiếng như đang nói chuyện với interviewer thật). Lịch ôn tập được phân bổ theo chu kỳ giãn cách: Day 0 học mới → Day 1 kiểm tra lại → Day 3 giải bài toán tình huống → Day 7 giải thích không nhìn ghi chú → Day 14 mock interview → Day 30 phỏng vấn ngẫu nhiên.',
    deep_dive: 'Kỹ thuật "Feynman Technique + Explain Out Loud": Khi bạn nghĩ mình đã hiểu nhưng khi mở miệng nói bị ngắc ngứ, đó chính là lỗ hổng kiến thức thực tế (Gap). Việc nói to thành tiếng giúp tai nghe lại âm thanh và kích hoạt vùng ngôn ngữ não bộ, tạo phản xạ không cần suy nghĩ dịch từ tiếng Việt sang tiếng Anh.',
    trade_offs: {
      when_use: 'Lộ trình chuẩn bị phỏng vấn trong 1–2 tháng.',
      when_not_use: 'Không học thụ động theo kiểu đọc lướt sách hay highlight tài liệu.',
      pros: ['Nhớ sâu, không bị quên sau vài ngày, tự tin dưới áp lực phòng vấn'],
      cons: ['Đòi hỏi sự kiên trì và kỷ luật mỗi ngày'],
      alternatives: ['Học nhóm theo cặp (Pair practice)']
    },
    layers: {
      l1_junior: 'Đọc tài liệu nhiều lần để cố nhớ.',
      l2_middle: 'Dùng Flashcard và tự kiểm tra câu hỏi mà không nhìn đáp án.',
      l3_senior: 'Ở mức 3 YoE, thành thạo kỹ thuật Feynman giải thích bản chất, kỷ luật ôn tập theo Forgetting Curve và phản xạ nói trôi chảy dưới 30 giây.'
    }
  }
];
