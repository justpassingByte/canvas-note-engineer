import React from 'react';
import {
  AlertTriangle,
  GitFork,
  ShieldCheck,
  Database,
  ShoppingBag,
  Layers,
  Cpu
} from 'lucide-react';
import { NodeBadgeType } from '../../types/graphTypes.js';

interface LucideIconPodProps {
  type: NodeBadgeType;
  className?: string;
}

export const LucideIconPod: React.FC<LucideIconPodProps> = ({ type, className = 'lucide-icon' }) => {
  switch (type) {
    case 'su_co_canh_bao':
      return <AlertTriangle className={className} />;
    case 'tranh_chap_phan_nhanh':
      return <GitFork className={className} />;
    case 'khien_bao_ve':
      return <ShieldCheck className={className} />;
    case 'khoi_tru_database':
      return <Database className={className} />;
    case 'hop_kien_hang_domain':
      return <ShoppingBag className={className} />;
    case 'hang_doi_message_queue':
      return <Layers className={className} />;
    case 'bo_nho_dem_cache':
      return <Cpu className={className} />;
    default:
      return <ShieldCheck className={className} />;
  }
};
