import React, { useEffect } from 'react';
import './styles/engineering-tokens.css';
import './styles/canvas.css';
import './styles/node.css';
import './styles/drawer.css';

import { SvgGridCanvas } from './components/Canvas/SvgGridCanvas.js';
import { FieldNotesDrawer } from './components/Drawer/FieldNotesDrawer.js';
import { useGraphStore } from './store/useGraphStore.js';
import { INITIAL_PAYMENT_GRAPH } from './data/initialGraph.js';

export const App: React.FC = () => {
  const { graph, setGraph, fetchCurrentGraph } = useGraphStore();

  useEffect(() => {
    // Khởi tạo đồ thị: thử tải từ backend SQLite, nếu offline dùng INITIAL_PAYMENT_GRAPH
    if (!graph) {
      fetchCurrentGraph().then(() => {
        if (!useGraphStore.getState().graph) {
          setGraph(INITIAL_PAYMENT_GRAPH);
        }
      });
    }
  }, []);

  return (
    <main className="khong-gian-lam-viec">
      <SvgGridCanvas />
      <FieldNotesDrawer />
    </main>
  );
};

export default App;
