import { ProviderFactory } from '../providers/providerFactory.js';
import { sqliteClient } from '../db/sqliteClient.js';
import { DOMAIN_CATALOG, DOMAIN_DEFAULTS } from '../data/domainCatalog.js';
import { InterviewTopicEntity } from '../types/interviewTypes.js';

export function resolveTopicCrossLinkNodeId(domainId: string, title: string): string {
  const d = domainId.toLowerCase();
  const t = title.toLowerCase();

  if (d.includes('websocket') || t.includes('websocket') || t.includes('realtime') || t.includes('sse')) return 'node-websocket-realtime';
  if (d.includes('docker') || d.includes('linux') || t.includes('docker') || t.includes('container') || t.includes('sigterm') || t.includes('oom')) return 'node-docker-linux';
  if (d.includes('cicd') || t.includes('github actions') || t.includes('blue-green') || t.includes('canary') || t.includes('migration')) return 'node-cicd-pipeline';
  if (d.includes('testing') || t.includes('playwright') || t.includes('test') || t.includes('vitest') || t.includes('mock')) return 'node-testing-qa';
  if (d.includes('react') || t.includes('react') || t.includes('virtual dom') || t.includes('hook') || t.includes('state')) return 'node-ui-view';
  if (d.includes('nextjs') || t.includes('nextjs') || t.includes('ssr') || t.includes('rsc') || t.includes('streaming')) return 'node-rendering-ssr';
  if (d.includes('auth') || d.includes('security') || t.includes('jwt') || t.includes('token') || t.includes('session') || t.includes('cookie')) return 'node-auth-service';
  if (d.includes('postgresql') || d.includes('database') || t.includes('postgres') || t.includes('sql') || t.includes('acid') || t.includes('index') || t.includes('lock')) return 'node-tru-db';
  if (d.includes('redis') || t.includes('redis') || t.includes('cache') || t.includes('redlock') || t.includes('ttl')) return 'node-cache-redis';
  if (d.includes('queue') || d.includes('kafka') || t.includes('rabbitmq') || t.includes('bullmq') || t.includes('queue') || t.includes('dlq')) return 'node-queue-kafka';
  if (d.includes('file') || d.includes('storage') || t.includes('s3') || t.includes('presigned') || t.includes('upload')) return 'node-s3-upload';
  if (d.includes('observability') || d.includes('ci-cd') || t.includes('telemetry') || t.includes('tracing') || t.includes('p99')) return 'node-observability';
  if (d.includes('gateway') || d.includes('api-design') || t.includes('gateway') || t.includes('rate limit') || t.includes('idempotency')) return 'node-cong-gateway';
  return 'node-backend-service';
}

const SYSTEM_PROMPT = `
Bạn là một Senior Fullstack Engineer + Technical Interview Coach chuyên đào tạo ứng viên cấp độ Senior / Production phỏng vấn vào các công ty Product/Global hàng đầu.
Nhiệm vụ của bạn là tạo một BỘ PHẢN XẠ PHỎNG VẤN (Interview Reaction Cheatsheet) cho một topic kỹ thuật cụ thể.

Mục tiêu cốt lõi:
- Không viết giáo trình dài dòng.
- Tạo cấu trúc trigger memory phản xạ trong 5-15 giây và trả lời trôi chảy trong 20-40 giây.
- Luôn giải thích BẢN CHẤT và TRADE-OFFS (được gì, mất gì, khi nào KHÔNG nên dùng).
- Có 3 tầng nhận thức: L1 (Junior: là gì), L2 (Middle: cơ chế hoạt động), L3 (Senior/Production: trade-offs, production failure, scale, debugging).

Bạn PHẢI trả về duy nhất một JSON object hợp lệ (không kèm markdown \`\`\`json ở ngoài) theo schema sau:
{
  "title": "Tên chủ đề ngắn gọn",
  "target_intent": "Interviewer đang thực sự test điều gì ở ứng viên?",
  "trigger_keywords": ["keyword1", "keyword2", "keyword3", "mental model"],
  "recall_5s": "Nếu chỉ có 5 giây để nhớ topic này, mental model ngắn gọn tối đa 3-5 dòng là gì?",
  "interview_answer": "Câu trả lời trực tiếp có thể nói trong phòng phỏng vấn khoảng 20-40 giây, tự nhiên, không sách vở sáo rỗng.",
  "deep_dive": "Các điểm chuyên sâu interviewer có thể xoáy sâu vào cơ chế hoạt động bên dưới.",
  "practical_example": {
    "title": "Tên ví dụ thực tế",
    "code": "Đoạn code minh họa ngắn gọn, thực chiến",
    "scenario": "Ngữ cảnh thực tế tại sao dùng code này"
  },
  "trade_offs": {
    "when_use": "Khi nào nên dùng",
    "when_not_use": "Khi nào TUYỆT ĐỐI KHÔNG NÊN dùng",
    "pros": ["Ưu điểm 1", "Ưu điểm 2"],
    "cons": ["Nhược điểm 1", "Nhược điểm 2"],
    "alternatives": ["Giải pháp thay thế 1", "Giải pháp thay thế 2"]
  },
  "follow_ups": [
    { "question": "Câu hỏi đào sâu 1", "answer_skeleton": "Khung câu trả lời ngắn gọn" },
    { "question": "Câu hỏi đào sâu 2", "answer_skeleton": "Khung câu trả lời ngắn gọn" }
  ],
  "common_traps": [
    "Sai lầm / hiểu lầm tai hại phổ biến 1 khiến ứng viên mất điểm",
    "Sai lầm phổ biến 2"
  ],
  "active_recall": [
    "Câu hỏi 1 để tự kiểm tra mà không nhìn đáp án",
    "Câu hỏi 2"
  ],
  "layers": {
    "l1_junior": "Tôi phải biết nó là gì (định nghĩa)",
    "l2_middle": "Tôi phải giải thích tại sao nó hoạt động như vậy (cơ chế nội tại)",
    "l3_senior": "Tôi phải biết trade-off, production failure case, debugging và scale (Senior/Production Level)"
  },
  "why_ladder": [
    { "question": "Tại sao dùng X?", "answer": "Để giải quyết vấn đề A" },
    { "question": "Tại sao vấn đề A lại quan trọng?", "answer": "Vì ảnh hưởng tới B" },
    { "question": "Tại sao B lại quan trọng?", "answer": "Vì ảnh hưởng tới C" },
    { "question": "Khi nào thì KHÔNG dùng?", "answer": "Khi D xảy ra" }
  ],
  "code_reaction": {
    "code": "Đoạn code ngắn chứa bug hoặc tình huống cần phán đoán",
    "question": "Chuyện gì xảy ra / Lỗi gì ở đoạn code trên?",
    "explanation": "Giải thích nguyên nhân cốt lõi",
    "fix": "Cách sửa chữa chuẩn xác"
  }
}
`;

export class InterviewGenerator {
  public static async generateTopic(
    topicPrompt: string,
    domainId?: string,
    forceOffline: boolean = true
  ): Promise<InterviewTopicEntity> {
    let targetDomain = DOMAIN_CATALOG.find(d => d.id === domainId);
    if (!targetDomain) {
      targetDomain = DOMAIN_CATALOG[0];
    }

    if (forceOffline) {
      return this.generateOfflineTopic(topicPrompt, targetDomain);
    }

    const provider = ProviderFactory.getActiveProvider();
    if (!provider) {
      // Tự sinh nội dung chuẩn Senior/Production trực tiếp (Offline Autonomous Mode) không cần provider bên ngoài
      return this.generateOfflineTopic(topicPrompt, targetDomain);
    }

    try {
      const userPrompt = `
Hãy tạo bản cheatsheet phản xạ kỹ sư chuyên sâu chuẩn Senior / Production cho chủ đề sau:
- Chủ đề: "${topicPrompt}"
- Thuộc lĩnh vực: "${targetDomain.title}" (${targetDomain.description})

Lưu ý:
- Trả về DUY NHẤT một JSON hợp lệ.
- Ngôn ngữ: Tiếng Việt kết hợp thuật ngữ kỹ thuật tiếng Anh chuẩn xác.
- Đáp ứng chuẩn mực Senior / Production: nói về concurrency, trade-offs, failure modes, không giải thích như cho fresher.
`;

      const rawResponse = await provider.generateCompletion({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: userPrompt,
        temperature: 0.3,
        jsonMode: true
      });

      const cleanJson = rawResponse.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      const topicSlug = 'topic-' + (parsed.title || topicPrompt)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) + '-' + Date.now().toString(36).slice(-4);

      const topicEntity: InterviewTopicEntity = {
        id: topicSlug,
        domain_id: targetDomain.id,
        domain_title: targetDomain.title,
        title: parsed.title || topicPrompt,
        target_intent: parsed.target_intent || 'Kiểm tra năng lực tư duy kỹ sư',
        trigger_keywords: Array.isArray(parsed.trigger_keywords) ? parsed.trigger_keywords : [parsed.title || topicPrompt],
        recall_5s: parsed.recall_5s || 'Mô hình tư duy phản xạ 5 giây.',
        interview_answer: parsed.interview_answer || '',
        deep_dive: parsed.deep_dive || '',
        practical_example: parsed.practical_example,
        trade_offs: parsed.trade_offs || {
          when_use: '',
          when_not_use: '',
          pros: [],
          cons: [],
          alternatives: []
        },
        follow_ups: parsed.follow_ups || [],
        common_traps: parsed.common_traps || [],
        active_recall: parsed.active_recall || [],
        layers: parsed.layers || {
          l1_junior: parsed.title,
          l2_middle: parsed.recall_5s,
          l3_senior: parsed.interview_answer
        },
        why_ladder: parsed.why_ladder || [],
        code_reaction: parsed.code_reaction,
        cross_link_node_id: resolveTopicCrossLinkNodeId(targetDomain.id, parsed.title || topicPrompt),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      sqliteClient.saveInterviewTopic(topicEntity);
      return topicEntity;
    } catch (err: any) {
      console.warn(`[InterviewGenerator] External provider call failed (${err.message}). Tự động sinh nội dung Senior / Production bằng Autonomous Offline Engine.`);
      return this.generateOfflineTopic(topicPrompt, targetDomain);
    }
  }

  public static async generateDomainTopics(domainId: string): Promise<InterviewTopicEntity[]> {
    const domain = DOMAIN_CATALOG.find(d => d.id === domainId);
    if (!domain) {
      throw new Error(`Không tìm thấy domain với ID: ${domainId}`);
    }

    const defaults = DOMAIN_DEFAULTS[domain.id] || [
      `${domain.title} Core Mechanics`,
      `${domain.title} Production Architecture`,
      `${domain.title} Troubleshooting & Failure Modes`
    ];

    const provider = ProviderFactory.getActiveProvider();
    if (!provider) {
      // Không có AI Provider: Không tự động sinh dữ liệu template rác
      return [];
    }

    const outlinePrompt = `
Dựa vào Domain kỹ thuật: "${domain.title}" (Mô tả: ${domain.description}),
hãy liệt kê đúng 3 chủ đề (topics) quan trọng và hay bị phỏng vấn nhất đối với vị trí Senior Fullstack Engineer.


Trả về duy nhất một JSON array chứa 3 string tên topic, ví dụ:
["Tên topic 1", "Tên topic 2", "Tên topic 3"]
`;

    let topicNames: string[] = [];
    try {
      const outlineRaw = await provider.generateCompletion({
        systemPrompt: 'Bạn là chuyên gia thiết kế đề phỏng vấn kỹ sư phần mềm. Trả về duy nhất JSON array string.',
        userPrompt: outlinePrompt,
        temperature: 0.3,
        jsonMode: true
      });

      const cleanJson = outlineRaw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      topicNames = JSON.parse(cleanJson);
      if (!Array.isArray(topicNames)) topicNames = [];
    } catch (err: any) {
      console.warn(`[InterviewGenerator] External provider outline failed (${err.message}).`);
      return [];
    }

    const generatedTopics: InterviewTopicEntity[] = [];
    for (const name of topicNames.slice(0, 3)) {
      try {
        const topic = await this.generateTopic(name, domain.id, false);
        generatedTopics.push(topic);
      } catch (e: any) {
        console.error(`Lỗi sinh topic ${name}:`, e.message);
      }
    }

    return generatedTopics;
  }

  public static generateOfflineTopic(topicPrompt: string, domain: { id: string; title: string; description: string }): InterviewTopicEntity {
    const topicSlug = 'topic-' + topicPrompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) + '-' + Date.now().toString(36).slice(-4);

    const titleClean = topicPrompt.trim();

    // Để rỗng sạch sẽ thay vì sinh template giả mạo, đáp ứng yêu cầu người dùng
    const entity: InterviewTopicEntity = {
      id: topicSlug,
      domain_id: domain.id,
      domain_title: domain.title,
      title: titleClean,
      target_intent: `Chủ đề "${titleClean}" thuộc chuyên đề ${domain.title}.`,
      trigger_keywords: [titleClean],
      recall_5s: `Chủ đề "${titleClean}" hiện chưa có nội dung thực chiến soạn sẵn. Vui lòng cấu hình AI Provider hoặc tự biên soạn phản xạ.`,
      interview_answer: '',
      deep_dive: '',
      practical_example: undefined,
      trade_offs: {
        when_use: '',
        when_not_use: '',
        pros: [],
        cons: [],
        alternatives: []
      },
      follow_ups: [],
      common_traps: [],
      active_recall: [],
      layers: {
        l1_junior: '',
        l2_middle: '',
        l3_senior: ''
      },
      why_ladder: [],
      code_reaction: undefined,
      cross_link_node_id: resolveTopicCrossLinkNodeId(domain.id, titleClean),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    sqliteClient.saveInterviewTopic(entity);
    return entity;
  }
}


