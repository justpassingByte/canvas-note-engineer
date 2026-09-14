import { InterviewTopicEntity } from '../types/interviewTypes.js';

export const SEED_TOPICS_PART2: InterviewTopicEntity[] = [
  // ==========================================
  // DOMAIN 10: NODE.JS INTERNALS
  // ==========================================
  {
    id: 'topic-node-event-loop-streams',
    domain_id: 'domain-10-nodejs',
    domain_title: 'Domain 10 — Node.js Internals',
    title: 'libuv Event Loop, Streams & Backpressure',
    target_intent: 'Đánh giá hiểu biết về kiến trúc non-blocking I/O của Node.js, luồng xử lý dữ liệu lớn bằng Streams và cách xử lý hiện tượng tràn bộ đệm (Backpressure).',
    trigger_keywords: ['libuv', 'Thread Pool', 'Non-blocking I/O', 'Streams', 'Backpressure', 'HighWaterMark'],
    recall_5s: 'Node.js dùng libuv để xử lý non-blocking I/O. Các tác vụ CPU/File I/O nặng được đẩy sang Thread Pool (4 threads mặc định). Stream đọc theo từng chunk; Backpressure xuất hiện khi tốc độ ghi chậm hơn tốc độ đọc.',
    interview_answer: 'Node.js chạy trên kiến trúc Event-driven Non-blocking được hỗ trợ bởi thư viện C++ libuv. Trong khi Event Loop chạy trên Main Thread duy nhất, các tác vụ nặng như File System I/O, DNS lookup và mã hóa crypto được chuyển sang Worker Thread Pool (mặc định 4 threads, có thể tăng qua UV_THREADPOOL_SIZE). Để truyền tải dữ liệu lớn (như file 5GB hay video) mà không làm cạn kiệt RAM, ta dùng Streams: dữ liệu được cắt thành các chunk nhỏ (mặc định 64KB). Nếu Writable Stream ghi xuống đĩa quá chậm so với tốc độ Readable Stream đọc vào, hiện tượng Backpressure xảy ra: Writable sẽ trả về false và emit event `drain` khi sẵn sàng tiếp nhận, phương thức `readable.pipe(writable)` tự động quản lý việc này để bảo vệ RAM.',
    deep_dive: 'Vòng lặp libuv gồm 6 pha chính theo thứ tự: Timers (setTimeout) → Pending Callbacks (I/O) → Idle/Prepare → Poll (chờ I/O mới) → Check (setImmediate) → Close Callbacks (socket.on("close")). setImmediate được thiết kế để chạy ngay sau pha Poll.',
    practical_example: {
      title: 'Xử lý file nén khổng lồ với Streams & Pipeline',
      code: `import { createReadStream, createWriteStream } from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

async function compressHugeFile(source: string, destination: string) {
  // pipeline tự động quản lý backpressure, xử lý lỗi và dọn dẹp stream
  await pipeline(
    createReadStream(source),
    createGzip(),
    createWriteStream(destination)
  );
  console.log('Nén file thành công mà chỉ tốn dưới 30MB RAM!');
}`,
      scenario: 'Nén file 10GB mà bộ nhớ Node.js process luôn ổn định ở mức vài chục MB, không bao giờ bị Out-of-Memory (OOM).'
    },
    trade_offs: {
      when_use: 'Luôn dùng Streams cho file upload, export CSV lớn, và proxy network requests.',
      when_not_use: 'Dữ liệu nhỏ trong RAM (< vài chục KB) thì đọc buffer đơn giản nhanh hơn chi phí khởi tạo stream.',
      pros: ['Tiết kiệm RAM vượt trội', 'Bắt đầu xử lý dữ liệu ngay khi chunk đầu tiên tới (Time-to-first-byte nhanh)'],
      cons: ['Error handling của stream thủ công khá phức tạp nếu không dùng pipeline()'],
      alternatives: ['fs.readFile (chỉ dùng cho file config nhỏ)']
    },
    follow_ups: [
      {
        question: 'Tại sao tác vụ tính toán CPU-bound (như hash mật khẩu hay vòng lặp lớn) lại làm chết server Node.js?',
        answer_skeleton: 'Vì nó chiếm dụng Main Thread, ngăn cản Event Loop chuyển sang các pha tiếp theo để nhận và phản hồi request HTTP của người dùng khác. Cần chuyển sang Worker Threads.'
      }
    ],
    common_traps: [
      'Dùng fs.readFileSync hoặc fs.readFile để nạp file 2GB vào RAM gây sập server (heap out of memory).',
      'Dùng stream.pipe() mà không bắt event error trên cả 2 đầu stream (rò rỉ file descriptor).'
    ],
    active_recall: [
      'Backpressure là gì và cơ chế nào trong Node.js Streams giúp xử lý nó tự động?',
      'UV_THREADPOOL_SIZE mặc định là bao nhiêu và nó đảm nhận những tác vụ nào?'
    ],
    layers: {
      l1_junior: 'Node.js dùng JavaScript ở backend, xử lý nhiều kết nối cùng lúc mà không tốn nhiều luồng.',
      l2_middle: 'libuv kết hợp Event Loop với Thread Pool để xử lý non-blocking I/O. Streams giúp đọc file lớn theo từng chunk.',
      l3_senior: 'Ở mức 3 YoE, phải thành thạo cơ chế Backpressure, quản trị Graceful Shutdown (SIGTERM/SIGINT), và debug Memory Leak bằng clinic.js hoặc heapdump.'
    },
    why_ladder: [
      { question: 'Tại sao Node.js xử lý I/O tốt hơn đa số framework truyền thống?', answer: 'Vì nó không tốn 1 thread hệ điều hành cho mỗi socket, mà dùng epoll/kqueue gom hàng ngàn socket.' },
      { question: 'Chuyện gì xảy ra nếu ghi stream nhanh hơn đọc?', answer: 'Dữ liệu bị ứ đọng trong bộ đệm RAM của Writable Stream cho tới khi tràn bộ nhớ (OOM).' },
      { question: 'Làm sao pipeline() giải quyết điều đó?', answer: 'Nó lắng nghe sự kiện drain để tạm dừng đọc cho tới khi bộ đệm xả xong.' }
    ],
    code_reaction: {
      code: `app.get('/download', (req, res) => {
  // NGUY HIỂM:
  const data = fs.readFileSync('/large-video.mp4');
  res.send(data);
});`,
      question: 'Chuyện gì sẽ xảy ra khi 10 người dùng đồng thời tải video trên?',
      explanation: 'readFileSync chặn đứng toàn bộ server (không ai vào được web), và 10 request tải file lớn cùng lúc sẽ tiêu tốn hàng GB RAM làm sập process Node.js.',
      fix: 'Sử dụng stream: `fs.createReadStream(\'/large-video.mp4\').pipe(res);`'
    },
    cross_link_node_id: 'node-dong-co'
  },

  // ==========================================
  // DOMAIN 11: NESTJS ARCHITECTURE
  // ==========================================
  {
    id: 'topic-nestjs-lifecycle-pipeline',
    domain_id: 'domain-11-nestjs',
    domain_title: 'Domain 11 — NestJS Architecture',
    title: 'Lifecycle Pipeline: Middleware vs Guard vs Interceptor vs Pipe vs Filter',
    target_intent: 'Kiểm tra xem ứng viên có nắm vững thứ tự thực thi của Request Pipeline trong NestJS và biết đặt logic đúng vị trí kiến trúc hay không.',
    trigger_keywords: ['Request Lifecycle', 'Middleware', 'Guard', 'Interceptor', 'Pipe', 'Exception Filter', 'Dependency Injection'],
    recall_5s: 'Thứ tự thực thi khi request vào NestJS: Middleware → Guard (xác thực quyền) → Interceptor (trước) → Pipe (validate/transform) → Controller Handler → Interceptor (sau) → Exception Filter (nếu lỗi).',
    interview_answer: 'NestJS tổ chức kiến trúc theo Request Lifecycle cực kỳ chặt chẽ: (1) Middleware chạy đầu tiên, dùng để can thiệp tầng raw HTTP như CORS, logging, gán requestId; (2) Guard chạy tiếp theo để xác thực Authentication và Authorization (RBAC) - nếu false sẽ chặn ngay lập tức trả về 403; (3) Interceptor (Pre) bọc quanh controller, dùng để bind thêm logic hoặc đo lường thời gian (timer); (4) Pipe chạy trước khi vào handler để validate và transform dữ liệu (Class-validator, Zod, ParseIntPipe); (5) Controller & Service thực thi nghiệp vụ; (6) Interceptor (Post) chuyển đổi format dữ liệu trả về (Data Masking, Serialization); (7) Exception Filter bắt mọi lỗi chưa được xử lý và chuẩn hóa payload lỗi trả về client.',
    deep_dive: 'Sự khác biệt quan trọng: Guard và Interceptor có quyền truy cập vào `ExecutionContext` (chứa thông tin Controller class và Handler method qua Reflector metadata), trong khi Middleware chỉ biết `req, res, next` như Express thuần túy. Vì vậy, logic phân quyền dựa trên Decorator bắt buộc phải nằm ở Guard.',
    practical_example: {
      title: 'Thứ tự triển khai một Feature bảo mật trong NestJS',
      code: `@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard) // 1. Kiểm tra Token & Role ADMIN
export class OrderController {
  @Post()
  @UseInterceptors(LoggingInterceptor) // 2. Bắt đầu tính latency
  async create(
    @Body(new ValidationPipe({ whitelist: true })) dto: CreateOrderDto // 3. Validate DTO
  ) {
    return this.orderService.create(dto); // 4. Nghiệp vụ
  }
}
// Nếu service throw lỗi -> ExceptionFilter tự bắt và format JSON lỗi chuẩn.`,
      scenario: 'Toàn bộ việc phân quyền, validate và đo độ trễ được tách rời khỏi code nghiệp vụ theo mô hình AOP (Aspect-Oriented Programming).'
    },
    trade_offs: {
      when_use: 'Tuân thủ đúng vị trí: Auth ở Guard, Validate ở Pipe, Format/Logging ở Interceptor, Bắt lỗi ở Filter.',
      when_not_use: 'Không nhét logic nghiệp vụ cơ sở dữ liệu vào Middleware hoặc Pipe.',
      pros: ['Tuân thủ tuyệt đối Single Responsibility Principle', 'Dễ dàng tái sử dụng và viết Unit Test với DI'],
      cons: ['Độ dốc học tập cao hơn Express thuần', 'Nhiều lớp abstraction làm tăng độ phức tạp ban đầu'],
      alternatives: ['Express / Fastify thuần với custom middleware']
    },
    follow_ups: [
      {
        question: 'Tại sao NestJS mặc định là Singleton Scope và khi nào nên dùng Request Scope?',
        answer_skeleton: 'Singleton chỉ tạo 1 instance duy nhất giúp tiết kiệm RAM và tăng tốc độ xử lý. Request Scope sinh instance mới cho mỗi request, chỉ nên dùng khi cần lưu thông tin theo từng tenant hoặc request context đặc biệt (lưu ý sẽ làm giảm hiệu năng).'
      }
    ],
    common_traps: [
      'Thực hiện logic phân quyền Token trong Middleware thay vì Guard (làm mất khả năng đọc metadata từ custom decorators).',
      'Lạm dụng Request Scoped providers làm tụt giảm hiệu năng server.'
    ],
    active_recall: [
      'Nêu chính xác thứ tự thực thi của 5 thành phần trong NestJS Request Lifecycle?',
      'Tại sao Guard lại có thể đọc được Metadata từ `@Roles(\'ADMIN\')` mà Middleware thì không?'
    ],
    layers: {
      l1_junior: 'NestJS là framework Node.js theo phong cách Angular, chia thành Module, Controller, Service.',
      l2_middle: 'Nắm vững thứ tự Lifecycle: Middleware -> Guard -> Interceptor -> Pipe -> Controller -> Filter.',
      l3_senior: 'Ở mức 3 YoE, thành thạo Dynamic Modules (`register`, `forRoot`), Custom Providers (`useFactory`), ExecutionContext reflection, và microservice transports.'
    },
    why_ladder: [
      { question: 'Tại sao NestJS phân chia nhiều layer như vậy?', answer: 'Để áp dụng Aspect-Oriented Programming (AOP), tách các vấn đề xuyên suốt (cross-cutting concerns) ra khỏi code nghiệp vụ.' },
      { question: 'Tại sao Pipe chạy sau Guard?', answer: 'Vì nếu không có quyền truy cập, hệ thống cần chặn ngay ở Guard mà không lãng phí CPU để validate payload ở Pipe.' },
      { question: 'Lợi ích của Interceptor là gì?', answer: 'Nó áp dụng mô hình RxJS Observable, cho phép can thiệp cả trước khi hàm chạy lẫn sau khi hàm trả kết quả.' }
    ],
    code_reaction: {
      code: `// Pipe cố gắng kiểm tra quyền Admin:
@Injectable()
export class AdminCheckPipe implements PipeTransform {
  transform(value: any) {
    if (value.role !== 'admin') throw new ForbiddenException();
    return value;
  }
}`,
      question: 'Tại sao việc kiểm tra quyền bằng Pipe như trên là sai kiến trúc NestJS?',
      explanation: 'Vi phạm Single Responsibility: Pipe chỉ sinh ra để Validate và Transform dữ liệu. Việc kiểm tra quyền hạn (Authorization) bắt buộc phải nằm ở Guard.',
      fix: 'Chuyển logic sang `RolesGuard implements CanActivate` và dùng decorator `@Roles(\'admin\')`.'
    }
  },

  // ==========================================
  // DOMAIN 13: AUTHENTICATION & SECURITY
  // ==========================================
  {
    id: 'topic-auth-jwt-rtr-cookies',
    domain_id: 'domain-13-auth-security',
    domain_title: 'Domain 13 — Authentication & Security',
    title: 'JWT, Refresh Token Rotation (RTR) & HttpOnly Cookie Security',
    target_intent: 'Đánh giá kiến thức phòng thủ ứng dụng web: cách lưu trữ token chống XSS/CSRF, cơ chế thu hồi token (Revocation) và phát hiện đánh cắp phiên (Token Family).',
    trigger_keywords: ['JWT', 'Access Token', 'Refresh Token', 'Token Rotation (RTR)', 'Token Family', 'HttpOnly Secure SameSite', 'XSS vs CSRF'],
    recall_5s: 'Không bao giờ lưu JWT vào localStorage (dễ bị XSS đọc trộm). Lưu Access Token trong RAM/Closure (hết hạn 15m), Refresh Token trong HttpOnly Cookie (hết hạn 7d). Mỗi lần refresh, sinh Refresh Token mới và hủy token cũ (RTR); nếu token cũ bị tái sử dụng, thu hồi toàn bộ Token Family.',
    interview_answer: 'Một hệ thống xác thực an toàn tuyệt đối không lưu token trong localStorage vì bất kỳ mã XSS độc hại nào cũng có thể đánh cắp phiên. Thay vào đó: (1) Access Token có thời hạn ngắn (5-15 phút) lưu trong bộ nhớ RAM của ứng dụng; (2) Refresh Token có thời hạn dài (7-30 ngày) được lưu trong Cookie với cờ `HttpOnly` (JS không đọc được), `Secure` (chỉ qua HTTPS), và `SameSite=Strict/Lax` (chống CSRF). (3) Khi Access Token hết hạn, frontend gọi endpoint refresh để lấy cặp token mới. Tại đây ta áp dụng Refresh Token Rotation (RTR): mỗi refresh token chỉ được dùng đúng 1 lần. Nếu hệ thống phát hiện một refresh token cũ đã từng dùng bị gửi lại, ta nghi ngờ hacker đã chiếm được token và lập tức hủy (revoke) toàn bộ Token Family của người dùng đó, ép đăng nhập lại.',
    deep_dive: 'Vấn đề cốt lõi của JWT là Stateless: không thể thu hồi tức thì trước khi hết hạn. Do đó Access Token bắt buộc phải có TTL cực ngắn. Khi user bấm Logout hoặc đổi mật khẩu, ta lưu Refresh Token ID vào Blacklist trên Redis hoặc cập nhật `token_version` trong bảng User để vô hiệu hóa mọi phiên cũ.',
    practical_example: {
      title: 'Mẫu Refresh Token Rotation & Phát hiện tái sử dụng (Reuse Detection)',
      code: `async function rotateRefreshToken(oldToken: string) {
  const record = await db.refreshToken.findUnique({ where: { token: oldToken } });
  
  // NGUY HIỂM: Token đã bị dùng rồi mà lại xuất hiện -> CẢNH BÁO BỊ HACK!
  if (record.isUsed) {
    // Hủy toàn bộ gia đình token của user này ngay lập tức
    await db.refreshToken.deleteMany({ where: { familyId: record.familyId } });
    throw new UnauthorizedException('Phát hiện token bị đánh cắp! Vui lòng đăng nhập lại.');
  }

  // Đánh dấu token cũ đã dùng
  await db.refreshToken.update({ where: { id: record.id }, data: { isUsed: true } });

  // Sinh cặp token mới giữ nguyên familyId
  const newRefreshToken = crypto.randomUUID();
  await db.refreshToken.create({
    data: { token: newRefreshToken, familyId: record.familyId, userId: record.userId, isUsed: false }
  });

  return { accessToken: generateJwt(record.userId), newRefreshToken };
}`,
      scenario: 'Hacker chặn được Refresh Token và dùng trước; khi nạn nhân vô tình gửi lại token đó, hệ thống lập tức khóa toàn bộ phiên của cả hai bên.'
    },
    trade_offs: {
      when_use: 'Hệ thống web và mobile cần xác thực an toàn, hỗ trợ đăng nhập trên nhiều thiết bị.',
      when_not_use: 'Ứng dụng nội bộ đơn giản không cần mở rộng có thể dùng Session ID lưu trong Redis truyền thống.',
      pros: ['Chống XSS đánh cắp refresh token', 'Tự động phát hiện khi tài khoản bị xâm phạm phiên'],
      cons: ['Cần lưu trữ trạng thái refresh token ở database (không còn 100% stateless)'],
      alternatives: ['Server-side Session lưu trên Redis (dễ thu hồi hơn nhưng phụ thuộc Redis)']
    },
    follow_ups: [
      {
        question: 'Tại sao SameSite=Lax lại chống được phần lớn các cuộc tấn công CSRF?',
        answer_skeleton: 'Vì với SameSite=Lax, trình duyệt sẽ không gửi cookie theo các cross-site request kiểu POST/PUT từ trang web của hacker sang API của ta.'
      },
      {
        question: 'Nên dùng thuật toán băm mật khẩu nào ở thời điểm hiện tại?',
        answer_skeleton: 'Argon2id (đoạt giải Password Hashing Competition) là chuẩn hiện đại nhất vì chống được tấn công brute-force bằng GPU/ASIC nhờ cơ chế Memory-Hard. Nếu không có Argon2 thì dùng bcrypt.'
      }
    ],
    common_traps: [
      'Lưu JWT vào localStorage hoặc sessionStorage vì tiện lợi.',
      'Cấp Access Token có thời hạn vĩnh viễn hoặc quá dài (vài ngày).',
      'Giải mã JWT payload ở frontend (`jwt-decode`) rồi tin tưởng tuyệt đối mà không xác thực chữ ký signature ở backend.'
    ],
    active_recall: [
      'Tại sao việc lưu token trong localStorage lại dễ bị tấn công hơn HttpOnly cookie?',
      'Cơ chế Token Family hoạt động thế nào để phát hiện Refresh Token bị rò rỉ?'
    ],
    layers: {
      l1_junior: 'JWT gồm Header, Payload, Signature; dùng để xác định danh tính người dùng sau khi đăng nhập.',
      l2_middle: 'Access Token thời hạn ngắn kết hợp Refresh Token trong HttpOnly Cookie để cân bằng giữa bảo mật và trải nghiệm.',
      l3_senior: 'Ở mức 3 YoE, thành thạo Refresh Token Rotation với Reuse Detection, Token Revocation List trên Redis, chống CSRF bằng Double Submit Cookie hoặc SameSite, và chuẩn OAuth2 PKCE.'
    },
    why_ladder: [
      { question: 'Tại sao không để JWT sống lâu 30 ngày?', answer: 'Vì JWT là stateless, nếu bị lộ thì hacker có quyền truy cập suốt 30 ngày mà không cách nào chặn kịp.' },
      { question: 'Tại sao không lưu trong localStorage?', answer: 'Bất kỳ script độc hại nào từ thư viện npm dính XSS đều có thể đọc window.localStorage và gửi token về server hacker.' },
      { question: 'HttpOnly Cookie giải quyết được gì?', answer: 'Nó cấm JavaScript trên trình duyệt truy cập vào cookie, vô hiệu hóa hoàn toàn con đường XSS đọc token.' }
    ],
    code_reaction: {
      code: `// Express handler ngây thơ:
app.post('/api/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  const payload = jwt.verify(refreshToken, REFRESH_SECRET);
  // Cấp access token mới mà không kiểm tra rotation hay database:
  const newAccessToken = jwt.sign({ id: payload.id }, ACCESS_SECRET, { expiresIn: '15m' });
  res.json({ accessToken: newAccessToken });
});`,
      question: 'Lỗ hổng bảo mật nghiêm trọng trong endpoint refresh trên là gì?',
      explanation: 'Không có Refresh Token Rotation và không lưu trạng thái ở DB. Hacker chỉ cần trộm được refreshToken này một lần là có thể gọi refresh liên tục mãi mãi để sinh access token mà không bao giờ bị phát hiện hay thu hồi.',
      fix: 'Lưu refresh token trong database, áp dụng RTR sinh token mới và hủy token cũ, nhận qua HttpOnly cookie.'
    },
    cross_link_node_id: 'node-auth-token'
  },

  // ==========================================
  // DOMAIN 16: QUEUES & ASYNC PROCESSING
  // ==========================================
  {
    id: 'topic-queues-outbox-pattern',
    domain_id: 'domain-16-queues-async',
    domain_title: 'Domain 16 — Queues & Async Processing',
    title: 'Transactional Outbox Pattern & Dead Letter Queue (DLQ)',
    target_intent: 'Đánh giá khả năng giải quyết bài toán tính nhất quán phân tán (Dual Write Problem): Lưu Database thành công nhưng bắn Message sang Queue thất bại.',
    trigger_keywords: ['Dual Write Problem', 'Transactional Outbox Pattern', 'Dead Letter Queue (DLQ)', 'Exponential Backoff', 'At-Least-Once Delivery', 'Idempotent Consumer'],
    recall_5s: 'Vấn đề Dual Write: Lưu DB và publish Message sang RabbitMQ/Kafka không thể nằm trong cùng 1 ACID transaction. Giải pháp: Transactional Outbox Pattern lưu message vào bảng outbox cùng transaction với business data, sau đó worker quét bảng outbox để đẩy sang Queue.',
    interview_answer: 'Trong hệ thống phân tán, vấn đề kinh điển "Dual Write" xảy ra khi ta vừa cập nhật Database (ví dụ tạo đơn hàng) vừa bắn Event sang Message Queue (để gửi email hay trừ kho): Nếu DB commit thành công nhưng server crash trước khi bắn Queue, hoặc Queue từ chối, hệ thống sẽ bị lệch dữ liệu vĩnh viễn. Để giải quyết, tôi áp dụng Transactional Outbox Pattern: bảng `outbox_events` được tạo ngay trong cùng Database. Khi tạo đơn hàng, event được INSERT vào bảng outbox trong cùng 1 ACID Transaction duy nhất. Một background worker (hoặc Debezium CDC đọc Write-Ahead Log) sẽ đọc các record chưa gửi từ bảng outbox để publish sang Queue kèm xác nhận ACK, sau đó xóa hoặc đánh dấu PROCESSED. Phía Consumer xử lý theo cơ chế At-Least-Once kèm Idempotency; nếu thử lại thất bại 5 lần (Retry với Exponential Backoff), message sẽ được chuyển vào Dead Letter Queue (DLQ) để cảnh báo kỹ sư can thiệp.',
    deep_dive: 'Nguyên tắc bất di bất dịch của Message Queue: Hầu hết các queue phân tán chỉ đảm bảo At-Least-Once delivery (giao hàng ít nhất 1 lần, có thể bị trùng lặp khi mạng timeout), chứ không bao giờ đảm bảo Exactly-Once trong thực tế. Do đó Consumer BẮT BUỘC phải là Idempotent Consumer (kiểm tra message_id trong database trước khi thực hiện).',
    practical_example: {
      title: 'Triển khai Transactional Outbox với Prisma/Postgres',
      code: `async function createOrderWithOutbox(orderData: OrderInput) {
  // Thực hiện trong 1 ACID Transaction duy nhất
  return await prisma.$transaction(async (tx) => {
    // 1. Lưu đơn hàng
    const order = await tx.order.create({ data: orderData });

    // 2. Lưu event vào bảng Outbox cùng lúc
    await tx.outboxEvent.create({
      data: {
        aggregateType: 'ORDER',
        aggregateId: order.id,
        eventType: 'ORDER_CREATED',
        payload: JSON.stringify(order),
        status: 'PENDING'
      }
    });

    return order;
  });
}
// Cron Worker hoặc Polling process riêng sẽ quét các event 'PENDING' để đẩy sang RabbitMQ/Kafka`,
      scenario: 'Dù server có sập nguồn ngay sau khi tạo đơn hàng, event vẫn nằm an toàn trong DB và sẽ được gửi đi ngay khi server khởi động lại.'
    },
    trade_offs: {
      when_use: 'Bắt buộc khi có giao tiếp bất đồng bộ giữa các dịch vụ tài chính, thanh toán, kho vận, gửi email quan trọng.',
      when_not_use: 'Các log phân tích telemetry không quan trọng nếu mất vài dòng cũng không ảnh hưởng.',
      pros: ['Đảm bảo 100% không bao giờ mất message (Zero Message Loss)', 'Không cần 2-Phase Commit (2PC) cồng kềnh'],
      cons: ['Tăng độ trễ truyền tin (vài trăm ms do polling worker)', 'Bảng outbox cần cơ chế dọn dẹp (cleanup job)'],
      alternatives: ['Change Data Capture (CDC) với Debezium đọc trực tiếp WAL của Postgres']
    },
    follow_ups: [
      {
        question: 'Chuyện gì xảy ra nếu Message đẩy sang Queue thành công nhưng worker xóa outbox record bị lỗi?',
        answer_skeleton: 'Worker tiếp theo sẽ gửi lại message đó (Duplicate message). Đây là lý do tại sao Consumer bắt buộc phải kiểm tra Idempotency Key.'
      }
    ],
    common_traps: [
      'Gửi message sang RabbitMQ trước rồi mới commit DB (nếu DB rollback vì lỗi unique key thì queue vẫn bắn email!).',
      'Không cấu hình DLQ khiến message lỗi bị retry vô tận làm nghẽn toàn bộ hàng đợi (Poison Message).'
    ],
    active_recall: [
      'Bài toán Dual Write là gì và tại sao Transactional Outbox lại giải quyết được triệt để?',
      'Tại sao Consumer của Message Queue luôn luôn phải thiết kế theo chuẩn Idempotent?'
    ],
    layers: {
      l1_junior: 'Message Queue giúp tách rời các dịch vụ và xử lý công việc nặng trong background.',
      l2_middle: 'Sử dụng DLQ để chứa các message bị lỗi sau khi retry. Áp dụng Exponential Backoff.',
      l3_senior: 'Ở mức 3 YoE, thành thạo Transactional Outbox Pattern, CDC (Change Data Capture) với Debezium, xử lý Poison Pills và kiến trúc Idempotent Consumer.'
    },
    why_ladder: [
      { question: 'Tại sao không gọi API gửi email trực tiếp khi thanh toán xong?', answer: 'Nếu bên thứ 3 gửi email bị chậm 5s hoặc sập, request thanh toán của khách hàng sẽ bị quay đơ hoặc báo lỗi giả.' },
      { question: 'Tại sao không gửi message sang Queue ngay trong hàm?', answer: 'Nếu server crash giữa chừng, DB có đơn nhưng Queue không có tin nhắn (Dual Write Failure).' },
      { question: 'Bảng Outbox giúp gì?', answer: 'Nó biến việc gửi tin nhắn thành 1 lệnh INSERT bình thường trong cùng Transaction của Database.' }
    ],
    code_reaction: {
      code: `async function completeCheckout(order) {
  await db.order.save(order);
  // NGUY CƠ CHẾT LẶNG:
  await rabbitmq.publish('order_created', order); 
}`,
      question: 'Chuyện gì xảy ra nếu dòng số 4 (rabbitmq.publish) bị ném lỗi mạng hoặc timeout?',
      explanation: 'Đơn hàng đã được lưu và trừ tiền trong DB, nhưng RabbitMQ không nhận được message. Hàng hóa không được đóng gói, email không gửi, khách hàng khiếu nại.',
      fix: 'Áp dụng Transactional Outbox Pattern: lưu message vào bảng outbox cùng transaction với order.save().'
    },
    cross_link_node_id: 'node-hang-doi'
  },

  // ==========================================
  // DOMAIN 17: WEBSOCKET & REALTIME
  // ==========================================
  {
    id: 'topic-websocket-reconnect-scaling',
    domain_id: 'domain-17-websocket',
    domain_title: 'Domain 17 — WebSocket & Realtime',
    title: 'WebSocket Lifecycle, Heartbeat & Horizontal Scaling with Redis Adapter',
    target_intent: 'Kiểm tra kinh nghiệm vận hành hệ thống Realtime nhiều server: xử lý rớt mạng chập chờn, phát hiện kết nối chết (Zombie connections) và phát tán tin nhắn đa cụm.',
    trigger_keywords: ['WebSocket', 'Heartbeat / Ping-Pong', 'Exponential Reconnect', 'Zombie Connection', 'Redis Pub/Sub Adapter', 'Socket.IO'],
    recall_5s: 'WebSocket duy trì kết nối TCP 2 chiều liên tục. Phải có Heartbeat (Ping/Pong) để dọn dẹp các socket bị đứt ngầm (Zombie). Khi scale nhiều server, dùng Redis Pub/Sub Adapter để broadcast tin nhắn giữa các instance.',
    interview_answer: 'WebSocket nâng cấp từ HTTP qua handshake 101 Switching Protocols để duy trì kênh truyền nhị phân 2 chiều liên tục. Trong môi trường thực tế (như 4G chập chờn), thiết bị di động có thể mất mạng mà không kịp gửi TCP FIN packet, tạo ra Zombie Connections chiếm dụng file descriptor của server. Ta bắt buộc phải triển khai Heartbeat (cơ chế Ping/Pong định kỳ 25–30s): nếu sau 2 chu kỳ server không nhận được Pong, nó chủ động ngắt kết nối. Về phía client, dùng thuật toán Exponential Backoff có Jitter để reconnect tránh làm sập server khi phục hồi (Thundering Herd). Khi scale ứng dụng ra nhiều server phía sau Load Balancer, nếu User A kết nối tới Server 1 và User B kết nối tới Server 2, Server 1 không thể gửi trực tiếp cho B: ta tích hợp Redis Pub/Sub Adapter để khi có tin nhắn, Server 1 bắn event vào Redis channel và Server 2 lắng nghe để gửi xuống socket của User B.',
    deep_dive: 'Load Balancer (như AWS ALB hay Nginx) bắt buộc phải bật Sticky Sessions (nếu dùng polling fallback của Socket.IO) và tăng `idle_timeout` (mặc định 60s) lên cao hơn khoảng thời gian Heartbeat ping/pong để tránh bị ngắt kết nối oan.',
    practical_example: {
      title: 'Mô hình mở rộng WebSocket đa server với Redis Streams / Adapter',
      code: `// Server Node.js (Socket.IO + Redis Adapter)
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://redis-cluster:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

const io = new Server(3000, {
  pingInterval: 25000, // Gửi ping mỗi 25s
  pingTimeout: 20000,   // Đợi pong tối đa 20s, quá hạn coi là socket chết
  adapter: createAdapter(pubClient, subClient) // Đồng bộ broadcast giữa mọi instance!
});

io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => socket.join(roomId));
  socket.on('send_msg', ({ roomId, msg }) => {
    // Tự động broadcast tới tất cả server khác có user trong room này!
    io.to(roomId).emit('new_msg', msg);
  });
});`,
      scenario: 'Hệ thống chat 100.000 người dùng phân bổ trên 10 server EC2 vẫn nhận tin nhắn của nhau theo thời gian thực dưới 20ms.'
    },
    trade_offs: {
      when_use: 'Ứng dụng cần độ trễ cực thấp (< 50ms) và dữ liệu 2 chiều: Chat, Bảng giá chứng khoán, Game online, Thông báo đẩy.',
      when_not_use: 'Dữ liệu chỉ cập nhật 1 chiều từ server xuống client (như thông báo đơn hàng) thì Server-Sent Events (SSE) nhẹ hơn và tự hỗ trợ reconnect qua HTTP.',
      pros: ['Độ trễ tối thiểu, không tốn overhead của HTTP headers cho mỗi message'],
      cons: ['Chiếm dụng persistent connection (file descriptor) trên RAM', 'Khó scale hơn REST API'],
      alternatives: ['Server-Sent Events (SSE) cho 1 chiều', 'Short/Long Polling']
    },
    follow_ups: [
      {
        question: 'Server-Sent Events (SSE) khác WebSocket ở điểm nào và khi nào nên chọn SSE?',
        answer_skeleton: 'SSE chạy trên HTTP/1.1 hoặc HTTP/2 thuần túy, chỉ truyền 1 chiều từ server xuống client, tự động reconnect, vượt qua tường lửa/proxy dễ dàng hơn WebSocket. Rất thích hợp cho AI chat streaming hoặc notification feed.'
      }
    ],
    common_traps: [
      'Không cài đặt Ping/Pong dẫn đến hàng triệu Zombie connections ăn mòn file descriptor và RAM của server.',
      'Deploy nhiều server Node.js chạy WebSocket đằng sau Load Balancer mà không có Redis Adapter (người dùng không nhận được tin nhắn của nhau).'
    ],
    active_recall: [
      'Zombie connection trong WebSocket là gì và xử lý bằng cơ chế nào?',
      'Tại sao cần Redis Adapter khi mở rộng hệ thống WebSocket ra nhiều container/server?'
    ],
    layers: {
      l1_junior: 'WebSocket tạo kênh kết nối liên tục 2 chiều giữa trình duyệt và server.',
      l2_middle: 'Sử dụng Heartbeat để phát hiện đứt kết nối ngầm. Reconnect với exponential backoff.',
      l3_senior: 'Ở mức 3 YoE, thành thạo scaling ngang với Redis Adapter, quản lý Linux ulimit file descriptors, Load Balancer TCP termination và giải pháp SSE thay thế.'
    },
    why_ladder: [
      { question: 'Tại sao không dùng HTTP polling liên tục?', answer: 'Mỗi request polling đều phải bắt tay TCP, gửi kèm cookie/header gây tốn băng thông và CPU.' },
      { question: 'Tại sao cần Heartbeat Ping/Pong?', answer: 'Router mạng hoặc thiết bị di động có thể âm thầm cắt kết nối mà không gửi thông báo, để lại socket rác trên server.' },
      { question: 'Tại sao cần Redis Adapter?', answer: 'Vì kết nối socket của User A chỉ nằm trong RAM của 1 server cụ thể; server đó phải nhờ Redis để tìm server đang giữ kết nối của User B.' }
    ],
    code_reaction: {
      code: `// Client code ngây thơ:
function connect() {
  const ws = new WebSocket('wss://api.example.com');
  ws.onclose = () => {
    // Reconnect ngay lập tức không delay:
    connect(); 
  };
}`,
      question: 'Khi server khởi động lại (restart), đoạn code client trên sẽ gây ra thảm họa gì?',
      explanation: 'Thundering Herd Problem: 100.000 clients đồng loạt gửi request kết nối lại ngay lập tức (0ms backoff), tạo ra cuộc tấn công từ chối dịch vụ (DDoS) tự tạo làm sập server vừa khởi động.',
      fix: 'Sử dụng Exponential Backoff kèm Jitter ngẫu nhiên: `setTimeout(connect, Math.min(30000, 1000 * 2 ** attempts) + Math.random() * 1000)`.'
    }
  },

  // ==========================================
  // DOMAIN 18: FILE UPLOAD & STORAGE
  // ==========================================
  {
    id: 'topic-s3-presigned-urls',
    domain_id: 'domain-18-file-upload',
    domain_title: 'Domain 18 — File Upload & Storage',
    title: 'Direct S3 Upload with Presigned URLs & Multipart',
    target_intent: 'Đánh giá kiến trúc tải file hiệu năng cao: không để server backend làm proxy trung chuyển tốn RAM/băng thông, bảo mật bucket và xác thực MIME type.',
    trigger_keywords: ['Presigned URL', 'Direct Upload', 'S3 Bucket Policy', 'Multipart Upload', 'MIME Spoofing', 'CloudFront Origin'],
    recall_5s: 'Không bao giờ upload file lớn xuyên qua server backend (nghẽn RAM và băng thông). Luồng chuẩn: Client xin Presigned URL từ Backend → Client upload trực tiếp lên AWS S3 qua PUT request → S3 kích hoạt Lambda/Webhook thông báo Backend xử lý.',
    interview_answer: 'Một lỗi kiến trúc rất nặng là upload file (như video hay ảnh lớn) trực tiếp lên backend Node.js rồi backend mới đẩy tiếp lên S3. Điều này khiến server backend gánh toàn bộ băng thông, tốn RAM buffer và nghẽn CPU. Kiến trúc chuẩn công nghiệp là Direct Upload qua Presigned URL: (1) Client gửi metadata (tên file, dung lượng, contentType) lên Backend; (2) Backend kiểm tra quyền (Authorization), validate dung lượng tối đa và loại file, sau đó dùng AWS SDK sinh ra một S3 Presigned URL có thời hạn ngắn (5–15 phút); (3) Client nhận URL và dùng lệnh HTTP PUT để tải file trực tiếp từ trình duyệt lên S3; (4) Sau khi tải xong, S3 có thể bắn Event sang SQS/Lambda hoặc Client gọi API xác nhận với Backend. Đối với file trên 100MB, ta dùng S3 Multipart Upload để chia nhỏ file thành các part 5MB tải song song và hỗ trợ tiếp tục (resumable) nếu rớt mạng.',
    deep_dive: 'Vấn đề bảo mật chống MIME Spoofing: Người dùng có thể đổi đuôi file virus `.exe` thành `.png`. Khi sinh Presigned URL, Backend bắt buộc phải khóa chặt header `Content-Type: image/png` và `Content-Length-Range` trong policy. Sau khi upload, dùng AWS Lambda đọc Magic Bytes (chữ ký nhị phân ở đầu file) để xác thực định dạng thật trước khi kích hoạt file.',
    practical_example: {
      title: 'Backend sinh Presigned URL với AWS SDK v3',
      code: `import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: 'ap-southeast-1' });

app.post('/api/uploads/presigned-url', async (req, res) => {
  const { fileName, fileType, fileSize } = req.body;

  // 1. Kiểm duyệt kích thước tối đa 50MB
  if (fileSize > 50 * 1024 * 1024) {
    return res.status(400).json({ error: 'File vượt quá giới hạn 50MB' });
  }

  // 2. Sinh unique key ngẫu nhiên tránh ghi đè
  const fileKey = \`uploads/\${crypto.randomUUID()}-\${fileName}\`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType
  });

  // 3. Khóa thời hạn URL đúng 5 phút
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  res.json({ uploadUrl, fileKey });
});`,
      scenario: 'Hàng ngàn người dùng tải video lên cùng lúc mà server backend vẫn tiêu thụ 0% băng thông tải file.'
    },
    trade_offs: {
      when_use: 'Tất cả các chức năng upload ảnh đại diện, tài liệu, video, file đính kèm trong production.',
      when_not_use: 'Chỉ upload trực tiếp qua backend khi cần xử lý stream tức thì tại RAM (như import file CSV 100 dòng để insert DB ngay).',
      pros: ['Giải phóng 100% tài nguyên CPU/RAM/Băng thông của server backend', 'Tận dụng hạ tầng băng thông cực lớn của AWS S3'],
      cons: ['Phải cấu hình CORS trên S3 bucket', 'Xác thực định dạng nội dung file phức tạp hơn'],
      alternatives: ['Cloudinary cho quản lý ảnh/video tự động', 'Tus protocol cho resumable uploads phức tạp']
    },
    follow_ups: [
      {
        question: 'Làm sao để người dùng chỉ xem được file của chính họ trong S3 Private Bucket?',
        answer_skeleton: 'S3 Bucket luôn để Private (Block All Public Access). Khi người dùng cần xem, backend sinh Presigned GET URL có thời hạn 10 phút, hoặc phân phối qua CloudFront dùng Signed Cookies.'
      }
    ],
    common_traps: [
      'Để S3 Bucket ở chế độ Public Read/Write (nguy cơ bị quét rò rỉ dữ liệu hoặc bị lợi dụng làm kho chứa file lậu tốn tiền).',
      'Upload file qua backend bằng thư viện `multer` lưu tạm vào ổ cứng server EC2 (làm đầy ổ cứng và không chạy được khi scale nhiều container).'
    ],
    active_recall: [
      'Nêu 3 bước của luồng Direct Upload sử dụng S3 Presigned URL?',
      'Tại sao không nên upload file xuyên qua server backend?'
    ],
    layers: {
      l1_junior: 'S3 là dịch vụ lưu trữ file trên đám mây của AWS, lưu được ảnh, video, tài liệu.',
      l2_middle: 'Sử dụng Presigned URL để trình duyệt upload thẳng lên S3 mà không đi qua server.',
      l3_senior: 'Ở mức 3 YoE, thành thạo S3 Multipart Upload song song, kiểm tra Magic Bytes chống mã độc, tích hợp CloudFront OAC (Origin Access Control), và lifecycle policy tự động đẩy sang Glacier.'
    },
    why_ladder: [
      { question: 'Tại sao không upload qua backend?', answer: 'File 100MB qua backend sẽ chiếm 100MB RAM và 100MB băng thông vào + 100MB băng thông ra, làm nghẽn toàn bộ server.' },
      { question: 'Presigned URL hoạt động thế nào?', answer: 'Backend dùng Secret Key ký một chữ ký HMAC chứa bucket, key, method và hạn sử dụng; S3 kiểm tra chữ ký đó để cho phép upload.' },
      { question: 'Làm sao ngăn chặn ghi đè file?', answer: 'Backend luôn gắn thêm UUID vào tên file key thay vì dùng tên gốc do người dùng gửi lên.' }
    ],
    code_reaction: {
      code: `// Express handler cũ kỹ:
app.post('/upload', upload.single('avatar'), async (req, res) => {
  // File đã được lưu vào ổ cứng EC2 cục bộ:
  await s3.upload({ Bucket: 'my-bucket', Key: req.file.filename, Body: req.file.buffer });
  res.json({ success: true });
});`,
      question: 'Khi triển khai ứng dụng này lên Kubernetes / AWS ECS với 5 bản sao (replicas), vấn đề gì sẽ xảy ra?',
      explanation: 'Nếu upload nửa chừng bị ngắt hoặc scale container, file tạm nằm trên ổ cứng local của container sẽ biến mất khi container tái khởi động. Đồng thời server chịu tải băng thông kép.',
      fix: 'Bỏ multer, chuyển hoàn toàn sang Direct Upload bằng Presigned URL.'
    }
  },

  // ==========================================
  // DOMAIN 19: TESTING & QUALITY ASSURANCE
  // ==========================================
  {
    id: 'topic-testing-pyramid-playwright',
    domain_id: 'domain-19-testing',
    domain_title: 'Domain 19 — Testing & Quality Assurance',
    title: 'Test Pyramid, Integration Testing & Playwright E2E Isolation',
    target_intent: 'Đánh giá tư duy kiểm thử phần mềm thực tế: không viết test hình thức để đối phó coverage, cân bằng giữa Unit/Integration/E2E và khắc phục Flaky Tests.',
    trigger_keywords: ['Test Pyramid', 'Unit Test', 'Integration Test', 'E2E Testing (Playwright)', 'Flaky Tests', 'Test Isolation', 'Mock vs Real DB'],
    recall_5s: 'Kim tự tháp kiểm thử: Nhiều Unit Tests (nhanh, rẻ, test hàm pure) → Số lượng vừa phải Integration Tests (test API với DB thật) → Ít E2E Tests (chậm, tốn kém, test luồng người dùng chính trên Playwright).',
    interview_answer: 'Một chiến lược kiểm thử hiệu quả tuân thủ Kim tự tháp Test: (1) Tầng đáy là Unit Tests (Jest/Vitest) kiểm tra các hàm thuần túy, thuật toán, validation logic (tốc độ mili-giây, chi phí rẻ); (2) Tầng giữa là Integration Tests - đây là tầng mang lại ROI cao nhất: kiểm tra API endpoint tương tác với cơ sở dữ liệu thật (dùng Testcontainers hoặc SQLite in-memory) để đảm bảo câu lệnh SQL, foreign keys và constraints hoạt động chuẩn xác; (3) Tầng đỉnh là E2E Tests bằng Playwright để kiểm tra các luồng kinh doanh sống còn (như Đăng nhập, Checkout giỏ hàng) trên trình duyệt thật. Để xử lý vấn đề nhức nhối nhất là Flaky Tests (test chập chờn), nguyên tắc số 1 là Test Isolation: mỗi test case phải chạy trên dữ liệu độc lập, tự dọn dẹp sau khi chạy, và tuyệt đối không dùng `sleep(3000)` mà phải dùng `waitForSelector` hoặc `expect.toPass()` tự động đợi theo trạng thái mạng.',
    deep_dive: 'Lạm dụng Mock quá đà là cạm bẫy lớn: Mock toàn bộ Database service khiến Unit test chạy xanh 100% nhưng lên production vẫn sập vì lỗi cú pháp SQL hoặc sai kiểu dữ liệu. Do đó, kiểm thử nghiệp vụ bắt buộc phải có Integration Test với Real Database.',
    practical_example: {
      title: 'Mẫu Playwright E2E Test chuẩn tự động chờ (Auto-waiting)',
      code: `import { test, expect } from '@playwright/test';

test('Luồng thanh toán giỏ hàng hoàn chỉnh', async ({ page }) => {
  // 1. Chuẩn bị tài khoản test độc lập (Test Isolation)
  const user = await createIsolatedTestUser();
  await page.goto('/login');

  // 2. Playwright tự động chờ element tương tác được (không cần sleep!)
  await page.fill('#email', user.email);
  await page.fill('#password', 'Secret123!');
  await page.click('button[type="submit"]');

  // 3. Khẳng định URL chuyển hướng
  await expect(page).toHaveURL('/dashboard');

  // 4. Thêm sản phẩm và kiểm tra toast thông báo
  await page.click('[data-testid="add-to-cart"]');
  await expect(page.locator('.toast-success')).toHaveText('Đã thêm vào giỏ hàng');
});`,
      scenario: 'Test chạy ổn định trên CI/CD GitHub Actions mà không bị lỗi chập chờn do mạng nhanh hay chậm.'
    },
    trade_offs: {
      when_use: 'Viết E2E cho 5–10 luồng quan trọng nhất (Happy path thanh toán, đăng ký). Viết Integration test cho toàn bộ API endpoints.',
      when_not_use: 'Không viết E2E cho mọi trường hợp biên (edge cases) nhỏ nhặt (như test 20 loại format email sai) vì sẽ làm chậm CI/CD hàng tiếng đồng hồ.',
      pros: ['Tự tin tuyệt đối khi refactor code hoặc deploy lên production', 'Bắt được lỗi hồi quy (Regression)'],
      cons: ['Tốn thời gian bảo trì test suite khi thay đổi UI'],
      alternatives: ['Cypress', 'Puppeteer']
    },
    follow_ups: [
      {
        question: 'Làm thế nào để cô lập dữ liệu (Data Isolation) giữa các bài test integration chạy song song?',
        answer_skeleton: 'Mỗi test file sử dụng một schema database riêng biệt, hoặc bọc mỗi test case trong một Transaction và tự động ROLLBACK ở hook afterEach().'
      }
    ],
    common_traps: [
      'Dùng `await page.waitForTimeout(5000)` trong E2E tests (nguyên nhân số 1 gây ra Flaky tests khi máy CI bị chậm).',
      'Các bài test phụ thuộc vào thứ tự chạy (Test B đòi hỏi dữ liệu do Test A tạo ra).'
    ],
    active_recall: [
      'Ba tầng của Kim tự tháp kiểm thử phần mềm là gì và tỷ trọng phân bổ như thế nào?',
      'Tại sao sleep/wait cứng theo thời gian lại là kẻ thù số 1 của kiểm thử tự động?'
    ],
    layers: {
      l1_junior: 'Unit test kiểm tra hàm, E2E test kiểm tra cả trang web từ giao diện người dùng.',
      l2_middle: 'Sử dụng Playwright với auto-waiting để chống flaky tests. Viết integration tests tương tác với database thật.',
      l3_senior: 'Ở mức 3 YoE, thành thạo Test Isolation bằng Database Transaction Rollback, thiết lập Testcontainers trong Docker CI/CD, và chiến lược Contract Testing với Pact.'
    },
    why_ladder: [
      { question: 'Tại sao không viết 100% E2E test cho an tâm?', answer: 'Vì E2E test chạy rất chậm (vài phút/test), tốn tài nguyên máy chủ CI, và rất dễ bị chập chờn khi giao diện đổi.' },
      { question: 'Tại sao không chỉ viết Unit Test?', answer: 'Vì các Unit test mock hết database nên không phát hiện được lỗi khi các module thực sự ghép nối với nhau.' },
      { question: 'Tại sao Playwright vượt trội hơn Selenium cũ?', answer: 'Nó giao tiếp trực tiếp qua Chrome DevTools Protocol (CDP) và có cơ chế Auto-waiting thông minh trước mọi thao tác click/fill.' }
    ],
    code_reaction: {
      code: `test('Xóa sản phẩm', async ({ page }) => {
  await page.click('.btn-delete');
  // NGUY CƠ FLAKY:
  await page.waitForTimeout(3000); 
  expect(await page.locator('.item').count()).toBe(0);
});`,
      question: 'Đoạn test trên có thể gây ra lỗi gì khi chạy trên GitHub Actions runner yếu?',
      explanation: 'Nếu server CI phản hồi chậm hơn 3 giây, `waitForTimeout(3000)` hết giờ trước khi API xóa xong -> Test rớt oan. Ngược lại nếu xóa xong trong 50ms, nó lãng phí 2.95s chờ đợi vô ích.',
      fix: 'Dùng auto-waiting assertion: `await expect(page.locator(\'.item\')).toHaveCount(0);`'
    }
  }
];
