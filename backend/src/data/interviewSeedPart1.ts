import { InterviewTopicEntity } from '../types/interviewTypes.js';

export const SEED_TOPICS_PART1: InterviewTopicEntity[] = [
  // ==========================================
  // DOMAIN 1: JAVASCRIPT FUNDAMENTALS
  // ==========================================
  {
    id: 'topic-js-event-loop',
    domain_id: 'domain-01-js-fundamentals',
    domain_title: 'Domain 1 — JavaScript Fundamentals',
    title: 'Event Loop, Microtasks vs Macrotasks',
    target_intent: 'Kiểm tra xem ứng viên có hiểu cách V8/JS runtime thực thi bất đồng bộ đơn luồng (single-threaded) và thứ tự ưu tiên của call stack, microtasks và macrotasks.',
    trigger_keywords: ['Single-threaded', 'Call Stack', 'Web APIs', 'Microtask Queue', 'Macrotask Queue', 'Event Loop Tick'],
    recall_5s: 'Call stack chạy đồng bộ trước. Khi stack rỗng, Event Loop vét sạch toàn bộ Microtasks (Promise, queueMicrotask) trước khi lấy đúng 1 Macrotask (setTimeout, setInterval) ra chạy.',
    interview_answer: 'JavaScript là ngôn ngữ đơn luồng với một Call Stack duy nhất. Khi gặp tác vụ bất đồng bộ như Promise hay setTimeout, nó đẩy sang Web API. Khi hoàn thành, callback được xếp vào 2 hàng đợi: Microtask Queue (Promises, queueMicrotask, MutationObserver) và Macrotask Queue (setTimeout, setInterval, setImmediate, I/O). Trong mỗi vòng lặp Event Loop, sau khi Call Stack thực thi xong đoạn code đồng bộ, engine sẽ vét cạn TẤT CẢ các microtasks cho tới khi hàng đợi rỗng, rồi mới lấy duy nhất một macrotask tiếp theo ra chạy, sau đó lặp lại chu kỳ.',
    deep_dive: 'Nếu một microtask liên tục sinh ra microtask mới (đệ quy microtask), Call Stack và Event Loop sẽ bị nghẽn hoàn toàn (starvation), khiến trình duyệt đơ và không bao giờ render lại được frame hình hay thực thi macrotask tiếp theo.',
    practical_example: {
      title: 'Đoán thứ tự Output Event Loop',
      code: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => {
  console.log('3');
  queueMicrotask(() => console.log('4'));
});
console.log('5');
// Thứ tự in: 1 -> 5 -> 3 -> 4 -> 2`,
      scenario: 'Đồng bộ (1, 5) -> Microtasks (3, rồi 4 vừa thêm vào microtask queue) -> Macrotask (2).'
    },
    trade_offs: {
      when_use: 'Dùng queueMicrotask() khi muốn hoãn một logic chạy ngay sau khi stack hiện tại rỗng nhưng TRƯỚC KHI trình duyệt repaint hoặc macrotask chạy.',
      when_not_use: 'Không dùng microtask cho các tác vụ nặng CPU vì sẽ block giao diện; nên dùng Web Worker.',
      pros: ['Đảm bảo tính tuần tự không cần multi-thread lock', 'Hiệu năng cao cho I/O không khóa'],
      cons: ['Dễ gây freeze UI nếu dính microtask loop', 'Không tận dụng được đa lõi CPU trực tiếp'],
      alternatives: ['Web Workers cho tính toán song song', 'requestAnimationFrame cho tác vụ đồ họa']
    },
    follow_ups: [
      {
        question: 'requestAnimationFrame nằm ở bước nào trong Event Loop?',
        answer_skeleton: 'Nó chạy ngay trước bước Render/Paint của trình duyệt, sau khi giải quyết xong microtasks và trước khi màn hình vẽ lại frame mới (thường 60fps / 16.6ms).'
      },
      {
        question: 'async/await bản chất hoạt động thế nào trong Event Loop?',
        answer_skeleton: 'Nó chỉ là syntactic sugar bọc Generator và Promise. Dòng code ngay sau từ khóa await sẽ được chuyển thành một microtask callback trong .then().'
      }
    ],
    common_traps: [
      'Nghĩ rằng setTimeout(fn, 0) sẽ chạy ngay lập tức; thực tế nó phải đợi xong toàn bộ microtasks.',
      'Lầm tưởng Promise executor `new Promise((resolve) => { ... })` chạy bất đồng bộ (nó chạy đồng bộ ngay lập tức!).'
    ],
    active_recall: [
      'Thứ tự ưu tiên giữa Promise.then và setTimeout(fn, 0) là gì và tại sao?',
      'Chuyện gì xảy ra với trình duyệt nếu một Promise liên tục gọi queueMicrotask đệ quy?'
    ],
    layers: {
      l1_junior: 'Event Loop giúp JavaScript chạy bất đồng bộ dù chỉ có một luồng thực thi duy nhất.',
      l2_middle: 'Call Stack rỗng -> Xử lý hết Microtask Queue (Promise) -> Xử lý 1 Macrotask (setTimeout) -> Render UI -> Lặp lại.',
      l3_senior: 'Ở mức 3 YoE, cần kiểm soát microtask starvation, tối ưu hóa starvation trong batching của React 18, và biết khi nào nên điều phối qua postMessage, MessageChannel hay requestIdleCallback.'
    },
    why_ladder: [
      { question: 'Tại sao JS cần Event Loop?', answer: 'Vì JS đơn luồng, nếu tác vụ I/O chạy đồng bộ sẽ làm đóng băng toàn bộ ứng dụng.' },
      { question: 'Tại sao chia ra Microtask và Macrotask?', answer: 'Để ưu tiên xử lý các kết quả bất đồng bộ nội tại (Promise) ngay lập tức trước khi nhường luồng cho I/O ngoài.' },
      { question: 'Tại sao Microtask lại được ưu tiên vét cạn?', answer: 'Để đảm bảo tính nhất quán dữ liệu trạng thái nhanh nhất có thể trước khi render frame.' }
    ],
    code_reaction: {
      code: `console.log('A');
new Promise((resolve) => {
  console.log('B');
  resolve('C');
}).then((res) => console.log(res));
console.log('D');`,
      question: 'Thứ tự in ra console là gì và tại sao?',
      explanation: 'In A -> B -> D -> C. Executor của Promise chạy đồng bộ ngay lập tức khi khởi tạo, nên B in trước D. Sau đó D in xong, Call Stack rỗng, microtask .then() mới in C.',
      fix: 'Nếu muốn B chạy bất đồng bộ, phải đưa logic vào setTimeout hoặc hàm async có await.'
    }
  },
  {
    id: 'topic-js-closures-memory',
    domain_id: 'domain-01-js-fundamentals',
    domain_title: 'Domain 1 — JavaScript Fundamentals',
    title: 'Closures, Lexical Scope & Memory Leaks',
    target_intent: 'Đánh giá hiểu biết sâu về Execution Context, Lexical Environment, cách hàm lưu giữ tham chiếu và rủi ro rò rỉ bộ nhớ (memory leaks) trong thực tế.',
    trigger_keywords: ['Closure', 'Lexical Scope', 'Garbage Collection', 'Reference Retention', 'Memory Leak', 'Stale Closure'],
    recall_5s: 'Closure là một hàm có khả năng "nhớ" và truy cập các biến trong phạm vi từ vựng (lexical scope) của nơi nó được sinh ra, ngay cả khi hàm cha đã kết thúc thực thi.',
    interview_answer: 'Closure hình thành khi một hàm con truy cập các biến từ hàm cha bao bọc nó. Trong JavaScript engine, mỗi khi hàm chạy, một Lexical Environment được tạo ra. Nếu hàm con vẫn còn tham chiếu tồn tại (ví dụ được trả về, gán cho biến toàn cục, hoặc làm event listener), Garbage Collector (GC) sẽ không thể thu hồi các biến trong Lexical Environment cha, cho phép hàm con tiếp tục truy cập chúng. Ứng dụng thực tế là data privacy/encapsulation, currying, và hooks trong React. Tuy nhiên, nếu closure giữ tham chiếu đến các object lớn mà không được giải phóng, nó sẽ gây Memory Leak.',
    deep_dive: 'V8 tối ưu hóa closure bằng cách chỉ giữ lại những biến thực sự được hàm con đọc (Context allocation). Tuy nhiên, nếu trong cùng một scope có 2 closure, một closure đọc object lớn và một closure được gắn vào window/DOM, V8 có thể dùng chung Scope Context và vô tình giữ lại cả object lớn đó trong RAM.',
    practical_example: {
      title: 'Memory Leak do Closure giữ tham chiếu DOM/Object',
      code: `function attachHandler() {
  const hugeData = new Array(1000000).fill('leak'); // 8MB RAM
  const el = document.getElementById('btn');
  el.addEventListener('click', () => {
    // Closure giữ tham chiếu tới hugeData dù không cần
    console.log(el.id);
  });
}
// Sửa: Giải phóng biến hoặc chỉ giữ đúng dữ liệu cần thiết`,
      scenario: 'Component unmount nhưng event listener chưa removeEventListener khiến hugeData không bao giờ bị GC thu dọn.'
    },
    trade_offs: {
      when_use: 'Khi cần tạo biến private, module pattern, memoization function, hoặc custom React hooks.',
      when_not_use: 'Khi tạo quá nhiều hàm trong vòng lặp lớn mà không cần thiết, gây áp lực lên Garbage Collector.',
      pros: ['Đóng gói dữ liệu an toàn không ô nhiễm global', 'Tạo ra các hàm có trạng thái bền vững'],
      cons: ['Tốn RAM vì biến không bị GC thu dọn ngay', 'Nguy cơ Stale Closure trong React effects'],
      alternatives: ['WeakMap / Private Class Fields (#privateField)', 'State stores ngoài']
    },
    follow_ups: [
      {
        question: 'Làm sao phát hiện Memory Leak do Closure trong Chrome DevTools?',
        answer_skeleton: 'Dùng tab Memory -> Chụp Heap Snapshot trước và sau khi thao tác, lọc theo "Detached HTMLElement" hoặc so sánh delta giữa 2 snapshot.'
      }
    ],
    common_traps: [
      'Nghĩ rằng biến trong hàm cha luôn bị xóa khi hàm cha return.',
      'Quên remove event listener hoặc clear setInterval khiến closure giữ biến vĩnh viễn.'
    ],
    active_recall: [
      'Điều kiện gì khiến Garbage Collector không thể thu hồi một biến cục bộ sau khi hàm kết thúc?',
      'Stale closure trong React useEffect xảy ra do cơ chế nào của JavaScript?'
    ],
    layers: {
      l1_junior: 'Closure là hàm có thể truy cập biến của hàm cha bên ngoài nó.',
      l2_middle: 'Hàm con giữ một con trỏ tới Lexical Environment của cha, ngăn Garbage Collector dọn dẹp biến đó.',
      l3_senior: 'Ở mức 3 YoE, cần kiểm soát retention path trong V8 heap snapshot, tối ưu allocation scope context và xử lý stale closure trong functional programming.'
    },
    why_ladder: [
      { question: 'Tại sao JS có Closure?', answer: 'Vì JS hỗ trợ First-Class Functions (hàm có thể truyền đi như một giá trị).' },
      { question: 'Tại sao biến không bị xóa khi hàm cha kết thúc?', answer: 'Vì hàm con còn sống vẫn giữ tham chiếu tới Lexical Environment cha.' },
      { question: 'Tại sao điều đó có thể gây nguy hiểm?', answer: 'Nếu giữ tham chiếu tới DOM node hoặc dữ liệu lớn, RAM sẽ tăng liên tục không giải phóng được.' }
    ],
    code_reaction: {
      code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}`,
      question: 'Đoạn code trên in ra gì và sửa thế nào bằng closure/let?',
      explanation: 'In ra 3, 3, 3 vì var có function scope, cả 3 callback đều trỏ tới cùng 1 biến i sau khi loop đã chạy xong i=3.',
      fix: 'Đổi `var i` thành `let i` (block scope tạo closure mới cho mỗi vòng lặp), hoặc dùng IIFE `((idx) => setTimeout(...))(i)`.'
    }
  },

  // ==========================================
  // DOMAIN 2: BROWSER & WEB PLATFORM
  // ==========================================
  {
    id: 'topic-browser-rendering-pipeline',
    domain_id: 'domain-02-browser-platform',
    domain_title: 'Domain 2 — Browser & Web Platform',
    title: 'Rendering Pipeline, Reflow (Layout) & Repaint',
    target_intent: 'Đánh giá khả năng tối ưu hóa UI mượt mà (60fps/120fps), hiểu rõ chi phí tính toán khi DOM thay đổi và cách tránh giật lag (Jank).',
    trigger_keywords: ['DOM Tree', 'CSSOM', 'Render Tree', 'Layout / Reflow', 'Paint', 'Compositing', 'GPU Acceleration'],
    recall_5s: 'Trình duyệt render theo chuỗi: DOM + CSSOM → Render Tree → Layout (tính kích thước/vị trí) → Paint (tô màu/pixel) → Composite (ghép layer GPU). Reflow luôn kéo theo Repaint và tốn kém nhất.',
    interview_answer: 'Trình duyệt chuyển đổi HTML/CSS thành pixel qua 5 bước: (1) Parse DOM và CSSOM, (2) Kết hợp thành Render Tree (bỏ qua display: none), (3) Layout / Reflow để tính toán tọa độ và kích thước chính xác của từng element, (4) Paint để vẽ text, màu nền, viền thành các bitmap layer, và (5) Compositing trên GPU để ghép các layer lại hiển thị lên màn hình. Reflow là bước tốn kém nhất vì nó tính toán lại hình học không gian và có thể lan truyền (cascade) ra toàn bộ trang. Muốn tối ưu, ta ưu tiên animate các thuộc tính chỉ kích hoạt Composite như transform và opacity.',
    deep_dive: 'Hiện tượng Layout Thrashing xảy ra khi code JavaScript đọc thuộc tính layout (như offsetTop, offsetWidth, getBoundingClientRect) xen kẽ với việc ghi DOM (như el.style.width = ...), buộc trình duyệt phải đồng bộ tính lại layout ngay lập tức nhiều lần trong 1 frame.',
    practical_example: {
      title: 'Tối ưu hiệu ứng Animation đạt 60fps',
      code: `/* XẤU: Gây Reflow & Repaint liên tục mỗi frame */
.box-bad {
  transition: left 0.3s, width 0.3s;
}

/* TỐT: Chỉ kích hoạt Compositing trên GPU, không Reflow/Repaint */
.box-good {
  transition: transform 0.3s;
  will-change: transform; /* Báo trình duyệt đưa sang layer riêng */
  transform: translate3d(100px, 0, 0);
}`,
      scenario: 'Animation dùng transform không chặn Main Thread của JavaScript, chạy mượt mà kể cả khi CPU đang bận.'
    },
    trade_offs: {
      when_use: 'Sử dụng CSS transform, opacity và will-change cho các hiệu ứng chuyển động mượt mà.',
      when_not_use: 'Lạm dụng will-change cho hàng trăm phần tử sẽ làm cạn kiệt bộ nhớ VRAM của GPU.',
      pros: ['Đạt chuẩn 60fps / 120fps', 'Giảm tải cho Main Thread'],
      cons: ['Tốn thêm bộ nhớ đồ họa VRAM cho GPU layers', 'Có thể gây lỗi mờ chữ (blurry text) nếu scale sai'],
      alternatives: ['CSS Transitions / Animations', 'Web Animations API']
    },
    follow_ups: [
      {
        question: 'Tại sao thay đổi visibility: hidden chỉ gây Repaint mà không gây Reflow?',
        answer_skeleton: 'Vì visibility: hidden vẫn giữ nguyên kích thước và vị trí hình học của phần tử trên trang, chỉ ẩn việc tô màu (paint pixel).'
      }
    ],
    common_traps: [
      'Đọc offsetHeight trong vòng lặp for (Layout Thrashing).',
      'Nghĩ rằng display: none và opacity: 0 có chi phí render giống nhau (display: none loại khỏi Render Tree, opacity: 0 vẫn nằm trong Render Tree).'
    ],
    active_recall: [
      'Hai thuộc tính CSS nào duy nhất chạy hoàn toàn trên GPU Compositor mà không gây Reflow lẫn Repaint?',
      'Layout Thrashing là gì và làm thế nào để tránh?'
    ],
    layers: {
      l1_junior: 'Trình duyệt đọc HTML và CSS rồi vẽ lên màn hình theo các bước DOM -> CSSOM -> Render.',
      l2_middle: 'Reflow tính toán lại vị trí và kích thước; Repaint vẽ lại màu sắc. Reflow luôn kéo theo Repaint.',
      l3_senior: 'Ở mức 3 YoE, cần kiểm soát Layout Thrashing, tận dụng FastDOM hoặc requestAnimationFrame để batch DOM reads/writes, và tối ưu hóa Layer Promotion trên GPU.'
    },
    why_ladder: [
      { question: 'Tại sao trang web bị giật lag (Jank)?', answer: 'Vì một frame mất hơn 16.6ms để tính toán, làm rớt khung hình.' },
      { question: 'Bước nào trong pipeline chậm nhất?', answer: 'Reflow (Layout), vì nó phải tính toán lại cây tọa độ hình học đệ quy.' },
      { question: 'Làm sao giải quyết triệt để?', answer: 'Chỉ animate transform và opacity trên GPU Compositor thread.' }
    ],
    code_reaction: {
      code: `// Đoạn code nguy hiểm:
for (let i = 0; i < items.length; i++) {
  const width = items[i].offsetWidth; // READ (Force Reflow)
  items[i].style.width = width + 10 + 'px'; // WRITE
}`,
      question: 'Hiện tượng gì xảy ra khi chạy đoạn code trên với 1000 items?',
      explanation: 'Forced Synchronous Layout (Layout Thrashing): Trình duyệt bị ép phải dừng lại tính toán lại layout 1000 lần liên tiếp, làm đơ trình duyệt.',
      fix: 'Đọc hết giá trị (batch read) trước, sau đó mới ghi style hàng loạt (batch write).'
    }
  },

  // ==========================================
  // DOMAIN 3: REACT FUNDAMENTALS
  // ==========================================
  {
    id: 'topic-react-reconciliation-fiber',
    domain_id: 'domain-03-react-fundamentals',
    domain_title: 'Domain 3 — React Fundamentals',
    title: 'Reconciliation, Virtual DOM & Fiber Architecture',
    target_intent: 'Kiểm tra xem ứng viên có hiểu cách React đồng bộ hóa trạng thái với DOM, cơ chế Diffing O(N) và tại sao Fiber cho phép ngắt quãng render (Concurrent).',
    trigger_keywords: ['Virtual DOM', 'Reconciliation', 'Diffing Algorithm', 'React Fiber', 'Work Loop', 'Key Identity'],
    recall_5s: 'Virtual DOM là bản mô phỏng cây UI trong RAM. Reconciliation là thuật toán so sánh diff giữa 2 cây VDOM O(N). Fiber biến cây thành danh sách liên kết (linked list) cho phép dừng, ưu tiên và tiếp tục render.',
    interview_answer: 'Reconciliation là quá trình React so sánh cây Virtual DOM mới với cây cũ để tìm ra các thay đổi tối thiểu cần cập nhật lên real DOM. Thuật toán Diffing của React dựa trên 2 giả định để giảm độ phức tạp từ O(N³) xuống O(N): (1) Hai phần tử khác type sẽ sinh ra cây hoàn toàn khác nhau và bị hủy/tạo mới, và (2) Các phần tử con trong list được định danh bằng prop `key` để tái sử dụng. Để làm cho quá trình này không block Main Thread, React 16 viết lại core bằng Fiber Architecture: mỗi Fiber là một đơn vị công việc (unit of work) tổ chức dạng linked list, cho phép React ngắt quãng (pause), phân cấp ưu tiên (priority scheduling) và tiếp tục render sau.',
    deep_dive: 'Fiber có 2 giai đoạn: Render Phase (bất đồng bộ, có thể bị hủy hoặc chạy lại, tính toán diff trong RAM) và Commit Phase (đồng bộ, không thể ngắt quãng, áp dụng các thay đổi thực tế vào real DOM và chạy layout effects).',
    practical_example: {
      title: 'Tác hại của việc dùng index làm key trong danh sách động',
      code: `// NGUY HIỂM: Dùng index làm key khi xóa phần tử đầu danh sách
{todos.map((todo, index) => (
  <TodoItem key={index} text={todo.text} />
))}
// Khi xóa phần tử đầu, index của các phần tử sau bị dời lên:
// React tưởng item 1 đổi text thành item 2 -> Giữ nguyên state nội bộ sai lệch!`,
      scenario: 'Form input hoặc checkbox bên trong TodoItem bị giữ lại dữ liệu của phần tử khác sau khi xóa.'
    },
    trade_offs: {
      when_use: 'Luôn luôn dùng ID duy nhất và ổn định từ backend (UUID, database ID) làm prop key.',
      when_not_use: 'Tuyệt đối không sinh key ngẫu nhiên Math.random() trong render vì sẽ hủy và tạo lại DOM mỗi lần re-render.',
      pros: ['Giữ nguyên trạng thái component con chính xác', 'Tối ưu hóa số phép biến đổi DOM thực tế'],
      cons: ['Virtual DOM tốn thêm bộ nhớ RAM cho cây đối tượng ảo', 'Vẫn có chi phí so sánh diff'],
      alternatives: ['Fine-grained Reactivity không dùng VDOM (Svelte, SolidJS)']
    },
    follow_ups: [
      {
        question: 'Điều gì xảy ra nếu đổi type của component từ <div> sang <span>?',
        answer_skeleton: 'React sẽ unmount hoàn toàn cây cũ (xóa sạch DOM và state con) và mount lại cây mới từ đầu.'
      }
    ],
    common_traps: [
      'Dùng key={Math.random()} khiến component bị unmount và remount mỗi render.',
      'Nghĩ rằng Virtual DOM luôn nhanh hơn Real DOM thuần (nó sinh ra để dễ duy trì code declarative, không phải lúc nào cũng nhanh hơn thao tác DOM tay tối ưu).'
    ],
    active_recall: [
      'Hai giai đoạn cốt lõi của React Fiber là gì và giai đoạn nào có thể bị ngắt quãng?',
      'Tại sao dùng array index làm key lại gây bug khi thêm/xóa phần tử ở giữa danh sách?'
    ],
    layers: {
      l1_junior: 'React dùng Virtual DOM để so sánh điểm khác biệt và chỉ cập nhật những gì thay đổi lên web.',
      l2_middle: 'Diffing O(N) dựa trên element type và key. Fiber chia nhỏ công việc thành các unit of work.',
      l3_senior: 'Ở mức 3 YoE, phải hiểu Double Buffering (current fiber vs workInProgress fiber), cơ chế time-slicing của Scheduler, và tại sao Render phase phải pure không được có side-effect.'
    },
    why_ladder: [
      { question: 'Tại sao React tạo ra Fiber?', answer: 'Kiến trúc Stack Reconciler cũ chạy đồng bộ đệ quy làm lag trình duyệt khi cây component quá lớn.' },
      { question: 'Fiber giải quyết bằng cách nào?', answer: 'Chuyển cấu trúc cây thành Linked List để có thể dừng và nhường CPU cho browser vẽ frame.' },
      { question: 'Tại sao Render Phase phải là pure function?', answer: 'Vì nó có thể bị hủy và chạy lại nhiều lần trước khi sang Commit Phase.' }
    ],
    code_reaction: {
      code: `function List() {
  return (
    <div>
      {items.map(item => (
        <InputItem key={Math.random()} defaultValue={item.name} />
      ))}
    </div>
  );
}`,
      question: 'Người dùng gặp hiện tượng gì khi gõ chữ vào ô input trong List trên?',
      explanation: 'Mỗi lần state cha đổi làm re-render, key sinh ra ngẫu nhiên mới -> React hủy DOM input cũ và tạo input mới tinh -> Ô input mất focus và mất chữ vừa gõ.',
      fix: 'Sử dụng id duy nhất ổn định: `key={item.id}`.'
    }
  },

  // ==========================================
  // DOMAIN 5: REACT ADVANCED
  // ==========================================
  {
    id: 'topic-react-suspense-concurrent',
    domain_id: 'domain-05-react-advanced',
    domain_title: 'Domain 5 — React Advanced',
    title: 'React Suspense & Concurrent Transitions (useTransition)',
    target_intent: 'Đánh giá hiểu biết về mô hình rendering bất đồng bộ, cách trì hoãn render không khẩn cấp để giữ UI tương tác phản hồi tức thì (INP).',
    trigger_keywords: ['Suspense', 'Promise Throwing', 'Concurrent React', 'useTransition', 'Urgent vs Non-urgent Update', 'INP'],
    recall_5s: 'Suspense không đơn thuần là spinner tải trang; nó là ranh giới phối hợp async dependency. useTransition phân tách update khẩn cấp (gõ phím tức thì) khỏi update nặng (render list filter) để tránh đơ giao diện.',
    interview_answer: 'Trước React 18, mọi state update đều có cùng độ ưu tiên cao và chạy đồng bộ. Concurrent React cho phép phân loại cập nhật: (1) Urgent Updates (gõ text, click, hover) cần phản hồi lập tức để đảm bảo chỉ số INP, và (2) Transition Updates (lọc kết quả, chuyển tab, render biểu đồ) có thể trì hoãn. Hook `useTransition` đánh dấu một state update là non-urgent: nếu người dùng tiếp tục tương tác, React sẽ tạm dừng tính toán transition để ưu tiên xử lý urgent event trước. Còn Suspense bắt các Promise được throw từ data fetcher, giữ nguyên UI cũ hoặc hiện fallback mà không làm vỡ cây render.',
    deep_dive: 'Cơ chế hoạt động ngầm của Suspense: Khi một component đọc dữ liệu chưa sẵn sàng, nó throw một Promise. React bắt lấy Promise này tại `<Suspense>` boundary gần nhất, lưu trạng thái dở dang và subscribe vào Promise. Khi Promise resolve, React tiếp tục render lại component đó.',
    practical_example: {
      title: 'Tối ưu ô tìm kiếm với useTransition',
      code: `function SearchPage() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Urgent: cập nhật ô input gõ chữ tức thì
    setInput(e.target.value);

    // 2. Non-urgent: hoãn render 10,000 kết quả tìm kiếm
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  return (
    <>
      <input value={input} onChange={handleChange} />
      {isPending && <span>Đang lọc dữ liệu...</span>}
      <HeavyList query={query} />
    </>
  );
}`,
      scenario: 'Người dùng gõ phím liên tục với tốc độ cao mà ô input không bị delay hay giật lag.'
    },
    trade_offs: {
      when_use: 'Khi render các danh sách lớn, chuyển tab nặng hoặc khi tích hợp fetch dữ liệu có hỗ trợ Suspense.',
      when_not_use: 'Cho các input được kiểm soát (controlled input) trực tiếp; input bắt buộc phải phản hồi đồng bộ.',
      pros: ['Cải thiện vượt bậc chỉ số Core Web Vitals (INP)', 'Giao diện không bao giờ bị đơ khi xử lý tính toán nặng'],
      cons: ['Có thể render thừa nếu transition bị ngắt liên tục', 'Đòi hỏi thư viện data fetching tương thích Suspense'],
      alternatives: ['Debounce / Throttle truyền thống', 'Virtualization (react-window)']
    },
    follow_ups: [
      {
        question: 'useDeferredValue khác useTransition ở điểm nào?',
        answer_skeleton: 'useTransition bọc logic cập nhật state (setState), còn useDeferredValue bọc một giá trị props/state có sẵn để sinh ra bản sao bị hoãn (deferred copy).'
      }
    ],
    common_traps: [
      'Bọc việc set text input vào trong startTransition khiến phím bấm bị trễ chữ.',
      'Nghĩ rằng Suspense tự động biến hàm fetch thông thường thành bất đồng bộ mà không cần wrapper ném Promise.'
    ],
    active_recall: [
      'Sự khác nhau cơ bản giữa Urgent Update và Transition Update trong React 18 là gì?',
      'Tại sao useTransition lại giúp cải thiện chỉ số Interaction to Next Paint (INP)?'
    ],
    layers: {
      l1_junior: 'Suspense hiện màn hình chờ (fallback) khi component con đang tải dữ liệu hoặc tải code.',
      l2_middle: 'useTransition cho phép hạ độ ưu tiên của một state update nặng để ưu tiên gõ phím trước.',
      l3_senior: 'Ở mức 3 YoE, cần nắm rõ Scheduler lane priorities, cơ chế throw Promise của Suspense, và streaming SSR kết hợp selective hydration trong Next.js.'
    },
    why_ladder: [
      { question: 'Tại sao cần useTransition thay vì chỉ debounce?', answer: 'Debounce chỉ trì hoãn thời điểm bắt đầu; khi bắt đầu chạy nó vẫn block giao diện. useTransition cho phép ngắt ngang giữa chừng.' },
      { question: 'Làm sao React ngắt được tiến trình render?', answer: 'Dựa trên kiến trúc Fiber và MessageChannel ngắt quãng theo từng time slice 5ms.' },
      { question: 'Suspense bắt dữ liệu bằng cách nào?', answer: 'Nó sử dụng cơ chế throw Promise tương tự error boundary bắt exception.' }
    ],
    code_reaction: {
      code: `function TabContainer() {
  const [tab, setTab] = useState('home');
  const [isPending, startTransition] = useTransition();

  const selectTab = (nextTab) => {
    // BUG: startTransition bọc async/await
    startTransition(async () => {
      await fetchTabDetails();
      setTab(nextTab);
    });
  };
}`,
      question: 'Đoạn code dùng useTransition trên có hoạt động đúng không?',
      explanation: 'Sai: Hàm callback truyền vào startTransition phải là hàm đồng bộ (synchronous). Không được truyền async function vì React cần kích hoạt context chuyển tiếp ngay lập tức.',
      fix: 'Tách fetchTabDetails() ra ngoài, hoặc dùng Suspense data fetching, chỉ bọc `setTab(nextTab)` bên trong startTransition.'
    }
  },

  // ==========================================
  // DOMAIN 7: FRONTEND STATE & DATA
  // ==========================================
  {
    id: 'topic-frontend-server-vs-client-state',
    domain_id: 'domain-07-frontend-state',
    domain_title: 'Domain 7 — Frontend State & Data',
    title: 'Server State vs Client State & TanStack Query Invalidation',
    target_intent: 'Đánh giá tư duy phân tách trạng thái ứng dụng: không nhồi nhét server data vào Redux/Zustand, và kiểm soát stale-while-revalidate.',
    trigger_keywords: ['Client State', 'Server State', 'TanStack Query', 'Cache Invalidation', 'Optimistic Update', 'Stale Time'],
    recall_5s: 'Client State là trạng thái cục bộ của UI (modal đóng/mở, theme dark/light). Server State là dữ liệu từ DB (danh sách đơn hàng), bất đồng bộ và có thể bị cũ (stale) bất cứ lúc nào.',
    interview_answer: 'Một lỗi phổ biến của Junior là lưu toàn bộ API data vào global store như Redux hay Zustand. Thực tế, Server State có tính chất khác hoàn toàn Client State: nó thuộc quyền sở hữu của backend, mang tính bất đồng bộ, và có thể bị lỗi thời (stale) bởi người dùng khác. Tôi dùng TanStack Query (React Query) cho Server State để tận dụng tự động caching, background revalidation (stale-while-revalidate), retry khi rớt mạng, và deduplication. Còn Client State (như trạng thái mở sidebar, stepper form tạm) tôi dùng Zustand hoặc local state.',
    deep_dive: 'Hiểu đúng staleTime vs gcTime (cacheTime): `staleTime` là thời gian dữ liệu được coi là tươi mới (fresh), trong thời gian này Query sẽ không fetch lại từ mạng. `gcTime` là thời gian dữ liệu không dùng được giữ trong RAM trước khi bị xóa hoàn toàn.',
    practical_example: {
      title: 'Mẫu Optimistic Update cho chức năng Like',
      code: `const queryClient = useQueryClient();

const likeMutation = useMutation({
  mutationFn: (postId: string) => api.likePost(postId),
  // Khi vừa bấm like: Cập nhật UI ngay lập tức
  onMutate: async (postId) => {
    await queryClient.cancelQueries({ queryKey: ['post', postId] });
    const prevPost = queryClient.getQueryData(['post', postId]);
    queryClient.setQueryData(['post', postId], (old: any) => ({ ...old, likes: old.likes + 1 }));
    return { prevPost }; // Lưu bản sao để rollback nếu lỗi
  },
  // Nếu API lỗi: Rollback lại giá trị cũ
  onError: (err, postId, context) => {
    queryClient.setQueryData(['post', postId], context?.prevPost);
  },
  // Dù thành công hay lỗi: Revalidate để đồng bộ chuẩn xác với server
  onSettled: (data, err, postId) => {
    queryClient.invalidateQueries({ queryKey: ['post', postId] });
  }
});`,
      scenario: 'Người dùng bấm like thấy số nhảy ngay tức thì (0ms latency), nếu rớt mạng số tự động lùi lại an toàn.'
    },
    trade_offs: {
      when_use: 'Optimistic Update cho các tương tác thường xuyên thành công: Like, Bookmark, Đổi thứ tự Todo.',
      when_not_use: 'Không dùng cho thao tác rủi ro cao: Chuyển tiền, Đặt lệnh mua chứng khoán (cần Pessimistic chờ server xác nhận).',
      pros: ['Trải nghiệm người dùng phản hồi tức thì', 'Tự động xử lý race condition & retry'],
      cons: ['Phải viết code rollback cẩn thận khi API thất bại', 'Tăng độ phức tạp quản trị cache'],
      alternatives: ['Pessimistic Update (hiện spinner chờ backend trả 200)']
    },
    follow_ups: [
      {
        question: 'Làm sao ngăn chặn Race Condition khi người dùng chuyển trang nhanh liên tục?',
        answer_skeleton: 'TanStack Query tự động hủy request cũ thông qua AbortController gắn trong QueryFunctionContext.signal.'
      }
    ],
    common_traps: [
      'Copy dữ liệu từ React Query sang useState cục bộ làm mất cơ chế tự động đồng bộ cache.',
      'Đặt staleTime = 0 nhưng gcTime = 0 khiến app gửi request liên tục mỗi lần re-render.'
    ],
    active_recall: [
      'Phân biệt sự khác nhau cơ bản giữa staleTime và gcTime trong TanStack Query?',
      'Ba bước bắt buộc trong một quy trình Optimistic Update an toàn là gì?'
    ],
    layers: {
      l1_junior: 'Client State là state giao diện, Server State là dữ liệu gọi từ API.',
      l2_middle: 'Dùng React Query quản lý Server State với cơ chế stale-while-revalidate thay vì lưu trong Redux.',
      l3_senior: 'Ở mức 3 YoE, thành thạo Optimistic Mutations có rollback, query cancellation bằng AbortSignal, và chiến lược Invalidation theo phân cấp Query Key.'
    },
    why_ladder: [
      { question: 'Tại sao không lưu API response vào Redux?', answer: 'Vì Redux không tự quản lý được việc hết hạn (stale), refetch khi focus tab, hay retry khi mạng chập chờn.' },
      { question: 'Tại sao cần stale-while-revalidate?', answer: 'Để người dùng thấy dữ liệu cũ ngay lập tức trong khi âm thầm tải bản mới nhất từ backend.' },
      { question: 'Chuyện gì xảy ra nếu Optimistic Update bị lỗi mạng?', answer: 'Phải dùng context trong onMutate để rollback trạng thái về đúng bản snapshot trước đó.' }
    ],
    code_reaction: {
      code: `// Chống mẫu phổ biến (Anti-pattern):
function UserProfile({ userId }) {
  const { data } = useQuery(['user', userId], fetchUser);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (data) setUserName(data.name);
  }, [data]);
}`,
      question: 'Tại sao việc copy data từ React Query vào useState trong đoạn code trên là anti-pattern?',
      explanation: 'Tạo ra 2 nguồn chân lý (Single Source of Truth bị phá vỡ). Khi cache revalidate trong background, state cục bộ userName có thể bị lệch hoặc bị đè bất ngờ.',
      fix: 'Dùng trực tiếp `data.name` hoặc dùng thuộc tính select của useQuery để transform dữ liệu.'
    }
  },

  // ==========================================
  // DOMAIN 8: FRONTEND PERFORMANCE
  // ==========================================
  {
    id: 'topic-frontend-core-web-vitals',
    domain_id: 'domain-08-frontend-perf',
    domain_title: 'Domain 8 — Frontend Performance',
    title: 'Core Web Vitals (LCP, CLS, INP) & Performance Debugging Sequence',
    target_intent: 'Đánh giá khả năng đo lường, phân tích bottleneck thực tế bằng Chrome DevTools Performance panel thay vì tối ưu hóa cảm tính.',
    trigger_keywords: ['Core Web Vitals', 'LCP (Largest Contentful Paint)', 'INP (Interaction to Next Paint)', 'CLS (Cumulative Layout Shift)', 'Waterfall Analysis', 'Profiler'],
    recall_5s: 'Core Web Vitals gồm 3 chỉ số: LCP (tốc độ tải khối lớn nhất < 2.5s), INP (độ nhạy tương tác phản hồi < 200ms), CLS (độ ổn định thị giác không bị nhảy layout < 0.1). Khi web chậm: Đo lường → Cô lập nút thắt → Đưa giả thuyết → Tối ưu → Đo lại.',
    interview_answer: 'Khi nhận phản hồi "Trang web bị chậm", tôi không vội vàng viết useMemo lung tung mà tuân thủ quy trình đo lường có hệ thống: (1) Tái hiện vấn đề trong môi trường ẩn danh kèm throttle CPU/Network (Fast 3G, 4x CPU Slowdown), (2) Đo lường 3 chỉ số Core Web Vitals thực tế: LCP kiểm tra xem ảnh hero/banner hay font bị chặn bởi render-blocking resources; INP kiểm tra Long Tasks (>50ms) trên Main Thread làm trễ phản hồi tương tác; CLS kiểm tra ảnh thiếu width/height hoặc banner quảng cáo chèn động gây giật trang. (3) Dùng Chrome Performance tab và React Profiler để tìm component render lặp lại hoặc hàm chạy tốn CPU, sau đó mới tối ưu và đo đạc lại để so sánh chỉ số trước/sau.',
    deep_dive: 'Chỉ số INP (thay thế FID từ tháng 3/2024) đo độ trễ của TẤT CẢ các tương tác trong suốt phiên làm việc của người dùng, bao gồm: Input Delay (chờ Main Thread rảnh) + Processing Time (thời gian chạy JS event callback) + Presentation Delay (thời gian browser vẽ lại frame kết quả).',
    practical_example: {
      title: 'Khắc phục triệt để lỗi CLS và LCP',
      code: `<!-- 1. Tránh CLS: Luôn khai báo kích thước hoặc aspect-ratio -->
<img src="banner.webp" width="1200" height="600" style="aspect-ratio: 2/1;" alt="Banner" />

<!-- 2. Tối ưu LCP: Preload ảnh banner chính & ưu tiên tải -->
<link rel="preload" as="image" href="hero.webp" fetchpriority="high" />

<!-- 3. Tối ưu INP: Cắt nhỏ Long Task (> 50ms) -->
async function yieldToMain() {
  return new Promise(resolve => setTimeout(resolve, 0));
}`,
      scenario: 'Trang thương mại điện tử tải banner không làm nhảy giỏ hàng và danh sách sản phẩm bên dưới.'
    },
    trade_offs: {
      when_use: 'Áp dụng đo lường trên production qua Real User Monitoring (RUM) kết hợp Lighthouse trong CI/CD.',
      when_not_use: 'Không tối ưu sớm (Premature optimization) cho các trang admin nội bộ ít người dùng với chi phí code phức tạp.',
      pros: ['Tăng thứ hạng SEO trên Google', 'Tăng tỷ lệ chuyển đổi đơn hàng (Conversion Rate)'],
      cons: ['Tốn thời gian audit và thiết lập hạ tầng CDN/Image optimization'],
      alternatives: ['Partytown cho third-party scripts', 'Next.js Image & Font built-in optimizations']
    },
    follow_ups: [
      {
        question: 'Làm thế nào để chia nhỏ một Long Task 200ms trên Main Thread?',
        answer_skeleton: 'Dùng scheduler.yield() hoặc setTimeout(fn, 0) giữa các batch tính toán để nhường luồng cho trình duyệt render frame mới.'
      }
    ],
    common_traps: [
      'Chạy Lighthouse trên máy dev cấu hình khủng mạng cáp quang (phải throttle CPU 4x và mạng Fast 3G).',
      'Thêm useMemo ở khắp mọi nơi tưởng là tối ưu (thực tế chi phí so sánh deps còn tốn hơn render component đơn giản).'
    ],
    active_recall: [
      'INP đo lường điều gì và gồm những thành phần thời gian nào?',
      'Tại sao việc thiếu thuộc tính width/height trên thẻ <img> lại là thủ phạm chính gây ra lỗi CLS?'
    ],
    layers: {
      l1_junior: 'Web chậm do ảnh nặng, tải nhiều file JavaScript, hoặc code tính toán lâu.',
      l2_middle: 'Đo lường 3 chỉ số Core Web Vitals: LCP (tải trang), INP (tương tác), CLS (ổn định giao diện).',
      l3_senior: 'Ở mức 3 YoE, thành thạo quy trình đọc flame graph trong Performance Tab, phát hiện layout thrashing, xử lý Long Tasks bằng web workers hoặc scheduler.yield().'
    },
    why_ladder: [
      { question: 'Tại sao Google thay thế FID bằng INP?', answer: 'FID chỉ đo tương tác đầu tiên, còn INP đo độ mượt của toàn bộ các tương tác trong suốt phiên truy cập.' },
      { question: 'Tại sao một Long Task làm hỏng INP?', answer: 'Vì JavaScript đơn luồng, khi Main Thread bị chiếm dụng quá 50ms, trình duyệt không thể xử lý event click của người dùng.' },
      { question: 'Làm sao biết được element nào là LCP?', answer: 'Bật Performance panel, tìm timeline "LCP" trong tab Timings để inspect chính xác node DOM đại diện.' }
    ],
    code_reaction: {
      code: `// Component xử lý 50.000 dòng dữ liệu:
function DataGrid({ rows }) {
  return (
    <div>
      {rows.map(row => <Row key={row.id} data={row} />)}
    </div>
  );
}`,
      question: 'Tại sao trang web bị đơ (High INP / TBT) khi dữ liệu có 50.000 dòng?',
      explanation: 'Tạo 50.000 DOM nodes đồng thời làm tê liệt trình duyệt (tốn hàng trăm MB RAM và gây Long Task vài giây cho Layout & Paint).',
      fix: 'Sử dụng kỹ thuật Virtualization (react-window hoặc tanstack-virtual) để chỉ render ~20 dòng đang hiển thị trong viewport.'
    }
  },

  // ==========================================
  // DOMAIN 9: TYPESCRIPT DEEP DIVE
  // ==========================================
  {
    id: 'topic-ts-discriminated-unions-zod',
    domain_id: 'domain-09-typescript',
    domain_title: 'Domain 9 — TypeScript Deep Dive',
    title: 'Discriminated Unions, Narrowing & Runtime Validation (Zod)',
    target_intent: 'Kiểm tra xem ứng viên có hiểu ranh giới sống còn giữa Type Safety ở Compile-time và Runtime Data Validation khi tiếp nhận payload từ bên ngoài.',
    trigger_keywords: ['Discriminated Union', 'Type Narrowing', 'Type Guard', 'Compile-time vs Runtime', 'Zod', 'Structural Typing'],
    recall_5s: 'TypeScript bị xóa sạch (type erasure) khi compile sang JS, do đó type TS KHÔNG THỂ bảo vệ dữ liệu ở runtime. Phải dùng Discriminated Union cho state mô hình hóa, và dùng Zod để validate dữ liệu đầu vào từ API.',
    interview_answer: 'Một lỗi chết người của lập trình viên là tin rằng viết interface TypeScript là dữ liệu API trả về sẽ luôn an toàn. TypeScript chỉ kiểm tra kiểu ở Compile-time và hoàn toàn biến mất ở Runtime (Type Erasure). Do đó, dữ liệu đến từ người dùng, mạng hay local storage bắt buộc phải đi qua Runtime Validation như Zod. Trong nội bộ code, tôi tận dụng Discriminated Unions (kết hợp các type có chung một trường định danh như `status: "success" | "error"`) để ép TypeScript tự động thu hẹp kiểu (Type Narrowing) trong switch/case, ngăn chặn triệt để trạng thái bất hợp lệ (Impossible States).',
    deep_dive: 'Discriminated Union giúp loại bỏ "Impossible States". Thay vì tạo state `{ isLoading: boolean, error?: string, data?: Data }` (có thể vô tình vừa có error vừa có data), ta định nghĩa: `{ status: "loading" } | { status: "success", data: Data } | { status: "error", error: string }`. Trình duyệt và compiler sẽ không bao giờ cho phép truy cập `.data` khi `status === "error"`.',
    practical_example: {
      title: 'Kết hợp Discriminated Union & Zod Schema',
      code: `import { z } from 'zod';

// 1. Runtime validation schema
const PaymentResponseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('SUCCESS'), transactionId: z.string() }),
  z.object({ status: z.literal('FAILED'), reason: z.string() })
]);

// 2. Tự động suy luận TypeScript type từ Zod
type PaymentResponse = z.infer<typeof PaymentResponseSchema>;

function handlePayment(rawJson: unknown) {
  // Parse runtime an toàn: ném lỗi ngay nếu dữ liệu backend gửi sai
  const result: PaymentResponse = PaymentResponseSchema.parse(rawJson);

  // Type narrowing tự động
  if (result.status === 'SUCCESS') {
    console.log(result.transactionId); // Hợp lệ
  } else {
    console.log(result.reason); // Hợp lệ, không thể truy cập transactionId ở đây!
  }
}`,
      scenario: 'Nếu backend đổi format JSON hoặc thiếu trường, Zod bắt lỗi ngay tại ranh giới mạng, không để crash sâu trong UI.'
    },
    trade_offs: {
      when_use: 'Sử dụng Zod cho: Request Body trong backend API, Form Input, và API Response từ third-party.',
      when_not_use: 'Không bọc Zod cho các hàm tính toán nội bộ thuần túy vì parse runtime tốn CPU.',
      pros: ['Đảm bảo 100% an toàn kiểu dữ liệu ở cả compile-time lẫn runtime', 'Tự động sinh type từ schema'],
      cons: ['Tăng nhẹ bundle size (Zod ~12KB gzip)', 'Tốn chi phí CPU để parse object lớn'],
      alternatives: ['Valibot (siêu nhẹ ~1KB)', 'TypeBox (dựa trên JSON Schema)']
    },
    follow_ups: [
      {
        question: 'Khác biệt giữa type alias và interface trong TypeScript là gì?',
        answer_skeleton: 'Interface có thể Declaration Merging và tối ưu hơn cho Object OOP. Type alias hỗ trợ Union (|), Intersection (&), Tuple, và Conditional Types phức tạp.'
      }
    ],
    common_traps: [
      'Dùng type assertion `as UserData` để ép kiểu response từ fetch() mà không validate runtime.',
      'Sử dụng type `any` làm mất toàn bộ tính năng kiểm tra kiểu của TypeScript.'
    ],
    active_recall: [
      'Tại sao nói: "TypeScript type safety KHÔNG PHẢI là runtime validation"?',
      'Discriminated Union cần tối thiểu những yếu tố gì để TypeScript nhận diện?'
    ],
    layers: {
      l1_junior: 'TypeScript giúp code có kiểu dữ liệu rõ ràng, báo lỗi trước khi chạy.',
      l2_middle: 'Sử dụng Discriminated Union và Type Guards để narrowing kiểu dữ liệu một cách an toàn.',
      l3_senior: 'Ở mức 3 YoE, phải hiểu Type Erasure, Structural Typing (Duck Typing), Conditional Types (`T extends U ? X : Y`), và bảo vệ Network Boundary bằng Zod.'
    },
    why_ladder: [
      { question: 'Tại sao cần TypeScript?', answer: 'Để phát hiện 80% lỗi logic ngay khi gõ code trong IDE.' },
      { question: 'Tại sao TypeScript không bảo vệ được API response?', answer: 'Vì toàn bộ type bị xóa sạch khi dịch sang JavaScript trên browser.' },
      { question: 'Làm sao giải quyết?', answer: 'Dùng thư viện Runtime Schema Validation như Zod để kiểm tra tính toàn vẹn dữ liệu.' }
    ],
    code_reaction: {
      code: `async function getUser(id: string) {
  const res = await fetch(\`/api/users/\${id}\`);
  const data = await res.json() as { email: string; roles: string[] }; // BUG
  return data.roles.includes('admin');
}`,
      question: 'Đoạn code trên có thể gây crash ứng dụng ở tình huống nào dù TypeScript không báo lỗi?',
      explanation: 'Dùng type assertion `as ...` lừa compiler. Nếu backend trả về `{ error: "User not found" }` (không có roles), `data.roles` là undefined và `.includes()` sẽ ném TypeError: Cannot read properties of undefined.',
      fix: 'Sử dụng Zod để parse: `const data = UserSchema.parse(await res.json())`.'
    }
  }
];
