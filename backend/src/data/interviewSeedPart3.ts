import { InterviewTopicEntity } from '../types/interviewTypes.js';

export const SEED_TOPICS_PART3: InterviewTopicEntity[] = [
  // ==========================================
  // DOMAIN 20: DOCKER & LINUX OPS
  // ==========================================
  {
    id: 'topic-docker-multistage-caching',
    domain_id: 'domain-20-docker-linux',
    domain_title: 'Domain 20 — Docker & Containerization',
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
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo Graceful Shutdown xử lý SIGTERM, bảo mật non-root user, multi-arch builds (ARM64 vs AMD64), và tối ưu Linux cgroups limits.'
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
    domain_title: 'Domain 21 — CI/CD Pipelines & Automation',
    title: 'Blue-Green vs Canary Deployments & Safe Zero-Downtime Migrations',
    target_intent: 'Đánh giá kinh nghiệm triển khai phần mềm không gián đoạn dịch vụ (Zero-Downtime) và kỹ năng thực hiện Database Migration tương thích ngược (Expand and Contract).',
    trigger_keywords: ['Blue-Green Deployment', 'Canary Deployment', 'Zero Downtime', 'Expand and Contract Pattern', 'Database Migration Safety', 'Rollback Strategy'],
    recall_5s: 'Blue-Green chạy 2 môi trường song song rồi chuyển router 100%. Canary chuyển dần 5% → 25% → 100% để thăm dò lỗi. Database Migration an toàn tuyệt đối không được xóa/đổi tên cột ngay; phải dùng Expand and Contract pattern.',
    interview_answer: 'Để đạt chuẩn Zero-Downtime Deployment, ta có 2 chiến lược: Blue-Green (chạy phiên bản mới trên cụm Green độc lập, kiểm tra xong thì tráo đổi Router/Load Balancer 100% lưu lượng) và Canary (chuyển 5% traffic của người dùng thật sang bản mới để theo dõi tỷ lệ lỗi và độ trễ trên CloudWatch/DataDog, nếu ổn định mới tăng dần lên 100%). Thách thức lớn nhất của Zero-Downtime nằm ở Database Migration: nếu bản Green chạy migration xóa hoặc đổi tên cột trong khi bản Blue vẫn đang nhận 95% traffic, bản Blue sẽ sập ngay lập tức. Để khắc phục, ta áp dụng mô hình "Expand and Contract": (1) Bước 1 (Expand): Thêm cột mới `full_name`, giữ nguyên cột cũ `first_name, last_name`. Code ghi vào cả hai; (2) Bước 2: Chạy background script migrate dữ liệu cũ; (3) Bước 3: Đổi code đọc từ cột mới; (4) Bước 4 (Contract): Ở đợt deploy tuần sau, mới xóa cột cũ an toàn.',
    deep_dive: "Trong PostgreSQL, một số câu lệnh DDL (như `ALTER TABLE ADD COLUMN ... DEFAULT 'abc'` trên các bản Postgres cũ, hoặc thêm index không có CONCURRENTLY) sẽ chiếm Exclusive Table Lock, chặn đứng mọi câu lệnh SELECT/INSERT và làm treo toàn bộ ứng dụng production. Bắt buộc phải dùng `CREATE INDEX CONCURRENTLY`.",
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
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo Zero-downtime Database Migrations (Expand/Contract), DDL locks avoidance, và tự động rollback dựa trên SLO/Error Budget alerts.'
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
  // DOMAIN 22: AWS CLOUD & SERVERLESS ECOSYSTEM
  // ==========================================
  {
    id: 'topic-aws-fullstack-architecture',
    domain_id: 'domain-22-aws-cloud',
    domain_title: 'Domain 22 — AWS Cloud & Serverless Ecosystem',
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
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo kiến trúc VPC Multi-AZ, IaC bằng Terraform/CDK, RDS Read Replicas kết hợp connection pooling qua AWS RDS Proxy, và giám sát hạ tầng với CloudWatch Container Insights.'
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
  {
    id: 'topic-aws-ecs-fargate-orchestration',
    domain_id: 'domain-22-aws-cloud',
    domain_title: 'Domain 22 — AWS Cloud & Serverless Ecosystem',
    title: 'AWS ECS Fargate vs EC2 & Container Orchestration at Scale',
    target_intent: 'Đánh giá khả năng chọn lựa và vận hành container runtime trên AWS: trade-off giữa ECS Fargate (Serverless) vs ECS EC2, cơ chế Auto-scaling và Rolling Update không gián đoạn.',
    trigger_keywords: ['AWS ECS', 'Fargate vs EC2', 'Task Definition', 'Capacity Provider', 'Service Auto Scaling', 'Target Tracking', 'Stop Timeout'],
    recall_5s: 'ECS Fargate không cần quản lý máy chủ EC2 (Zero server management), trả tiền theo vCPU/RAM container tiêu thụ. ECS EC2 cho phép tùy biến sâu, dùng Spot instances tiết kiệm 70% chi phí. Dùng Target Tracking Scaling theo RequestCountPerTarget.',
    interview_answer: 'Khi lựa chọn nền tảng container trên AWS, quyết định cốt lõi là ECS Fargate vs ECS EC2: (1) Với ECS Fargate: Là mô hình Serverless Container, ta không cần vá lỗi Linux OS, quản lý dung lượng ổ đĩa hay cụm máy ảo. Mỗi Task khởi chạy trong một micro-VM độc lập có ENI riêng trong VPC. Cực kỳ lý tưởng cho web API có tải biến động hoặc nhóm kỹ thuật tinh gọn không có đội ngũ DevOps chuyên trách; (2) Với ECS EC2: Cần thiết khi ứng dụng đòi hỏi GPU, mount ổ cứng EFS/EBS tốc độ cực cao, hoặc muốn tận dụng EC2 Spot Instances để tối ưu chi phí tới 70–90%; (3) Vận hành Production: Cần cấu hình Task Definition với `stopTimeout` (mặc định 30s) để container hoàn tất request trước khi nhận SIGKILL; cấu hình Minimum Healthy Percent = 100% và Maximum Percent = 200% để đảm bảo Rolling Update có sẵn container thay thế trước khi container cũ bị tắt.',
    deep_dive: 'Capacity Providers: Giúp linh hoạt phối hợp giữa Fargate On-Demand (đảm bảo độ tin cậy) và Fargate Spot (tiết kiệm chi phí). Ví dụ cấu hình tỉ lệ Base: 2 Tasks On-Demand, sau đó scale theo tỉ lệ 1 On-Demand : 4 Spot.',
    practical_example: {
      title: 'Cấu hình Rolling Deployment an toàn trên ECS Service',
      code: `resource "aws_ecs_service" "api" {
  name            = "production-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 4
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 100 # Luôn duy trì 100% capacity
  deployment_maximum_percent         = 200 # Cho phép bật gấp đôi trong lúc deploy

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "api"
    container_port   = 3000
  }
}`,
      scenario: 'Khi deploy image mới, ECS khởi chạy 4 task mới song song, chờ ALB Health Check chuyển sang Healthy rồi mới dừng 4 task cũ, đạt 0 downtime.'
    },
    trade_offs: {
      when_use: 'SaaS APIs, NestJS/Node microservices, Next.js frontend SSR chạy trên hạ tầng container chuyên nghiệp.',
      when_not_use: 'Tác vụ chạy ngắt quãng vài phút một ngày (dùng AWS Lambda rẻ hơn rất nhiều).',
      pros: ['Không tốn công bảo trì cụm máy chủ EC2', 'Bảo mật cô lập cao cấp độ VM'],
      cons: ['Thời gian khởi động task (1-2 phút) lâu hơn so với Lambda cold start (< 1s)'],
      alternatives: ['AWS EKS (Kubernetes)', 'AWS App Runner']
    },
    follow_ups: [
      {
        question: 'Làm thế nào để ECS Auto Scaling phản ứng kịp với spike traffic đột biến?',
        answer_skeleton: 'Kết hợp Target Tracking Metric trên ALB (ví dụ `ALBRequestCountPerTarget` = 1000 req/min) với Step Scaling dựa trên CloudWatch Alarm và giữ số lượng min_capacity đủ tải nền.'
      }
    ],
    common_traps: [
      'Đặt `minimum_healthy_percent = 0` khiến toàn bộ task cũ bị terminate cùng lúc trước khi task mới khởi động, gây sập hệ thống vài phút.',
      'Gán cứng Task Memory/CPU quá sát ngưỡng thực tế dẫn đến container bị OOMKilled khi traffic tăng.'
    ],
    active_recall: [
      'Sự khác nhau cơ bản giữa ECS Fargate và ECS EC2 là gì?',
      'Tại sao `deployment_minimum_healthy_percent = 100` lại quan trọng đối với Zero-Downtime?'
    ],
    layers: {
      l1_junior: 'ECS là dịch vụ điều phối container Docker trên đám mây AWS.',
      l2_middle: 'Fargate tự quản lý hạ tầng tính toán, EC2 yêu cầu tự cấu hình và cập nhật máy ảo.',
      l3_senior: 'Ở cấp độ Production & Senior, làm chủ Capacity Providers kết hợp Fargate Spot, tinh chỉnh Target Tracking scaling, và xử lý container stopTimeout.'
    },
    cross_link_node_id: 'node-cong-gateway'
  },
  {
    id: 'topic-aws-lambda-serverless-concurrency',
    domain_id: 'domain-22-aws-cloud',
    domain_title: 'Domain 22 — AWS Cloud & Serverless Ecosystem',
    title: 'Serverless Event-Driven Compute with AWS Lambda & Cold-Start Optimization',
    target_intent: 'Đánh giá kinh nghiệm thực chiến với mô hình Serverless: hiểu vòng đời thực thi của Lambda, xử lý Cold Start, kiểm soát Concurrency và bảo vệ cơ sở dữ liệu hạ nguồn.',
    trigger_keywords: ['AWS Lambda', 'Cold Start vs Warm Start', 'Execution Context', 'Reserved Concurrency', 'Provisioned Concurrency', 'RDS Connection Exhaustion'],
    recall_5s: 'Lambda gồm Init Phase (chạy code ngoài handler) và Invoke Phase. Tránh khởi tạo DB connection trong handler. Dùng Provisioned Concurrency để triệt tiêu Cold Start cho endpoint quan trọng. Dùng Reserved Concurrency để ngăn Lambda đè sập PostgreSQL.',
    interview_answer: 'Kiến trúc AWS Lambda mang lại khả năng scale tự động từ 0 lên hàng chục ngàn invocations/giây mà không tốn chi phí chờ. Tuy nhiên, trong sản xuất cần làm chủ 3 thách thức: (1) Cold Start: Xảy ra khi Lambda cấp phát micro-VM mới và nạp runtime. Để tối ưu: tách code khởi tạo DB client/SDK ra ngoài Handler (Execution Context reuse); giảm bundle size bằng ESBuild/Tree-shaking; với các API đòi hỏi P99 latency < 50ms, bật Provisioned Concurrency để giữ sẵn warm instances; (2) Giới hạn Concurrency & Bảo vệ Database: Khi có spike 10,000 requests, Lambda tự động scale 10,000 instances. Nếu mỗi instance mở 5 kết nối SQL, cụm PostgreSQL sẽ bị sập vì quá tải Connection (Max Connections Exhaustion). Giải pháp: Đặt Reserved Concurrency cho function hoặc đặt AWS RDS Proxy ở giữa để gom connection pool; (3) Event Source Mapping: Với SQS/DynamoDB Streams, Lambda tự động poll theo batch, cần bật `ReportBatchItemFailures` để chỉ retry những record bị lỗi thay vì retry toàn bộ batch.',
    deep_dive: 'Execution Environment Lifecycle: Code nằm ngoài `export const handler` chỉ chạy 1 lần duy nhất trong Init Phase. Các invocations tiếp theo (Warm) sẽ tái sử dụng biến toàn cục và kết nối mạng đã mở trước đó.',
    practical_example: {
      title: 'Mẫu Lambda Handler tối ưu tái sử dụng kết nối (Connection Reuse)',
      code: `import { S3Client } from '@aws-sdk/client-s3';
import { Pool } from 'pg';

// KHỞI TẠO NGOÀI HANDLER: Chỉ chạy 1 lần trong Init Phase!
const s3 = new S3Client({});
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2, // Mỗi container Lambda chỉ giữ tối đa 2 kết nối
  idleTimeoutMillis: 30000
});

export const handler = async (event: any) => {
  // Tái sử dụng kết nối đã có sẵn trong Execution Context
  const client = await dbPool.connect();
  try {
    const { rows } = await client.query('SELECT * FROM orders WHERE id = $1', [event.orderId]);
    return { statusCode: 200, body: JSON.stringify(rows[0]) };
  } finally {
    client.release();
  }
};`,
      scenario: 'Tiết kiệm 200ms thời gian bắt tay TCP/TLS với database cho mỗi lần gọi hàm.'
    },
    trade_offs: {
      when_use: 'Event-driven tasks, xử lý ảnh/video từ S3, webhook ingestion, cron jobs định kỳ, microservices tải biến động lớn.',
      when_not_use: 'Ứng dụng chạy tác vụ liên tục 24/7 tải cố định (chạy ECS Fargate/EC2 sẽ rẻ hơn), hoặc tác vụ xử lý video kéo dài > 15 phút (vượt timeout của Lambda).',
      pros: ['Tự động scale hoàn hảo', 'Chi phí = 0 khi không có người dùng truy cập'],
      cons: ['Cold start latency', 'Khó debug và kiểm thử local phức tạp hơn'],
      alternatives: ['AWS ECS Fargate', 'Cloudflare Workers']
    },
    follow_ups: [
      {
        question: 'Tại sao lại cần AWS RDS Proxy khi sử dụng Lambda với PostgreSQL?',
        answer_skeleton: 'Vì kiến trúc serverless của Lambda có thể scale hàng ngàn container tức thì, mỗi container mở kết nối riêng sẽ làm tràn connection pool của Postgres. RDS Proxy đóng vai trò connection pool tập trung, chia sẻ kết nối và tái sử dụng chúng an toàn.'
      }
    ],
    common_traps: [
      'Tạo mới kết nối Database (new PrismaClient() / new Pool()) BÊN TRONG thân hàm handler khiến mỗi request mở thêm kết nối mới làm cạn kiệt DB.',
      'Đặt Lambda bên trong VPC mà không bật VPC Lattice/Hyperplane gây cold start 10 giây trên các kiến trúc cũ.'
    ],
    active_recall: [
      'Init Phase và Invoke Phase của AWS Lambda khác nhau như thế nào?',
      'Làm thế nào để ngăn hàng ngàn Lambda instances làm cạn kiệt kết nối của cơ sở dữ liệu quan hệ?'
    ],
    layers: {
      l1_junior: 'Lambda chạy code không cần server, kích hoạt bởi sự kiện và tính tiền theo mili-giây.',
      l2_middle: 'Biết cách giảm cold start và tái sử dụng execution context bằng cách khai báo client ngoài handler.',
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo Provisioned Concurrency, Event Source Mapping partial failure reporting, và phối hợp RDS Proxy chống cạn kiệt kết nối.'
    },
    cross_link_node_id: 'node-cong-gateway'
  },
  {
    id: 'topic-aws-s3-high-throughput-storage',
    domain_id: 'domain-22-aws-cloud',
    domain_title: 'Domain 22 — AWS Cloud & Serverless Ecosystem',
    title: 'High-Throughput Object Storage with AWS S3 Presigned URLs, Multipart & Lifecycle',
    target_intent: 'Đánh giá kỹ năng thiết kế hạ tầng lưu trữ quy mô lớn: tải tệp trực tiếp, tối ưu chi phí lưu trữ dài hạn và bảo vệ dữ liệu với S3 Object Lock/Versioning.',
    trigger_keywords: ['AWS S3', 'Presigned URL V4', 'Multipart Upload', 'S3 Lifecycle Rules', 'Glacier Deep Archive', 'S3 Event Notifications', 'OAC (Origin Access Control)'],
    recall_5s: 'Presigned URL cho phép client đẩy file thẳng lên S3 mà không nghẽn RAM server. File > 100MB bắt buộc dùng S3 Multipart Upload song song. Cấu hình S3 Lifecycle tự động đẩy file cũ sang Glacier để giảm 80% chi phí lưu trữ.',
    interview_answer: 'AWS S3 là nền tảng lưu trữ đối tượng (Object Storage) chuẩn công nghiệp với độ bền 11 số 9 (99.999999999%). Trong thiết kế hệ thống quy mô lớn, tôi tập trung vào 3 trụ cột: (1) Tránh Bottleneck Máy Chủ bằng Presigned URLs: Thay vì client tải file 1GB qua API Gateway/Backend làm tràn bộ nhớ và tốn băng thông kép, backend chỉ sinh một Presigned URL có chữ ký HMAC-SHA256 với thời hạn sống 5-15 phút. Browser sử dụng URL này để PUT trực tiếp vào S3; (2) Multipart Upload: Đối với các tệp lớn (> 100MB) hoặc mạng không ổn định, chia tệp thành các chunk 5MB–10MB tải lên song song. Nếu rớt mạng ở chunk nào, chỉ cần tải lại đúng chunk đó; (3) Tối ưu hóa chi phí với S3 Lifecycle Management: Thiết lập quy tắc tự động: sau 30 ngày chuyển dữ liệu từ S3 Standard sang S3 Infrequent Access (tiết kiệm 50%), sau 90 ngày chuyển sang S3 Glacier Flexible, sau 365 ngày lưu trữ vĩnh viễn ở Glacier Deep Archive (tiết kiệm 95% chi phí).',
    deep_dive: 'S3 Event Notifications: S3 có thể tự động phát sinh sự kiện `s3:ObjectCreated:*` đẩy vào SQS hoặc EventBridge. Đây là mẫu thiết kế Event-Driven chuẩn mực để kích hoạt Worker xử lý nén ảnh, quét virus hoặc trích xuất video mà không làm nghẽn luồng người dùng.',
    practical_example: {
      title: 'Sinh Presigned URL với điều kiện kích thước và Content-Type nghiêm ngặt',
      code: `import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: 'ap-southeast-1' });

export async function generateUploadUrl(userId: string, filename: string, mimeType: string) {
  const key = \`uploads/\${userId}/\${Date.now()}-\${filename}\`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: mimeType, // Buộc client phải gửi đúng MIME
    ServerSideEncryption: 'AES256'
  });

  // URL chỉ có hiệu lực trong 300 giây (5 phút)
  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  return { presignedUrl, key };
}`,
      scenario: 'Người dùng tải tệp 500MB trực tiếp vào S3 với tốc độ tối đa của đường truyền cá nhân, backend hoàn toàn không tốn 1MB RAM nào.'
    },
    trade_offs: {
      when_use: 'Lưu trữ tài liệu, ảnh sản phẩm, video, bản sao lưu database, xuất báo cáo CSV lớn.',
      when_not_use: 'Làm hệ thống tệp đĩa gắn cho ứng dụng đòi hỏi độ trễ micro-giây (cần dùng Amazon EBS hoặc EFS).',
      pros: ['Độ bền 11 số 9', 'Dung lượng lưu trữ vô hạn', 'Chi phí cực thấp với Glacier'],
      cons: ['Tính nhất quán eventual consistency trên một số metadata cũ (hiện đã có strong read-after-write)'],
      alternatives: ['Cloudflare R2 (không tốn phí egress)', 'Google Cloud Storage']
    },
    follow_ups: [
      {
        question: 'Làm thế nào để chặn người dùng tải mã độc hoặc file giả mạo khi dùng Presigned URL?',
        answer_skeleton: 'Sử dụng S3 Event Notification kích hoạt Lambda quét Magic Bytes của tệp sau khi upload; tích hợp ClamAV container để quét virus; nếu không hợp lệ thì xóa file và đánh dấu vi phạm.'
      }
    ],
    common_traps: [
      'Công khai toàn bộ S3 bucket ra Internet (public read) thay vì dùng CloudFront kết hợp OAC (Origin Access Control).',
      'Để Presigned URL hết hạn quá lâu (như 24 tiếng) tạo lỗ hổng cho kẻ xấu lợi dụng upload file rác.'
    ],
    active_recall: [
      'Tại sao việc upload file lớn qua backend server lại là một kiến trúc tồi trong sản xuất?',
      'Giải thích chiến lược 3 tầng của S3 Lifecycle Rules để giảm chi phí lưu trữ?'
    ],
    layers: {
      l1_junior: 'S3 là kho chứa tệp đám mây của AWS.',
      l2_middle: 'Dùng Presigned URL để upload trực tiếp và cấu hình CloudFront CDN phía trước S3.',
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo S3 Multipart song song, Lifecycle Tiering sang Glacier, S3 Event Notifications, và bảo vệ bucket bằng OAC.'
    },
    cross_link_node_id: 'node-s3-upload'
  },
  {
    id: 'topic-aws-dynamodb-single-table-design',
    domain_id: 'domain-22-aws-cloud',
    domain_title: 'Domain 22 — AWS Cloud & Serverless Ecosystem',
    title: 'Amazon DynamoDB Single-Table Design & High-Concurrency Partitioning',
    target_intent: 'Đánh giá tư duy thiết kế cơ sở dữ liệu NoSQL hiệu năng cao: Single-Table Design của Rick Houlihan, Partition Key hashing và kiểm soát chi phí RCU/WCU.',
    trigger_keywords: ['DynamoDB', 'Single-Table Design', 'Partition Key (PK) & Sort Key (SK)', 'Global Secondary Index (GSI)', 'Hot Partition', 'RCU / WCU', 'DynamoDB Streams'],
    recall_5s: 'DynamoDB scale vô hạn bằng cách băm Partition Key ra nhiều physical storage node. Single-Table Design gộp nhiều entity vào 1 bảng để đọc dữ liệu quan hệ trong đúng 1 query đơn lẻ O(1). Tránh Hot Partition bằng Partition Salting.',
    interview_answer: 'Amazon DynamoDB là cơ sở dữ liệu NoSQL Key-Value & Document có độ trễ đơn vị mili-giây ở bất kỳ quy mô nào. Trong kiến trúc cao cấp, tôi áp dụng Single-Table Design: (1) Thay vì tạo 10 bảng riêng lẻ như trong SQL (Users, Orders, Items), ta gộp tất cả vào 1 bảng duy nhất với khóa chung chung: `PK` (Partition Key) và `SK` (Sort Key); (2) Lấy dữ liệu quan hệ trong 1 Query: Ví dụ với `PK = USER#123`, ta có thể query lấy cả thông tin User profile (`SK = METADATA`) và danh sách các đơn hàng gần nhất (`SK = ORDER#2026-09-21`) trong đúng MỘT network request duy nhất, loại bỏ hoàn toàn nhu cầu JOIN bảng; (3) Tránh Hot Partition: DynamoDB băm PK để phân bổ dữ liệu vào các phân vùng phần cứng (1000 WCU / 3000 RCU mỗi phân vùng). Nếu tất cả request cùng ghi vào một giá trị PK (như ngày hôm nay), phân vùng đó sẽ bị quá tải (Hot Partition) gây Throttling. Giải pháp: Áp dụng Write Sharding / Partition Salting (thêm suffix ngẫu nhiên `_0` đến `_9`).',
    deep_dive: 'DynamoDB Streams: Ghi lại luồng thay đổi dữ liệu theo thời gian thực (CDC - Change Data Capture). Khi có bản ghi mới, Streams kích hoạt Lambda để đồng bộ dữ liệu sang Elasticsearch/OpenSearch phục vụ tìm kiếm toàn văn, hoặc gửi thông báo WebSocket.',
    practical_example: {
      title: 'Mô hình dữ liệu Single-Table Design cho E-Commerce',
      code: `// Bảng duy nhất: "EcommerceTable"
// Item 1: Thông tin User
{
  "PK": "USER#u_101",
  "SK": "METADATA",
  "name": "Alex",
  "email": "alex@example.com"
}

// Item 2: Đơn hàng thuộc User u_101
{
  "PK": "USER#u_101",
  "SK": "ORDER#ord_999",
  "total": 150.0,
  "status": "PAID",
  "GSI1PK": "ORDER#ord_999", // Phục vụ tìm kiếm ngược từ mã đơn
  "GSI1SK": "USER#u_101"
}

// Item 3: Chi tiết sản phẩm trong đơn
{
  "PK": "ORDER#ord_999",
  "SK": "ITEM#item_456",
  "productName": "Mechanical Keyboard",
  "quantity": 1
}`,
      scenario: 'Chỉ với 1 câu lệnh Query `PK = USER#u_101 AND SK begins_with(ORDER#)`, ứng dụng lấy toàn bộ lịch sử đơn hàng của user chỉ mất 4ms.'
    },
    trade_offs: {
      when_use: 'Hệ thống có access patterns được định nghĩa rõ ràng từ trước, chịu tải hàng triệu request/giây, gaming leaderboards, shopping carts.',
      when_not_use: 'Hệ thống phân tích kinh doanh (BI/Analytics), ứng dụng có truy vấn tùy biến ad-hoc linh hoạt (cần dùng PostgreSQL/Snowflake).',
      pros: ['Độ trễ < 10ms ổn định ở mọi quy mô dung lượng (1GB hay 100TB như nhau)', 'Zero server maintenance'],
      cons: ['Đường cong học tập dốc (Steep learning curve)', 'Thay đổi access patterns đòi hỏi migrate schema phức tạp'],
      alternatives: ['Amazon Aurora PostgreSQL', 'MongoDB Atlas']
    },
    follow_ups: [
      {
        question: 'Khác biệt giữa Scan và Query trong DynamoDB là gì?',
        answer_skeleton: '`Query` tìm kiếm trực tiếp bằng Partition Key (O(1)), chỉ đọc dữ liệu cần thiết, cực nhanh và tiết kiệm RCU. `Scan` duyệt tuần tự qua toàn bộ bảng, làm nghẽn hiệu năng, tốn RCU và có thể làm cạn kiệt ngân sách.'
      }
    ],
    common_traps: [
      'Dùng DynamoDB như SQL: Tạo nhiều bảng rồi ở backend gọi nhiều truy vấn tuần tự rồi tự ghép dữ liệu bằng code JS.',
      'Sử dụng câu lệnh `Scan` trong luồng request của người dùng thật.'
    ],
    active_recall: [
      'Single-Table Design giải quyết bài toán gì trong hệ thống phân tán chịu tải lớn?',
      'Hot Partition trong DynamoDB xảy ra khi nào và cách khắc phục?'
    ],
    layers: {
      l1_junior: 'DynamoDB là cơ sở dữ liệu NoSQL khóa-giá trị của AWS.',
      l2_middle: 'Hiểu vai trò của Partition Key và Sort Key để thực hiện truy vấn Query thay vì Scan.',
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo mô hình Single-Table Design, tối ưu Global Secondary Indexes (GSI), xử lý Hot Partitions bằng Sharding, và tích hợp DynamoDB Streams.'
    },
    cross_link_node_id: 'node-tru-db'
  },
  {
    id: 'topic-aws-api-gateway-throttling-authorizers',
    domain_id: 'domain-22-aws-cloud',
    domain_title: 'Domain 22 — AWS Cloud & Serverless Ecosystem',
    title: 'AWS API Gateway Architecture, Lambda Authorizers & Throttling Defense',
    target_intent: 'Đánh giá khả năng xây dựng cửa ngõ API an toàn: phân biệt REST API vs HTTP API, cơ chế phân quyền Lambda Authorizer và kỹ thuật chống tấn công từ chối dịch vụ bằng Token Bucket.',
    trigger_keywords: ['API Gateway', 'REST API vs HTTP API', 'Lambda Authorizer', 'Token Bucket Throttling', 'Usage Plans & API Keys', 'Request Validation'],
    recall_5s: 'HTTP API nhẹ và rẻ hơn 70% so với REST API. Lambda Authorizer xác thực JWT tại cửa ngõ trước khi request chạm vào backend, cache policy IAM để tiết kiệm chi phí. Throttling dùng Token Bucket (Rate vs Burst limit) để chặn request lũ lụt.',
    interview_answer: 'AWS API Gateway đóng vai trò cửa ngõ tiếp nhận toàn bộ lưu lượng internet vào hệ thống: (1) Lựa chọn REST API vs HTTP API: HTTP API được xây dựng lại từ đầu, tối ưu hóa độ trễ thấp hơn 60% và chi phí rẻ hơn 70%, hỗ trợ OIDC/JWT authorizer native; REST API phức tạp hơn, phù hợp khi cần tính năng cao cấp như Request Validation, WAF trực tiếp, SOAP XML transformation, hoặc Usage Plans bán API; (2) Lambda Authorizer & Token Caching: Khi request gửi `Authorization: Bearer <token>`, API Gateway kích hoạt một hàm Lambda Authorizer kiểm tra chữ ký token. Nếu hợp lệ, Authorizer sinh một IAM Policy `Allow` và cache kết quả trong 300 giây dựa trên token hash. Nhờ vậy, 1.000 request tiếp theo của user được duyệt qua cổng tức thì mà không cần tốn tiền chạy lại hàm Lambda xác thực; (3) Throttling Defense: Áp dụng thuật toán Token Bucket ở 2 cấp độ: Rate Limit (số request/giây trung bình) và Burst Limit (dung lượng bình chứa tối đa khi có đột biến). Khi client vượt ngưỡng, Gateway tự trả về 429 Too Many Requests ngay tại Edge, bảo vệ toàn diện backend phía sau.',
    deep_dive: 'API Gateway Request Validation: Gateway có thể xác thực JSON Schema của body request ngay tại biên mạng. Nếu payload thiếu trường bắt buộc, nó trả về 400 Bad Request lập tức mà không chuyển tiếp request vào backend, tiết kiệm 100% chi phí tính toán compute.',
    practical_example: {
      title: 'Mẫu IAM Policy do Lambda Authorizer trả về',
      code: `export const handler = async (event: any) => {
  const token = event.authorizationToken;
  const user = verifyJwt(token);

  if (!user) {
    throw new Error('Unauthorized'); // Trả về 401
  }

  // Trả về IAM Policy cho phép truy cập
  return {
    principalId: user.id,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: event.methodArn // Cho phép gọi endpoint này
      }]
    },
    context: {
      userId: user.id,
      role: user.role // Truyền context xuống backend
    }
  };
};`,
      scenario: 'Bảo vệ toàn bộ API endpoints phía sau, backend chỉ việc đọc `event.requestContext.authorizer` mà không cần verify lại JWT.'
    },
    trade_offs: {
      when_use: 'Cửa ngõ công khai cho web/mobile apps, serverless backends, monetization qua API Keys.',
      when_not_use: 'Giao tiếp nội bộ giữa các microservices trong cùng VPC (nên dùng Service Connect hoặc Private ALB để tránh độ trễ thêm 15ms và chi phí request).',
      pros: ['Tự động scale không giới hạn', 'Tích hợp bảo mật mạnh mẽ và throttling chi tiết'],
      cons: ['Độ trễ overhead ~15–30ms', 'Chi phí tăng đáng kể nếu có hàng tỷ request micro-transactions'],
      alternatives: ['Application Load Balancer (ALB)', 'Kong API Gateway']
    },
    follow_ups: [
      {
        question: 'Sự khác nhau giữa Rate Limit và Burst Limit trong API Gateway là gì?',
        answer_skeleton: 'Rate Limit là tốc độ trung bình bền vững (ví dụ 10.000 req/s). Burst Limit là sức chứa tối đa của thùng chứa token (ví dụ 5.000 tokens) cho phép xử lý một đợt sóng đột ngột trong vài mili-giây trước khi bắt đầu áp dụng Rate Limit.'
      }
    ],
    common_traps: [
      'Không bật cache cho Lambda Authorizer khiến mỗi HTTP request kích hoạt thêm một invocation của authorizer làm nhân đôi chi phí và độ trễ.',
      'Dùng REST API cho các tác vụ đơn giản thay vì HTTP API làm đội chi phí hạ tầng lên gấp 3 lần.'
    ],
    active_recall: [
      'Tại sao nên cân nhắc HTTP API thay vì REST API trong AWS API Gateway?',
      'Cơ chế cache của Lambda Authorizer hoạt động như thế nào để giảm tải cho hệ thống?'
    ],
    layers: {
      l1_junior: 'API Gateway là cổng kết nối nhận request từ internet chuyển vào backend.',
      l2_middle: 'Biết cấu hình CORS, định tuyến đường dẫn và gắn API Key để kiểm soát truy cập.',
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo Lambda Authorizer với IAM policy caching, Token Bucket Throttling (Rate/Burst), và Request Validation tại biên mạng.'
    },
    cross_link_node_id: 'node-cong-gateway'
  },
  {
    id: 'topic-aws-appsync-realtime-graphql',
    domain_id: 'domain-22-aws-cloud',
    domain_title: 'Domain 22 — AWS Cloud & Serverless Ecosystem',
    title: 'Realtime GraphQL with AWS AppSync, WebSocket Subscriptions & Resolvers',
    target_intent: 'Đánh giá kinh nghiệm với nền tảng Managed GraphQL: cách vận hành WebSocket Subscriptions chịu tải hàng triệu client, Pipeline Resolvers và JavaScript resolvers.',
    trigger_keywords: ['AWS AppSync', 'Managed GraphQL', 'Realtime Subscriptions', 'WebSocket Connection Lifecycle', 'Pipeline Resolvers', 'APPSYNC_JS vs VTL'],
    recall_5s: 'AppSync tự động quản lý kết nối WebSocket cho hàng triệu clients mà không cần dựng cụm Redis Pub/Sub hay Socket.io server. Dùng APPSYNC_JS để viết resolver trực tiếp tới DynamoDB không cần Lambda.',
    interview_answer: 'AWS AppSync là dịch vụ Managed GraphQL cấp doanh nghiệp, nổi bật nhất ở khả năng hỗ trợ Realtime Subscriptions trên quy mô cực lớn: (1) Quản trị WebSocket Tự Động: Trong kiến trúc truyền thống (như Socket.io), khi có 100.000 người dùng trực tuyến, ta phải dựng cụm server Node.js, cấu hình Sticky Session trên Load Balancer và cụm Redis Pub/Sub để đồng bộ tin nhắn giữa các máy chủ. Với AppSync, AWS tự động quản lý toàn bộ kết nối WebSocket phân tán ra khắp các Edge Location, tự động fan-out tin nhắn khi có Mutation; (2) Tối ưu hóa Resolver không cần Server (Direct Data Source): Thay vì mọi GraphQL query đều phải gọi qua một hàm Lambda (tốn thêm chi phí và dính cold start), AppSync hỗ trợ kết nối trực tiếp với DynamoDB hoặc RDS Aurora bằng APPSYNC_JS (JavaScript resolvers). Resolver chuyển đổi GraphQL query thành truy vấn DynamoDB gốc và trả về kết quả trong dưới 5ms; (3) Pipeline Resolvers: Cho phép xâu chuỗi nhiều tác vụ: Bước 1 gọi DynamoDB kiểm tra quyền truy cập của User, Bước 2 thực hiện cập nhật dữ liệu, Bước 3 gọi EventBridge thông báo cho các hệ thống khác.',
    deep_dive: 'Bảo vệ Subscription: AppSync cho phép áp dụng Authorization Directive (như `@aws_auth`, `@aws_cognito_user_pools`) ngay trên từng trường của schema. Nhờ đó, người dùng chỉ có thể lắng nghe (subscribe) các sự kiện thuộc về ID của chính họ.',
    practical_example: {
      title: 'Schema GraphQL hỗ trợ Realtime Subscriptions trên AppSync',
      code: `type Message {
  id: ID!
  channelId: String!
  content: String!
  sender: String!
  createdAt: AWSDateTime!
}

type Mutation {
  sendMessage(channelId: String!, content: String!): Message!
}

type Subscription {
  onNewMessage(channelId: String!): Message
    @aws_subscribe(mutations: ["sendMessage"])
}`,
      scenario: 'Khi user gọi mutation sendMessage, AppSync tự động phát tin nhắn qua WebSocket tới hàng chục ngàn người đang subscribe channelId đó mà không cần viết 1 dòng code backend quản lý socket.'
    },
    trade_offs: {
      when_use: 'Ứng dụng chat realtime, dashboard tài chính hiển thị giá chứng khoán cập nhật từng giây, ứng dụng cộng tác (collaborative editing), mobile apps cần offline sync.',
      when_not_use: 'Hệ thống chỉ có các tác vụ CRUD đơn giản tĩnh ít tương tác (dùng REST API đơn giản hơn).',
      pros: ['Zero infrastructure management cho WebSockets', 'Xử lý N+1 tốt hơn khi dùng Direct Resolvers'],
      cons: ['Bị phụ thuộc (Vendor Lock-in) vào hệ sinh thái AWS', 'Cú pháp APPSYNC_JS có một số hạn chế so với Node.js đầy đủ'],
      alternatives: ['Apollo Server + Redis PubSub', 'Supabase Realtime']
    },
    follow_ups: [
      {
        question: 'Tại sao dùng Direct DynamoDB Resolver trên AppSync lại tốt hơn gọi qua Lambda?',
        answer_skeleton: 'Direct Resolver loại bỏ hoàn toàn độ trễ khởi động (cold start) và chi phí thực thi của Lambda, dữ liệu đi thẳng từ AppSync vào DynamoDB qua mạng nội bộ AWS chỉ mất 2–5ms.'
      }
    ],
    common_traps: [
      'Bọc mọi resolver bằng Lambda một cách quán tính khiến kiến trúc chậm chạp và tốn chi phí gấp đôi.',
      'Không lọc tham số trong Subscription khiến toàn bộ dữ liệu nhạy cảm của mọi người dùng bị broadcast công khai.'
    ],
    active_recall: [
      'Lợi ích lớn nhất của AWS AppSync so với việc tự dựng server Socket.io là gì?',
      'Pipeline Resolvers trong AppSync cho phép thực hiện điều gì?'
    ],
    layers: {
      l1_junior: 'AppSync là dịch vụ chạy GraphQL API trên AWS.',
      l2_middle: 'Hiểu cơ chế Subscriptions để cập nhật dữ liệu realtime qua WebSocket.',
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo Direct DynamoDB Resolvers bằng APPSYNC_JS, Pipeline Resolvers phân quyền nhiều bước, và thiết kế GraphQL schema tối ưu tải realtime.'
    },
    cross_link_node_id: 'node-websocket-realtime'
  },
  {
    id: 'topic-aws-cloudwatch-observability-insights',
    domain_id: 'domain-22-aws-cloud',
    domain_title: 'Domain 22 — AWS Cloud & Serverless Ecosystem',
    title: 'AWS CloudWatch Observability, Container Insights, Alarms & X-Ray Tracing',
    target_intent: 'Đánh giá năng lực giám sát và phản ứng sự cố trên AWS: khai thác CloudWatch Logs Insights, Container Insights cho ECS, thiết lập Alarms thông minh và Distributed Tracing với AWS X-Ray.',
    trigger_keywords: ['CloudWatch Logs Insights', 'CloudWatch Metrics & Alarms', 'Container Insights', 'AWS X-Ray', 'High-Resolution Metrics', 'Anomaly Detection'],
    recall_5s: 'CloudWatch Logs Insights dùng ngôn ngữ truy vấn để scan terabytes log trong vài giây. Container Insights theo dõi CPU/Memory/Disk ở cấp độ Task và Container trên ECS. Tích hợp AWS X-Ray để trace toàn bộ hành trình request qua API Gateway, Lambda và DynamoDB.',
    interview_answer: 'Một hệ thống production trên AWS không thể vận hành mù quáng nếu thiếu bộ công cụ CloudWatch & X-Ray: (1) CloudWatch Logs Insights: Thay vì tải hàng GB log về máy để grep, tôi sử dụng câu lệnh truy vấn của Insights để đếm số lượng lỗi 500, tính P95/P99 latency theo từng route và lọc các dòng log theo `correlationId` chỉ trong vài giây; (2) Container Insights: Bật trên ECS Cluster để tự động thu thập các metric chuyên sâu: CPU/Memory utilization theo từng Task, Network traffic in/out, và tỷ lệ Task restarts. Khi một container bị chết do OOM (Out Of Memory), Container Insights lập tức ghi nhận spike memory trước khi crash; (3) Composite Alarms & Anomaly Detection: Tránh tình trạng "Báo động giả gây mệt mỏi" (Alert Fatigue) bằng cách kết hợp nhiều điều kiện: Chỉ bắn thông báo Slack/PagerDuty khi: (CPU > 85%) VÀ (P99 Latency > 2s) VÀ (Tỷ lệ lỗi 5xx > 1%) duy trì liên tục trong 3 chu kỳ đo (3 evaluation periods). (4) AWS X-Ray: Thêm X-Ray SDK để tự động inject Trace Header vào mọi outgoing request, vẽ nên Service Map trực quan chỉ ra chính xác vị trí bị nghẽn.',
    deep_dive: 'High-Resolution Metrics: CloudWatch hỗ trợ lưu metric ở độ phân giải cao (1 giây thay vì 1 phút chuẩn). Cực kỳ quan trọng để phát hiện các đợt micro-bursts lưu lượng làm tràn bộ đệm socket trước khi hệ thống kịp tự động scale.',
    practical_example: {
      title: 'Câu truy vấn CloudWatch Logs Insights điều tra lỗi 500 và P99 Latency',
      code: `fields @timestamp, @message, status, duration, correlationId
| filter status >= 500
| stats count(*) as errorCount, pct(duration, 99) as p99Latency by bin(5m)
| sort errorCount desc
| limit 20`,
      scenario: 'Chỉ mất 3 giây để biết chính xác trong 1 giờ qua, khung thời gian 5 phút nào có nhiều lỗi 500 nhất và P99 latency tại thời điểm đó là bao nhiêu.'
    },
    trade_offs: {
      when_use: 'Hạ tầng AWS Native, ECS clusters, Serverless Lambda stacks.',
      when_not_use: 'Hạ tầng Multi-Cloud (chạy cả GCP/AWS) hoặc On-premise (nên chọn giải pháp độc lập như Datadog, Prometheus + Grafana, hoặc Grafana Cloud).',
      pros: ['Tích hợp sâu sẵn có với mọi dịch vụ AWS chỉ bằng 1 nút bấm', 'Bảo mật IAM native'],
      cons: ['Chi phí log ingestion và custom metrics có thể tăng rất nhanh nếu không có chính sách Log Retention (mặc định lưu vĩnh viễn)'],
      alternatives: ['Datadog', 'Prometheus + Grafana Loki', 'OpenTelemetry (OTel)']
    },
    follow_ups: [
      {
        question: 'Làm thế nào để kiểm soát chi phí lưu trữ log CloudWatch không bị đội lên hàng ngàn USD/tháng?',
        answer_skeleton: 'Đặt Retention Period rõ ràng (ví dụ 14 ngày cho development, 30–90 ngày cho production thay vì Never Expire); cấu hình filter log level ở ứng dụng (chỉ log WARN/ERROR trên prod); và sử dụng S3 Lifecycle xuất log sang S3 Glacier để lưu trữ tuân thủ pháp lý giá rẻ.'
      }
    ],
    common_traps: [
      'Để Log Retention mặc định là "Never Expire" khiến sau 2 năm tiền lưu trữ log chiếm 30% hóa đơn AWS.',
      'Đặt Alarm dựa trên số liệu tức thời 1 phút duy nhất gây ra báo động giả liên tục mỗi khi có 1 request chậm.'
    ],
    active_recall: [
      'CloudWatch Logs Insights giúp ích gì khi điều tra sự cố production so với đọc log thủ công?',
      'Tại sao cần thiết lập Composite Alarms thay vì các alarm đơn lẻ?'
    ],
    layers: {
      l1_junior: 'CloudWatch là công cụ xem biểu đồ CPU và đọc log của AWS.',
      l2_middle: 'Biết tạo Dashboard, đặt CloudWatch Alarm gửi email khi CPU cao.',
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo truy vấn Logs Insights, kích hoạt Container Insights chẩn đoán OOM container, cấu hình Composite Alarms và tích hợp AWS X-Ray distributed tracing.'
    },
    cross_link_node_id: 'node-observability'
  },

  // ==========================================
  // DOMAIN 23: SYSTEM & SOFTWARE ARCHITECTURE
  // ==========================================
  {
    id: 'topic-arch-rest-vs-graphql',
    domain_id: 'domain-23-system-design',
    domain_title: 'Domain 23 — System & Software Architecture',
    title: 'REST vs GraphQL API Architecture & High-Scale Data Fetching Trade-offs',
    target_intent: 'Đánh giá năng lực tư duy kiến trúc API: so sánh bản chất, hiệu năng mạng, bài toán Over/Under-fetching, giải quyết triệt để vấn đề N+1 và chiến lược Caching ở tầng biên.',
    trigger_keywords: ['REST vs GraphQL', 'Over-fetching & Under-fetching', 'GraphQL N+1 Problem', 'DataLoader Batching & Caching', 'HTTP Edge Caching (Cache-Control)', 'Schema Stitching & Federation'],
    recall_5s: 'REST tận dụng tối đa HTTP Caching (GET request cache tại CDN), đơn giản, dễ scale. GraphQL giải quyết triệt để Over/Under-fetching cho mobile client nhưng mất HTTP cache tự nhiên (vì dùng POST) và đối mặt bài toán N+1 truy vấn DB. Bắt buộc dùng DataLoader để batching.',
    interview_answer: 'Khi lựa chọn giữa REST và GraphQL cho kiến trúc hệ thống, ta phải cân nhắc các đánh đổi cốt lõi: (1) Bài toán Dữ liệu (Over/Under-fetching): REST thường trả về toàn bộ tài nguyên cố định (Over-fetching) hoặc buộc client phải gọi 5 API tuần tự để gom đủ dữ liệu hiển thị một màn hình (Under-fetching / Waterfall network). GraphQL cho phép client chỉ định chính xác các trường cần thiết, giảm payload mạng từ 50KB xuống 2KB, cực kỳ lý tưởng cho mạng di động 4G/5G; (2) Đánh đổi về Caching: REST là chuẩn mực vàng về Caching ở tầng HTTP/CDN (CloudFront, Cloudflare). Một request `GET /products/123` được cache tại Edge Server trả về trong 5ms. Ngược lại, GraphQL gửi hầu hết request qua HTTP `POST`, khiến các CDN truyền thống không thể cache tự động, buộc phải triển khai Client-side cache (Apollo Normalized Cache) hoặc Persisted Queries; (3) Điểm chết N+1 và DataLoader: Trong GraphQL, nếu query danh sách 100 tác giả và sách của họ, resolver ngây thơ sẽ thực hiện 1 truy vấn lấy tác giả và 100 truy vấn lấy sách (N+1 queries). Bắt buộc phải áp dụng thư viện `DataLoader` để gom nhóm (batching) các khóa lại và chỉ thực hiện đúng 1 truy vấn `WHERE author_id IN (...)`.',
    deep_dive: 'GraphQL Query Complexity & Rate Limiting: Kẻ xấu có thể gửi một GraphQL query đệ quy sâu vô tận (Author -> Books -> Author -> Books...) làm CPU backend bị treo. Trong sản xuất, bắt buộc phải cài đặt middleware tính toán Query Depth Limit và Query Complexity Analysis để từ chối các truy vấn độc hại trước khi thực thi.',
    practical_example: {
      title: 'Giải quyết bài toán N+1 trong GraphQL bằng DataLoader',
      code: `import DataLoader from 'dataloader';

// DataLoader gom tất cả authorId được yêu cầu trong 1 event loop tick:
const authorLoader = new DataLoader(async (authorIds: readonly string[]) => {
  // Thực hiện ĐÚNG 1 truy vấn SQL duy nhất:
  const authors = await db.author.findMany({
    where: { id: { in: [...authorIds] } }
  });
  
  // Trả về mảng kết quả đúng thứ tự của authorIds
  const authorMap = new Map(authors.map(a => [a.id, a]));
  return authorIds.map(id => authorMap.get(id));
});

// Trong GraphQL Resolver:
export const bookResolver = {
  author: async (book) => {
    // Không query DB trực tiếp ở đây! Hãy gọi qua loader:
    return authorLoader.load(book.authorId);
  }
};`,
      scenario: 'Từ 101 truy vấn SQL riêng lẻ gây nghẽn database, hệ thống giảm xuống chỉ còn đúng 2 truy vấn SQL siêu tốc.'
    },
    trade_offs: {
      when_use: 'GraphQL tối ưu cho ứng dụng di động phức tạp, dashboard tổng hợp dữ liệu từ nhiều microservices (BFF - Backend For Frontend). REST tối ưu cho public APIs công khai, file downloads, hệ thống tài nguyên CRUD tĩnh.',
      when_not_use: 'Không dùng GraphQL khi đội ngũ chưa hiểu DataLoader hoặc khi ứng dụng chủ yếu phục vụ các API cần HTTP CDN caching cao.',
      pros: ['Client linh hoạt tuyệt đối', 'Không còn tình trạng waterfall network requests'],
      cons: ['Mất HTTP caching tự nhiên', 'Độ phức tạp bảo mật và giám sát cao hơn'],
      alternatives: ['gRPC cho service-to-service', 'tRPC cho fullstack TypeScript']
    },
    follow_ups: [
      {
        question: 'Làm thế nào để cache các GraphQL queries ở tầng CDN (Edge Location)?',
        answer_skeleton: 'Sử dụng Automatic Persisted Queries (APQ): Client băm query thành chuỗi SHA-256 hash và gửi request dưới dạng HTTP `GET /graphql?hash=...`. Khi đó CDN có thể cache response theo hash key bình thường.'
      }
    ],
    common_traps: [
      'Viết GraphQL resolvers truy vấn cơ sở dữ liệu trực tiếp mà không dùng DataLoader gây sập DB khi có 100 người dùng.',
      'Không giới hạn Query Depth khiến hệ thống bị tấn công DoS bằng các query lồng nhau.'
    ],
    active_recall: [
      'Tại sao CDN dễ dàng cache REST API hơn rất nhiều so với GraphQL?',
      'DataLoader giải quyết vấn đề N+1 trong GraphQL bằng cơ chế nào của Node.js Event Loop?'
    ],
    layers: {
      l1_junior: 'REST dùng các phương thức HTTP GET/POST/PUT/DELETE. GraphQL dùng 1 endpoint duy nhất để query dữ liệu theo ý muốn.',
      l2_middle: 'Hiểu bài toán over/under-fetching và cách định nghĩa Schema, Queries, Mutations trong GraphQL.',
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo tối ưu N+1 bằng DataLoader, bảo vệ backend bằng Query Complexity Analysis, và triển khai CDN Edge Caching cho GraphQL bằng Persisted Queries.'
    },
    cross_link_node_id: 'node-cong-gateway'
  },
  {
    id: 'topic-arch-microservices-saga-resilience',
    domain_id: 'domain-23-system-design',
    domain_title: 'Domain 23 — System & Software Architecture',
    title: 'Microservices Decomposition, Distributed Transactions (Saga) & Circuit Breakers',
    target_intent: 'Đánh giá năng lực thiết kế hệ thống phân tán chịu lỗi cao: phân rã dịch vụ theo Domain-Driven Design, giải quyết giao dịch phân tán bằng Saga Pattern thay vì 2PC, và bảo vệ hệ thống bằng Circuit Breakers.',
    trigger_keywords: ['Microservices', 'Database-per-Service', 'Distributed Transaction', 'Two-Phase Commit (2PC)', 'Saga Pattern (Choreography vs Orchestration)', 'Circuit Breaker (Open/Half-Open/Closed)', 'Compensating Transaction'],
    recall_5s: 'Quy tắc vàng: Mỗi Microservice sở hữu database riêng (Database-per-Service). Không dùng 2PC khóa phân tán vì làm nghẽn toàn hệ thống; dùng Saga Pattern với các giao dịch bù trừ (Compensating Transactions). Bọc các kết nối ra ngoài bằng Circuit Breaker để chống lỗi dây chuyền (Cascading Failure).',
    interview_answer: 'Khi chuyển đổi từ Monolith sang Microservices, 2 bài toán sống còn là Giao dịch phân tán và Khả năng chịu lỗi: (1) Nguyên tắc Database-per-Service: Tuyệt đối không để Service A truy vấn trực tiếp vào database của Service B (vi phạm tính đóng gói và gây coupling chặt). Mọi trao đổi phải qua API hoặc Message Queue; (2) Giải quyết Giao dịch phân tán bằng Saga Pattern: Trong quy trình Đặt hàng (Order Service) → Thanh toán (Payment Service) → Trừ kho (Inventory Service), ta không thể dùng ACID transaction thông thường hay Two-Phase Commit (2PC) vì 2PC khóa tài nguyên trên mạng, độ trễ cao và dễ gây deadlock. Thay vào đó, ta áp dụng Saga Pattern: Chuỗi các transaction cục bộ. Nếu bước Trừ kho thất bại, hệ thống kích hoạt Giao dịch Bù trừ (Compensating Transaction) để hoàn lại tiền cho khách và hủy đơn hàng. Saga có 2 dạng: Choreography (các service lắng nghe event của nhau qua Kafka) và Orchestration (một Orchestrator trung tâm như AWS Step Functions điều phối từng bước); (3) Ngăn lỗi dây chuyền với Circuit Breaker: Khi Payment Gateway đối tác bị chậm 30s, các request gọi tới sẽ làm cạn kiệt thread pool của hệ thống. Circuit Breaker theo dõi tỷ lệ lỗi: Khi lỗi vượt 50%, nó "Bật ngắt mạch" (Open State) và trả về phản hồi lỗi hoặc fallback ngay lập tức mà không thèm gọi ra ngoài nữa, bảo vệ hệ thống không bị chết chùm.',
    deep_dive: 'Trạng thái của Circuit Breaker: Closed (hoạt động bình thường) → Open (chặn đứng mọi cuộc gọi, trả fallback ngay) → Sau thời gian timeout (như 30s), chuyển sang Half-Open: cho phép một vài request thăm dò đi qua. Nếu thành công, đóng mạch lại (Closed); nếu thất bại, tiếp tục mở mạch (Open).',
    practical_example: {
      title: 'Mô hình Saga Orchestration xử lý giao dịch đặt hàng thất bại',
      code: `// Quy trình Saga: Đặt hàng -> Thanh toán -> Trừ kho
async function processOrderSaga(orderId, paymentDetails) {
  // Bước 1: Tạo đơn PENDING (Local DB)
  await orderService.createPending(orderId);

  // Bước 2: Gọi Payment Service
  const paymentOk = await paymentService.charge(paymentDetails);
  if (!paymentOk) {
    await orderService.markFailed(orderId, 'PAYMENT_FAILED');
    return;
  }

  // Bước 3: Gọi Inventory Service
  const inventoryOk = await inventoryService.reserve(orderId);
  if (!inventoryOk) {
    // THẤT BẠI CỤC BỘ: KÍCH HOẠT GIAO DỊCH BÙ TRỪ (COMPENSATION)!
    await paymentService.refund(paymentDetails); // Hoàn tiền lại
    await orderService.markFailed(orderId, 'OUT_OF_STOCK'); // Hủy đơn
    return;
  }

  // Bước 4: Hoàn tất
  await orderService.markCompleted(orderId);
}`,
      scenario: 'Đảm bảo tính nhất quán cuối cùng (Eventual Consistency) trên 3 cơ sở dữ liệu độc lập mà không cần khóa bảng.'
    },
    trade_offs: {
      when_use: 'Hệ thống có nhiều team độc lập (> 30 kỹ sư), các domain nghiệp vụ có tốc độ mở rộng và scale phần cứng khác nhau.',
      when_not_use: 'Dự án mới khởi nghiệp (Startup giai đoạn MVP) hoặc team ít người (Monolith dạng Modular Monolith sẽ phát triển nhanh hơn gấp 5 lần).',
      pros: ['Độc lập deploy và scale', 'Cô lập lỗi (fault isolation)'],
      cons: ['Độ phức tạp vận hành mạng, tracing, và giao dịch phân tán cực kỳ cao'],
      alternatives: ['Modular Monolith', 'Event-Driven Architecture']
    },
    follow_ups: [
      {
        question: 'So sánh ưu nhược điểm giữa Saga Choreography và Saga Orchestration?',
        answer_skeleton: 'Choreography đơn giản, phi tập trung (decentralized), thích hợp quy trình ngắn 2–3 bước nhưng khó truy vết và dễ dính vòng lặp event. Orchestration có một bộ điều phối trung tâm rõ ràng, dễ giám sát trạng thái và xử lý rollback phức tạp nhưng tạo thêm một điểm nghẽn phụ thuộc (coordinator).'
      }
    ],
    common_traps: [
      'Nhiều microservices dùng chung 1 database PostgreSQL duy nhất (Tạo ra "Distributed Monolith" tồi tệ nhất của cả 2 thế giới).',
      'Không thiết kế giao dịch bù trừ (Compensating actions) có tính Idempotent khiến khi retry hoàn tiền lại trừ/cộng tiền 2 lần.'
    ],
    active_recall: [
      'Tại sao Two-Phase Commit (2PC) không phù hợp cho kiến trúc Microservices hiện đại?',
      '3 trạng thái hoạt động của Circuit Breaker là gì và cơ chế tự phục hồi của nó diễn ra như thế nào?'
    ],
    layers: {
      l1_junior: 'Microservices chia nhỏ ứng dụng lớn thành nhiều dịch vụ nhỏ giao tiếp qua HTTP.',
      l2_middle: 'Mỗi microservice có database riêng, trao đổi dữ liệu bất đồng bộ qua hàng đợi.',
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo Saga Pattern (Orchestration vs Choreography), thiết kế Idempotent Compensating Transactions, và cấu hình Circuit Breakers chống cascading failures.'
    },
    cross_link_node_id: 'node-backend-service'
  },
  {
    id: 'topic-arch-enterprise-cicd-zerodowntime',
    domain_id: 'domain-23-system-design',
    domain_title: 'Domain 23 — System & Software Architecture',
    title: 'Enterprise CI/CD Pipelines: Blue-Green, Canary & Zero-Downtime Database Migrations',
    target_intent: 'Đánh giá kiến trúc triển khai phần mềm cấp doanh nghiệp: bảo vệ production với CI/CD tự động, kiểm soát Canary rollout bằng số liệu giám sát thực tế và quy trình database migration an toàn.',
    trigger_keywords: ['CI/CD Pipeline', 'GitHub Actions', 'Blue-Green vs Canary', 'Automated Rollback', 'SLO / Error Budget Gates', 'Expand-Contract Pattern'],
    recall_5s: 'CI/CD chuẩn: Lint & TypeCheck → Unit Test → Build Container song song → Deploy Staging & E2E Smoke Test → Canary 5% Production. Bật Automated Rollback nếu Error Rate > 1% hoặc P99 latency vượt ngưỡng. Không bao giờ chạy migration đổi tên cột trực tiếp.',
    interview_answer: 'Một pipeline CI/CD cấp doanh nghiệp phải đảm bảo 2 yếu tố: Tốc độ đưa tính năng ra thị trường (Lead Time) và Độ tin cậy không gián đoạn dịch vụ (Zero-Downtime): (1) Thiết kế Pipeline nhiều chặng (Staged Pipeline): Khi tạo PR, GitHub Actions chạy song song: Linting, TypeScript type-check và Unit test (< 3 phút). Khi merge vào main, pipeline build Docker multi-arch image, push lên Amazon ECR với SHA commit hash; (2) Chiến lược Triển khai Canary & SLO Gates: Thay vì cập nhật 100% người dùng, ta đẩy bản mới lên cụm Canary nhận 5% lưu lượng. Pipeline tự động lắng nghe metrics từ CloudWatch/Prometheus trong 15 phút: Nếu tỷ lệ lỗi 5xx vượt quá Error Budget (ví dụ > 0.5%) hoặc P99 latency tăng 50%, hệ thống kích hoạt Rollback tự động ngay lập tức mà không cần con người can thiệp; (3) An toàn Database Migrations (Expand/Contract): Tách biệt hoàn toàn việc deploy code và migrate database thành các giai đoạn tương thích ngược, đảm bảo các container phiên bản cũ và phiên bản mới cùng đọc/ghi database êm ái trong suốt thời gian chuyển tiếp.',
    deep_dive: 'DDL Lock Safety: Trong PostgreSQL, lệnh `ALTER TABLE` thêm cột với default giá trị động hoặc thêm foreign key không có `NOT VALID` sẽ chiếm Exclusive Lock làm nghẽn toàn bộ ứng dụng. Pipeline CI/CD cần tích hợp công cụ linter migration (như `squawk` hoặc `atlas`) để phát hiện các câu lệnh khóa bảng nguy hiểm trước khi chạy lên production.',
    practical_example: {
      title: 'Mẫu GitHub Actions Workflow với Safety Gates',
      code: `name: Production Deployment Pipeline
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:unit
      - run: npm run build

  deploy-canary:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy 5% Canary to ECS
        run: ./deploy-canary.sh --weight 5
      
      - name: Monitor Error Rate for 10 mins
        run: ./verify-slo.sh || (./rollback.sh && exit 1)

  promote-full:
    needs: deploy-canary
    runs-on: ubuntu-latest
    steps:
      - name: Promote to 100% Production
        run: ./deploy-full.sh`,
      scenario: 'Bảo vệ hệ thống tự động: nếu code mới có lỗi rò rỉ bộ nhớ hoặc exception ngầm, 95% người dùng không hề bị ảnh hưởng và pipeline tự động rollback an toàn.'
    },
    trade_offs: {
      when_use: 'Hệ thống có nhiều lập trình viên cùng commit code mỗi ngày, dịch vụ có người dùng toàn cầu liên tục.',
      when_not_use: 'Dự án demo của cá nhân không có traffic thực tế.',
      pros: ['Triệt tiêu nỗi sợ deploy thứ Sáu (Friday Deployments)', 'Tự động hóa 100% khâu kiểm thử và phát hành'],
      cons: ['Đòi hỏi đầu tư ban đầu vào viết test tự động và xây dựng metrics'],
      alternatives: ['GitOps với ArgoCD / Flux']
    },
    follow_ups: [
      {
        question: 'Làm thế nào để kiểm tra một câu lệnh Database Migration có an toàn để chạy trên bảng 20 triệu dòng không?',
        answer_skeleton: 'Chạy thử migration trên môi trường Staging có clone dữ liệu thật; kiểm tra xem lệnh có cần Table Lock độc quyền không; luôn thêm cột dưới dạng nullable trước; và tạo index với CONCURRENTLY.'
      }
    ],
    common_traps: [
      'Gộp chung lệnh migration phá vỡ tương thích ngược và lệnh deploy code vào cùng 1 bước duy nhất.',
      'Deploy trực tiếp từ máy tính cá nhân của dev bằng lệnh CLI thay vì qua CI/CD có kiểm soát quyền.'
    ],
    active_recall: [
      'Canary Deployment bảo vệ hệ thống khỏi các lỗi nghiêm trọng như thế nào?',
      'Tại sao DDL Locks trong cơ sở dữ liệu quan hệ lại là kẻ thù số 1 của Zero-Downtime?'
    ],
    layers: {
      l1_junior: 'CI/CD tự động chạy lệnh test và deploy code khi push lên GitHub.',
      l2_middle: 'Biết viết file YAML cho GitHub Actions và cấu hình biến môi trường an toàn.',
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo chiến lược Canary Rollout có Automated SLO Rollback, bảo vệ Zero-Downtime bằng Expand-Contract pattern, và kiểm soát DDL locks trên database lớn.'
    },
    cross_link_node_id: 'node-cicd-pipeline'
  },
  {
    id: 'topic-arch-docker-k8s-production-hardening',
    domain_id: 'domain-23-system-design',
    domain_title: 'Domain 23 — System & Software Architecture',
    title: 'Container Orchestration with Docker & Kubernetes (K8s) Production Hardening',
    target_intent: 'Đánh giá kiến thức nền tảng và vận hành container ở quy mô lớn: kiến trúc Kubernetes, Pod lifecycle, cơ chế tự phục hồi, Health Probes và cấu hình Resource Requests/Limits chống OOM.',
    trigger_keywords: ['Kubernetes (K8s)', 'Pod Lifecycle', 'Liveness vs Readiness vs Startup Probes', 'Resource Requests & Limits', 'Horizontal Pod Autoscaler (HPA)', 'Ingress Controller', 'OOMKilled (Exit Code 137)'],
    recall_5s: 'K8s điều phối container tự động phục hồi và tự co giãn. Phải phân biệt rõ: Liveness Probe (restart pod khi chết đứng), Readiness Probe (ngừng gửi traffic khi pod đang bận/khởi động), Startup Probe (chờ app khởi động nặng). Luôn đặt Resource Requests để K8s xếp lịch (scheduler) và Limits để tránh một pod ngốn sạch RAM node.',
    interview_answer: 'Khi vận hành container ở quy mô lớn trên Kubernetes hoặc cụm Docker production, có 3 nguyên lý cốt lõi cần làm chủ: (1) Bộ ba Health Probes: Startup Probe (bảo vệ ứng dụng khởi động lâu không bị K8s giết sớm); Liveness Probe (kiểm tra ứng dụng có bị deadlock/treo Event Loop không; nếu thất bại K8s sẽ restart container); Readiness Probe (kiểm tra ứng dụng đã sẵn sàng nhận request chưa; nếu thất bại K8s chỉ tạm thời rút Pod ra khỏi Service Load Balancer mà KHÔNG restart Pod). Rất nhiều dev nhầm lẫn đặt kiểm tra kết nối DB vào Liveness Probe khiến khi DB chậm, toàn bộ Pod trong cụm bị restart đồng loạt gây sập dây chuyền; (2) Resource Requests vs Limits & Chống OOMKilled: `requests` là mức tài nguyên tối thiểu K8s bảo đảm cấp khi chọn máy (Node Scheduling); `limits` là trần tối đa. Nếu container tiêu thụ RAM vượt quá limit, Linux Kernel sẽ gửi tín hiệu SIGKILL (Exit Code 137 OOMKilled); (3) Tự động Co Giãn (HPA): Horizontal Pod Autoscaler tăng giảm số lượng Pod dựa trên mức sử dụng CPU/Memory thực tế hoặc custom metrics từ Prometheus.',
    deep_dive: 'Nguyên lý Pod Disruption Budget (PDB): Khi Kubernetes nâng cấp phiên bản node máy chủ (Node Draining), PDB đảm bảo luôn có ít nhất N Pod (ví dụ `minAvailable: 2`) hoạt động, ngăn chặn tình trạng cụm node tự động cập nhật làm gián đoạn dịch vụ của khách hàng.',
    practical_example: {
      title: 'Cấu hình K8s Deployment chuẩn Production',
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: backend:commit-sha
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        # Health Probes phân định rạch ròi:
        livenessProbe:
          httpGet:
            path: /health/liveness # Chỉ kiểm tra process còn sống
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /health/readiness # Kiểm tra sẵn sàng nhận traffic
            port: 3000
          periodSeconds: 5`,
      scenario: 'Pod khởi động êm ái, chỉ nhận traffic khi đã sẵn sàng, và tự phục hồi khi có lỗi mà không làm nghẽn cụm máy chủ.'
    },
    trade_offs: {
      when_use: 'Hệ thống có hàng chục microservices, hạ tầng multi-cloud, cần tự động co giãn và tự phục hồi cấp độ doanh nghiệp lớn.',
      when_not_use: 'Hệ thống chỉ có 1–2 dịch vụ web (dùng Docker Compose hoặc AWS ECS Fargate sẽ đơn giản và tiết kiệm chi phí vận hành hơn nhiều).',
      pros: ['Chuẩn mực công nghiệp toàn cầu', 'Hệ sinh thái công cụ mã nguồn mở phong phú'],
      cons: ['Độ phức tạp quản trị và chi phí học tập khổng lồ (Kube complexity)'],
      alternatives: ['AWS ECS Fargate', 'Docker Swarm', 'Nomad']
    },
    follow_ups: [
      {
        question: 'Tại sao KHÔNG BAO GIỜ được kiểm tra kết nối Database bên trong Liveness Probe?',
        answer_skeleton: 'Nếu Database bị nghẽn mạng hoặc khởi động lại trong 10 giây, Liveness Probe của tất cả các Pod sẽ thất bại cùng lúc. K8s sẽ restart toàn bộ Pod trong cụm, tạo ra cơn bão kết nối khởi động lại làm Database sập vĩnh viễn (Cascading Failure). Kiểm tra DB chỉ nên đặt ở Readiness Probe.'
      }
    ],
    common_traps: [
      'Không cấu hình Resource Requests/Limits khiến 1 pod bị rò rỉ bộ nhớ (Memory Leak) ăn hết RAM của cả node, kéo theo các pod khác trên cùng node bị giết lây.',
      'Cấu hình Liveness Probe quá nhạy (timeout 1s, period 2s) khiến mỗi khi có 1 request CPU nặng là pod bị restart.'
    ],
    active_recall: [
      'Sự khác biệt cốt lõi giữa Liveness Probe và Readiness Probe trong Kubernetes là gì?',
      'Exit Code 137 trong container mang ý nghĩa gì và nguyên nhân gốc rễ do đâu?'
    ],
    layers: {
      l1_junior: 'Kubernetes là phần mềm quản lý nhiều container chạy trên nhiều máy chủ.',
      l2_middle: 'Hiểu các đối tượng Pod, Deployment, Service và Ingress trong Kubernetes.',
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo thiết lập Health Probes chống cascading restarts, quản trị Resource Requests/Limits tránh OOMKilled, và cấu hình Horizontal Pod Autoscaler (HPA).'
    },
    cross_link_node_id: 'node-docker-linux'
  },
  {
    id: 'topic-system-design-flash-sale',
    domain_id: 'domain-23-system-design',
    domain_title: 'Domain 23 — System & Software Architecture',
    title: 'High-Concurrency Flash Sale & Inventory Concurrency Control',
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
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo Lua Scripting nguyên tử trên Redis, cơ chế Delay Queue hoàn trả kho, và phân tầng Traffic Shedding tại API Gateway.'
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
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo OpenTelemetry spans, thiết lập SLO/SLI alerts dựa trên P99 latency, và tối ưu hóa chi phí logging bằng Trace Sampling.'
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
    domain_title: 'Domain 25 — Systematic Debugging & Production Incidents',
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
      l3_senior: 'Ở cấp độ Production & Senior, suy luận từ nguyên lý cơ bản (First Principles), sử dụng phương pháp loại trừ giả thuyết khoa học, và viết Incident Post-Mortem với RCA phòng thủ.'
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
    domain_title: 'Domain 27 — Production Scenario Challenges',
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
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo Webhook Signature verification, Transactional Outbox, và đối soát tự động Reconciliation Job.'
    }
  },

  // ==========================================
  // DOMAIN 28: MIXED MOCK INTERVIEW
  // ==========================================
  {
    id: 'topic-mixed-mock-session',
    domain_id: 'domain-28-mixed-mock',
    domain_title: 'Domain 28 — Mixed Mock Interview Simulation',
    title: 'Cross-Domain Senior Mock Interview Session (Frontend ↔ Backend ↔ AWS ↔ Architecture)',
    target_intent: 'Mô phỏng buổi phỏng vấn thật: các câu hỏi được trộn lẫn bất ngờ giữa React, SQL, Node, AWS và Security để kiểm tra khả năng nhảy ngữ cảnh (Context Switching).',
    trigger_keywords: ['Context Switching', 'Fullstack Synthesis', 'End-to-End Reasoning', 'Production Trade-offs'],
    recall_5s: 'Phỏng vấn thực tế không báo trước topic. Tư duy xâu chuỗi: Frontend (State, Bundle, INP) ↔ Backend (Lifecycle, Event Loop, Idempotency) ↔ Database (Index, Transaction) ↔ AWS (VPC, S3, ALB).',
    interview_answer: 'Một Senior Fullstack Engineer không chỉ biết từng công nghệ riêng lẻ mà có khả năng xâu chuỗi toàn bộ luồng dữ liệu End-to-End: Khi người dùng bấm nút Mua Hàng trên React: (1) Frontend dùng TanStack Query gửi POST request kèm Idempotency-Key; (2) Request qua CloudFront WAF và ALB vào NestJS container trong Private Subnet; (3) NestJS Guard kiểm tra JWT, Pipe validate dữ liệu bằng Zod; (4) Backend gọi Lua script trên Redis kiểm tra tồn kho và giành Distributed Lock; (5) Transactional Outbox ghi nhận đơn hàng vào PostgreSQL ACID DB và đẩy message sang RabbitMQ; (6) Worker nén hóa đơn lưu vào S3 và gửi email; (7) Nếu có sự cố, hệ thống truy vết bằng Correlation ID trên CloudWatch. Tôi có thể đi sâu vào bất kỳ mắt xích nào trong chuỗi này.',
    deep_dive: 'Khả năng kết nối các mảng kiến thức là yếu tố số 1 phân biệt giữa một lập trình viên làm theo mẫu và một kỹ sư Senior có thể độc lập gánh vác kiến trúc sản phẩm.',
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
      l3_senior: 'Ở cấp độ Production & Senior, có bức tranh toàn cảnh End-to-End từ browser đến hạ tầng cloud, giải thích được bottleneck ở từng mắt xích.'
    }
  },

  // ==========================================
  // DOMAIN 29: 30-DAY SPACED REPETITION
  // ==========================================
  {
    id: 'topic-spaced-repetition-plan',
    domain_id: 'domain-29-spaced-repetition',
    domain_title: 'Domain 29 — 30-Day Spaced Repetition Mastery',
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
      l3_senior: 'Ở cấp độ Production & Senior, thành thạo kỹ thuật Feynman giải thích bản chất, kỷ luật ôn tập theo Forgetting Curve và phản xạ nói trôi chảy dưới 30 giây.'
    }
  }
];
