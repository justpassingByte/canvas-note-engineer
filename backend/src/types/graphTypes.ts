export type NodeBadgeType = 
  | 'su_co_canh_bao'
  | 'tranh_chap_phan_nhanh'
  | 'khien_bao_ve'
  | 'khoi_tru_database'
  | 'hop_kien_hang_domain'
  | 'hang_doi_message_queue'
  | 'bo_nho_dem_cache';

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
  cluster_id?: string;
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
}

export interface SpawnClusterPayload {
  cluster_name: string;
  cluster_theme?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'purple' | 'rose';
  sub_title?: string;
  nodes: CompactClusterNode[];
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
