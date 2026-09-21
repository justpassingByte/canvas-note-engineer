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
  l1_junior: string;
  l2_middle: string;
  l3_senior: string;
}

export interface PracticalExample {
  title?: string;
  code?: string;
  scenario?: string;
}

export interface UserTopicProgress {
  topic_id: string;
  gap_status: GapStatus;
  reviewed_count: number;
  last_reviewed_at: string | null;
  notes?: string;
}

export interface InterviewTopicEntity {
  id: string;
  domain_id: string;
  domain_title: string;
  title: string;
  target_intent: string;
  trigger_keywords: string[];
  recall_5s: string;
  interview_answer: string;
  deep_dive: string;
  practical_example?: PracticalExample;
  trade_offs: TradeOffs;
  follow_ups?: FollowUpItem[];
  common_traps?: string[];
  active_recall?: string[];
  layers: TopicLayers;
  why_ladder?: WhyLadderItem[];
  code_reaction?: CodeReactionItem;
  cross_link_node_id?: string;
  created_at?: string;
  updated_at?: string;
  progress?: UserTopicProgress;
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
