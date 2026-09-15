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
  allTopics: InterviewTopicEntity[];
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
  selectDomainAndTopic: (domainId: string | null, topicId: string | null, tab?: 'reader' | 'drill' | 'gap_map') => void;
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
  allTopics: [],
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
    // If allTopics already loaded in memory, filter instantly
    const targetDomainId = domainId !== undefined ? domainId : get().selectedDomainId;
    const currentAll = get().allTopics;

    if (currentAll.length > 0) {
      const filtered = targetDomainId
        ? currentAll.filter((t) => t.domain_id === targetDomainId)
        : currentAll;
      const currentSelected = get().selectedTopicId;
      const validSelected = filtered.some((t) => t.id === currentSelected)
        ? currentSelected
        : filtered[0]?.id || null;

      set({
        topics: filtered,
        selectedDomainId: targetDomainId || null,
        selectedTopicId: validSelected
      });
      return;
    }

    set({ isLoading: true });
    try {
      // Fetch ALL topics once into memory cache
      const res = await fetch(`${API_BASE}/topics`);
      if (res.ok) {
        const allData: InterviewTopicEntity[] = await res.json();
        const effectiveDomainId = targetDomainId || (get().domains.length > 0 ? get().domains[0].id : null);
        const filtered = effectiveDomainId
          ? allData.filter((t) => t.domain_id === effectiveDomainId)
          : allData;

        const currentSelected = get().selectedTopicId;
        const validSelected = filtered.some((t) => t.id === currentSelected)
          ? currentSelected
          : filtered[0]?.id || null;

        set({
          allTopics: allData,
          topics: filtered,
          selectedDomainId: effectiveDomainId,
          selectedTopicId: validSelected
        });
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
    const all = get().allTopics;
    const filtered = domainId ? all.filter((t) => t.domain_id === domainId) : all;
    set({
      selectedDomainId: domainId,
      topics: filtered,
      selectedTopicId: filtered[0]?.id || null,
      drillIndex: 0,
      isCardFlipped: false
    });
    get().resetTimer();
  },

  selectTopic: (topicId) => {
    if (!topicId) {
      set({ selectedTopicId: null, isCardFlipped: false });
      return;
    }
    const all = get().allTopics;
    const targetTopic = all.find((t) => t.id === topicId);
    const domainId = targetTopic?.domain_id || get().selectedDomainId;
    const filtered = domainId ? all.filter((t) => t.domain_id === domainId) : all;

    set({
      selectedDomainId: domainId,
      topics: filtered.length > 0 ? filtered : all,
      selectedTopicId: topicId,
      isCardFlipped: false
    });
    get().resetTimer();
  },

  selectDomainAndTopic: (domainId, topicId, tab) => {
    const all = get().allTopics;
    const targetTopic = topicId ? all.find((t) => t.id === topicId) : null;
    const effectiveDomainId = domainId || targetTopic?.domain_id || get().selectedDomainId;
    const filtered = effectiveDomainId ? all.filter((t) => t.domain_id === effectiveDomainId) : all;
    const effectiveTopicId = topicId || targetTopic?.id || filtered[0]?.id || null;

    set({
      ...(tab ? { activeTab: tab } : {}),
      selectedDomainId: effectiveDomainId,
      topics: filtered.length > 0 ? filtered : all,
      selectedTopicId: effectiveTopicId,
      drillIndex: 0,
      isCardFlipped: false
    });
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
        const updater = (t: InterviewTopicEntity) =>
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
            : t;

        set((state) => ({
          allTopics: state.allTopics.map(updater),
          topics: state.topics.map(updater)
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

      set((state) => {
        const newAll = [data.topic, ...state.allTopics.filter((t) => t.id !== data.topic.id)];
        const effectiveDomain = domainId || state.selectedDomainId;
        const newFiltered = effectiveDomain ? newAll.filter((t) => t.domain_id === effectiveDomain) : newAll;
        return {
          allTopics: newAll,
          topics: newFiltered,
          selectedDomainId: effectiveDomain,
          selectedTopicId: data.topic.id,
          isGenerateModalOpen: false
        };
      });

      await get().fetchDomains();
      await get().fetchGapMap();
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

      // Re-fetch all to synchronize
      set({ allTopics: [] });
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
