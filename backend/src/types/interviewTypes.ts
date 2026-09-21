export type GapStatus = 'MUST_LEARN' | 'WEAK' | 'KNOW' | 'READY';

export interface FollowUpItem {
  question: string;
  answer_skeleton: string;
}

export interface WhyLadderItem {
  question: string;
  answer: string;
}

export interface CodeReactionItem {
  code: string;
  question: string;
  explanation: string;
  fix?: string;
}

export interface TradeOffs {
  when_use: string;
  when_not_use: string;
  pros: string[];
  cons: string[];
  alternatives: string[];
}

export interface TopicLayers {
  l1_junior: string;    // Tôi phải biết nó là gì
  l2_middle: string;    // Tôi phải giải thích tại sao nó hoạt động như vậy
  l3_senior: string;    // Trade-off, production implication, failure case, debugging, scale
}

export interface PracticalExample {
  title?: string;
  code?: string;
  scenario?: string;
}

export interface InterviewTopicEntity {
  id: string;
  domain_id: string;
  domain_title: string;
  title: string;
  target_intent: string;              // 🎯 Interviewer đang test gì?
  trigger_keywords: string[];         // ⚡ keyword → keyword → mental model
  recall_5s: string;                  // 🧠 5-Second Recall
  interview_answer: string;           // 🗣️ Spoken answer (20-40s)
  deep_dive: string;                  // 🔍 Deep Dive
  practical_example?: PracticalExample; // 💻 Practical Example
  trade_offs: TradeOffs;              // ⚖️ Trade-offs
  follow_ups?: FollowUpItem[];        // 🔥 Follow-up Questions
  common_traps?: string[];            // ❌ Common Traps
  active_recall?: string[];           // 🧪 Active Recall Questions
  layers: TopicLayers;                // 📶 L1 / L2 / L3
  why_ladder?: WhyLadderItem[];       // 🪜 "Why?" Ladder
  code_reaction?: CodeReactionItem;   // 💻 Code Reaction snippet
  cross_link_node_id?: string;        // Liên kết tới Node ID trên Canvas kiến trúc nếu có
  created_at?: string;
  updated_at?: string;
}

export interface UserTopicProgress {
  topic_id: string;
  gap_status: GapStatus;
  reviewed_count: number;
  last_reviewed_at: string | null;
  notes?: string;
}

export type RoleTrack = 'all' | 'frontend' | 'backend' | 'devops_cloud' | 'architecture' | 'drills';

export interface DomainMeta {
  id: string;
  number: number;
  title: string;
  description: string;
  icon?: string;
  track?: RoleTrack;
  prerequisites?: string[];
  downstream?: string[];
  related_domains?: string[];
  total_topics: number;
  ready_count: number;
  weak_count: number;
  must_learn_count: number;
  know_count: number;
}

export interface GapMapSummary {
  total_domains: number;
  total_topics: number;
  ready_count: number;
  know_count: number;
  weak_count: number;
  must_learn_count: number;
  ready_percentage: number;
}
