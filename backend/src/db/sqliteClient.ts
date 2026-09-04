import path from 'path';
import fs from 'fs';
import { GraphData, NodeEntity, EdgeEntity } from '../types/graphTypes.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CACHE_FILE = path.join(DATA_DIR, 'knowledge_cache.json');

interface CacheStore {
  graphs: Record<string, GraphData>;
  latestGraphId?: string;
}

function readStore(): CacheStore {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Không thể đọc cache, khởi tạo mới:', err);
  }
  return { graphs: {} };
}

function writeStore(store: CacheStore): void {
  try {
    const tempFile = `${CACHE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tempFile, CACHE_FILE);
  } catch (err) {
    console.error('Lỗi khi ghi cache cục bộ:', err);
  }
}

export const sqliteClient = {
  saveGraph(graph: GraphData): void {
    const store = readStore();
    store.graphs[graph.id] = graph;
    store.latestGraphId = graph.id;
    writeStore(store);
  },

  getGraph(id: string): GraphData | null {
    const store = readStore();
    return store.graphs[id] || null;
  },

  getCurrentGraph(): GraphData | null {
    const store = readStore();
    if (store.latestGraphId && store.graphs[store.latestGraphId]) {
      return store.graphs[store.latestGraphId];
    }
    const all = Object.values(store.graphs);
    return all.length > 0 ? all[0] : null;
  },

  addDeltaNodes(
    graphId: string,
    parentNodeId: string,
    newNodes: NodeEntity[],
    newEdges: EdgeEntity[]
  ): GraphData | null {
    const graph = this.getGraph(graphId) || this.getCurrentGraph();
    if (!graph) return null;

    // Đánh dấu node cha đã khai phá hoàn tất (Saturation Lock)
    const parent = graph.nodes.find(n => n.id === parentNodeId);
    if (parent) {
      parent.fully_explored = true;
    }

    // Thêm các node mới (tránh trùng lặp id)
    for (const node of newNodes) {
      if (!graph.nodes.some(n => n.id === node.id)) {
        node.parent_id = parentNodeId;
        graph.nodes.push(node);
      }
    }

    // Thêm các edge mới
    for (const edge of newEdges) {
      if (!graph.edges.some(e => e.from === edge.from && e.to === edge.to)) {
        graph.edges.push(edge);
      }
    }

    this.saveGraph(graph);
    return graph;
  },

  updateNodeCollapse(
    graphId: string,
    nodeId: string,
    isCollapsed: boolean
  ): GraphData | null {
    const graph = this.getGraph(graphId) || this.getCurrentGraph();
    if (!graph) return null;

    const parent = graph.nodes.find(n => n.id === nodeId);
    if (!parent) return graph;

    // Tìm tất cả các node con của node này
    const childNodes = graph.nodes.filter(n => n.parent_id === nodeId);
    parent.is_collapsed = isCollapsed;
    parent.collapsed_count = childNodes.length;

    for (const child of childNodes) {
      child.is_collapsed = isCollapsed;
    }

    this.saveGraph(graph);
    return graph;
  },

  deleteNodePermanently(
    graphId: string,
    nodeId: string
  ): GraphData | null {
    const graph = this.getGraph(graphId) || this.getCurrentGraph();
    if (!graph) return null;

    // Thu thập danh sách ID cần xóa (node này và tất cả con cháu của nó)
    const idsToDelete = new Set<string>([nodeId]);
    let added = true;
    while (added) {
      added = false;
      for (const n of graph.nodes) {
        if (n.parent_id && idsToDelete.has(n.parent_id) && !idsToDelete.has(n.id)) {
          idsToDelete.add(n.id);
          added = true;
        }
      }
    }

    // Lọc bỏ các node
    graph.nodes = graph.nodes.filter(n => !idsToDelete.has(n.id));

    // Lọc bỏ các đường nối liên quan
    graph.edges = graph.edges.filter(e => !idsToDelete.has(e.from) && !idsToDelete.has(e.to));

    // Nếu xóa node con, mở lại khóa bão hòa của node cha nếu không còn con nào
    for (const parent of graph.nodes) {
      const remainingChildren = graph.nodes.filter(n => n.parent_id === parent.id);
      if (remainingChildren.length === 0 && parent.fully_explored && parent.id === 'node-khien-khoa') {
        parent.fully_explored = false;
        parent.is_collapsed = false;
        parent.collapsed_count = 0;
      }
    }

    this.saveGraph(graph);
    return graph;
  }
};
