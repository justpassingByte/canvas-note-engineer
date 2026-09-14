import { describe, it, expect } from 'vitest';
import { interviewService, DOMAIN_CATALOG } from '../services/interviewService.js';
import { InterviewTopicEntity } from '../types/interviewTypes.js';

describe('Interview Lab Integration Test Suite', () => {
  it('should list all 29 standard interview domains', () => {
    const domains = interviewService.getDomains();
    expect(domains).toHaveLength(29);
    expect(domains[0].id).toBe('domain-01-js-fundamentals');
    expect(domains[3].id).toBe('domain-04-react-hooks');
    expect(domains[28].id).toBe('domain-29-spaced-repetition');
  });

  it('should contain high quality seed topics out of the box', () => {
    const topics = interviewService.getTopics();
    expect(topics.length).toBeGreaterThanOrEqual(5);

    // Verify React Hooks topic
    const reactHookTopic = topics.find(t => t.id === 'topic-usecallback-memo');
    expect(reactHookTopic).toBeDefined();
    expect(reactHookTopic?.trigger_keywords).toContain('useCallback');
    expect(reactHookTopic?.layers.l3_senior).toBeDefined();
    expect(reactHookTopic?.why_ladder?.length).toBeGreaterThan(0);
    expect(reactHookTopic?.code_reaction?.code).toBeDefined();
    expect(reactHookTopic?.trade_offs.when_use).toBeDefined();

    // Verify Next.js topic
    const nextTopic = topics.find(t => t.id === 'topic-nextjs-rsc-vs-client');
    expect(nextTopic).toBeDefined();
    expect(nextTopic?.domain_id).toBe('domain-06-nextjs');

    // Verify PostgreSQL topic
    const sqlTopic = topics.find(t => t.id === 'topic-postgres-btree-explain');
    expect(sqlTopic).toBeDefined();
    expect(sqlTopic?.trigger_keywords).toContain('B-Tree Index');

    // Verify Redis topic
    const redisTopic = topics.find(t => t.id === 'topic-redis-stampede-locks');
    expect(redisTopic).toBeDefined();
    expect(redisTopic?.trigger_keywords).toContain('Cache Stampede');

    // Verify Idempotency topic
    const idempotencyTopic = topics.find(t => t.id === 'topic-api-idempotency-keys');
    expect(idempotencyTopic).toBeDefined();
    expect(idempotencyTopic?.trigger_keywords).toContain('Idempotency-Key');
  });

  it('should update topic progress and reflect in Gap Map calculations', () => {
    const topicId = 'topic-usecallback-memo';
    
    // Initial update to WEAK
    interviewService.updateProgress({
      topic_id: topicId,
      gap_status: 'WEAK',
      notes: 'Need to review stale closure edge case'
    });

    let updated = interviewService.getTopicById(topicId);
    expect(updated?.progress?.gap_status).toBe('WEAK');
    expect(updated?.progress?.reviewed_count).toBeGreaterThanOrEqual(1);

    // Update to READY
    interviewService.updateProgress({
      topic_id: topicId,
      gap_status: 'READY'
    });

    updated = interviewService.getTopicById(topicId);
    expect(updated?.progress?.gap_status).toBe('READY');

    const gapMap = interviewService.getGapMap();
    expect(gapMap.ready_count).toBeGreaterThanOrEqual(1);
    expect(gapMap.ready_percentage).toBeGreaterThan(0);
  });

  it('should allow saving and deleting a custom topic', () => {
    const customTopic: InterviewTopicEntity = {
      id: 'topic-test-custom-docker',
      domain_id: 'domain-20-docker-linux',
      domain_title: 'Domain 20 — Docker & Linux Ops',
      title: 'Multi-stage Docker Builds & Layer Caching',
      target_intent: 'Kiểm tra kỹ năng tối ưu image size và thời gian CI/CD build',
      trigger_keywords: ['Docker', 'Multi-stage build', 'Layer caching', 'Alpine'],
      recall_5s: 'Multi-stage build tách biệt build environment nặng khỏi runtime container nhẹ để giảm size từ 1GB xuống 50MB.',
      interview_answer: 'Dùng multi-stage build để chỉ copy compiled artifact sang image cuối, loại bỏ toàn bộ compiler và node_modules dev.',
      deep_dive: 'Docker lưu cache theo từng lệnh RUN/COPY. Để tối ưu layer cache, copy package.json và npm install trước khi copy source code.',
      trade_offs: {
        when_use: 'Production containerization',
        when_not_use: 'Local quick dev mounts',
        pros: ['Image nhẹ', 'Bảo mật tốt'],
        cons: ['Cú pháp Dockerfile phức tạp hơn'],
        alternatives: ['Distroless images']
      },
      layers: {
        l1_junior: 'Multi-stage build là kỹ thuật viết nhiều FROM trong 1 Dockerfile',
        l2_middle: 'Giúp copy file build từ stage trước sang stage sau',
        l3_senior: 'Tối ưu layer caching và giảm blast radius về security'
      }
    };

    interviewService.saveTopic(customTopic);
    const retrieved = interviewService.getTopicById(customTopic.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe(customTopic.title);

    // Delete custom topic
    interviewService.deleteTopic(customTopic.id);
    const afterDelete = interviewService.getTopicById(customTopic.id);
    expect(afterDelete).toBeNull();
  });
});
