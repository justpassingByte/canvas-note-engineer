# Fullstack Senior & Production Interview Reaction Cheatsheet
> **Tác giả / Hệ điều hành phản xạ:** Senior Fullstack Coach & Architecture Engine  
> **Target Level:** Senior / Production Fullstack Engineer (Product / Global Standard)  
> **Core Stack:** TypeScript, React, Next.js, Node.js, NestJS, PostgreSQL, Redis, REST/WebSocket, Docker, AWS  
> **Core Principle:** `Keyword → Trigger Memory → Recall (5s) → Interview Answer (20-40s) → Deep Dive → Trade-offs → Follow-ups → Code Reaction`

---

## 0. How to Use This

### 🎯 Bản chất của kỳ phỏng vấn Senior / Production
Interviewer không tìm kiếm một cuốn từ điển sống biết thuộc lòng cú pháp. Họ tìm kiếm một kỹ sư:
1. **Bật ra được framework tư duy trong 5–15 giây** ngay sau khi nghe câu hỏi.
2. **Hiểu bản chất bên dưới (Under the Hood)**: Tại sao nó hoạt động như vậy, chi phí bộ nhớ/CPU là gì.
3. **Làm chủ Trade-offs**: Không có giải pháp hoàn hảo, chỉ có sự đánh đổi giữa hiệu năng, độ phức tạp, và tính nhất quán.
4. **Kinh nghiệm thực chiến (Production battle-tested)**: Biết hệ thống sập ở đâu, race condition xảy ra thế nào, và cách debug khi có sự cố.

### ⚡ 3 Tầng nhận thức (Answer in Layers)
- **L1 — Junior Recall (Định nghĩa)**: Nó là gì? Giải quyết bài toán bề mặt nào?
- **L2 — Middle Explanation (Cơ chế)**: Tại sao nó hoạt động như vậy? Mô hình bộ nhớ / luồng dữ liệu bên trong.
- **L3 — Production & Trade-offs (Thực chiến)**: Concurrency, Failure modes, Trade-offs, Scalability, Observability, Debugging.

---

## 1. Interview Mental Models

### Framework 1: Trả lời câu hỏi kỹ thuật ("What is X?")
```text
[1. Bản chất & Mục đích sinh ra] 
  → [2. Cơ chế hoạt động cốt lõi (5-10s)] 
  → [3. Ví dụ thực tế trong Production] 
  → [4. Trade-off & Khi nào KHÔNG NÊN dùng]
```

### Framework 2: Trả lời thiết kế hệ thống ("How to design X?")
```text
[1. Clarify Requirements (Functional & Non-functional)] 
  → [2. API Interface & Data Model] 
  → [3. High-Level Flow (Gateway → Service → DB/Cache)] 
  → [4. Bottlenecks & Concurrency Control] 
  → [5. Failure Modes, Idempotency & Observability]
```

### Framework 3: Trả lời tình huống Debugging ("System is slow / 500 / Crash")
```text
[1. Clarify & Reproduce (Xác định triệu chứng, phạm vi)] 
  → [2. Observe & Trace (Logs, Correlation ID, Metrics, APM)] 
  → [3. Form Hypothesis (Giả thuyết điểm nghẽn)] 
  → [4. Test & Narrow down] 
  → [5. Fix, Verify & Regression Guard]
```

### Framework 4: "I don't know — but I know how to reason"
> *"Tôi chưa trực tiếp vận hành công nghệ X trong môi trường production, nhưng dựa trên nguyên lý nền tảng của hệ thống phân tán / mô hình bộ nhớ, bài toán này quy về... Tôi sẽ tiếp cận theo các bước sau..."*

---

## 2. JavaScript Fundamentals

### Topic 2.1: Event Loop, Microtask & Execution Prediction

#### 🎯 Interviewer đang test gì?
Hiểu cách V8 runtime xử lý bất đồng bộ đơn luồng (single-threaded), độ ưu tiên giữa Call Stack, Microtask Queue (`Promise`, `queueMicrotask`) và Macrotask Queue (`setTimeout`, `setImmediate`, I/O).

#### ⚡ Trigger Keywords
```text
Single Thread → Call Stack → Web APIs/libuv → Microtask Queue (Promise.then, queueMicrotask) → Macrotask Queue (setTimeout, I/O) → Event Loop tick
```

#### 🧠 5-Second Recall
Call Stack rỗng thì Event Loop **luôn vét sạch toàn bộ Microtask Queue** trước khi nhặt **1 task duy nhất** từ Macrotask Queue. Microtask sinh thêm microtask sẽ làm nghẽn Macrotask và render của trình duyệt.

#### 🗣️ Interview Answer (30s)
> *"JavaScript là ngôn ngữ đơn luồng với một Call Stack duy nhất. Khi gặp các tác vụ bất đồng bộ, V8 đẩy chúng vào hàng đợi tương ứng: Microtask Queue dành cho `Promise.then`, `catch`, `finally` và `queueMicrotask`; Macrotask Queue dành cho `setTimeout`, `setInterval`, I/O. Cơ chế Event Loop vận hành theo nguyên tắc: Thực thi hết code đồng bộ trong Call Stack, sau đó ưu tiên rút cạn kiệt toàn bộ các task trong Microtask Queue (kể cả microtask được sinh ra bên trong microtask đó), rồi mới lấy đúng một task trong Macrotask Queue và kiểm tra render pipeline."*

#### 💻 Code Reaction & Execution Prediction
```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => {
  console.log('3');
  queueMicrotask(() => console.log('4'));
}).then(() => console.log('5'));
console.log('6');
```
- **Output đúng**: `1 → 6 → 3 → 4 → 5 → 2`
- **Giải thích**: 
  1. `1` và `6` chạy đồng bộ trên Call Stack.
  2. `setTimeout` đăng ký callback vào Macrotask Queue.
  3. `Promise.resolve().then` đẩy callback `3` vào Microtask Queue.
  4. Sau khi Stack rỗng: Lấy `3` ra chạy, `queueMicrotask` đẩy `4` vào Microtask Queue, `then` tiếp theo đẩy `5` vào Microtask Queue.
  5. Tiếp tục vét cạn Microtask Queue: in `4`, sau đó in `5`.
  6. Microtask rỗng, Event Loop mới nhặt Macrotask đầu tiên: in `2`.

#### ⚖️ Trade-offs & Production Implication
- **Khi nào dùng `queueMicrotask`**: Khi muốn một tác vụ chạy ngay sau khi Call Stack rỗng nhưng trước khi trình duyệt vẽ lại màn hình (Render) và trước khi xử lý sự kiện người dùng tiếp theo.
- **Bẫy sản xuất (Starvation)**: Vòng lặp đệ quy gọi microtask vô hạn sẽ làm trình duyệt freeze (đơ UI hoàn toàn) hoặc Node.js không bao giờ xử lý được request I/O mới.

---

### Topic 2.2: Closures, Lexical Environment & Stale State

#### 🎯 Interviewer đang test gì?
Khả năng quản lý bộ nhớ, hiểu cách hàm giữ tham chiếu tới phạm vi cha (Lexical Scope), nguyên nhân gây rò rỉ bộ nhớ (memory leaks) và bug stale closure trong React Hooks.

#### ⚡ Trigger Keywords
```text
Lexical Environment → Outer Reference Scope → Heap Allocation → Retained Memory → Stale Closure Bug
```

#### 🧠 5-Second Recall
Closure là một hàm ghi nhớ môi trường tĩnh (lexical environment) nơi nó được sinh ra, kể cả khi hàm cha đã return. Biến được tham chiếu sẽ không bị Garbage Collector dọn rẹp, lưu trên Heap.

#### 🗣️ Interview Answer (25s)
> *"Closure được tạo ra khi một hàm bên trong giữ tham chiếu đến các biến nằm trong phạm vi của hàm bao ngoài nó. Ngay cả khi hàm cha đã kết thúc thực thi, các biến đó vẫn tồn tại trên Heap vì có con trỏ sống trỏ tới. Trong thực tế, Closure là nền tảng của tính bao đóng dữ liệu (data encapsulation), factory functions, và hooks trong React, nhưng nếu không cẩn thận giải phóng event listener hay timer, closure sẽ giữ lại các object lớn gây Memory Leak."*

#### 💻 Code Reaction
```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
```
- **Vấn đề**: In ra `3, 3, 3` vì từ khóa `var` có function scope, cả 3 timer closure đều trỏ tới cùng một ô nhớ `i`.
- **Cách sửa**: Đổi `var` thành `let` (block scope - mỗi vòng lặp tạo 1 lexical scope mới) hoặc dùng IIFE.

---

## 3. Browser / Web Platform

### Topic 3.1: Critical Rendering Path, Reflow & Repaint

#### 🎯 Interviewer đang test gì?
Hiểu cách trình duyệt chuyển đổi HTML/CSS/JS thành pixel trên màn hình. Kỹ năng tối ưu hóa FPS (60fps/120fps) và chỉ số Core Web Vitals (INP, CLS).

#### ⚡ Trigger Keywords
```text
DOM + CSSOM → Render Tree → Layout (Reflow: tính hình học) → Paint (Repaint: màu sắc) → Composite (GPU layer)
```

#### 🧠 5-Second Recall
- **Reflow (Layout)**: Thay đổi kích thước/vị trí hình học (`width`, `height`, `top`, `fontSize`). Cực kỳ tốn kém vì tính toán lại toàn bộ cây render.
- **Repaint**: Chỉ đổi giao diện hiển thị (`color`, `background`, `visibility`). Không đổi hình học.
- **GPU Composite**: Sử dụng `transform` và `opacity` để GPU xử lý trên composite layer riêng mà KHÔNG kích hoạt Reflow hay Repaint.

#### 🗣️ Interview Answer (30s)
> *"Trình duyệt dựng trang qua các bước: Phân tích HTML thành DOM, CSS thành CSSOM, gộp lại thành Render Tree, sau đó chạy bước Layout để tính toán tọa độ hình học (Reflow), bước Paint để vẽ màu sắc và văn bản (Repaint), cuối cùng Composite các layer lên GPU. Trong thực tế, các thao tác đọc ghi DOM liên tục như `offsetHeight` xen kẽ với ghi style sẽ gây Layout Thrashing. Khi làm animation, tôi luôn ưu tiên sử dụng thuộc tính `transform` và `opacity` kết hợp `will-change` để đưa tác vụ lên GPU layer, tránh hoàn toàn Reflow và Repaint."*

#### ⚖️ Trade-offs
- `transform: translate3d(0,0,0)`: Mượt 60fps, giảm tải CPU, nhưng lạm dụng quá nhiều layer sẽ gây tràn VRAM trên thiết bị di động yếu.

---

### Topic 3.2: CORS, Preflight Request & Security Headers

#### 🎯 Interviewer đang test gì?
Hiểu chính sách Same-Origin Policy (SOP), tại sao trình duyệt chặn request, cơ chế Preflight `OPTIONS`, và phân biệt giữa bảo mật Browser và Server.

#### ⚡ Trigger Keywords
```text
Same-Origin Policy → Origin (Scheme + Host + Port) → Simple Request vs Preflight (OPTIONS) → Access-Control-Allow-Origin → CSRF token
```

#### 🧠 5-Second Recall
CORS là cơ chế của **trình duyệt**, không phải của server. Server vẫn nhận request và thực thi bình thường; chính trình duyệt là bên từ chối trả response về cho JavaScript nếu thiếu header `Access-Control-Allow-Origin`.

#### 🔥 Follow-up Questions
- **Q**: Khi nào trình duyệt gửi Preflight request (`OPTIONS`)?  
  *Answer Skeleton*: Khi request không phải là Simple Request (ví dụ dùng method `PUT`, `DELETE`, `PATCH`, hoặc có custom headers như `Authorization`, hoặc `Content-Type: application/json`).
- **Q**: CORS có ngăn chặn được hacker tấn công API trực tiếp bằng Postman / curl không?  
  *Answer Skeleton*: Hoàn toàn không. CORS chỉ là hàng rào bảo vệ ở tầng Browser. Bảo mật backend phải dựa vào Authentication, Rate Limiting và CSRF/WAF.

---

## 4. React Fundamentals

### Topic 4.1: React Fiber & Reconciliation Algorithm

#### 🎯 Interviewer đang test gì?
Hiểu cách React so sánh cây Virtual DOM (Reconciliation), cơ chế ngắt quãng ưu tiên của Fiber Architecture (React 16+), và lý do cần `key` trong danh sách.

#### ⚡ Trigger Keywords
```text
Stack Reconciler (cũ, đồng bộ) → Fiber Node (Linked List: child, sibling, return) → Cooperative Scheduling → Render Phase (ngắt được) → Commit Phase (đồng bộ, cập nhật DOM)
```

#### 🧠 5-Second Recall
Fiber biến cây component thành cấu trúc danh sách liên kết hai chiều. Giúp React chia nhỏ công việc render thành từng chunk nhỏ, có thể tạm dừng (yield) cho browser xử lý tương tác người dùng, sau đó tiếp tục mà không làm đơ giao diện.

#### 🗣️ Interview Answer (30s)
> *"Trước React 16, Stack Reconciler xử lý đệ quy đồng bộ, cây component lớn sẽ làm nghẽn main thread gây rớt khung hình. Fiber ra đời viết lại lõi React dưới dạng một Linked List của các Fiber node. Quá trình render được chia thành 2 giai đoạn: Render Phase tính toán diffing bất đồng bộ và có thể bị ngắt quãng theo độ ưu tiên; Commit Phase cập nhật thực tế vào DOM thật và luôn diễn ra đồng bộ để tránh chớp giật giao diện. Đó cũng là nền tảng cho Concurrent Mode, Suspense và Transitions trong React 18."*

#### ❌ Common Trap
- **Dùng index làm `key`**: Khi xóa hoặc đảo thứ tự mảng, index của item thay đổi khiến Fiber node tái sử dụng sai component instance, gây lỗi giữ lại state cũ của input form.

---

## 5. React Hooks & Advanced

### Topic 5.1: `useCallback` vs `useMemo` & Referential Equality

#### 🎯 Interviewer đang test gì?
Hiểu về đẳng thức tham chiếu (`Object.is`), vòng đời re-render, chi phí so sánh dependencies so với chi phí re-render thực tế.

#### ⚡ Trigger Keywords
```text
Function/Object identity → Referential Equality (Object.is) → React.memo prop comparison → Unnecessary child re-render → Memory overhead
```

#### 🧠 5-Second Recall
`useCallback` cache **con trỏ hàm**, `useMemo` cache **kết quả tính toán**. Cả hai hook này KHÔNG làm component hiện tại chạy nhanh hơn; chúng sinh ra để giữ nguyên tham chiếu nhằm ngăn component con bọc `React.memo` re-render vô ích.

#### 🗣️ Interview Answer (35s)
> *"Trong JavaScript, mỗi lần component re-render, toàn bộ hàm và object khai báo bên trong đều được tạo mới tại địa chỉ bộ nhớ mới. Nếu ta truyền callback này xuống component con đã được tối ưu bằng `React.memo`, React so sánh props thấy tham chiếu thay đổi nên vẫn re-render con. `useCallback` giải quyết việc này bằng cách giữ nguyên tham chiếu hàm qua các lần render nếu dependency không đổi. Tuy nhiên, nếu component con không dùng `React.memo` hoặc render rất nhẹ, việc bọc `useCallback` chỉ làm tăng chi phí cấp phát bộ nhớ và so sánh deps của React."*

#### 🪜 Why-Ladder
1. **Tại sao dùng `useCallback`?** → Để ổn định tham chiếu con trỏ hàm.
2. **Tại sao cần ổn định tham chiếu?** → Để `React.memo` ở component con không thấy prop bị đổi.
3. **Tại sao cần `React.memo`?** → Để tránh re-render những cây component con phức tạp và nặng.
4. **Khi nào KHÔNG NÊN dùng?** → Khi truyền xuống thẻ DOM gốc (`<button>`) hoặc component con đơn giản; chi phí quản lý hook vượt quá chi phí render.

---

### Topic 5.2: React Suspense & Streaming SSR

#### 🎯 Interviewer đang test gì?
Hiểu cách Suspense phối hợp với Promise để phối hợp render bất đồng bộ, cơ chế Streaming HTML từ Server và Selective Hydration.

#### ⚡ Trigger Keywords
```text
Promise thrown → Suspense Boundary catch → Fallback render → Promise resolve → Resume rendering → Streaming HTML chunks
```

#### 🧠 5-Second Recall
Suspense không chỉ là "loading spinner". Về mặt cơ chế, component ném ra một `Promise` khi đang fetch dữ liệu; Suspense Boundary gần nhất bắt lấy Promise đó, hiển thị fallback, và khi Promise resolve, React tự động tiếp tục render component con.

---

## 6. Next.js App Router

### Topic 6.1: Server Components (RSC) vs Client Components

#### 🎯 Interviewer đang test gì?
Khả năng phân tách ranh giới mạng (Network Boundary), cơ chế zero-bundle size, và sự khác biệt giữa SSR truyền thống với React Server Components.

#### ⚡ Trigger Keywords
```text
React Server Components (Default) → Zero Client Bundle → Direct Backend/DB Access → Serialization Boundary → 'use client' (Hydration Entry)
```

#### 🧠 5-Second Recall
- **Server Component**: Chạy 100% trên server, trả về RSC Payload (JSON Virtual DOM), 0 byte JS tải về browser. Không dùng được hooks (`useState`, `useEffect`) hay DOM listeners.
- **Client Component (`'use client'`)**: VẪN ĐƯỢC RENDER TRÊN SERVER (SSR) trong lần đầu, sau đó tải JS bundle xuống browser để hydrate event listeners và quản lý state.

#### 🗣️ Interview Answer (35s)
> *"Server Components là mặc định trong Next.js App Router. Chúng chỉ thực thi ở server, cho phép ta query database hoặc đọc filesystem trực tiếp mà không để lộ connection string và không tốn bất kỳ byte JS nào trong client bundle. Directive `'use client'` không biến component thành Client-Side Rendering thuần túy, mà nó đánh dấu ranh giới serialize (Network Boundary): Component đó vẫn được SSR tạo HTML tĩnh trước ở server, sau đó client tải JS bundle để hydrate tương tác. Quy tắc vàng là đẩy Client Component xuống lá xa nhất của cây component (leaf level) để tối đa hóa lợi ích zero-bundle."*

#### 💻 Code Reaction
```typescript
// app/users/page.tsx
'use client';
import prisma from '@/lib/db'; // ❌ LỖI LỚN
export default function Page() {
  const users = prisma.user.findMany(); // Lộ secret hoặc build fail
  return <div>{users.length}</div>;
}
```
- **Fix**: Bỏ `'use client'`, để Page là Server Component query DB trực tiếp, sau đó truyền mảng users nguyên thủy xuống `<UserList users={users} />` có `'use client'`.

---

### Topic 6.2: SSR vs CSR vs SSG vs ISR Matrix

| Chiến lược | Thời điểm Render | Ưu điểm | Nhược điểm | Use Case thực tế |
|---|---|---|---|---|
| **CSR (Client-Side)** | Hoàn toàn tại trình duyệt | Chi phí server thấp, trải nghiệm SPA mượt | SEO kém, LCP chậm, lộ API structure | Dashboard Admin, Canvas, App nội bộ |
| **SSR (Server-Side)** | Mỗi khi có HTTP Request | Dữ liệu luôn tươi mới (Real-time), SEO tốt | TTFB cao, tăng tải CPU cho server | Trang tìm kiếm, Feed tin tức cá nhân hóa |
| **SSG (Static Gen)** | Lúc `npm run build` | Cực nhanh (phục vụ từ CDN Edge), chịu tải vô hạn | Dữ liệu bị đóng băng lúc build, build lâu | Blog, Landing page, Documentation |
| **ISR (Incremental)** | Build + Tự sinh lại sau `revalidate: X` | Tốc độ như CDN nhưng dữ liệu tự động cập nhật ngầm | Người đầu tiên sau TTL có thể thấy dữ liệu cũ | Trang chi tiết sản phẩm E-commerce (100k SKU) |

---

## 7. TypeScript Deep Dive

### Topic 7.1: `type` vs `interface`, Discriminated Unions & `never`

#### 🎯 Interviewer đang test gì?
Khả năng mô hình hóa dữ liệu phức tạp, xử lý an toàn kiểu tại compile time, và phân biệt giữa Static Typing của TypeScript với Runtime Validation.

#### ⚡ Trigger Keywords
```text
Interface (Declaration Merging, Object shapes) vs Type (Unions, Primitives, Tuples) → Discriminated Union (tag/type field) → Exhaustive Check with never
```

#### 🧠 5-Second Recall
TypeScript chỉ kiểm tra kiểu ở lúc **biên dịch (compile-time)** và biến mất hoàn toàn khi chạy (type erasure). Muốn an toàn ở runtime khi nhận dữ liệu từ API/Form bắt buộc phải dùng thư viện kiểm thực runtime như **Zod** hoặc **Valibot**.

#### 💻 Thực chiến: Discriminated Union & Exhaustive Check
```typescript
type PaymentState =
  | { status: 'PENDING' }
  | { status: 'SUCCESS'; transactionId: string; amount: number }
  | { status: 'FAILED'; errorCode: string };

function handlePayment(state: PaymentState): string {
  switch (state.status) {
    case 'PENDING':
      return 'Đang xử lý';
    case 'SUCCESS':
      return `Thành công: ${state.transactionId}`;
    case 'FAILED':
      return `Thất bại: ${state.errorCode}`;
    default: {
      // Đảm bảo không bao giờ bỏ sót case mới ở compile time
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}
```

---

## 8. Frontend State & Data

### Topic 8.1: Client State vs Server State & TanStack Query

#### 🎯 Interviewer đang test gì?
Khả năng phân biệt giữa dữ liệu tạm của UI (Client State) với bản sao dữ liệu từ backend (Server State), chiến lược Stale-While-Revalidate, và Optimistic UI.

#### ⚡ Trigger Keywords
```text
Client State (Zustand/Context: modals, theme) vs Server State (Async, Cache, Invalidation, Deduplication) → Optimistic Update → Rollback on Failure
```

#### 🧠 5-Second Recall
Đừng đưa dữ liệu API vào Redux/Zustand thủ công. Server State vốn không thuộc về frontend; nó là một bộ nhớ đệm (remote cache) có trạng thái cũ (stale), cần tự động re-fetch, deduplicate request và giải phóng bộ nhớ. Hãy dùng TanStack Query (React Query) hoặc SWR.

---

## 9. Frontend Performance

### Topic 9.1: Quy trình điều tra hiệu năng & Core Web Vitals (INP, LCP, CLS)

#### 🎯 Interviewer đang test gì?
Kỹ năng giải quyết bài toán: *"Trang web chạy rất chậm, em sẽ làm gì?"* — Đánh giá xem ứng viên có phương pháp luận đo đạc khoa học hay chỉ đoán mò tối ưu bừa bãi.

#### ⚡ Trigger Keywords
```text
Reproduce → Chrome DevTools Performance Profiler → Bottleneck (CPU bound vs Network Waterfall vs Re-render) → Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1) → Measure again
```

#### 🗣️ Interview Answer (Framework phản xạ 30s)
> *"Khi trang web chậm, tôi không bao giờ tối ưu hóa mù quáng. Tôi tuân thủ quy trình 5 bước:
> 1. **Tái hiện và Đo lường**: Dùng Lighthouse và Chrome DevTools Performance tab (bật CPU 4x throttling) để ghi lại Trace thực tế.
> 2. **Xác định điểm nghẽn**: Kiểm tra theo 3 chỉ số Core Web Vitals: LCP chậm do ảnh quá nặng hay server TTFB cao? INP kém do Main Thread bị block bởi JavaScript dài (>50ms Long Task)? Hay CLS do layout nhảy vì ảnh không set width/height?
> 3. **Đưa ra giả thuyết & Áp dụng giải pháp**: Dùng React Profiler tìm component re-render vô cớ, dùng dynamic import code-splitting hoặc virtualization (react-window) cho danh sách lớn.
> 4. **Đo lại (Verify)**: So sánh chỉ số trước và sau trên môi trường Staging."*

---

## 10. Node.js Internals

### Topic 10.1: libuv, Event Loop 6 Phases & Non-blocking I/O

#### 🎯 Interviewer đang test gì?
Hiểu cách Node.js xử lý hàng chục ngàn kết nối đồng thời với mô hình Single Thread, vai trò của libuv Thread Pool, và cách xử lý CPU-bound task để không làm nghẽn Event Loop.

#### ⚡ Trigger Keywords
```text
V8 Engine → libuv (Thread Pool: 4 threads mặc định) → Event Loop 6 Phases (Timers → Pending I/O → Idle/Prepare → Poll → Check: setImmediate → Close) → process.nextTick priority
```

#### 🧠 5-Second Recall
Node.js chạy JavaScript trên **1 luồng duy nhất** (Event Loop), nhưng các tác vụ nặng như Đọc File (fs), mã hóa (`crypto.pbkdf2`), nén (`zlib`) và DNS lookup được đẩy xuống **libuv Thread Pool** (mặc định 4 threads nền). Riêng Network I/O (TCP/HTTP) được hệ điều hành xử lý bất đồng bộ qua epoll (Linux) / kqueue (macOS) / IOCP (Windows) mà không tốn thread nào.

#### 🔥 Follow-up: CPU-bound Task xử lý thế nào?
- Khi cần tính toán mã hóa, xử lý ảnh hoặc xuất Excel 1 triệu dòng:
  1. Không bao giờ chạy trực tiếp trên Event Loop chính vì sẽ block mọi request HTTP khác.
  2. Sử dụng `worker_threads` (chia sẻ ArrayBuffer) hoặc đẩy tác vụ ra Message Queue (BullMQ/RabbitMQ) cho worker process riêng xử lý.

---

## 11. NestJS Architecture

### Topic 11.1: Thứ tự thực thi Middleware → Guard → Interceptor → Pipe → Filter

#### 🎯 Interviewer đang test gì?
Khả năng làm chủ vòng đời request trong NestJS (Request Lifecycle), thiết kế Clean Architecture, và áp dụng đúng pattern cho từng bài toán.

```text
Request 
  → [1. Middleware] (Gán requestId, CORS, body parser)
  → [2. Guard] (Xác thực Auth, JWT, quyền RBAC)
  → [3. Interceptor (Pre)] (Ghi log thời gian bắt đầu, cache check)
  → [4. Pipe] (Validate DTO với class-validator, biến đổi dữ liệu)
  → [5. Controller Handler] (Thực thi Business logic)
  → [6. Interceptor (Post)] (Biến đổi response format { data, statusCode })
  → [7. Exception Filter] (Bắt lỗi Unhandled, format JSON response chuẩn)
```

#### 🧠 5-Second Recall
- **Guard**: Trả về `true/false` xem có được đi tiếp không (Chạy trước Pipe).
- **Pipe**: Biến đổi và kiểm tra tính hợp lệ của Body/Param (Nếu lỗi, văng BadRequestException ngay trước khi vào Controller).
- **Interceptor**: Bọc quanh Controller (AOP - Aspect Oriented Programming), có thể can thiệp cả trước và sau khi handler chạy.

---

## 12. API Design & Protocols

### Topic 12.1: Idempotency Keys trong thanh toán & REST

#### 🎯 Interviewer đang test gì?
Hiểu cách thiết kế hệ thống tài chính chống trừ tiền 2 lần khi mạng chập chờn (Network Retry) và xử lý Race Condition.

#### ⚡ Trigger Keywords
```text
Network Unreliability → Client Timeout Retry → Idempotency-Key Header → ACID DB Unique Constraint → Atomic Lock → Cache previous response
```

#### 🧠 5-Second Recall
Idempotent nghĩa là gọi 1 lần hay gọi 100 lần thì trạng thái dữ liệu trên hệ thống chỉ biến đổi đúng 1 lần. POST không mặc định idempotent, bắt buộc phải dùng `Idempotency-Key` kết hợp Unique Index trong cơ sở dữ liệu.

#### 💻 Production Pattern
```sql
CREATE TABLE idempotency_keys (
  key VARCHAR(64) PRIMARY KEY,
  status VARCHAR(20) NOT NULL, -- 'PROCESSING', 'SUCCESS', 'FAILED'
  response_body JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```
- Khi request tới: Thử INSERT `key` với status `PROCESSING`.
- Nếu văng lỗi `Duplicate Key (P2002 / 23505)`: Đọc bản ghi hiện có. Nếu đang `PROCESSING` → trả về `409 Conflict`. Nếu đã `SUCCESS` → trả về ngay `response_body` cũ mà không chạy lại logic trừ tiền.

---

## 13. Authentication & Security

### Topic 13.1: JWT vs Session, Refresh Token Rotation (RTR) & XSS/CSRF

#### 🎯 Interviewer đang test gì?
Hiểu sự đánh đổi giữa Stateless và Stateful Auth, bảo vệ token an toàn chống rò rỉ, và cơ chế phát hiện đánh cắp token (Token Theft Detection).

#### ⚡ Trigger Keywords
```text
Access Token (Ngắn: 15m) → Refresh Token (Dài: 7d) → HttpOnly Secure SameSite Cookie → Refresh Token Rotation (RTR) → Token Family Invalidation on Reuse
```

#### 🧠 5-Second Recall
- **Không bao giờ lưu Token vào `localStorage`**: Vì mọi đoạn mã JavaScript (kể cả thư viện bên thứ 3 dính mã độc XSS) đều đọc được.
- **Lưu vào HttpOnly, Secure, SameSite=Strict Cookie**: Trình duyệt tự gửi cookie, JavaScript hoàn toàn không chạm vào được (chống 100% XSS đánh cắp). Kết hợp CSRF token hoặc Custom Header (`X-Requested-With`) để chống CSRF.

#### 🛡️ Cơ chế Refresh Token Rotation (RTR) & Token Family
1. Mỗi khi Refresh Token được dùng để lấy Access Token mới, server hủy ngay Refresh Token cũ và cấp một Refresh Token mới.
2. Nếu kẻ gian đã trộm token cũ và cố gắng gửi lên sau đó: Server phát hiện token đã bị thu hồi → **Đánh dấu cả "gia đình token" (Token Family) bị xâm phạm** → Thu hồi toàn bộ phiên đăng nhập của người dùng đó ngay lập tức!

---

## 14. PostgreSQL / SQL

### Topic 14.1: B-Tree Index, EXPLAIN ANALYZE & Tối ưu hóa truy vấn triệu dòng

#### 🎯 Interviewer đang test gì?
Kỹ năng giải quyết bài toán: *"Query này chạy trên 10 triệu dòng mất 12 giây, em làm thế nào để kéo về dưới 50ms?"*

#### ⚡ Trigger Keywords
```text
Sequential Scan (Quét toàn bảng) → EXPLAIN (ANALYZE, BUFFERS) → B-Tree Index → Index Selectivity → Composite Index (Quy tắc tiền tố trái) → N+1 Query Fix
```

#### 🧠 5-Second Recall
Đừng tạo index bừa bãi. Index giúp đọc nhanh (O(log N)) nhưng làm chậm thao tác `INSERT/UPDATE` và tốn RAM bộ nhớ đệm (shared buffers). Phải chạy `EXPLAIN ANALYZE` để xem chi phí thực tế (Actual Time và Buffers Read/Hit).

#### 💻 Debugging Flow cho Slow Query
1. **Chạy `EXPLAIN (ANALYZE, BUFFERS) SELECT ...`**:
   - Thấy `Seq Scan` trên bảng lớn? → Thiếu index.
   - Thấy `Index Scan` nhưng vẫn chậm? → Index Selectivity kém (ví dụ index trên cột `gender` chỉ có 2 giá trị) hoặc bảng bị phình to (Bloat, cần `VACUUM ANALYZE`).
2. **Composite Index (Chỉ mục kết hợp)**:
   - Nếu query có `WHERE tenant_id = 1 AND status = 'ACTIVE' ORDER BY created_at DESC`:
   - Tạo index theo thứ tự: `CREATE INDEX idx_tenant_status_created ON orders (tenant_id, status, created_at DESC);`
   - Tuân thủ quy tắc tiền tố bên trái (Leftmost Prefix Rule).

---

## 15. Redis & In-Memory

### Topic 15.1: Cache-Aside, Cache Stampede (Dogpiling) & Distributed Lock

#### 🎯 Interviewer đang test gì?
Hiểu cách bảo vệ cơ sở dữ liệu khi có hàng chục ngàn request đồng thời, chiến lược vô hiệu hóa cache (cache invalidation), và phân biệt giữa Stampede, Avalanche, Penetration.

#### ⚡ Trigger Keywords
```text
Cache-Aside (Lazy loading) → TTL with Jitter → Cache Stampede / Hot-key Expiry → Distributed Lock (SET NX EX + Lua Release) → Fallback Circuit Breaker
```

#### 🧠 5-Second Recall
- **Cache Stampede**: Hot-key hết hạn đúng lúc có spike 10,000 req/s, tất cả cùng miss cache và đồng loạt đâm thẳng vào Database làm sập DB.
- **Giải pháp**: Dùng Mutex Lock trên Redis (`SET key token NX EX 5`) để chỉ đúng 1 request được quyền query DB và tính toán cache lại; các request khác chờ 50ms rồi đọc lại cache.
- **Cache Avalanche**: Hàng triệu key hết hạn cùng 1 giây → Thêm **Jitter** (ngẫu nhiên ± 10–20% TTL).
- **Cache Penetration**: Query ID không hề tồn tại trong DB → Lưu cache giá trị rỗng (`NULL`) với TTL ngắn (60s) hoặc dùng **Bloom Filter**.

#### 💻 Distributed Lock với Lua Script an toàn
```typescript
// Giành khóa nguyên tử
const acquired = await redis.set('lock:product:101', token, 'NX', 'EX', 5);

// Giải phóng khóa CHỈ KHI đúng token sở hữu (chống xóa nhầm của request khác)
const releaseLua = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;
await redis.eval(releaseLua, 1, 'lock:product:101', token);
```

---

## 16. Queue / Async Processing

### Topic 16.1: Message Queue, Idempotent Consumer & Dead Letter Queue (DLQ)

#### 🎯 Interviewer đang test gì?
Hiểu cách thiết kế hệ thống decoupled, xử lý bất đồng bộ, tính chất At-least-once delivery, retry với exponential backoff, và cách gom các message lỗi vào DLQ để không làm tắc nghẽn queue.

#### ⚡ Trigger Keywords
```text
Producer → Queue (BullMQ / SQS) → Worker (Consumer) → Visibility Timeout → At-Least-Once Delivery → Idempotent Consumer → Exponential Backoff + Jitter → Dead Letter Queue (DLQ)
```

#### 🧠 5-Second Recall
Trong hệ thống phân tán, tin nhắn trong queue **luôn có thể bị xử lý trùng (duplicate)** do mạng timeout lúc worker ack. Do đó, Consumer bắt buộc phải mang tính **Idempotent** (ghi nhận message_id đã xử lý vào database). Khi worker lỗi, retry có số lần tối đa, quá ngưỡng thì đẩy vào **Dead Letter Queue (DLQ)** để kỹ sư phân tích mà không nghẽn luồng.

#### 💼 Kịch bản thực tế: Thanh toán thành công nhưng gửi Email thất bại
> *"Không bao giờ để logic gửi Email nằm chung trong cùng HTTP request của Payment. Khi Payment thành công, lưu bản ghi DB và bắn một event vào Queue (`orders.paid`). Worker lắng nghe queue để gửi email qua SendGrid/SES. Nếu dịch vụ email bên thứ 3 chết tạm thời, queue tự động retry với Exponential Backoff (10s, 30s, 2m, 10m). Nếu retry quá 5 lần vẫn fail, message trôi vào DLQ kèm theo alert PagerDuty."*

---

## 17. WebSocket & Realtime

### Topic 17.1: WebSocket Lifecycle, Reconnection & Scale ngang với Redis Adapter

#### 🎯 Interviewer đang test gì?
Hiểu sự khác biệt giữa HTTP Stateless với WebSocket Stateful. Kỹ năng scale Socket server khi có nhiều instance phía sau Load Balancer.

#### ⚡ Trigger Keywords
```text
HTTP 101 Switching Protocols → Full-Duplex TCP Socket → Heartbeat (Ping/Pong 30s) → Sticky Session / Redis Pub-Sub Adapter → Reconnection with Message History Buffer
```

#### 🧠 5-Second Recall
WebSocket giữ kết nối TCP sống (Stateful) trên 1 server cụ thể. Muốn Client A ở Server 1 chat được với Client B ở Server 2, bắt buộc phải dùng **Redis Pub/Sub Adapter** làm cầu nối đồng bộ tin nhắn qua các node.

#### 🔥 Follow-up: Khi mạng rớt rồi có lại thì làm sao không mất tin nhắn?
- Khi reconnect, client gửi kèm `last_received_message_id`.
- Server kiểm tra Redis Stream hoặc SQL query lấy các tin nhắn phát sinh từ sau ID đó và đồng bộ lại cho client (Sync Catch-up).

---

## 18. File Upload & S3

### Topic 18.1: Direct-to-S3 Upload với Presigned URL vs Streaming

#### 🎯 Interviewer đang test gì?
Hiểu cách xử lý file lớn (video, tài liệu 500MB) mà không làm nghẽn RAM và băng thông của API Server.

#### ⚡ Trigger Keywords
```text
Client request URL → API Server tạo AWS S3 Presigned PUT URL (TTL 5m) → Client PUT trực tiếp lên S3 → S3 Event Notification / Webhook gọi lại API Server lưu metadata
```

#### 🧠 5-Second Recall
Không bao giờ cho file đi qua backend server (`multipart/form-data`) nếu không cần xử lý ảnh ngay lập tức. Hãy để client xin **Presigned URL** từ backend (chỉ mất vài ms kiểm tra quyền), sau đó client upload trực tiếp dữ liệu nhị phân lên thẳng S3.

#### 🛡️ Bảo mật File Upload
1. **Chống MIME Spoofing**: Đừng chỉ tin đuôi file (`.jpg`). Đọc **Magic Bytes** (header byte nhị phân của file) để kiểm tra định dạng thật.
2. **Private Bucket**: Bucket S3 luôn phải để `Block Public Access`. Khi người dùng muốn xem file riêng tư, server cấp **Signed URL** hoặc CloudFront Signed Cookie có thời hạn 15 phút.

---

## 19. Testing & Quality Assurance

### Topic 19.1: Test Pyramid, Test Isolation & Tự động hóa E2E với Playwright

#### 🎯 Interviewer đang test gì?
Chiến lược kiểm thử phần mềm thực tế, phân biệt Mock vs Stub, cách tránh Flaky Test, và test luồng thanh toán / checkout thế nào cho an toàn.

#### ⚡ Trigger Keywords
```text
Test Pyramid (Nhiều Unit → Vừa Integration → Ít E2E) → Test Isolation (Database Rollback / Testcontainer) → Playwright UI Tests → Mock External Boundaries (Stripe, SES)
```

#### 🧠 5-Second Recall
- **Unit Test**: Test pure logic, helper, thuật toán tính toán thuế/giảm giá (nhanh, 0 network).
- **Integration Test**: Test API endpoint với Real Database thật (dùng Docker testcontainers hoặc isolated schema), mock các dịch vụ trả phí bên thứ 3 (Payment Gateway).
- **E2E Test**: Dùng Playwright kiểm tra các User Flow quan trọng nhất (Đăng ký → Thêm giỏ hàng → Thanh toán).

---

## 20. Docker & Linux Ops

### Topic 20.1: Multi-stage Dockerfile, Layer Caching & Linux Signals

#### 🎯 Interviewer đang test gì?
Khả năng đóng gói container production nhỏ gọn, tối ưu thời gian CI/CD build, và xử lý Graceful Shutdown khi nhận tín hiệu từ hệ điều hành.

#### ⚡ Trigger Keywords
```text
Multi-Stage Build (deps → builder → runner) → Layer Cache (copy package.json trước) → Non-root user → SIGTERM (Graceful shutdown) vs SIGKILL
```

#### 💻 Multi-stage Dockerfile chuẩn cho Next.js / Node.js
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm run build

# Stage 3: Runner (Production siêu nhẹ, an toàn)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
USER appuser
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

#### 🧠 5-Second Recall: SIGTERM vs SIGKILL
Khi container bị scale-down hoặc restart: Hệ điều hành gửi `SIGTERM` (cho ứng dụng 30 giây để hoàn thành các request đang chạy dở, đóng kết nối DB, ngắt poll queue). Nếu sau 30s ứng dụng vẫn chưa tắt, OS gửi `SIGKILL` (giết tiến trình ngay lập tức).

---

## 21. CI/CD Pipelines

### Topic 21.1: GitHub Actions, Blue-Green vs Canary & Safe Migrations

#### 🎯 Interviewer đang test gì?
Khả năng thiết kế quy trình release không downtime (Zero-Downtime Deployment), cách rollback an toàn khi phát hiện lỗi ở production.

#### ⚡ Trigger Keywords
```text
Lint & Test → Build Docker Image → Push ECR → Expand & Contract Pattern (Backward-compatible DB Migration) → Blue-Green / Canary Deploy → Smoke Test → Route Traffic
```

#### 🛡️ Nguyên tắc vàng: Safe Database Migrations (Expand & Contract)
Không bao giờ đổi tên cột (`RENAME COLUMN`) hoặc xóa cột (`DROP COLUMN`) trực tiếp trong cùng bản release của code mới!
- **Bước 1 (Expand)**: Thêm cột mới `full_name` (cho phép NULL), code mới ghi đồng thời vào cả `name` cũ và `full_name` mới.
- **Bước 2**: Chạy background script copy dữ liệu cũ sang cột mới.
- **Bước 3 (Contract)**: Chuyển code chỉ đọc/ghi cột mới.
- **Bước 4**: Release phiên bản sau mới chạy migration xóa cột cũ `name`.

---

## 22. AWS Cloud Architecture

### Topic 22.1: VPC, Public/Private Subnet, ALB, ECS Fargate & RDS Multi-AZ

#### 🎯 Interviewer đang test gì?
Hiểu kiến trúc mạng đám mây chuẩn mực của một ứng dụng Fullstack Product: Đảm bảo bảo mật nhiều lớp (Defense in Depth) và tính sẵn sàng cao (High Availability).

```text
User 
  → [Route 53 (DNS)] 
  → [CloudFront (CDN + WAF)] 
  → [Public Subnet: Application Load Balancer (ALB) + NAT Gateway] 
  → [Private Subnet: ECS Fargate Containers (Next.js / NestJS)] 
  → [Isolated DB Subnet: Amazon RDS PostgreSQL Multi-AZ + ElastiCache Redis]
```

#### 🧠 5-Second Recall
1. **RDS và Database không bao giờ đặt ở Public Subnet**: Chỉ đặt trong Isolated Subnet, Security Group chỉ cho phép duy nhất port 5432 từ Security Group của ECS Tasks.
2. **Private ECS làm sao tải package ra Internet?**: ECS gửi traffic qua **NAT Gateway** nằm ở Public Subnet; Internet bên ngoài không thể chủ động kết nối vào ECS.
3. **RDS Multi-AZ**: Tự động đồng bộ dữ liệu sang Availability Zone khác (Standby instance). Nếu AZ chính bị sập nguồn, AWS tự động chuyển DNS (failover) sang node phụ trong vòng 60–120 giây mà không mất dữ liệu.

---

## 23. System & Software Architecture (Production Caliber)

### Framework thiết kế 8 bước cho Senior Fullstack:
```text
Requirements (Clarify QPS / Data Size)
  → API Contract
  → Data Model & Indexing
  → Core Architecture Diagram
  → Concurrency & Race Conditions
  → Caching & Queue Buffering
  → Failure Modes & Resiliency
  → Trade-offs Analysis
```

### Thiết kế mẫu: E-Commerce Flash Sale & Inventory Reservation
- **Bài toán**: 10,000 người cùng bấm "Mua ngay" cho 100 chiếc iPhone trong 1 giây. Không được bán âm kho (Overselling), không được làm nghẽn DB.
- **Giải pháp chuẩn Senior / Production**:
  1. **Tầng Edge / Gateway**: Rate limit theo User IP (Token Bucket qua Redis WAF) để chặn spam bot.
  2. **Tầng Cache / In-Memory Reservation**: Giữ số lượng tồn kho trên Redis (`stock:iphone:101 = 100`). Khi user mua, chạy đoạn **Lua script** nguyên tử:
     ```lua
     local stock = tonumber(redis.call('get', KEYS[1]))
     if stock and stock >= 1 then
       redis.call('decr', KEYS[1])
       return 1
     else
       return 0
     end
     ```
  3. **Tầng Bất đồng bộ (Async Buffer)**: Nếu Redis Lua script trả về 1 (giành kho thành công), đẩy một event `order.create` vào Message Queue (BullMQ/SQS).
  4. **Tầng Worker Persistence**: Worker nhặt message tuần tự, mở ACID Transaction trong PostgreSQL để trừ tồn kho thực tế và tạo hóa đơn với `status = 'PENDING_PAYMENT'`.
  5. **Payment Timeout**: Cho user 15 phút thanh toán. Nếu sau 15 phút chưa trả tiền, worker quét và nạp trả lại tồn kho vào Redis (`INCR`).

---

## 24. Observability & Monitoring

### Topic 24.1: The 4 Golden Signals, OpenTelemetry & Correlation ID

#### 🎯 Interviewer đang test gì?
Hiểu cách quan sát sức khỏe hệ thống ở quy mô lớn, kỹ năng điều tra khi người dùng than phiền: *"Hôm nay web chậm quá em ơi!"*

#### ⚡ Trigger Keywords
```text
The 4 Golden Signals (Latency, Traffic, Errors, Saturation) → Correlation ID (X-Request-ID) → Distributed Tracing (OpenTelemetry / Jaeger) → APM Metrics & P99 Latency
```

#### 🧠 5-Second Recall
- **Latency**: Đo P95/P99 chứ không nhìn Average (Trung bình). P99 latency cao nghĩa là 1% người dùng quan trọng nhất đang chịu thời gian chờ tồi tệ.
- **Correlation ID (`x-request-id`)**: Sinh UUID duy nhất ở API Gateway, truyền qua mọi header HTTP và message queue xuống worker/DB. Khi có lỗi, chỉ cần search đúng 1 ID này trong Kibana/Loki là thấy toàn bộ hành trình của request.

#### 🔍 Điều tra thực tế: Users phản ánh Checkout chậm
> *"Tôi lần theo chuỗi: Client Network Waterfall → ALB Latency → API Handler Duration → DB Query Time. Sử dụng OpenTelemetry trace, tôi phát hiện request bị nghẽn 3 giây tại đoạn gọi synchronous sang bên thứ 3 (SMS OTP gateway) do bên đối tác bị chậm. Giải pháp: Chuyển sang async hoặc áp dụng Strict Timeout 1.5s kèm Circuit Breaker."*

---

## 25. Systematic Debugging ("I Don't Know — But I Know How to Debug")

### Framework phản xạ 8 bước khi gặp câu hỏi hóc búa:
```text
[1. Clarify Context] (Xảy ra với ai? Lúc nào? Mọi người hay một số?)
  → [2. Reproduce] (Môi trường local / staging có bị không?)
  → [3. Observe] (Xem HTTP status code, Server Logs, CPU/RAM metrics)
  → [4. Narrow Scope] (Phân lập: Lỗi ở Frontend, Network, Backend hay DB?)
  → [5. Form Hypothesis] (Giả thuyết nguyên nhân gốc rễ)
  → [6. Test Hypothesis] (Kiểm tra bằng cURL, EXPLAIN hoặc debug log)
  → [7. Implement Fix] (Sửa chữa dứt điểm)
  → [8. Regression Guard] (Viết Unit/Integration test ngăn lỗi lặp lại)
```

### Ma trận xử lý 6 sự cố kinh điển:
1. **API trả về HTTP 500 ngẫu nhiên**:
   - *Nguyên nhân thường gặp*: Unhandled Promise Rejection, Null Pointer Reference (`TypeError: Cannot read property of undefined`), hoặc Database Connection Pool bị kiệt.
   - *Hành động*: Kiểm tra log tập trung theo `correlation_id`, xem stack trace, tăng max pool size hoặc giải phóng connection bị rò rỉ.
2. **API thỉnh thoảng trả về HTTP 502 Bad Gateway**:
   - *Nguyên nhân thường gặp*: Node.js process bị crash (OOM Killer hoặc Uncaught Exception) khiến reverse proxy (Nginx/ALB) không nhận được phản hồi từ upstream; hoặc Node.js Event Loop bị block quá lâu dẫn đến ALB timeout.
   - *Hành động*: Xem log của tiến trình (PM2 / Docker logs / dmesg xem có dính `Out of memory: Kill process`), kiểm tra timeout của Nginx/ALB so với Node.js `keepAliveTimeout`.
3. **Database Query trước đây chạy nhanh, nay chậm đột biến**:
   - *Nguyên nhân thường gặp*: Bảng tăng trưởng từ vài ngàn lên vài triệu dòng, Query Planner chuyển từ Index Scan sang Seq Scan do số liệu thống kê (Statistics) bị lệch lạc, hoặc thiếu Composite Index.
   - *Hành động*: Chạy `EXPLAIN (ANALYZE, BUFFERS)`, kiểm tra xem có dính Index Bloat không, chạy `ANALYZE table_name;` và thêm partial/composite index.
4. **Bộ nhớ RAM của Node.js tăng dần đều theo thời gian (Memory Leak)**:
   - *Nguyên nhân thường gặp*: Toàn cục giữ mảng cache không có TTL (`global.cache = []`), Event Listener được đăng ký liên tục mà không có `removeListener`, hoặc closure giữ con trỏ DOM.
   - *Hành động*: Dùng cờ `--inspect`, chụp 2 Heap Snapshots cách nhau 30 phút bằng Chrome DevTools, dùng tính năng Comparison để tìm constructor nào có số lượng object tăng đột biến (Retained Size).
5. **WebSocket bị ngắt kết nối liên tục sau mỗi 60 giây**:
   - *Nguyên nhân thường gặp*: Load Balancer (AWS ALB hoặc Cloudflare) có idle timeout mặc định 60 giây. Nếu không có traffic, LB sẽ tự động đóng kết nối TCP.
   - *Hành động*: Cài đặt cơ chế **Heartbeat (Ping/Pong)** ở tầng ứng dụng: Cứ mỗi 25-30 giây client và server gửi 1 ping frame nhẹ để giữ kết nối sống.
6. **Người dùng bị trừ tiền 2 lần cho 1 đơn hàng**:
   - *Nguyên nhân thường gặp*: Client bị lag 3G, người dùng ấn nút thanh toán 2 lần; hoặc Gateway phản hồi chậm khiến frontend timeout rồi tự động retry khi backend chưa kịp commit DB.
   - *Hành động*: Áp dụng `Idempotency-Key` với Unique Index ở database, disable nút bấm ngay khi click đầu tiên, và dùng distributed lock ngắn trong Redis.

---

## 26. Rapid Fire Reflex Bank (Phản xạ 10–20 giây)

1. **Closure là gì?**  
   → Là hàm giữ tham chiếu tới lexical scope của hàm cha ngay cả khi hàm cha đã kết thúc thực thi.
2. **Tại sao cần `useCallback`?**  
   → Để giữ ổn định tham chiếu con trỏ hàm, ngăn component con bọc `React.memo` re-render vô ích.
3. **Điều gì kích hoạt React component re-render?**  
   → State nội tại thay đổi, Props nhận vào thay đổi, Context subscribed thay đổi, hoặc Component cha re-render.
4. **Hiện tượng N+1 trong SQL là gì?**  
   → 1 câu query lấy danh sách N dòng, sau đó chạy thêm N câu query phụ trong vòng lặp để lấy dữ liệu liên kết. Khắc phục bằng `JOIN` hoặc `WHERE id IN (...)`.
5. **Index B-Tree trong Database là gì?**  
   → Là cấu trúc cây tự cân bằng giúp tìm kiếm bản ghi theo độ phức tạp O(log N) thay vì quét toàn bảng O(N).
6. **ACID trong cơ sở dữ liệu là viết tắt của gì?**  
   → Atomicity (Nguyên tử), Consistency (Nhất quán), Isolation (Cô lập), Durability (Bền vững).
7. **Idempotency trong REST là gì?**  
   → Gọi 1 lần hay nhiều lần cùng một payload thì trạng thái dữ liệu trên hệ thống không đổi.
8. **Khác biệt cốt lõi giữa JWT và Session?**  
   → JWT là Stateless (dữ liệu mã hóa nằm trong token ở client, server verify bằng chữ ký), Session là Stateful (dữ liệu lưu ở Redis/DB của server, client chỉ giữ session ID).
9. **Tại sao nên lưu token trong HttpOnly Cookie thay vì localStorage?**  
   → Vì JavaScript không đọc được HttpOnly Cookie, triệt tiêu 100% rủi ro bị đánh cắp token qua lỗ hổng XSS.
10. **CORS là bảo vệ của Client hay Server?**  
    → Là hàng rào bảo mật của Browser dựa trên Same-Origin Policy; Server vẫn nhận và xử lý request bình thường.
11. **Redis dùng để làm gì tốt nhất?**  
    → Cache tốc độ cao (in-memory), Distributed Lock, Rate Limiting (Token Bucket), và Pub/Sub.
12. **Chuyện gì xảy ra nếu Redis bị sập?**  
    → Hệ thống phải có Circuit Breaker để fallback tạm xuống Database có giới hạn tải, không được để lỗi Redis làm chết sập toàn bộ API.
13. **Presigned URL của S3 là gì?**  
    → Là URL có chữ ký mật mã và thời hạn ngắn (vài phút) do server cấp cho client để upload/download file trực tiếp lên S3 mà không cần lộ AWS credentials.
14. **Khác biệt giữa Security Group và NACL trong AWS?**  
    → Security Group hoạt động ở tầng Instance (Stateful, chỉ cần mở Inbound), NACL hoạt động ở tầng Subnet (Stateless, phải mở cả Inbound và Outbound).
15. **Public Subnet khác Private Subnet thế nào trong AWS VPC?**  
    → Public Subnet có Route Table trỏ ra Internet Gateway (gắn IP Public), Private Subnet chỉ đi ra Internet thông qua NAT Gateway nằm ở Public Subnet.
16. **Dead Letter Queue (DLQ) dùng để làm gì?**  
    → Là hàng đợi chứa các message lỗi đã retry hết số lần cho phép, giúp cách ly lỗi để kỹ sư điều tra mà không làm nghẽn luồng xử lý chính.
17. **Eventual Consistency là gì?**  
    → Dữ liệu giữa các node/dịch vụ có thể tạm thời lệch nhau trong một khoảng thời gian ngắn, nhưng cuối cùng sẽ đạt được trạng thái đồng nhất.
18. **Optimistic Locking khác Pessimistic Locking thế nào?**  
    → Optimistic Locking dùng cột version/timestamp (không khóa bảng, chỉ kiểm tra lúc UPDATE), Pessimistic Locking dùng `SELECT FOR UPDATE` để khóa chặt dòng từ lúc đọc đến khi commit.
19. **Race condition xảy ra khi nào?**  
    → Khi nhiều tiến trình hoặc luồng cùng truy cập và chỉnh sửa một tài nguyên chia sẻ mà kết quả phụ thuộc vào thứ tự thực thi không xác định.
20. **Core Web Vitals gồm 3 chỉ số nào?**  
    → LCP (Largest Contentful Paint - Tốc độ tải nội dung chính), INP (Interaction to Next Paint - Độ nhạy tương tác), CLS (Cumulative Layout Shift - Độ ổn định hình ảnh).

---

## 27. Scenario Questions & Production Failure Cases

### Kịch bản 1: Payment đã trừ tiền ở Stripe nhưng webhook gửi email xác nhận thất bại
- **Triệu chứng**: Khách hàng bị trừ $100 trên thẻ tín dụng nhưng không nhận được vé/hóa đơn, khiếu nại CSKH.
- **Phân tích nguyên nhân**: Kiến trúc ghép chung việc ghi nhận đơn hàng với việc gửi email đồng bộ trong cùng 1 handler. Khi SendGrid gặp sự cố hoặc timeout, toàn bộ handler bị fail hoặc email bị nuốt mất mà không có cơ chế bù trừ.
- **Giải pháp chuẩn Senior / Production**:
  1. Tách rời (Decouple) bằng **Transactional Outbox Pattern**: Trong cùng transaction trừ tiền và tạo đơn hàng ở DB, ghi thêm 1 dòng event vào bảng `outbox_events` (`event_type: 'ORDER_CONFIRMED', payload: {...}`).
  2. Background Worker hoặc CDC (Change Data Capture) đọc bảng outbox và đẩy vào SQS/BullMQ.
  3. Worker gửi email lắng nghe queue, có retry với Exponential Backoff (10s, 30s, 2m, 10m). Nếu quá 5 lần vẫn fail thì đẩy vào Dead Letter Queue (DLQ) để CSKH xử lý thủ công.

### Kịch bản 2: Bản build CI/CD vượt qua toàn bộ Test nhưng lên Production bị sập trắng trang
- **Triệu chứng**: Pipeline GitHub Actions xanh toàn bộ, nhưng khi deploy lên ECS/Vercel thì toàn bộ người dùng nhận màn hình trắng hoặc HTTP 500.
- **Phân tích nguyên nhân**:
  1. Môi trường CI/CD dùng mock database hoặc SQLite in-memory, trong khi Production chạy PostgreSQL thật với Strict SQL Mode.
  2. Biến môi trường (Environment Variables) mới bị thiếu trên Production (chưa add vào AWS Secrets Manager).
  3. Client Component trong Next.js import một dependency Node.js native (`fs` hoặc `crypto`).
- **Giải pháp chuẩn Senior / Production**:
  1. **Rollback tức thì**: Chuyển traffic về phiên bản container cũ (Blue-Green hoặc Rollback commit trước đó) trong vòng 60 giây.
  2. **Kiểm tra Health Check & Smoke Test**: Bổ sung bước Synthetic E2E Test (Playwright) chạy trực tiếp trên URL Staging thật trước khi promote lên Production.
  3. **Runtime Config Validation**: Sử dụng `t3-env` hoặc Zod để validate toàn bộ biến môi trường ngay lúc khởi động (startup time); nếu thiếu biến môi trường, tiến trình crash ngay lập tức kèm thông báo rõ ràng thay vì fail âm thầm ở runtime.

### Kịch bản 3: Cơ sở dữ liệu báo lỗi "FATAL: remaining connection slots are reserved for non-replicated superuser connections"
- **Triệu chứng**: Mọi API bỗng nhiên trả về lỗi kết nối DB, CPU của DB không cao nhưng không nhận thêm request mới.
- **Phân tích nguyên nhân**: Cạn kiệt Connection Pool của PostgreSQL (mặc định `max_connections = 100`). Xảy ra khi:
  1. Serverless Lambda hoặc ECS scale lên 50 tasks, mỗi task mở pool 10 connection → Vượt quá giới hạn của RDS.
  2. Code bị rò rỉ connection: Lấy connection từ pool nhưng trong block `catch` không có `finally { client.release() }`.
- **Giải pháp chuẩn Senior / Production**:
  1. Đặt **AWS RDS Proxy** hoặc **PgBouncer** ở giữa ứng dụng và RDS để tái sử dụng và chia sẻ connection pool (Connection Pooling Layer).
  2. Bắt buộc mọi thao tác query phải dùng ORM/Query Builder có cơ chế tự động giải phóng connection (như Prisma, Drizzle, TypeORM).

---

## 28. Mixed Mock Interview Question Bank

### Tầng 1: Easy & Fundamentals (Phản xạ tức thì)
1. Giải thích sự khác biệt giữa `==` và `===` trong JavaScript?
2. Tại sao `typeof null` lại trả về `'object'`?
3. Sự khác nhau giữa `null` và `undefined`?
4. Arrow function khác hàm truyền thống ở những điểm nào (về `this`, `arguments`, `prototype`)?
5. Destructuring và Spread Operator hoạt động theo cơ chế Shallow copy hay Deep copy?
6. Tại sao không nên sửa đổi trực tiếp (mutate) state trong React?
7. Virtual DOM trong React giải quyết bài toán gì?
8. Tại sao React component phải có duy nhất một thẻ cha (hoặc `<React.Fragment>`)?
9. Thuộc tính `key` trong mảng phần tử của React có vai trò gì?
10. Phân biệt `localStorage`, `sessionStorage` và `cookie`?
11. Trình duyệt gửi cookie lên server theo cơ chế nào?
12. Mã trạng thái HTTP 301 khác 302 ở điểm nào?
13. Mã trạng thái HTTP 401 Unauthorized khác 403 Forbidden ra sao?
14. Phân biệt `GET` và `POST` theo chuẩn HTTP?
15. Khóa chính (Primary Key) và Khóa ngoại (Foreign Key) là gì?
16. Bảng băm (Hash Map) có độ phức tạp tìm kiếm là bao nhiêu?
17. Phân biệt `process.nextTick` và `setImmediate` trong Node.js?
18. Docker Image khác Docker Container ở điểm nào?
19. Lệnh `git merge` khác `git rebase` ra sao?
20. Tại sao cần file `.dockerignore`?

### Tầng 2: Medium (Hiểu sâu cơ chế)
21. Phân biệt `Promise.all`, `Promise.allSettled`, `Promise.race` và `Promise.any`?
22. Event Bubbling và Event Capturing diễn ra theo thứ tự nào? Khi nào dùng `event.stopPropagation()` và `event.preventDefault()`?
23. Tại sao gọi `setState` trong React là bất đồng bộ?
24. Stale Closure trong `useEffect` xảy ra như thế nào và cách giải quyết?
25. Khi nào nên dùng `useRef` thay vì `useState`?
26. Phân biệt `type` và `interface` trong TypeScript, khi nào bắt buộc dùng `type`?
27. Discriminated Union trong TypeScript giúp tối ưu code thế nào?
28. TanStack Query (React Query) giúp giảm tải server bằng cơ chế Stale-While-Revalidate ra sao?
29. Stream và Buffer trong Node.js giải quyết bài toán gì khi xử lý file dung lượng lớn?
30. Middleware khác Guard và Interceptor trong NestJS ở những điểm nào?
31. Nguyên lý Dependency Injection (DI) và Inversion of Control (IoC) trong NestJS mang lại lợi ích gì?
32. Khác biệt giữa Offset Pagination (`OFFSET 100000 LIMIT 20`) và Cursor-based Pagination?
33. Sự khác nhau giữa `INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN` và `FULL OUTER JOIN`?
34. Transaction trong SQL đảm bảo tính chất ACID như thế nào?
35. Deadlock trong Database là gì và cách phòng tránh?
36. Cache-Aside Pattern hoạt động thế nào giữa API, Cache và Database?
37. Phân biệt giữa Cache Stampede, Cache Avalanche và Cache Penetration?
38. Tại sao cần cơ chế Heartbeat (Ping/Pong) cho kết nối WebSocket?
39. Multi-stage Dockerfile giúp giảm dung lượng image thế nào?
40. Kiểm thử tích hợp (Integration Test) khác Unit Test ở điểm mấu chốt nào?

### Tầng 3: Senior / Production Engineer (Hệ thống, Concurrency & Trade-offs)
41. Trình bày chi tiết cơ chế Server Components (RSC) trong Next.js App Router và sự khác biệt với SSR truyền thống?
42. Làm thế nào để truyền dữ liệu và tương tác giữa Server Component và Client Component mà không vi phạm quy tắc Serialization?
43. Trình bày cơ chế hoạt động của Refresh Token Rotation (RTR) và cách phát hiện token bị đánh cắp bằng Token Family?
44. Thiết kế cơ chế Idempotency cho API thanh toán bằng HTTP Header `Idempotency-Key` kết hợp PostgreSQL Unique Index?
45. Phân tích cơ chế hoạt động của B-Tree Index trong PostgreSQL và cách đọc hiểu kết quả `EXPLAIN (ANALYZE, BUFFERS)`?
46. Hiện tượng N+1 query xảy ra thế nào trong ORM (Prisma/TypeORM) và 3 cách khắc phục triệt để?
47. Làm thế nào để giành Distributed Lock an toàn trong Redis bằng `SET NX EX` và tại sao giải phóng lock phải dùng Lua script?
48. Thiết kế kiến trúc upload file dung lượng 2GB lên Amazon S3 trực tiếp từ trình duyệt mà không làm tốn RAM/băng thông của backend server?
49. Phân biệt giữa At-Least-Once Delivery và Exactly-Once Processing trong hệ thống Message Queue? Làm sao đảm bảo Consumer xử lý không bị trùng lặp?
50. Thiết kế kiến trúc AWS chuẩn cho một ứng dụng Fullstack (Next.js + NestJS + PostgreSQL + Redis): Phân tách VPC, Public/Private Subnet, ALB, ECS Fargate và Security Groups?

---

## 29. Spaced Repetition (Lộ trình ôn luyện chống quên)

Hệ thống ghi nhớ ngắt quãng (Spaced Repetition Schedule) thiết kế riêng để biến kiến thức bị động thành phản xạ chủ động:

```text
[Day 0: Ngay sau khi đọc] → Tự giải thích to thành lời (Feynman Technique) không nhìn tài liệu
[Day 1: Sau 24 giờ]       → Trả lời 5 câu hỏi Rapid Fire (15s/câu)
[Day 3: Sau 72 giờ]       → Giải quyết 2 kịch bản sự cố Production (Scenario Failure)
[Day 7: Sau 1 tuần]       → Vẽ lại sơ đồ kiến trúc (AWS / Database Index / RSC) từ trí nhớ
[Day 14: Sau 2 tuần]      → Mock Interview thực tế với đồng nghiệp hoặc AI Speech Coach (30 phút)
[Day 30: Sau 1 tháng]     → Phỏng vấn tổng hợp ngẫu nhiên đa lĩnh vực (Mixed Mock Interview)
```

### Bộ câu hỏi ôn tập theo chu kỳ:
- **Chu kỳ Day 1**:
  1. *Hỏi*: Tại sao `useCallback` chỉ có tác dụng khi kết hợp với `React.memo`?
  2. *Hỏi*: Event Loop ưu tiên Microtask hay Macrotask trước? Kể tên 2 microtask phổ biến?
  3. *Hỏi*: Tại sao lưu JWT vào `localStorage` lại nguy hiểm hơn `HttpOnly Cookie`?
- **Chu kỳ Day 3**:
  1. *Kịch bản*: Khách hàng ấn nút "Đặt hàng" 3 lần liên tiếp do mạng lag. Thiết kế backend xử lý thế nào để chỉ tạo đúng 1 đơn hàng?
  2. *Kịch bản*: Query SQL bỗng nhiên chậm từ 20ms lên 5s sau khi bảng đạt 5 triệu dòng. Nêu quy trình 4 bước kiểm tra và tối ưu?
- **Chu kỳ Day 7**:
  1. Vẽ luồng request từ Browser → Route 53 → CloudFront → ALB → ECS Task → RDS Multi-AZ.
  2. Vẽ cây Fiber và giải thích tại sao Render phase ngắt quãng được còn Commit phase thì không?
- **Chu kỳ Day 30**:
  - Bốc ngẫu nhiên 10 câu hỏi trong phần 28 để trả lời bấm giờ 60 giây/câu.

---

# FINAL SECTION: PERSONAL GAP MAP

## Personal Production Fullstack Gap Map

Hãy tự đánh giá mức độ tự tin của bạn trên 29 lĩnh vực cốt lõi theo 4 mức độ:
- 🔴 **Must Learn**: Chưa nắm rõ bản chất, dễ bị lúng túng khi interviewer hỏi sâu.
- 🟠 **Weak / Need Practice**: Hiểu lý thuyết nhưng chưa có phản xạ nói mượt mà trong 15 giây.
- 🟡 **Know but Need Recall**: Đã làm qua nhưng lâu ngày chưa đụng, cần ôn lại trigger keywords.
- 🟢 **Interview Ready**: Phản xạ tự nhiên, nói trôi chảy từ bản chất đến trade-offs và kịch bản lỗi.

| STT | Lĩnh vực kiến thức (Domain) | Tự đánh giá ban đầu | Mục tiêu sau 30 ngày |
|---|---|:---:|:---:|
| 01 | JavaScript Fundamentals (Event Loop, Closures, Memory) | 🟡 | 🟢 |
| 02 | Browser & Web Platform (Reflow/Repaint, CORS, Storage) | 🟡 | 🟢 |
| 03 | React Fundamentals (Fiber, Reconciliation, Key Identity) | 🟡 | 🟢 |
| 04 | React Hooks (`useCallback`, `useMemo`, Stale Closure) | 🟠 | 🟢 |
| 05 | React Advanced (Suspense, Streaming SSR, Transitions) | 🟠 | 🟢 |
| 06 | Next.js App Router (RSC vs Client, SSR/SSG/ISR) | 🟠 | 🟢 |
| 07 | Frontend State & Data (TanStack Query, Optimistic UI) | 🟡 | 🟢 |
| 08 | Frontend Performance (DevTools Profiler, Core Web Vitals) | 🟠 | 🟢 |
| 09 | TypeScript Deep Dive (Generics, Discriminated Unions, Zod) | 🟡 | 🟢 |
| 10 | Node.js Internals (libuv, Streams, Memory Leak) | 🟠 | 🟢 |
| 11 | NestJS Architecture (Guards, Interceptors, Pipes, DI) | 🟡 | 🟢 |
| 12 | API Design & Protocols (Idempotency, REST, Pagination) | 🟠 | 🟢 |
| 13 | Authentication & Security (JWT RTR, HttpOnly, CSRF/XSS) | 🟠 | 🟢 |
| 14 | PostgreSQL / SQL (B-Tree, EXPLAIN ANALYZE, ACID, N+1) | 🟠 | 🟢 |
| 15 | Redis & In-Memory (Cache-Aside, Stampede, Redlock) | 🔴 | 🟢 |
| 16 | Queues & Async (Idempotent Consumer, DLQ, Backoff) | 🔴 | 🟢 |
| 17 | WebSocket & Realtime (Lifecycle, Redis Adapter Scale) | 🟠 | 🟢 |
| 18 | File Upload & Storage (Direct S3 Presigned URL) | 🟡 | 🟢 |
| 19 | Testing & QA (Playwright, Test Isolation, Mocking) | 🟡 | 🟢 |
| 20 | Docker & Linux (Multi-stage, Signals, SIGTERM) | 🟡 | 🟢 |
| 21 | CI/CD Pipelines (GitHub Actions, Expand-Contract Migration) | 🟠 | 🟢 |
| 22 | AWS Cloud Architecture (VPC, ALB, ECS, RDS Multi-AZ) | 🔴 | 🟢 |
| 23 | System Design (Flash sale inventory, E-commerce, Chat) | 🔴 | 🟢 |
| 24 | Observability (OpenTelemetry, Correlation ID, P99) | 🟠 | 🟢 |
| 25 | Systematic Debugging ("I don't know but here is how I debug") | 🟠 | 🟢 |
| 26 | Rapid Fire Reflex Bank (Phản xạ 15 giây) | 🟠 | 🟢 |
| 27 | Production Scenarios & Failure Handling | 🟠 | 🟢 |
| 28 | Mixed Mock Interview | 🟠 | 🟢 |
| 29 | Spaced Repetition Discipline | 🟡 | 🟢 |

---

## 30-Day Active Recall Training Program

Mỗi ngày dành đúng **60 phút** theo kỷ luật 4 bước bất biến:
- **10 phút**: *Rapid Recall* (Lật 5 flashcard kiểm tra 5-second mental model).
- **20 phút**: *Deep Topic* (Nghiên cứu sâu 1 chủ đề: cơ chế bên dưới + trade-offs).
- **20 phút**: *Scenario & Failure Analysis* (Giải 1 bài toán sự cố production liên quan).
- **10 phút**: *Explain Out Loud* (Đứng dậy, bật ghi âm điện thoại, nói câu trả lời 30 giây như đang ngồi đối diện interviewer).

### Lịch trình 4 tuần tăng tốc:
- **Tuần 1 (Ngày 1 → 7): Nền tảng Frontend & Ngôn ngữ**
  - D1: JS Event Loop, Microtask & Execution prediction.
  - D2: Closures, Lexical Environment, Memory Leaks.
  - D3: Browser Critical Rendering Path & CORS.
  - D4: React Fiber & Reconciliation Algorithm.
  - D5: `useCallback`, `useMemo` & Referential Equality.
  - D6: Next.js Server Components vs Client Components.
  - D7: TypeScript Generics & Discriminated Unions + Review Tuần 1.
- **Tuần 2 (Ngày 8 → 14): Backend, Framework & API Design**
  - D8: Node.js libuv & Event Loop 6 Phases.
  - D9: NestJS Lifecycle: Middleware → Guard → Interceptor → Pipe → Filter.
  - D10: REST API Design & Cursor Pagination.
  - D11: Idempotency Keys trong thanh toán & Race Conditions.
  - D12: Authentication: JWT vs Session, Refresh Token Rotation.
  - D13: Web Security: CSRF, XSS, HttpOnly Cookie, CORS.
  - D14: Tổng hợp kiến trúc Backend + Mock Interview 30 phút.
- **Tuần 3 (Ngày 15 → 21): Data, Cache, Queue & Hạ tầng Cloud**
  - D15: PostgreSQL B-Tree Index & `EXPLAIN (ANALYZE, BUFFERS)`.
  - D16: Database Transactions, ACID, MVCC & Deadlocks.
  - D17: Redis Cache-Aside, Cache Stampede & Distributed Lock (Lua).
  - D18: Message Queue: BullMQ, Idempotent Consumer & DLQ.
  - D19: WebSocket Architecture & Horizontal Scaling với Redis Pub/Sub.
  - D20: S3 Direct Upload với Presigned URLs.
  - D21: AWS VPC, Public/Private Subnet, ALB & ECS Fargate.
- **Tuần 4 (Ngày 22 → 30): System Design, Debugging & Phỏng vấn tổng hợp**
  - D22: Docker Multi-stage & Linux Process Signals (SIGTERM).
  - D23: CI/CD Pipeline & Expand-Contract Database Migrations.
  - D24: System Design: Flash Sale Inventory Reservation.
  - D25: System Design: Realtime Chat Application.
  - D26: Observability: OpenTelemetry, Correlation ID & P99 Latency.
  - D27: Systematic Debugging ("I don't know but here is how I debug").
  - D28: Mixed Mock Interview: 20 câu hỏi ngẫu nhiên không báo trước.
  - D29: Rapid Fire Blitzkrieg: 50 câu hỏi phản xạ 15 giây.
  - D30: Final Readiness Assessment & Tự tin bước vào phòng phỏng vấn!


