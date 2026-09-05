export type NodeBadgeType = 
  | 'su_co_canh_bao'
  | 'tranh_chap_phan_nhanh'
  | 'khien_bao_ve'
  | 'khoi_tru_database'
  | 'hop_kien_hang_domain'
  | 'hang_doi_message_queue'
  | 'bo_nho_dem_cache'
  | 'ghi_chep_so_sach';

export interface ReflexQuizItem {
  cau_hoi: string;
  lua_chon: [string, string];
  dung: 0 | 1;
  giai_thich: string;
  phan_tang?: 'Kiến trúc cốt lõi' | 'Tương tranh cao điểm' | 'Lan truyền sự cố' | 'Đánh đổi kỹ thuật' | 'Vận hành & Giám sát' | string;
}

export type ReflexQuiz = ReflexQuizItem | ReflexQuizItem[];

export type SchematicArchetype =
  | 'pipeline_filter'
  | 'split_allocation'
  | 'two_phase_state_machine'
  | 'table_row_lock'
  | 'cache_ttl_lock'
  | 'queue_outbox_conveyor'
  | 'hexagonal_ports'
  | 'cryptographic_hash_chain'
  | 'rbac_policy_matrix'
  | 'circuit_breaker_backoff'
  | 'token_family_tree'
  | 'fanout_batch_aggregator'
  | 'chan_loc_khien'
  | 'va_cham_song_song'
  | 'luu_tru_acid'
  | 'hang_doi_dieu_tiet'
  | 'bo_nho_dem_redis'
  | 'rate_limit_sliding'
  | 'zero_trust_pep'
  | 'oauth2_oidc'
  | 'token_blacklist'
  | 'pdp_policy'
  | 'audit_hash_chain'
  | 'default';

export interface SchematicData {
  actor?: string;
  component?: string;
  target?: string;
  status?: string;
  metric?: string;
  items?: Array<{ label: string; value?: string; status?: 'ok' | 'warn' | 'error' | 'info' }>;
  steps?: Array<{ title: string; desc?: string; active?: boolean }>;
  table?: { name: string; columns: string[]; lock_mode?: string };
  metrics?: Record<string, string | number>;
}

export interface AnimationParams {
  mau: SchematicArchetype | string;
  tham_so: Record<string, string>;
  schematic_layout?: SchematicArchetype;
  schematic_data?: SchematicData;
}

export interface IncidentDossier {
  boi_canh_tai: string;        // Traffic Scale: e.g. 50.000 req/s, P99 Latency
  nguyen_nhan_goc_re: string;   // RCA
  ban_kinh_anh_huong: string;   // Blast Radius
  chien_luoc_phong_thu: string; // Defense & Mitigation Strategy
}

export interface NodeDetails {
  phan_loai: string;
  tieu_de: string;
  ban_chat: string;
  chu_thich_so_do: string;
  ca_thuc_te: string[];
  rui_ro: string[];
  chuoi_sup_do?: string[];
  incident_dossier?: IncidentDossier;
}

export interface NodeEntity {
  id: string;
  bieu_tuong: NodeBadgeType;
  tieu_de: string;
  nhan_buoc: string;
  tom_tat: string;
  toa_do: { x: number; y: number };
  tam: { x: number; y: number };
  fully_explored: boolean;
  parent_id?: string;

  // Phân cấp kiến trúc 3 tầng (Hierarchical Domain & Cluster Isolation)
  domain_id?: string;
  cluster_id?: string;
  sub_cluster_id?: string;

  // Cổng đối ngoại & Phân loại hạ tầng thực tế
  is_public_interface?: boolean;
  infra_type?: 'redis' | 'postgres' | 'kafka' | 'service' | 'gateway' | 'worker';

  is_collapsed?: boolean;
  collapsed_count?: number;
  hoat_hoa: AnimationParams;
  chi_tiet: NodeDetails;
  trac_nghiem: ReflexQuiz;
  trac_nghiem_list?: ReflexQuizItem[];
}

export interface EdgeEntity {
  from: string;
  to: string;
  tu?: { x: number; y: number };
  den?: { x: number; y: number };
  nhan: string;
  kieu: 'duong-noi-day' | 'duong-xung-em-ai' | 'duong-xung-su-co' | 'duong-xung-tmdt';
  giai_thich?: string;
  loai_lien_ket?: 'KICH_HOAT' | 'HOA_GIAI' | 'DEM_LOC' | 'LUU_TRU' | 'GIAO_THOA';
}

export interface GraphData {
  id: string;
  topic: string;
  nodes: NodeEntity[];
  edges: EdgeEntity[];
}

export interface CompactClusterNode {
  title: string;
  role?: string;
  summary: string;
  schematic_template?: string;
  schematic_params?: Record<string, string>;
  schematic_data?: SchematicData;
  ban_chat?: string;
  ca_thuc_te?: string[];
  rui_ro?: string[];
  chuoi_sup_do?: string[];
  incident_dossier?: IncidentDossier;
  trac_nghiem?: ReflexQuiz;
  trac_nghiem_list?: ReflexQuizItem[];
  is_public_interface?: boolean;
  infra_type?: 'redis' | 'postgres' | 'kafka' | 'service' | 'gateway' | 'worker';
  sub_cluster_id?: string;
}

export interface CompactSubCluster {
  sub_cluster_id?: string;
  name: string;
  infra_type?: 'redis' | 'postgres' | 'kafka' | 'service' | 'gateway' | 'worker';
  namespace?: string;
  theme?: string;
  nodes: CompactClusterNode[];
  position_offset?: { x: number; y: number };
}

export interface SpawnClusterPayload {
  domain_id?: string;
  cluster_name: string;
  cluster_theme?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'purple' | 'rose' | string;
  sub_title?: string;
  is_public_interface?: boolean;
  nodes: CompactClusterNode[];
  sub_clusters?: CompactSubCluster[];
  connect_to_shared_infra?: Array<'db' | 'cache' | 'queue'>;
  position?: { x: number; y: number };
}

export interface ExpandPayload {
  target_concept_slug: string;
  existing_node_slugs: string[];
  expansion_intent?: string;
}

export interface PrunePayload {
  node_id: string;
  action: 'collapse' | 'expand' | 'delete_permanently';
}
