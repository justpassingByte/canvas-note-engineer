import { create } from 'zustand';
import { GraphData, NodeEntity, EdgeEntity, SpawnClusterPayload } from '../types/graphTypes.js';
import { resolveNodeCollisions } from '../utils/nodePlacement.js';

interface GraphState {
  graph: GraphData | null;
  selectedNodeId: string;
  selectedEdge: EdgeEntity | null;
  isDomainLinkActive: boolean;
  isReflexQuizOpen: boolean;
  isRecallMode: boolean;
  revealedRecallNodes: string[];
  searchQuery: string;
  isWhatBreaksActive: boolean;
  isDrawerOpen: boolean;
  pan: { x: number; y: number };
  zoom: number;
  isLoading: boolean;
  errorMessage: string | null;

  // Actions
  setGraph: (graph: GraphData) => void;
  selectNode: (id: string) => void;
  selectEdge: (edge: EdgeEntity | null) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  expandNode: (nodeId: string) => Promise<void>;
  toggleCollapse: (nodeId: string) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  resetGraph: () => Promise<void>;
  toggleDomainLink: () => void;
  toggleReflexQuiz: () => void;
  toggleRecallMode: () => void;
  revealRecallNode: (nodeId: string) => void;
  setSearchQuery: (query: string) => void;
  toggleWhatBreaks: () => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  fetchCurrentGraph: () => Promise<void>;
  pollCurrentGraph: () => Promise<void>;
  spawnNode: (conceptType: string, position?: { x: number; y: number }, options?: { title?: string; category?: string; description?: string }) => Promise<void>;
  spawnCluster: (payload: SpawnClusterPayload) => Promise<void>;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  graph: null,
  selectedNodeId: 'node-khien-khoa',
  selectedEdge: null,
  isDomainLinkActive: true,
  isReflexQuizOpen: false,
  isRecallMode: false,
  revealedRecallNodes: [],
  searchQuery: '',
  isWhatBreaksActive: false,
  isDrawerOpen: true,
  pan: { x: 0, y: 0 },
  zoom: 1.0,
  isLoading: false,
  errorMessage: null,

  setGraph: (graph) => set({ graph }),

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  setPan: (pan) => {
    set((state) => ({
      pan: typeof pan === 'function' ? pan(state.pan) : pan
    }));
  },

  setZoom: (zoom) => {
    set((state) => {
      const nextZoom = typeof zoom === 'function' ? zoom(state.zoom) : zoom;
      return { zoom: Math.min(Math.max(nextZoom, 0.25), 2.5) };
    });
  },

  zoomIn: () => {
    set((state) => ({ zoom: Math.min(state.zoom * 1.15, 2.5) }));
  },

  zoomOut: () => {
    set((state) => ({ zoom: Math.max(state.zoom / 1.15, 0.25) }));
  },

  resetView: () => {
    set({ pan: { x: 0, y: 0 }, zoom: 1.0 });
  },

  selectNode: (id) => {
    // 100% 0 token, đổi active ID, mở Drawer, bỏ chọn Edge
    set({
      selectedNodeId: id,
      selectedEdge: null,
      isReflexQuizOpen: false,
      isWhatBreaksActive: false,
      isDrawerOpen: true
    });
  },

  selectEdge: (edge) => {
    // 0 token, mở Edge Inspector trong Drawer
    set({
      selectedEdge: edge,
      isDrawerOpen: edge !== null
    });
  },

  toggleRecallMode: () => {
    set((state) => ({ isRecallMode: !state.isRecallMode, revealedRecallNodes: [] }));
  },

  revealRecallNode: (nodeId) => {
    set((state) => ({
      revealedRecallNodes: state.revealedRecallNodes.includes(nodeId)
        ? state.revealedRecallNodes
        : [...state.revealedRecallNodes, nodeId]
    }));
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  toggleWhatBreaks: () => {
    set((state) => ({ isWhatBreaksActive: !state.isWhatBreaksActive }));
  },

  toggleDomainLink: () => {
    set((state) => ({ isDomainLinkActive: !state.isDomainLinkActive }));
  },

  toggleReflexQuiz: () => {
    set((state) => ({ isReflexQuizOpen: !state.isReflexQuizOpen }));
  },

  fetchCurrentGraph: async () => {
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await fetch('/api/graph/current');
      if (res.ok) {
        const data = await res.json();
        const rawGraph = data.graph || data;
        const safeNodes = resolveNodeCollisions(rawGraph.nodes);
        set({ graph: { ...rawGraph, nodes: safeNodes }, isLoading: false });
      } else {
        throw new Error('Không thể kết nối máy chủ backend');
      }
    } catch (err: any) {
      console.warn('Backend chưa khởi động, dùng mock graph cục bộ:', err.message);
      set({ isLoading: false });
    }
  },

  pollCurrentGraph: async () => {
    try {
      const res = await fetch('/api/graph/current');
      if (res.ok) {
        const data = await res.json();
        const rawGraph = data.graph || data;
        const current = get().graph;
        // Chỉ cập nhật khi số lượng node/edge hoặc danh sách node có sự thay đổi
        if (
          !current ||
          current.nodes.length !== rawGraph.nodes.length ||
          current.edges.length !== rawGraph.edges.length ||
          JSON.stringify(current.nodes.map(n => n.id)) !== JSON.stringify(rawGraph.nodes.map((n: any) => n.id))
        ) {
          const safeNodes = resolveNodeCollisions(rawGraph.nodes);
          set({ graph: { ...rawGraph, nodes: safeNodes } });
        }
      }
    } catch {}
  },

  expandNode: async (nodeId: string) => {
    const { graph } = get();
    if (!graph) return;

    const targetNode = graph.nodes.find(n => n.id === nodeId);
    if (!targetNode || targetNode.fully_explored) return;

    set({ isLoading: true });
    try {
      const existingSlugs = graph.nodes.map(n => n.id);
      const res = await fetch('/api/graph/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_concept_slug: nodeId,
          existing_node_slugs: existingSlugs
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Áp dụng thuật toán chống va chạm 100% không đè node
        const safeNodes = resolveNodeCollisions(data.graph.nodes);
        const resolvedGraph = { ...data.graph, nodes: safeNodes };

        // Tự động lướt Camera nếu các node con mới nằm ngoài màn hình
        const newNodes = safeNodes.filter(n => !graph.nodes.some(old => old.id === n.id));
        if (newNodes.length > 0) {
          const { pan, zoom } = get();
          const avgX = newNodes.reduce((acc, n) => acc + n.toa_do.x + 110, 0) / newNodes.length;
          const avgY = newNodes.reduce((acc, n) => acc + n.toa_do.y + 70, 0) / newNodes.length;
          const screenX = avgX * zoom + pan.x;
          const screenY = avgY * zoom + pan.y;

          if (screenX > window.innerWidth - 560 || screenX < 80 || screenY > window.innerHeight - 80 || screenY < 80) {
            set({
              pan: {
                x: pan.x - (screenX - (window.innerWidth - 520) / 2),
                y: pan.y - (screenY - window.innerHeight / 2)
              }
            });
          }
        }

        set({ graph: resolvedGraph, isLoading: false });
      } else {
        throw new Error('Lỗi từ backend');
      }
    } catch (err) {
      console.error('Lỗi khi mở rộng nhánh:', err);
      set({ isLoading: false });
    }
  },

  toggleCollapse: async (nodeId: string) => {
    const { graph } = get();
    if (!graph) return;

    const targetNode = graph.nodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    const newCollapseState = !targetNode.is_collapsed;

    // Cập nhật UI lạc quan tức thì (0 token, 0 delay)
    // CHỈ thay đổi is_collapsed của chính targetNode!
    // Tuyệt đối không cascade gán is_collapsed = true cho các node con,
    // vì SvgGridCanvas tự động lọc hiển thị dựa trên toàn bộ chuỗi tổ tiên (ancestor chain).
    const updatedNodes = graph.nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, is_collapsed: newCollapseState };
      }
      return n;
    });

    set({ graph: { ...graph, nodes: updatedNodes } });

    // Đồng bộ sang SQLite backend
    try {
      await fetch('/api/graph/prune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node_id: nodeId,
          action: newCollapseState ? 'collapse' : 'expand'
        })
      });
    } catch (err) {
      console.warn('Lỗi khi lưu trạng thái thu gọn vào backend:', err);
    }
  },

  deleteNode: async (nodeId: string) => {
    const { graph } = get();
    if (!graph) return;

    // Xác định các node cần xóa
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

    const remainingNodes = graph.nodes.filter(n => !idsToDelete.has(n.id));
    const remainingEdges = graph.edges.filter(e => !idsToDelete.has(e.from) && !idsToDelete.has(e.to));

    // Reset lại trạng thái của node cha nếu con bị xóa hết
    for (const parent of remainingNodes) {
      const hasChild = remainingNodes.some(n => n.parent_id === parent.id);
      if (!hasChild && parent.id === 'node-khien-khoa') {
        parent.fully_explored = false;
        parent.is_collapsed = false;
        parent.collapsed_count = 0;
      }
    }

    const nextSelectedId = remainingNodes.some(n => n.id === get().selectedNodeId)
      ? get().selectedNodeId
      : remainingNodes[0]?.id || '';

    set({
      graph: { ...graph, nodes: remainingNodes, edges: remainingEdges },
      selectedNodeId: nextSelectedId
    });

    try {
      await fetch('/api/graph/prune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node_id: nodeId,
          action: 'delete_permanently'
        })
      });
    } catch (err) {
      console.warn('Lỗi khi xóa node trên backend:', err);
    }
  },

  resetGraph: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/graph/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        set({ graph: data.graph, selectedNodeId: 'node-su-co', isLoading: false });
      }
    } catch (err) {
      console.error('Lỗi khi đặt lại đồ thị:', err);
      set({ isLoading: false });
    }
  },

  spawnNode: async (conceptType: string, position?: { x: number; y: number }, options?: { title?: string; category?: string; description?: string }) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/graph/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_type: conceptType,
          position,
          title: options?.title,
          category: options?.category,
          description: options?.description
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.spawned) {
          const safeNodes = resolveNodeCollisions(data.graph.nodes);
          set({
            graph: { ...data.graph, nodes: safeNodes },
            selectedNodeId: data.node?.id || get().selectedNodeId,
            isLoading: false,
            isDrawerOpen: true
          });
        } else {
          alert(data.message);
          set({ isLoading: false });
        }
      }
    } catch (err) {
      console.error('Lỗi khi spawn node:', err);
      set({ isLoading: false });
    }
  },

  spawnCluster: async (payload: SpawnClusterPayload) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/graph/spawn-cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.spawned) {
          const safeNodes = resolveNodeCollisions(data.graph.nodes);
          // Focus vào node đầu tiên của cụm vừa sinh
          const firstClusterNode = safeNodes.find(n => n.cluster_id === data.cluster_id);
          set({
            graph: { ...data.graph, nodes: safeNodes },
            selectedNodeId: firstClusterNode?.id || get().selectedNodeId,
            isLoading: false,
            isDrawerOpen: true
          });
        } else {
          alert(data.message);
          set({ isLoading: false });
        }
      }
    } catch (err) {
      console.error('Lỗi khi spawn cluster:', err);
      set({ isLoading: false });
    }
  }
}));
