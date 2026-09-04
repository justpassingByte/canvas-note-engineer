#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import Database from 'better-sqlite3';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const DB_PATH = path.resolve(process.cwd(), 'data', 'knowledge.db');

async function isServerAlive(url) {
  try {
    const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function isFrontendAlive(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

function getGraphFromDb() {
  if (!fs.existsSync(DB_PATH)) return null;
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const row = db.prepare('SELECT graph_data FROM knowledge_graphs ORDER BY updated_at DESC LIMIT 1').get();
    db.close();
    if (row && row.graph_data) {
      return JSON.parse(row.graph_data);
    }
  } catch (err) {
    // Fallback if db is busy or in wal
  }
  return null;
}

async function getCurrentGraph() {
  if (await isServerAlive(BACKEND_URL)) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/graph/current`);
      if (res.ok) {
        const body = await res.json();
        return body.graph || body;
      }
    } catch {}
  }
  return getGraphFromDb();
}

const action = process.argv[2] || 'status';
const param = process.argv[3];
const flag = process.argv[4];

async function main() {
  switch (action) {
    case 'status': {
      const backendUp = await isServerAlive(BACKEND_URL);
      const frontendUp = await isFrontendAlive(FRONTEND_URL);
      const graph = await getCurrentGraph();
      const dbExists = fs.existsSync(DB_PATH);

      console.log('=== CANVAS NOTE ENGINEER — SYSTEM STATUS ===');
      console.log(`Backend (${BACKEND_URL}): ${backendUp ? 'ONLINE (Port 3001)' : 'OFFLINE'}`);
      console.log(`Frontend (${FRONTEND_URL}): ${frontendUp ? 'ONLINE (Port 5173)' : 'OFFLINE'}`);
      console.log(`SQLite DB (${DB_PATH}): ${dbExists ? 'FOUND (WAL Mode)' : 'NOT INITIALIZED'}`);
      if (graph) {
        console.log(`Chủ đề đồ thị: "${graph.topic}"`);
        console.log(`Tổng số Nodes: ${graph.nodes?.length || 0} | Tổng số Edges: ${graph.edges?.length || 0}`);
        const explored = graph.nodes?.filter(n => n.fully_explored).length || 0;
        console.log(`Khám phá bão hòa: ${explored}/${graph.nodes?.length || 0} nodes`);
      } else {
        console.log('Chưa có dữ liệu đồ thị nào trong bộ nhớ đệm.');
      }
      break;
    }

    case 'open': {
      const backendUp = await isServerAlive(BACKEND_URL);
      const frontendUp = await isFrontendAlive(FRONTEND_URL);

      if (!backendUp || !frontendUp) {
        console.log('[Notice] Máy chủ dev chưa khởi động. Vui lòng chạy `npm run dev` để bật cả Frontend và Backend.');
      }

      if (param === '--agent' || flag === '--agent') {
        console.log(`[Canvas Open] Khởi chạy trong chế độ Agent Browser Automation tại: ${FRONTEND_URL}`);
      } else {
        console.log(`[Canvas Open] Đang mở Canvas trên trình duyệt mặc định: ${FRONTEND_URL}`);
        const startCmd = process.platform === 'win32' ? `start ${FRONTEND_URL}` : `open ${FRONTEND_URL}`;
        exec(startCmd, (err) => {
          if (err) console.error('Không thể mở trình duyệt tự động:', err.message);
        });
      }
      break;
    }

    case 'query': {
      if (!param) {
        console.log('Cách dùng: node canvas-cli.mjs query <từ_khóa>');
        process.exit(1);
      }
      const graph = await getCurrentGraph();
      if (!graph || !graph.nodes) {
        console.log('Không thể tải dữ liệu đồ thị.');
        process.exit(1);
      }

      const q = param.toLowerCase();
      const matches = graph.nodes.filter(n =>
        n.tieu_de.toLowerCase().includes(q) ||
        n.tom_tat.toLowerCase().includes(q) ||
        n.id.toLowerCase().includes(q) ||
        (n.chi_tiet?.phan_loai && n.chi_tiet.phan_loai.toLowerCase().includes(q)) ||
        (n.chi_tiet?.ban_chat && n.chi_tiet.ban_chat.toLowerCase().includes(q))
      );

      console.log(`=== KẾT QUẢ TÌM KIẾM CHO TỪ KHÓA: "${param}" (${matches.length} kết quả) ===\n`);
      if (matches.length === 0) {
        console.log('Không tìm thấy node nào khớp với từ khóa.');
      } else {
        for (const n of matches) {
          console.log(`- **[${n.id}] ${n.tieu_de}** (${n.chi_tiet?.phan_loai || 'Concept'})`);
          console.log(`  * Biểu tượng: ${n.bieu_tuong} | Bước: ${n.nhan_buoc}`);
          console.log(`  * Tóm tắt: ${n.tom_tat.replace(/<[^>]*>?/gm, '')}`);
          if (n.chi_tiet?.ban_chat) {
            console.log(`  * Bản chất kỹ thuật: ${n.chi_tiet.ban_chat.replace(/<[^>]*>?/gm, '')}`);
          }
          if (n.chi_tiet?.rui_ro?.length) {
            console.log(`  * Rủi ro thực chiến: ${n.chi_tiet.rui_ro[0]}`);
          }
          console.log('');
        }
      }
      break;
    }

    case 'expand': {
      const targetSlug = param || 'node-khien-khoa';
      console.log(`[Canvas Expand] Đang yêu cầu mở rộng nhánh cho node '${targetSlug}'...`);

      if (!(await isServerAlive(BACKEND_URL))) {
        console.error('[Lỗi] Backend chưa chạy tại http://localhost:3001. Vui lòng bật server để mở rộng nhánh.');
        process.exit(1);
      }

      const res = await fetch(`${BACKEND_URL}/api/graph/expand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_concept_slug: targetSlug,
          expansion_intent: 'buffer_queue'
        })
      });

      const body = await res.json();
      if (body.expanded) {
        console.log(`✓ Mở rộng thành công! ${body.message}`);
        console.log(`Tổng số node hiện tại: ${body.graph?.nodes?.length}`);
      } else {
        console.log(`Thông báo: ${body.message}`);
      }
      break;
    }

    case 'spawn':
    case 'ddos': {
      const concept = action === 'ddos' ? 'ddos' : (param || 'ddos');
      console.log(`[Canvas Spawn] Đang yêu cầu tạo node '${concept}'...`);

      if (!(await isServerAlive(BACKEND_URL))) {
        console.error('[Lỗi] Backend chưa chạy tại http://localhost:3001. Vui lòng bật server để tạo node.');
        process.exit(1);
      }

      const res = await fetch(`${BACKEND_URL}/api/graph/spawn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_type: concept
        })
      });

      const body = await res.json();
      if (body.spawned) {
        console.log(`✓ ${body.message}`);
        console.log(`Tổng số node hiện tại: ${body.graph?.nodes?.length}`);
      } else {
        console.log(`Thông báo: ${body.message}`);
      }
      break;
    }

    case 'export': {
      const format = (param || 'mermaid').toLowerCase();
      const graph = await getCurrentGraph();
      if (!graph) {
        console.error('Không tìm thấy đồ thị nào để xuất.');
        process.exit(1);
      }

      if (format === 'mermaid') {
        console.log('```mermaid');
        console.log('graph TD;');
        for (const n of graph.nodes) {
          console.log(`  ${n.id}["${n.tieu_de}"]`);
        }
        for (const e of graph.edges) {
          console.log(`  ${e.from} -->|"${e.nhan}"| ${e.to}`);
        }
        console.log('```');
      } else if (format === 'obsidian' || format === 'md') {
        console.log(`# ${graph.topic}\n`);
        console.log(`> Xuất tự động từ Canvas Note Engineer (SQLite WAL)\n`);
        console.log(`## Danh sách Khái niệm Kiến trúc\n`);
        for (const n of graph.nodes) {
          console.log(`### [[${n.tieu_de}]]`);
          console.log(`- **ID**: \`${n.id}\``);
          console.log(`- **Phân loại**: ${n.chi_tiet?.phan_loai || 'Chung'}`);
          console.log(`- **Bản chất**: ${n.chi_tiet?.ban_chat?.replace(/<[^>]*>?/gm, '') || n.tom_tat}`);
          console.log('');
        }
      } else {
        console.log(JSON.stringify(graph, null, 2));
      }
      break;
    }

    default: {
      console.log('Lệnh không hỗ trợ. Sử dụng: status | open | query | expand | export');
    }
  }
}

main().catch(err => {
  console.error('[Lỗi canvas-cli]:', err.message);
  process.exit(1);
});
