import React from 'react';
import {
  Globe,
  ShieldAlert,
  Hourglass,
  PowerOff,
  Cpu,
  Workflow,
  Cable,
  Split,
  KeyRound,
  RefreshCw,
  Scale,
  ShieldX,
  Lock,
  Hash,
  Database,
  Zap,
  Layers,
  Bot,
  BookOpen,
  Ticket,
  CreditCard,
  GitFork,
  AlertTriangle,
  ShoppingBag,
  ShieldCheck,
  Layout,
  Boxes,
  Server,
  CloudDownload,
  PackageOpen,
  FileCheck
} from 'lucide-react';
import { NodeBadgeType } from '../../types/graphTypes.js';

interface LucideIconPodProps {
  type: NodeBadgeType;
  className?: string;
}

export const LucideIconPod: React.FC<LucideIconPodProps> = ({ type, className = 'lucide-icon' }) => {
  switch (type) {
    // Core Gateway & Ingress
    case 'cong_gateway_ingress':
      return <Globe className={className} />;
    case 'tuong_lua_waf':
      return <ShieldAlert className={className} />;
    case 'dieu_tiet_rate_limit':
      return <Hourglass className={className} />;
    case 'bo_ngat_mach_circuit_breaker':
      return <PowerOff className={className} />;

    // Domain Core & Compute
    case 'dong_co_pure_engine':
      return <Cpu className={className} />;
    case 'dieu_phoi_service':
      return <Workflow className={className} />;
    case 'cong_ket_noi_port':
      return <Cable className={className} />;
    case 'gom_tach_fanout_batch':
      return <Split className={className} />;

    // Security, Identity & Policy
    case 'dinh_danh_auth_token':
      return <KeyRound className={className} />;
    case 'xoay_vong_token_rtr':
      return <RefreshCw className={className} />;
    case 'chinh_sach_rbac_pdp':
      return <Scale className={className} />;
    case 'danh_sach_den_blacklist':
      return <ShieldX className={className} />;
    case 'kho_khoa_bi_mat_vault':
      return <Lock className={className} />;
    case 'chuoi_bam_merkle_hash':
      return <Hash className={className} />;

    // Storage, Cache & Messaging
    case 'khoi_tru_database':
      return <Database className={className} />;
    case 'bo_nho_dem_cache':
      return <Zap className={className} />;
    case 'hang_doi_message_queue':
      return <Layers className={className} />;
    case 'tien_trinh_worker_pool':
      return <Bot className={className} />;
    case 'ghi_chep_so_sach':
      return <BookOpen className={className} />;

    // Business, Marketplace & Incidents
    case 'khuyen_mai_voucher':
      return <Ticket className={className} />;
    case 'thanh_toan_payment':
      return <CreditCard className={className} />;
    case 'tranh_chap_phan_nhanh':
      return <GitFork className={className} />;
    case 'su_co_canh_bao':
      return <AlertTriangle className={className} />;
    case 'hop_kien_hang_domain':
      return <ShoppingBag className={className} />;
    case 'khien_bao_ve':
      return <ShieldCheck className={className} />;

    // Frontend & Browser Architecture
    case 'ui_component_view':
      return <Layout className={className} />;
    case 'state_store_zustand':
      return <Boxes className={className} />;
    case 'rendering_ssr_csr':
      return <Server className={className} />;
    case 'client_cache_swr':
      return <CloudDownload className={className} />;
    case 'bundle_code_split':
      return <PackageOpen className={className} />;
    case 'browser_web_worker':
      return <Bot className={className} />;
    case 'form_zod_validator':
      return <FileCheck className={className} />;

    default:
      return <Globe className={className} />;
  }
};

