import { sqliteClient } from '../db/sqliteClient.js';
import {
  DomainMeta,
  InterviewTopicEntity,
  UserTopicProgress,
  GapStatus,
  GapMapSummary
} from '../types/interviewTypes.js';
import { SEED_TOPICS_PART1 } from '../data/interviewSeedPart1.js';
import { SEED_TOPICS_PART2 } from '../data/interviewSeedPart2.js';
import { SEED_TOPICS_PART3 } from '../data/interviewSeedPart3.js';

import { DOMAIN_CATALOG, DOMAIN_DEFAULTS } from '../data/domainCatalog.js';
import { InterviewGenerator, resolveTopicCrossLinkNodeId } from './interviewGenerator.js';

export { DOMAIN_CATALOG, DOMAIN_DEFAULTS };


export class InterviewService {
  constructor() {
    this.seedInitialTopicsIfNeeded();
  }

  private seedInitialTopicsIfNeeded(): void {
    // 1. Tự động dọn sạch các topic sinh từ template rỗng cũ (nếu có)
    sqliteClient.cleanBoilerplateTopics();

    const seedTopics: InterviewTopicEntity[] = [
      {
        id: 'topic-usecallback-memo',
        domain_id: 'domain-04-react-hooks',
        domain_title: 'Domain 4 — React Hooks',
        title: 'useCallback & Referential Equality',
        target_intent: 'Kiểm tra xem ứng viên có hiểu bản chất render cycle của React và khi nào tối ưu hóa thực sự mang lại giá trị hay chỉ tạo thêm overhead.',
        trigger_keywords: ['useCallback', 'function identity', 'referential equality', 'React.memo', 'unnecessary child re-render'],
        recall_5s: 'useCallback không làm function chạy nhanh hơn. Nó sinh ra chỉ để ổn định tham chiếu (referential identity) giữa các lần re-render, ngăn React.memo re-render component con vô ích.',
        interview_answer: 'useCallback dùng để giữ nguyên con trỏ hàm (function reference) qua các lần render của component cha. Trong JavaScript, mỗi lần hàm cha chạy lại, nó tạo ra một closure instance mới ở địa chỉ bộ nhớ mới. Nếu truyền callback này xuống component con bọc bởi React.memo, React sẽ so sánh props (Object.is) và thấy tham chiếu thay đổi, dẫn đến re-render không đáng có. Do đó, useCallback chỉ có tác dụng khi truyền xuống memoized child hoặc làm dependency cho useEffect.',
        deep_dive: 'Bản thân useCallback vẫn thực thi việc tạo function mới ở runtime và so sánh mảng dependencies. Vì vậy, bọc bừa bãi mọi function với useCallback thực chất làm tốn thêm chi phí bộ nhớ và CPU. Chỉ dùng khi: (1) truyền xuống component con được bọc bằng React.memo, hoặc (2) function nằm trong dependency array của một hook khác (như useEffect, useMemo).',
        practical_example: {
          title: 'Tối ưu danh sách đơn hàng lớn',
          code: `// Con bọc React.memo để chỉ re-render khi props thực sự đổi
const OrderItem = React.memo(({ order, onCancel }: { order: Order; onCancel: (id: string) => void }) => {
  return <div>{order.id} <button onClick={() => onCancel(order.id)}>Hủy</button></div>;
});

// Cha ổn định tham chiếu hàm onCancel
const OrderList = ({ orders }: { orders: Order[] }) => {
  const handleCancel = useCallback((id: string) => {
    cancelOrderApi(id);
  }, []); // Không đổi reference giữa các lần cha re-render

  return orders.map(o => <OrderItem key={o.id} order={o} onCancel={handleCancel} />);
};`,
          scenario: 'Khi một state khác ở cha thay đổi (ví dụ ô tìm kiếm text gõ liên tục), 1000 OrderItem con không bị re-render lại.'
        },
        trade_offs: {
          when_use: 'Khi truyền function xuống component con có dùng React.memo hoặc khi function nằm trong dependency array của useEffect/custom hook.',
          when_not_use: 'Khi truyền xuống các thẻ DOM nguyên bản (<button onClick={fn}>) hoặc component con không dùng React.memo.',
          pros: ['Ngăn chặn re-render dây chuyền của cây component con nặng', 'Ổn định dependency array cho useEffect'],
          cons: ['Tăng chi phí khởi tạo ban đầu (closure + dependency comparison)', 'Dễ dính stale closure nếu quên dependencies'],
          alternatives: ['Chuyển state xuống gần component con hơn (Colocation)', 'Sử dụng React Compiler (React 19) tự động memoize']
        },
        follow_ups: [
          {
            question: 'Nếu không dùng React.memo ở component con thì useCallback có ích gì không?',
            answer_skeleton: 'Hoàn toàn vô ích trong việc ngăn re-render, vì mặc định component con luôn re-render khi component cha re-render bất kể props có đổi hay không.'
          },
          {
            question: 'Stale closure xảy ra thế nào với useCallback?',
            answer_skeleton: 'Khi dependency array rỗng [] nhưng trong thân hàm lại đọc biến state/props, hàm sẽ giữ vĩnh viễn giá trị ở render đầu tiên.'
          }
        ],
        common_traps: [
          'Nghĩ rằng bọc useCallback sẽ giúp component cha chạy nhanh hơn.',
          'Bọc useCallback cho hàm onClick của thẻ <button> thông thường.',
          'Bỏ quên dependency khiến hàm đọc giá trị state cũ (Stale closure).'
        ],
        active_recall: [
          'useCallback giải quyết vấn đề gì trong JavaScript memory model?',
          'Tại sao viết useCallback(() => {}, []) lại có thể gây lỗi dữ liệu khi đọc state?'
        ],
        layers: {
          l1_junior: 'useCallback là một hook dùng để ghi nhớ (cache) định nghĩa của một hàm giữa các lần re-render.',
          l2_middle: 'Nó giữ nguyên tính đồng nhất tham chiếu (referential equality) của hàm, tránh việc hàm con bọc React.memo bị re-render do nhận prop mới.',
          l3_senior: 'Ở góc độ 3 YoE, cần nhận thức rõ: Với React 19 và React Compiler (Forget), compiler tự động memoize Virtual DOM và props tại build-time, loại bỏ nhu cầu viết useCallback/useMemo thủ công. Nhưng trong các dự án chưa bật Compiler hoặc thư viện ngoài, lạm dụng useCallback bừa bãi gây hại hiệu năng do overhead tạo closure và so sánh dependency array. Chỉ dùng khi truyền hàm xuống component con bọc bởi React.memo hoặc làm dependency cho hook khác.'
        },
        why_ladder: [
          { question: 'Tại sao cần useCallback?', answer: 'Để ổn định tham chiếu của hàm (stable function reference).' },
          { question: 'Tại sao cần ổn định tham chiếu?', answer: 'Vì JavaScript so sánh hàm theo địa chỉ bộ nhớ (referential equality Object.is).' },
          { question: 'Tại sao referential equality lại quan trọng?', answer: 'Vì React.memo so sánh shallow props trước khi quyết định re-render.' },
          { question: 'Tại sao React.memo lại so sánh props?', answer: 'Để bỏ qua việc re-render những cây component con tốn kém tính toán.' },
          { question: 'Khi nào KHÔNG NÊN dùng?', answer: 'Khi component con render rất nhẹ hoặc không có React.memo, chi phí quản lý hook vượt quá chi phí render.' }
        ],
        code_reaction: {
          code: `function SearchBox() {
  const [query, setQuery] = useState('');
  const handleClick = useCallback(() => {
    console.log("Searching for:", query);
  }, []); // <-- bug here!

  return <input value={query} onChange={e => setQuery(e.target.value)} onBlur={handleClick} />;
}`,
          question: 'Đoạn code trên gặp vấn đề gì khi người dùng gõ chữ rồi click ra ngoài?',
          explanation: 'Stale Closure: handleClick chỉ được tạo một lần với query ban đầu là chuỗi rỗng "". Dù người dùng gõ gì, handleClick vẫn in ra query ban đầu.',
          fix: 'Bổ sung [query] vào dependency array, hoặc dùng functional updater / useRef nếu không muốn hàm tạo lại.'
        },
        cross_link_node_id: 'node-ui-view'
      },
      {
        id: 'topic-nextjs-rsc-vs-client',
        domain_id: 'domain-06-nextjs',
        domain_title: 'Domain 6 — Next.js App Router',
        title: 'Server Components vs Client Components',
        target_intent: 'Đánh giá khả năng hiểu kiến trúc App Router, cơ chế streaming, zero-bundle-size của Server Components và ranh giới serialize (Network Boundary).',
        trigger_keywords: ['Server Components', 'Client Components', 'Zero Bundle Size', 'Serialization boundary', 'SSR vs RSC'],
        recall_5s: 'Server Component chạy 100% trên server, code không bao giờ lọt vào client JS bundle. Client Component ("use client") vẫn render trước trên server (SSR) rồi hydrate trên browser để gắn event listeners & state.',
        interview_answer: 'Server Components (mặc định trong App Router) chỉ chạy trên server, có thể truy cập trực tiếp database/filesystem mà không làm tăng kích thước bundle của trình duyệt. Còn Client Component (đánh dấu bởi directive "use client") không phải là chỉ chạy ở client, mà là component được gửi code JS xuống trình duyệt để thực hiện hydration, hỗ trợ state (useState) và event listener (onClick). Giao tiếp giữa hai bên tuân thủ quy tắc: Props truyền từ Server sang Client phải serialize được (JSON-like).',
        deep_dive: 'Một quan niệm sai lầm lớn là nghĩ "use client" nghĩa là Client-Side Rendering (CSR). Thực tế, Client Component vẫn được render thành HTML tĩnh trên Server trong lần request đầu tiên (SSR), sau đó client tải JS bundle để hydrate. RSC trả về định dạng đặc biệt gọi là RSC Payload (dạng JSON mô tả cây ảo), client dùng payload này để ghép cây DOM mà không mất state hiện tại.',
        practical_example: {
          title: 'Mẫu phân tách Server & Client lý tưởng',
          code: `// UserProfile.tsx (Server Component - Mặc định)
import db from '@/lib/db';
import LikeButton from './LikeButton'; // Client Component

export default async function UserProfile({ userId }: { userId: string }) {
  const user = await db.user.findUnique({ where: { id: userId } }); // Truy vấn DB trực tiếp không lộ credential
  return (
    <div>
      <h1>{user.name}</h1>
      {/* Chỉ đẩy phần tương tác vào Client component */}
      <LikeButton initialLikes={user.likes} />
    </div>
  );
}`,
          scenario: 'Toàn bộ thư viện nặng như DB driver, markdown parser, prisma giữ ở server, client chỉ tải vài KB cho LikeButton.'
        },
        trade_offs: {
          when_use: 'Server Component cho: fetching data, đọc secrets, bundle nặng. Client Component cho: tương tác người dùng, hooks (useState, useEffect), Web APIs (localStorage, geolocation).',
          when_not_use: 'Không thể dùng hooks hoặc onClick trong Server Component. Không thể truyền hàm trực tiếp từ Server Component xuống Client Component.',
          pros: ['Zero-bundle size cho dependencies server', 'Bảo mật tuyệt đối secrets', 'Fetch dữ liệu tốc độ cao tại cùng datacenter'],
          cons: ['Mô hình tư duy phức tạp hơn Pages Router', 'Props phải serialize được', 'Dễ nhầm lẫn cơ chế SSR vs CSR'],
          alternatives: ['Pages Router truyền thống với getServerSideProps', 'Single Page Application (Vite/CRA) thuần']
        },
        follow_ups: [
          {
            question: 'Có thể import Server Component vào trong Client Component được không?',
            answer_skeleton: 'Không thể import trực tiếp (sẽ biến thành client component), nhưng có thể truyền Server Component dưới dạng children prop (Composition pattern).'
          },
          {
            question: 'Tại sao prop truyền vào Client Component không được là Date hoặc Function?',
            answer_skeleton: 'Vì dữ liệu phải truyền qua ranh giới mạng (RSC payload format) dưới dạng JSON serializable.'
          }
        ],
        common_traps: [
          'Nghĩ rằng "use client" biến component thành chạy 100% ở browser mà không có SSR.',
          'Đặt "use client" ở root layout khiến toàn bộ ứng dụng thành Client Component làm mất hết ưu thế của RSC.',
          'Import database connection vào bên trong Client Component gây lỗi build hoặc lộ secret.'
        ],
        active_recall: [
          'Điểm khác biệt cốt lõi giữa SSR truyền thống và React Server Components (RSC) là gì?',
          'Làm thế nào để nhúng một Server Component phức tạp vào giữa một Client Component có state?'
        ],
        layers: {
          l1_junior: 'Server Component chạy trên server, Client Component thêm directive "use client" để dùng state và click handler.',
          l2_middle: 'Server Component sinh ra RSC Payload không chứa JS bundle của dependencies. Client Component vẫn được SSR trên server rồi mới hydrate ở browser.',
          l3_senior: 'Ở mức 3 YoE, cần nắm rõ Network Boundary, Serialization, Suspense Streaming, và cách giải quyết bài toán Waterfall request bằng component composition & Parallel Routes.'
        },
        why_ladder: [
          { question: 'Tại sao React tạo ra Server Components?', answer: 'Để giải quyết vấn đề bundle size quá lớn của các thư viện và giảm waterfall fetch từ client.' },
          { question: 'Tại sao bundle size lại là vấn đề lớn?', answer: 'Browser phải download, parse, compile JS làm chậm chỉ số LCP và INP (Core Web Vitals).' },
          { question: 'Tại sao không dùng SSR truyền thống là xong?', answer: 'SSR truyền thống vẫn phải gửi toàn bộ source code JS của component xuống client để hydrate.' },
          { question: 'RSC giải quyết việc đó thế nào?', answer: 'RSC chỉ gửi kết quả Virtual DOM (RSC payload) chứ không gửi JS code của Server Components.' }
        ],
        code_reaction: {
          code: `// app/dashboard/page.tsx
'use client';
import { useState } from 'react';
import db from '@/lib/db'; // <-- BUG

export default function Dashboard() {
  const [count, setCount] = useState(0);
  const users = db.users.findMany(); // <-- BUG
  return <div>{users.length}</div>;
}`,
          question: 'Đoạn code trên sẽ gây ra lỗi gì khi build hoặc chạy?',
          explanation: 'Lỗi bảo mật và runtime: Client Component chứa directive "use client" không thể import và thực thi trực tiếp database driver (như db). Code này sẽ bị bundler chặn hoặc lộ thông tin kết nối DB ra browser.',
          fix: 'Tách page thành Server Component để query db, rồi truyền dữ liệu users qua props xuống một Client Component nhỏ chỉ chứa logic setCount.'
        },
        cross_link_node_id: 'node-rendering-ssr'
      },
      {
        id: 'topic-postgres-btree-explain',
        domain_id: 'domain-14-postgresql',
        domain_title: 'Domain 14 — PostgreSQL & SQL',
        title: 'B-Tree Indexes & EXPLAIN ANALYZE',
        target_intent: 'Kiểm tra xem ứng viên có năng lực debug và tối ưu hóa câu lệnh SQL thực tế trên cơ sở dữ liệu hàng triệu dòng thay vì chỉ biết viết SELECT/JOIN cơ bản.',
        trigger_keywords: ['B-Tree Index', 'EXPLAIN ANALYZE', 'Sequential Scan', 'Index Scan', 'Index Only Scan', 'Selectivity'],
        recall_5s: 'Index là cấu trúc cây B-Tree giúp tìm kiếm O(log N) thay vì O(N) Sequential Scan. Nhưng Index chỉ được Postgres chọn khi độ chọn lọc (selectivity) cao và query không vi phạm quy tắc Leftmost Prefix.',
        interview_answer: 'Khi một truy vấn chậm trên bảng lớn, bước đầu tiên tôi chạy EXPLAIN (ANALYZE, BUFFERS) để xem execution plan thực tế thay vì đoán mò. Nếu thấy Sequential Scan trên bảng hàng triệu dòng, tôi kiểm tra xem có thiếu Index không. B-Tree index của Postgres tổ chức theo cây tự cân bằng O(log N). Tuy nhiên, có Index chưa chắc Postgres đã dùng nếu Selectivity thấp (dữ liệu trả về chiếm > 10-20% bảng), hoặc khi điều kiện WHERE bọc column trong function khiến index bị vô hiệu hóa.',
        deep_dive: 'Sự khác biệt giữa Index Scan và Index Only Scan: Index Scan đọc con trỏ từ B-Tree rồi nhảy vào Heap Table để lấy dữ liệu (tốn Random I/O). Index Only Scan lấy toàn bộ cột cần thiết ngay trên B-Tree (Covering Index) kết hợp Visibility Map, nhanh hơn gấp nhiều lần. Khi tạo Composite Index (A, B), thứ tự cột cực kỳ quan trọng: Query tìm kiếm theo B mà không có A sẽ không dùng được B-Tree theo nguyên tắc Leftmost Prefix.',
        practical_example: {
          title: 'Tối ưu truy vấn đơn hàng theo ngày & trạng thái',
          code: `-- Trước khi tối ưu: Seq Scan tốn 1.8s trên 5 triệu dòng
EXPLAIN ANALYZE SELECT id, total FROM orders WHERE status = 'PAID' AND created_at >= '2026-01-01';

-- Tạo Composite Index tối ưu thứ tự
CREATE INDEX idx_orders_status_created ON orders (status, created_at) INCLUDE (total);

-- Sau khi tối ưu: Index Only Scan chỉ tốn 4ms!`,
          scenario: 'Sử dụng INCLUDE (total) biến truy vấn thành Index Only Scan, hoàn toàn không cần chạm vào Heap data pages.'
        },
        trade_offs: {
          when_use: 'Cột thường xuyên xuất hiện trong WHERE, JOIN ON, ORDER BY có độ phân tán cao (High Cardinality).',
          when_not_use: 'Bảng nhỏ (< vài nghìn dòng), cột có Cardinality thấp (như gender chỉ có M/F), hoặc bảng ghi (INSERT/UPDATE liên tục).',
          pros: ['Giảm thời gian truy vấn từ giây xuống mili-giây', 'Giảm tải CPU và RAM cho Database server'],
          cons: ['Làm chậm thao tác ghi INSERT, UPDATE, DELETE (phải update cây B-Tree)', 'Tốn dung lượng đĩa và bộ nhớ đệm Shared Buffers'],
          alternatives: ['BRIN Index cho dữ liệu time-series có thứ tự tự nhiên', 'Partial Index (chỉ index status = ACTIVE)']
        },
        follow_ups: [
          {
            question: 'Tại sao có index trên cột created_at nhưng truy vấn WHERE DATE(created_at) = \'2026-01-01\' lại chạy Seq Scan?',
            answer_skeleton: 'Vì hàm DATE() bọc ngoài cột làm biến đổi giá trị, Postgres không thể đối chiếu trực tiếp trên B-Tree key. Phải dùng Expression Index hoặc viết lại dạng range: created_at >= \'...\' AND created_at < \'...\'.'
          },
          {
            question: 'EXPLAIN khác EXPLAIN ANALYZE ở điểm nào?',
            answer_skeleton: 'EXPLAIN chỉ là ước tính của Query Planner dựa trên thống kê (ANALYZE statistics). EXPLAIN ANALYZE thực sự chạy truy vấn và đo lường thời gian/số buffers thực tế.'
          }
        ],
        common_traps: [
          'Đánh index lên tất cả mọi cột trong bảng khiến hiệu năng ghi INSERT bị sụt giảm nghiêm trọng.',
          'Bọc function quanh indexed column trong mệnh đề WHERE.',
          'Nghĩ rằng Composite Index (A, B) có thể dùng bình thường cho truy vấn chỉ lọc theo cột B.'
        ],
        active_recall: [
          'Ba điều kiện để PostgreSQL Query Planner bỏ qua Index và chạy Sequential Scan là gì?',
          'Khác biệt cốt lõi giữa Index Scan và Index Only Scan là gì?'
        ],
        layers: {
          l1_junior: 'Index là một bảng mục lục giúp tìm kiếm bản ghi nhanh hơn mà không cần duyệt toàn bộ bảng.',
          l2_middle: 'Postgres dùng B-Tree index O(log N). Sử dụng EXPLAIN ANALYZE để đo lường cost, actual time và phát hiện Seq Scan.',
          l3_senior: 'Ở mức 3 YoE, cần thành thạo Covering Index (INCLUDE), Partial Index để tiết kiệm dung lượng, hiểu tác động của autovacuum và visibility map lên Index Only Scan, và cách thiết kế composite index tránh deadlock.'
        },
        why_ladder: [
          { question: 'Tại sao SQL chậm khi dữ liệu tăng lên 10 triệu dòng?', answer: 'Vì không có index, database phải quét tuần tự (Sequential Scan) đọc toàn bộ block đĩa.' },
          { question: 'Tại sao Index giải quyết được?', answer: 'Index tổ chức dữ liệu theo cây B-Tree, tìm kiếm chỉ mất O(log N) lần so khớp.' },
          { question: 'Tại sao không index tất cả các cột?', answer: 'Mỗi lần INSERT/UPDATE/DELETE, database phải khóa và ghi lại các node trên cây B-Tree làm nghẽn I/O ghi.' },
          { question: 'Tại sao có index mà Planner vẫn chạy Seq Scan?', answer: 'Vì khi tỷ lệ bản ghi thỏa mãn quá cao, Random I/O của Index Scan tốn kém hơn Sequential I/O của Seq Scan.' }
        ],
        code_reaction: {
          code: `-- Schema: users(id, email, is_deleted, created_at)
-- Index: CREATE INDEX idx_users_created ON users(created_at);

SELECT * FROM users 
WHERE created_at + INTERVAL '1 day' > NOW();`,
          question: 'Tại sao câu lệnh này vẫn chạy Seq Scan mặc dù đã có index trên created_at?',
          explanation: 'Biểu thức tính toán `created_at + INTERVAL \'1 day\'` nằm ở vế cột, khiến Query Planner không thể đối chiếu trực tiếp giá trị index key trong B-Tree.',
          fix: 'Chuyển phép toán sang vế đối diện: `WHERE created_at > NOW() - INTERVAL \'1 day\';`'
        },
        cross_link_node_id: 'node-tru-db'
      },
      {
        id: 'topic-redis-stampede-locks',
        domain_id: 'domain-15-redis',
        domain_title: 'Domain 15 — Redis & In-Memory',
        title: 'Cache Stampede & Distributed Locks',
        target_intent: 'Đánh giá kinh nghiệm xử lý tải cao (High Concurrency), cơ chế bảo vệ database khi cache hết hạn, và khả năng thiết kế Distributed Lock chuẩn an toàn.',
        trigger_keywords: ['Cache Stampede', 'Cache Avalanche', 'Distributed Lock', 'Redlock', 'SET NX EX', 'TTL Jitter'],
        recall_5s: 'Cache Stampede xảy ra khi một key hot vừa hết hạn, hàng ngàn request đồng thời đổ dồn xuống DB để query lại. Xử lý bằng Mutex Lock (SET key NX EX) hoặc Probabilistic Early Expiration (XFetch).',
        interview_answer: 'Cache Stampede (hay Dogpiling) là hiện tượng khi một hot key bị hết hạn (expired), hàng ngàn request đồng thời thấy cache miss và cùng truy vấn xuống Database, khiến DB chịu tải đột ngột và sập (Avalanche). Để chống Stampede, tôi áp dụng 2 chiến lược: (1) Thêm Jitter ngẫu nhiên vào TTL để các key không chết cùng lúc, và (2) Dùng Distributed Lock với Redis `SET key lock_val NX EX 10`: chỉ request đầu tiên giành được lock mới truy vấn DB để tái tạo cache, các request còn lại đợi hoặc trả dữ liệu cũ.',
        deep_dive: 'Khi triển khai Distributed Lock trên Redis, dùng `SET lock_key uuid NX EX 5`: NX đảm bảo tính atomic, EX đặt timeout tự động giải phóng chống deadlock nếu server crash. Khi release lock, bắt buộc phải dùng Lua Script kiểm tra uuid để tránh trường hợp process A chạy quá lâu làm hết hạn lock, process B chiếm lock, rồi process A lại vô tình xóa mất lock của B.',
        practical_example: {
          title: 'Mẫu Distributed Lock an toàn với Redis & Lua Script',
          code: `async function getProductWithLock(productId: string) {
  let data = await redis.get(\`product:\${productId}\`);
  if (data) return JSON.parse(data);

  const lockKey = \`lock:product:\${productId}\`;
  const lockToken = crypto.randomUUID();
  // Giành khóa nguyên tử trong 5 giây
  const acquired = await redis.set(lockKey, lockToken, 'NX', 'EX', 5);

  if (acquired) {
    try {
      data = await db.product.findById(productId);
      // Ghi cache kèm Jitter TTL (60s ± 10s) chống đồng loạt hết hạn
      const jitter = Math.floor(Math.random() * 20) - 10;
      await redis.set(\`product:\${productId}\`, JSON.stringify(data), 'EX', 60 + jitter);
      return data;
    } finally {
      // Lua script giải phóng lock an toàn chỉ khi đúng token
      const releaseLua = \`
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      \`;
      await redis.eval(releaseLua, 1, lockKey, lockToken);
    }
  } else {
    // Không lấy được lock: Chờ 50ms rồi thử đọc lại cache
    await sleep(50);
    return getProductWithLock(productId);
  }
}`,
          scenario: 'Chỉ duy nhất 1 luồng chạm vào Database khi cache hết hạn, 9999 luồng còn lại nhận dữ liệu cache ngay lập tức.'
        },
        trade_offs: {
          when_use: 'Khi có các hot-key chịu hàng ngàn lượt đọc/giây hoặc các thao tác nhạy cảm cần loại trừ tương tranh phân tán (thanh toán, trừ kho).',
          when_not_use: 'Cho các API đọc thấp hoặc dữ liệu ít thay đổi; không dùng Redis làm nguồn chân lý duy nhất (Single Source of Truth) nếu không có cơ chế backup/persistence an toàn.',
          pros: ['Bảo vệ Database không bị sụp đổ dây chuyền', 'Đảm bảo tính nhất quán dữ liệu giữa các microservices'],
          cons: ['Tăng độ trễ cho các request phải xếp hàng chờ lock', 'Phức tạp trong việc quản lý TTL của lock (bài toán lock expiry trước khi task hoàn thành)'],
          alternatives: ['Probabilistic Early Expiration (XFetch algorithm)', 'Background Cron Worker tự động làm mới cache trước khi hết hạn']
        },
        follow_ups: [
          {
            question: 'Chuyện gì xảy ra nếu Redis server bị sập (down)?',
            answer_skeleton: 'Hệ thống phải có Circuit Breaker để fallback tạm xuống DB có giới hạn (Rate limit), hoặc trả về Graceful Degradation / Stale cache, không để lỗi Redis làm chết toàn bộ API.'
          },
          {
            question: 'Tại sao giải phóng Redis Lock lại bắt buộc phải dùng Lua script?',
            answer_skeleton: 'Vì lệnh GET và DEL phải mang tính nguyên tử (atomic). Nếu dùng lệnh riêng, lock có thể hết hạn ngay sau khi GET khiến lệnh DEL xóa nhầm lock của request khác.'
          }
        ],
        common_traps: [
          'Dùng lệnh SETNX cũ không có tham số TTL khiến nếu process chết, lock sẽ tồn tại vĩnh viễn gây Deadlock.',
          'Dùng redis.del(lockKey) trực tiếp mà không kiểm tra token sở hữu.',
          'Cài đặt cùng một giá trị TTL cố định cho toàn bộ triệu sản phẩm khiến chúng cùng hết hạn tại một thời điểm (Cache Avalanche).'
        ],
        active_recall: [
          'Khác biệt giữa Cache Stampede, Cache Avalanche và Cache Penetration là gì?',
          'Viết câu lệnh Redis atomic chuẩn để giành Distributed Lock là gì?'
        ],
        layers: {
          l1_junior: 'Redis là cơ sở dữ liệu in-memory tốc độ cao, thường dùng làm bộ nhớ đệm (cache).',
          l2_middle: 'Sử dụng Redis cache-aside để giảm tải DB. Cần xử lý TTL và tránh Cache Stampede khi hot key hết hạn.',
          l3_senior: 'Ở mức 3 YoE, phải giải thích được Distributed Lock với Redlock/Lua script, tính nhất quán cuối cùng (eventual consistency), kịch bản Redis failover, và cơ chế Probabilistic Early Refresh.'
        },
        why_ladder: [
          { question: 'Tại sao cần Cache?', answer: 'Để giảm tải cho Database và phục vụ response dưới 5ms.' },
          { question: 'Tại sao không cache vĩnh viễn mà cần TTL?', answer: 'Để giải phóng RAM và đảm bảo dữ liệu không bị lệch vĩnh viễn so với database.' },
          { question: 'Chuyện gì xảy ra khi key hot hết hạn?', answer: 'Hàng ngàn request cùng lúc miss cache và đổ dồn xuống DB (Cache Stampede).' },
          { question: 'Làm sao giải quyết?', answer: 'Dùng Mutex Lock trên Redis bằng SET NX để chỉ 1 request được phép truy vấn DB và nạp lại cache.' }
        ],
        code_reaction: {
          code: `// Triển khai lock ngây thơ:
const isLocked = await redis.setnx("order_lock", "1");
if (isLocked) {
  await redis.expire("order_lock", 10);
  await processPayment();
  await redis.del("order_lock");
}`,
          question: 'Đoạn code trên có thể gây ra lỗi nghiêm trọng nào trong hệ thống phân tán?',
          explanation: 'Hai lỗi nghiêm trọng: (1) Lệnh setnx và expire không atomic, nếu server crash giữa 2 dòng này, lock vĩnh viễn không có TTL gây Deadlock. (2) Lệnh del không kiểm tra ai sở hữu lock, có thể xóa nhầm lock của instance khác.',
          fix: 'Dùng cú pháp nguyên tử: `await redis.set("order_lock", uniqueToken, "NX", "EX", 10)` và giải phóng bằng Lua script.'
        },
        cross_link_node_id: 'node-cache-redis'
      },
      {
        id: 'topic-api-idempotency-keys',
        domain_id: 'domain-12-api-design',
        domain_title: 'Domain 12 — API Design & Protocols',
        title: 'Idempotency Keys in Payment Systems',
        target_intent: 'Kiểm tra tư duy thiết kế API an toàn trong môi trường mạng không tin cậy (Network Failure, Client Retry, Trùng lặp thanh toán).',
        trigger_keywords: ['Idempotency-Key', 'At-least-once delivery', 'Unique constraint', 'Atomic lock check', 'Double payment prevention'],
        recall_5s: 'Mạng luôn có thể bị timeout dù server đã xử lý xong. Idempotency Key giúp client tự tin retry mà không sợ bị trừ tiền 2 lần: Server dùng key này kết hợp Unique Index để chặn xử lý trùng lặp và trả về kết quả cũ.',
        interview_answer: 'Trong các API nhạy cảm như thanh toán hay tạo đơn hàng, client gửi kèm một header `Idempotency-Key: UUID`. Khi nhận request, server kiểm tra key này trong database hoặc Redis. Nếu key chưa tồn tại, server tạo một bản ghi với trạng thái PROCESSING và tiến hành trừ tiền. Nếu key đã tồn tại và trạng thái là SUCCESS, server trả ngay kết quả đã lưu trước đó mà không trừ tiền lần 2. Nếu trạng thái đang là PROCESSING, server trả mã lỗi 409 Conflict hoặc yêu cầu chờ. Điều này ngăn chặn triệt để lỗi người dùng bấm 2 lần hoặc mạng chập chờn gây retry.',
        deep_dive: 'Lưu ý kiến trúc quan trọng: Việc kiểm tra và chèn Idempotency Key phải được bảo vệ bằng Unique Constraint cấp độ Database hoặc Atomic Lock trên Redis. Nếu chỉ viết `if (!exists) insert()`, hai request đồng thời vẫn có thể lọt qua (Race Condition). Ngoài ra, bản ghi Idempotency nên lưu kèm cả hash của Request Payload để phát hiện lỗi client gửi cùng 1 Idempotency Key nhưng body lại khác nhau.',
        practical_example: {
          title: 'Mẫu xử lý Idempotent Payment an toàn',
          code: `app.post('/api/v1/payments', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) return res.status(400).json({ error: 'Missing Idempotency-Key' });

  // 1. Chèn atomic với Unique Constraint
  try {
    await db.idempotency.create({
      data: { key: idempotencyKey, status: 'PROCESSING', response_body: null }
    });
  } catch (err: any) {
    if (err.code === 'P2002') { // Unique constraint violation
      const record = await db.idempotency.findUnique({ where: { key: idempotencyKey } });
      if (record.status === 'SUCCESS') {
        return res.status(200).json(record.response_body);
      }
      return res.status(409).json({ error: 'Request is already processing' });
    }
    throw err;
  }

  // 2. Thực hiện trừ tiền thực tế
  const result = await paymentGateway.charge(req.body);

  // 3. Cập nhật kết quả để phục vụ cho các lần retry sau
  await db.idempotency.update({
    where: { key: idempotencyKey },
    data: { status: 'SUCCESS', response_body: result }
  });

  return res.status(201).json(result);
});`,
          scenario: 'Khi khách hàng mất mạng 4G lúc đang thanh toán và ứng dụng tự retry, tiền chỉ bị trừ đúng 1 lần.'
        },
        trade_offs: {
          when_use: 'Bắt buộc cho các API có tác dụng phụ (side-effects) tài chính: Thanh toán, tạo đơn hàng, gửi email kích hoạt, hoàn tiền.',
          when_not_use: 'Các API GET, PUT, DELETE vốn dĩ đã có tính Idempotent theo chuẩn HTTP.',
          pros: ['Ngăn chặn hoàn toàn lỗi trừ tiền 2 lần (Double Charge)', 'Cho phép client retry an toàn trên mạng kém'],
          cons: ['Tăng chi phí lưu trữ bản ghi idempotency', 'Phải xử lý kịch bản request đang dở dang (Processing timeout)'],
          alternatives: ['Client sinh mã Token thanh toán trước (Payment Intent pattern của Stripe)']
        },
        follow_ups: [
          {
            question: 'Nếu server crash khi đang xử lý payment ở gateway (trạng thái kẹt ở PROCESSING), xử lý thế nào?',
            answer_skeleton: 'Dùng TTL cho trạng thái PROCESSING hoặc background reconciliation worker để truy vấn đối soát với Gateway và cập nhật lại trạng thái cuối cùng.'
          },
          {
            question: 'Tại sao HTTP GET và DELETE lại là Idempotent còn POST thì không?',
            answer_skeleton: 'GET chỉ đọc không đổi dữ liệu. DELETE xóa 1 tài nguyên nhiều lần thì trạng thái cuối cùng vẫn là tài nguyên đó không tồn tại. POST tạo tài nguyên mới mỗi lần gọi.'
          }
        ],
        common_traps: [
          'Chỉ kiểm tra key trên ứng dụng mà không có Unique Index ở DB dẫn tới Race Condition.',
          'Không lưu response cũ, khi retry lại chạy logic mới hoặc báo lỗi 500.',
          'Cho phép cùng 1 Idempotency Key nhưng payload gửi lên hoàn toàn khác nhau.'
        ],
        active_recall: [
          'Tại sao nói mạng không tin cậy là lý do số 1 sinh ra Idempotency Key?',
          'Làm thế nào để phân biệt giữa "Request đang xử lý" và "Request đã xử lý thành công" khi retry?'
        ],
        layers: {
          l1_junior: 'Idempotency nghĩa là gọi một API nhiều lần với cùng tham số thì kết quả hệ thống không thay đổi so với gọi một lần.',
          l2_middle: 'Sử dụng header Idempotency-Key và bảng lưu trạng thái để phát hiện duplicate request từ client khi retry.',
          l3_senior: 'Ở mức 3 YoE, phải xử lý được Race condition bằng Unique Index, xử lý Payload Hash mismatch, và cơ chế xử lý khi request bị timeout giữa chừng ở Gateway ngoài.'
        },
        why_ladder: [
          { question: 'Tại sao cần Idempotency Key cho API Payment?', answer: 'Vì mạng máy tính không tin cậy, client có thể không nhận được response dù server đã trừ tiền.' },
          { question: 'Tại sao client lại retry?', answer: 'Vì timeout 30s khiến client tưởng server chưa nhận được lệnh.' },
          { question: 'Chuyện gì xảy ra nếu server không có Idempotency?', answer: 'Server sẽ xử lý lại lệnh thanh toán và khách hàng bị trừ tiền 2 lần.' },
          { question: 'Làm sao để đảm bảo Idempotency an toàn tuyệt đối?', answer: 'Dùng Unique Constraint trong ACID DB hoặc Redis Atomic Lock để chặn tương tranh.' }
        ],
        code_reaction: {
          code: `// API thanh toán thiếu bảo vệ atomic:
const existing = await db.query('SELECT * FROM payments WHERE key = $1', [key]);
if (existing.rows.length > 0) {
  return res.json(existing.rows[0]);
}
await chargeCreditCard();
await db.query('INSERT INTO payments (key) VALUES ($1)', [key]);`,
          question: 'Lỗ hổng race condition nào sẽ xảy ra nếu 2 request cùng key tới server cách nhau 5ms?',
          explanation: 'Check-then-act race condition: Cả 2 request cùng chạy câu lệnh SELECT và thấy chưa có bản ghi nào, sau đó cả 2 cùng gọi chargeCreditCard() khiến khách hàng bị trừ tiền 2 lần.',
          fix: 'Tạo Unique Constraint trên cột key và dùng transaction hoặc insert key với status PROCESSING trước khi gọi chargeCreditCard().'
        },
        cross_link_node_id: 'node-cong-gateway'
      }
    ];

    const existing = sqliteClient.getAllInterviewTopics();

    const allSeeds: InterviewTopicEntity[] = [
      ...seedTopics,
      ...SEED_TOPICS_PART1,
      ...SEED_TOPICS_PART2,
      ...SEED_TOPICS_PART3
    ];

    // Gán cross_link_node_id cho các topic chưa có
    for (const seed of allSeeds) {
      if (!seed.cross_link_node_id) {
        seed.cross_link_node_id = resolveTopicCrossLinkNodeId(seed.domain_id, seed.title);
      }
    }

    // Ensure every existing topic has a valid cross_link_node_id
    for (const ex of existing) {
      if (!ex.cross_link_node_id) {
        ex.cross_link_node_id = resolveTopicCrossLinkNodeId(ex.domain_id, ex.title);
        sqliteClient.saveInterviewTopic(ex);
      }
    }

    const toInsert = allSeeds.filter(s => !existing.some(e => e.id === s.id));
    if (toInsert.length > 0) {
      sqliteClient.saveInterviewTopics(toInsert);
    }
  }


  public getDomains(): DomainMeta[] {
    const allTopics = sqliteClient.getAllInterviewTopics();
    
    return DOMAIN_CATALOG.map(domain => {
      const domainTopics = allTopics.filter(t => t.domain_id === domain.id);
      let readyCount = 0;
      let weakCount = 0;
      let knowCount = 0;
      let mustLearnCount = 0;

      for (const t of domainTopics) {
        const status = t.progress?.gap_status || 'MUST_LEARN';
        if (status === 'READY') readyCount++;
        else if (status === 'KNOW') knowCount++;
        else if (status === 'WEAK') weakCount++;
        else mustLearnCount++;
      }

      return {
        id: domain.id,
        number: domain.number,
        title: domain.title,
        description: domain.description,
        icon: domain.icon,
        total_topics: domainTopics.length,
        ready_count: readyCount,
        weak_count: weakCount,
        know_count: knowCount,
        must_learn_count: mustLearnCount
      };
    });
  }

  public getTopics(domainId?: string): Array<InterviewTopicEntity & { progress?: UserTopicProgress }> {
    return sqliteClient.getAllInterviewTopics(domainId);
  }

  public getTopicById(id: string): (InterviewTopicEntity & { progress?: UserTopicProgress }) | null {
    return sqliteClient.getInterviewTopic(id);
  }

  public saveTopic(topic: InterviewTopicEntity): void {
    sqliteClient.saveInterviewTopic(topic);
  }

  public deleteTopic(id: string): void {
    sqliteClient.deleteInterviewTopic(id);
  }

  public updateProgress(progress: {
    topic_id: string;
    gap_status?: GapStatus;
    reviewed_count?: number;
    last_reviewed_at?: string;
    notes?: string;
  }): void {
    sqliteClient.updateUserTopicProgress(progress);
  }

  public getGapMap(): GapMapSummary {
    return sqliteClient.getGapMapSummary();
  }
}

export const interviewService = new InterviewService();
