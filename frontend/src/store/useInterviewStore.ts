import { create } from 'zustand';
import {
  DomainMeta,
  InterviewTopicEntity,
  GapStatus,
  GapMapSummary
} from '../types/interviewTypes.js';

interface InterviewState {
  activeTab: 'reader' | 'drill' | 'gap_map';
  domains: DomainMeta[];
  selectedDomainId: string | null;
  topics: InterviewTopicEntity[];
  selectedTopicId: string | null;
  gapMapSummary: GapMapSummary | null;
  searchQuery: string;

  isLoading: boolean;
  isGenerating: boolean;
  generatingStatus: string | null;
  isGenerateModalOpen: boolean;

  // Flashcard Drill state
  drillIndex: number;
  isCardFlipped: boolean;
  drillFilterDomain: string | 'ALL';
  drillFilterStatus: GapStatus | 'ALL';

  // Speech Practice Timer state
  timerDuration: number;
  timeLeft: number;
  isTimerRunning: boolean;

  // Actions
  setActiveTab: (tab: 'reader' | 'drill' | 'gap_map') => void;
  fetchDomains: () => Promise<void>;
  fetchTopics: (domainId?: string) => Promise<void>;
  fetchGapMap: () => Promise<void>;
  selectDomain: (domainId: string | null) => void;
  selectTopic: (topicId: string | null) => void;
  setSearchQuery: (query: string) => void;
  updateTopicProgress: (topicId: string, status: GapStatus, notes?: string) => Promise<void>;
  generateTopic: (topicPrompt: string, domainId?: string) => Promise<InterviewTopicEntity | null>;
  generateDomain: (domainId: string) => Promise<void>;
  toggleGenerateModal: (open?: boolean) => void;

  // Drill Actions
  setDrillFilterDomain: (domainId: string | 'ALL') => void;
  setDrillFilterStatus: (status: GapStatus | 'ALL') => void;
  flipCard: () => void;
  nextDrillCard: () => void;
  prevDrillCard: () => void;

  // Timer Actions
  setTimerDuration: (seconds: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
}

const API_BASE = '/api/interview';

export const useInterviewStore = create<InterviewState>((set, get) => ({
  activeTab: 'reader',
  domains: [],
  selectedDomainId: null,
  topics: [],
  selectedTopicId: null,
  gapMapSummary: null,
  searchQuery: '',

  isLoading: false,
  isGenerating: false,
  generatingStatus: null,
  isGenerateModalOpen: false,

  drillIndex: 0,
  isCardFlipped: false,
  drillFilterDomain: 'ALL',
  drillFilterStatus: 'ALL',

  timerDuration: 30,
  timeLeft: 30,
  isTimerRunning: false,

  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchDomains: async () => {
    try {
      const res = await fetch(`${API_BASE}/domains`);
      if (res.ok) {
        const data = await res.json();
        set({ domains: data });
        if (!get().selectedDomainId && data.length > 0) {
          const firstWithTopics = data.find((d: DomainMeta) => d.total_topics > 0) || data[0];
          set({ selectedDomainId: firstWithTopics.id });
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách domains:', err);
    }
  },

  fetchTopics: async (domainId) => {
    set({ isLoading: true });
    try {
      const url = domainId ? `${API_BASE}/topics?domain_id=${domainId}` : `${API_BASE}/topics`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        set({ topics: data });
        if (data.length > 0 && !get().selectedTopicId) {
          set({ selectedTopicId: data[0].id });
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách topics:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchGapMap: async () => {
    try {
      const res = await fetch(`${API_BASE}/gap-map`);
      if (res.ok) {
        const data = await res.json();
        set({ gapMapSummary: data });
      }
    } catch (err) {
      console.error('Lỗi tải Gap Map:', err);
    }
  },

  selectDomain: (domainId) => {
    set({ selectedDomainId: domainId, selectedTopicId: null, drillIndex: 0, isCardFlipped: false });
    get().fetchTopics(domainId || undefined);
  },

  selectTopic: (topicId) => {
    set({ selectedTopicId: topicId, isCardFlipped: false });
    get().resetTimer();
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  updateTopicProgress: async (topicId, status, notes) => {
    try {
      const res = await fetch(`${API_BASE}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id: topicId, gap_status: status, notes })
      });
      if (res.ok) {
        set((state) => ({
          topics: state.topics.map((t) =>
            t.id === topicId
              ? {
                  ...t,
                  progress: {
                    ...(t.progress || {
                      topic_id: topicId,
                      gap_status: status,
                      reviewed_count: 0,
                      last_reviewed_at: null
                    }),
                    gap_status: status,
                    reviewed_count: (t.progress?.reviewed_count || 0) + 1,
                    last_reviewed_at: new Date().toISOString(),
                    notes: notes !== undefined ? notes : t.progress?.notes
                  }
                }
              : t
          )
        }));
        get().fetchDomains();
        get().fetchGapMap();
      }
    } catch (err) {
      console.error('Lỗi cập nhật tiến độ:', err);
    }
  },

  generateTopic: async (topicPrompt, domainId) => {
    set({ isGenerating: true, generatingStatus: `Đang sinh topic: "${topicPrompt}"...` });
    try {
      const res = await fetch(`${API_BASE}/generate-topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_prompt: topicPrompt, domain_id: domainId || get().selectedDomainId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi sinh topic');
      }

      await get().fetchTopics(get().selectedDomainId || undefined);
      await get().fetchDomains();
      await get().fetchGapMap();
      set({ selectedTopicId: data.topic.id, isGenerateModalOpen: false });
      return data.topic;
    } catch (err: any) {
      alert(`Không thể sinh topic: ${err.message}`);
      return null;
    } finally {
      set({ isGenerating: false, generatingStatus: null });
    }
  },

  generateDomain: async (domainId) => {
    set({ isGenerating: true, generatingStatus: 'Đang trích xuất và sinh toàn bộ topics cho domain...' });
    try {
      const res = await fetch(`${API_BASE}/generate-domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain_id: domainId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi sinh domain');
      }

      await get().fetchTopics(domainId);
      await get().fetchDomains();
      await get().fetchGapMap();
      set({ isGenerateModalOpen: false });
    } catch (err: any) {
      alert(`Lỗi sinh domain: ${err.message}`);
    } finally {
      set({ isGenerating: false, generatingStatus: null });
    }
  },

  toggleGenerateModal: (open) => {
    set((state) => ({
      isGenerateModalOpen: open !== undefined ? open : !state.isGenerateModalOpen
    }));
  },

  setDrillFilterDomain: (domainId) => set({ drillFilterDomain: domainId, drillIndex: 0, isCardFlipped: false }),
  setDrillFilterStatus: (status) => set({ drillFilterStatus: status, drillIndex: 0, isCardFlipped: false }),

  flipCard: () => set((state) => ({ isCardFlipped: !state.isCardFlipped })),

  nextDrillCard: () => {
    set((state) => ({
      drillIndex: state.drillIndex + 1,
      isCardFlipped: false,
      timeLeft: state.timerDuration,
      isTimerRunning: false
    }));
  },

  prevDrillCard: () => {
    set((state) => ({
      drillIndex: Math.max(0, state.drillIndex - 1),
      isCardFlipped: false,
      timeLeft: state.timerDuration,
      isTimerRunning: false
    }));
  },

  setTimerDuration: (seconds) => set({ timerDuration: seconds, timeLeft: seconds }),
  startTimer: () => set({ isTimerRunning: true }),
  pauseTimer: () => set({ isTimerRunning: false }),
  resetTimer: () => set((state) => ({ timeLeft: state.timerDuration, isTimerRunning: false })),
  tickTimer: () => {
    const { timeLeft, isTimerRunning } = get();
    if (isTimerRunning && timeLeft > 0) {
      set({ timeLeft: timeLeft - 1 });
    } else if (isTimerRunning && timeLeft <= 0) {
      set({ isTimerRunning: false });
    }
  }
}));
