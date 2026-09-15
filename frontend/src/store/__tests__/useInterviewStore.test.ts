import { describe, it, expect, beforeEach } from 'vitest';
import { useInterviewStore } from '../useInterviewStore.js';
import { InterviewTopicEntity } from '../../types/interviewTypes.js';

const mockTopics: InterviewTopicEntity[] = [
  {
    id: 'topic-react-1',
    domain_id: 'domain-frontend',
    domain_title: '1. Frontend Performance & React Internals',
    title: 'useCallback & Referential Equality',
    target_intent: 'Test mental model',
    recall_5s: 'Memory address equality',
    interview_answer: 'Sample answer',
    layers: {
      l1_junior: 'Junior explanation',
      l2_middle: 'Middle explanation',
      l3_senior: 'Senior trade-offs'
    },
    why_ladder: [],
    trigger_keywords: ['useCallback'],
    trade_offs: {
      when_use: 'Expensive props',
      when_not_use: 'Inline handlers',
      pros: ['Prevent re-render'],
      cons: ['Extra memory']
    },
    common_traps: ['Over-optimizing'],
    follow_ups: []
  },
  {
    id: 'topic-node-1',
    domain_id: 'domain-backend',
    domain_title: '5. Node.js Architecture & Concurrency',
    title: 'Event Loop Phases & Worker Threads',
    target_intent: 'Test Node concurrency model',
    recall_5s: 'libuv event loop phases',
    interview_answer: 'Sample answer 2',
    layers: {
      l1_junior: 'Junior explanation 2',
      l2_middle: 'Middle explanation 2',
      l3_senior: 'Senior trade-offs 2'
    },
    why_ladder: [],
    trigger_keywords: ['event loop'],
    trade_offs: {
      when_use: 'I/O heavy',
      when_not_use: 'CPU heavy',
      pros: ['High concurrency'],
      cons: ['Single threaded']
    },
    common_traps: ['Blocking main thread'],
    follow_ups: []
  }
];

describe('useInterviewStore - Instant In-Memory Switching & Zero Stale Flash', () => {
  beforeEach(() => {
    useInterviewStore.setState({
      activeTab: 'reader',
      domains: [],
      selectedDomainId: 'domain-frontend',
      allTopics: mockTopics,
      topics: [mockTopics[0]],
      selectedTopicId: 'topic-react-1',
      gapMapSummary: null,
      searchQuery: '',
      isLoading: false
    });
  });

  it('should switch domain and topic atomically via selectDomainAndTopic with zero stale state', () => {
    const store = useInterviewStore.getState();
    store.selectDomainAndTopic('domain-backend', 'topic-node-1', 'reader');

    const state = useInterviewStore.getState();
    expect(state.selectedDomainId).toBe('domain-backend');
    expect(state.selectedTopicId).toBe('topic-node-1');
    expect(state.topics.length).toBe(1);
    expect(state.topics[0].id).toBe('topic-node-1');
  });

  it('should instantly filter topics when selectDomain is called from memory', () => {
    const store = useInterviewStore.getState();
    store.selectDomain('domain-backend');

    const state = useInterviewStore.getState();
    expect(state.selectedDomainId).toBe('domain-backend');
    expect(state.selectedTopicId).toBe('topic-node-1');
    expect(state.topics[0].title).toBe('Event Loop Phases & Worker Threads');
  });

  it('should auto-sync domain when selectTopic is called for a cross-domain topic', () => {
    const store = useInterviewStore.getState();
    store.selectTopic('topic-node-1');

    const state = useInterviewStore.getState();
    expect(state.selectedDomainId).toBe('domain-backend');
    expect(state.selectedTopicId).toBe('topic-node-1');
  });
});
