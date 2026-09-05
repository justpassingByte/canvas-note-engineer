export type NodeBadgeType = 
  | 'su_co_canh_bao'
  | 'tranh_chap_phan_nhanh'
  | 'khien_bao_ve'
  | 'khoi_tru_database'
  | 'hop_kien_hang_domain'
  | 'hang_doi_message_queue'
  | 'bo_nho_dem_cache'
  | 'ghi_chep_so_sach';

export interface ReflexQuiz {
  cau_hoi: string;
  lua_chon: [string, string];
  dung: 0 | 1;
  giai_thich: string;
}

export interface AnimationParams {
  mau: string;
  tham_so: Record<string, string>;
}

export interface NodeDetails {
  phan_loai: string;
  tieu_de: string;
  ban_chat: string;
  chu_thich_so_do: string;
  ca_thuc_te: string[];
  rui_ro: string[];
  chuoi_sup_do?: string[];
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
  domain_id?: string;        // e.g. 'domain-auth', 'domain-payment', 'domain-shared-infra'
  cluster_id?: string;       // e.g. 'cum-oidc-service', 'cum-webhook-pipeline', 'cum-shared-infrastructure'
  sub_cluster_id?: string;   // e.g. 'sub-auth-redis', 'sub-payment-lock', 'sub-audit-vault'

  // Cổng đối ngoại & Phân loại hạ tầng thực tế
  is_public_interface?: boolean; // True nếu là Gateway / PEP / JWKS endpoint đại diện công khai cho cụm
  infra_type?: 'redis' | 'postgres' | 'kafka' | 'service' | 'gateway' | 'worker'; // Phân loại hạ tầng cốt lõi

  is_collapsed?: boolean;
  collapsed_count?: number;
  hoat_hoa: AnimationParams;
  chi_tiet: NodeDetails;
  trac_nghiem: ReflexQuiz;
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
  ban_chat?: string;
  ca_thuc_te?: string[];
  rui_ro?: string[];
  chuoi_sup_do?: string[];
  trac_nghiem?: ReflexQuiz;
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
