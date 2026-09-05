import React from 'react';
import { AnimationParams, SchematicArchetype, SchematicData } from '../../types/graphTypes.js';

interface DynamicSchematicProps {
  params: AnimationParams;
}

function renderSvgMultiLine(
  rawText: string | undefined,
  centerX: number,
  centerY: number,
  color: string,
  fontSize = 8.5,
  fontWeight = 800,
  maxLine1 = 14
) {
  if (!rawText) return null;
  const clean = rawText.trim();
  const words = clean.split(/\s+/);

  let line1 = '';
  let line2 = '';

  for (const w of words) {
    if (!line1 || (line1 + ' ' + w).length <= maxLine1) {
      line1 = (line1 ? line1 + ' ' + w : w);
    } else {
      line2 = (line2 ? line2 + ' ' + w : w);
    }
  }

  if (!line2) {
    return (
      <text
        x={centerX}
        y={centerY}
        textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize={fontSize}
        fontWeight={fontWeight}
        fill={color}
      >
        {line1}
      </text>
    );
  }

  return (
    <text
      x={centerX}
      y={centerY - 5}
      textAnchor="middle"
      fontFamily="'JetBrains Mono', monospace"
      fontSize={fontSize}
      fontWeight={fontWeight}
      fill={color}
    >
      <tspan x={centerX} dy="0">{line1}</tspan>
      <tspan x={centerX} dy="11">{line2}</tspan>
    </text>
  );
}

export const DynamicSchematic: React.FC<DynamicSchematicProps> = ({ params }) => {
  const p = params?.tham_so || {};
  const mau = (params?.schematic_layout || params?.mau || 'default') as SchematicArchetype;
  const d = params?.schematic_data || {};

  switch (mau) {
    // ------------------------------------------------------------------------
    // ARCHETYPE 1: INGRESS PIPELINE & TRAFFIC FILTER (Gateway, PEP, WAF, Zod)
    // ------------------------------------------------------------------------
    case 'pipeline_filter':
    case 'rate_limit_sliding':
    case 'zero_trust_pep': {
      const clientLabel = p.client || p.ingress || d.actor || 'CLIENT APP';
      const gatewayLabel = p.gateway || p.pep || p.waf || d.component || 'PEP GATEWAY';
      const targetLabel = p.auth_server || p.target || d.target || 'INTERNAL MESH';
      const statusLabel = p.status || p.pass || d.status || 'VERIFIED 200 OK';

      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Client Pod */}
          <rect x="15" y="32" width="85" height="58" rx="5" fill="#F3F4F6" stroke="#1A1D24" strokeWidth="1.8" />
          {renderSvgMultiLine(clientLabel, 57.5, 54, '#1A1D24', 8.5, 800, 11)}
          <text x="57.5" y="78" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6B7280">HTTPS / mTLS</text>

          {/* Dòng hạt request di chuyển */}
          <path d="M 100 48 L 220 48" stroke="#4F46E5" strokeWidth="1.8" strokeDasharray="4 4" />
          <rect x="100" y="40" width="54" height="16" rx="3" fill="#4F46E5">
            <animate attributeName="x" values="100;220;220" keyTimes="0;0.5;1" dur="3.5s" repeatCount="indefinite" />
          </rect>
          <text x="106" y="51.5" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#FFF" fontWeight="800">
            {p.token || 'BEARER DTO'}
            <animate attributeName="x" values="106;226;226" keyTimes="0;0.5;1" dur="3.5s" repeatCount="indefinite" />
          </text>

          {/* Drop 429 animation */}
          <path d="M 100 78 L 220 78" stroke="#DC2626" strokeWidth="1.8" strokeDasharray="4 4" />
          <rect x="100" y="70" width="50" height="16" rx="3" fill="#DC2626">
            <animate attributeName="x" values="100;220;140;140" keyTimes="0;0.5;0.75;1" dur="3.5s" repeatCount="indefinite" />
          </rect>
          <text x="106" y="81.5" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#FFF" fontWeight="800">
            {p.drop || '429 FLOOD'}
            <animate attributeName="x" values="106;226;146;146" keyTimes="0;0.5;0.75;1" dur="3.5s" repeatCount="indefinite" />
          </text>

          {/* Central PEP Filter Pod */}
          <polygon points="220,25 295,25 305,61 295,97 220,97 210,61" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2" />
          {renderSvgMultiLine(gatewayLabel, 257.5, 52, '#3730A3', 8.5, 900, 11)}
          <text x="257.5" y="78" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fontWeight="700" fill="#4F46E5">ZOD / PEP FILTER</text>

          {/* Target Mesh Pod */}
          <path d="M 305 61 L 345 61" stroke="#059669" strokeWidth="2" markerEnd="url(#mui-ten-xanh)" />
          <rect x="345" y="32" width="90" height="58" rx="5" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          {renderSvgMultiLine(targetLabel, 390, 54, '#065F46', 8.5, 800, 11)}
          <text x="390" y="78" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#059669" fontWeight="800">{statusLabel}</text>
        </svg>
      );
    }

    // ------------------------------------------------------------------------
    // ARCHETYPE 2: PURE COMPUTE & SPLIT ALLOCATION MATRIX (Promotion Engine)
    // ------------------------------------------------------------------------
    case 'split_allocation': {
      const engineLabel = p.engine || d.component || 'PURE PROMOTION ENGINE';
      const items = d.items || [
        { label: 'Seller A (-30k)', status: 'ok' },
        { label: 'Seller B (-70k)', status: 'ok' }
      ];

      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Cart Snapshot Input */}
          <rect x="15" y="32" width="95" height="60" rx="5" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
          <text x="62.5" y="48" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#92400E">CART SNAPSHOT</text>
          <text x="62.5" y="62" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#B45309">{p.amount || 'TOTAL: 100K'}</text>
          <rect x="25" y="72" width="75" height="14" rx="2" fill="#FDE68A" />
          <text x="62.5" y="82" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fontWeight="700" fill="#78350F">VOUCHER: -100K</text>

          {/* Dòng tính toán vào Engine */}
          <path d="M 110 62 L 180 62" stroke="#D97706" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="145" cy="62" r="5" fill="#D97706">
            <animate attributeName="cx" values="110;180" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* Pure Engine Center (100% 0 I/O) */}
          <rect x="180" y="24" width="125" height="76" rx="6" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
          {renderSvgMultiLine(engineLabel, 242.5, 48, '#1E40AF', 8.5, 900, 13)}
          <rect x="190" y="65" width="105" height="16" rx="3" fill="#DBEAFE" />
          <text x="242.5" y="76" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fontWeight="800" fill="#1D4ED8">
            {p.io || '0 I/O DETERMINISTIC'}
          </text>
          <text x="242.5" y="93" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6.5" fill="#6B7280">Penny Rounding: 0đ</text>

          {/* Phân bổ Split Output ra các Seller */}
          <path d="M 305 48 L 345 36" stroke="#059669" strokeWidth="1.8" markerEnd="url(#mui-ten-xanh)" />
          <path d="M 305 76 L 345 88" stroke="#059669" strokeWidth="1.8" markerEnd="url(#mui-ten-xanh)" />

          <rect x="345" y="18" width="90" height="34" rx="4" fill="#ECFDF5" stroke="#059669" strokeWidth="1.5" />
          <text x="390" y="32" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#065F46">{items[0]?.label || 'Seller A (-30k)'}</text>
          <text x="390" y="44" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6.5" fill="#047857">ALLOCATED OK</text>

          <rect x="345" y="72" width="90" height="34" rx="4" fill="#ECFDF5" stroke="#059669" strokeWidth="1.5" />
          <text x="390" y="86" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#065F46">{items[1]?.label || 'Seller B (-70k)'}</text>
          <text x="390" y="98" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6.5" fill="#047857">ALLOCATED OK</text>
        </svg>
      );
    }

    // ------------------------------------------------------------------------
    // ARCHETYPE 3: FINITE STATE MACHINE & 2-PHASE LIFECYCLE (Reservation 15m)
    // ------------------------------------------------------------------------
    case 'two_phase_state_machine': {
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Phase 1: Reservation */}
          <circle cx="70" cy="62" r="38" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
          <text x="70" y="52" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="900" fill="#92400E">PHASE 1</text>
          <text x="70" y="64" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#B45309">RESERVE</text>
          <text x="70" y="76" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6.5" fill="#78350F">TTL: 15 MINS</text>

          {/* Path Sang Phase 2: Finalize */}
          <path d="M 108 45 Q 225 15 342 45" fill="none" stroke="#059669" strokeWidth="2" markerEnd="url(#mui-ten-xanh)" />
          <rect x="185" y="16" width="80" height="16" rx="3" fill="#ECFDF5" stroke="#059669" strokeWidth="1" />
          <text x="225" y="27.5" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fontWeight="800" fill="#065F46">PAID ➔ REDEEM</text>

          {/* Path Sang Release (Cancel/Timeout) */}
          <path d="M 108 79 Q 225 110 342 79" fill="none" stroke="#DC2626" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#mui-ten-den)" />
          <rect x="185" y="93" width="80" height="16" rx="3" fill="#FEF2F2" stroke="#DC2626" strokeWidth="1" />
          <text x="225" y="104.5" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fontWeight="800" fill="#991B1B">TIMEOUT ➔ RELEASE</text>

          {/* Phase 2: Final State */}
          <circle cx="380" cy="62" r="38" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          <text x="380" y="52" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="900" fill="#065F46">PHASE 2</text>
          <text x="380" y="64" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#047857">LEDGER</text>
          <text x="380" y="76" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6.5" fill="#064E3B">IMMUTABLE</text>
        </svg>
      );
    }

    // ------------------------------------------------------------------------
    // ARCHETYPE 4: ACID TRANSACTION & ROW LOCK TABLE (PostgreSQL Ledger)
    // ------------------------------------------------------------------------
    case 'table_row_lock':
    case 'luu_tru_acid': {
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          <rect x="15" y="25" width="95" height="75" rx="5" fill="#F3F4F6" stroke="#1A1D24" strokeWidth="1.8" />
          <text x="62.5" y="46" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fontWeight="900" fill="#1A1D24">{p.lenh || 'TX WRITE'}</text>
          <text x="62.5" y="62" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6B7280">{p.lock || 'FOR UPDATE'}</text>
          <rect x="25" y="72" width="75" height="16" rx="3" fill="#DBEAFE" />
          <text x="62.5" y="83" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fontWeight="800" fill="#1E40AF">SERIALIZABLE</text>

          <path d="M 110 62 L 180 62" stroke="#2563EB" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="145" cy="62" r="5" fill="#2563EB">
            <animate attributeName="cx" values="110;180" dur="2.5s" repeatCount="indefinite" />
          </circle>

          {/* Database Disk Table Pod */}
          <rect x="180" y="18" width="255" height="88" rx="6" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
          <text x="307.5" y="36" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="900" fill="#1E40AF">POSTGRESQL ACID LEDGER</text>

          {/* Row Slot 1: Locked */}
          <rect x="195" y="44" width="225" height="24" rx="3" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.2" />
          <circle cx="210" cy="56" r="4" fill="#D97706" />
          <text x="220" y="59" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#92400E">ROW #101 [LOCKED]: QUOTA DECREMENT</text>

          {/* Row Slot 2: Committed */}
          <rect x="195" y="72" width="225" height="24" rx="3" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.2" />
          <circle cx="210" cy="84" r="4" fill="#059669" />
          <text x="220" y="87" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#1E40AF">ROW #102 [COMMITTED]: B-TREE UNIQUE INDEX</text>
        </svg>
      );
    }

    // ------------------------------------------------------------------------
    // ARCHETYPE 5: IN-MEMORY CACHE & DISTRIBUTED LOCK (Redis SETNX, JTI Store)
    // ------------------------------------------------------------------------
    case 'cache_ttl_lock':
    case 'bo_nho_dem_redis':
    case 'token_blacklist': {
      const storeLabel = p.store || p.cache || d.component || 'REDIS RAM CACHE';

      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Request Ingress */}
          <rect x="15" y="32" width="90" height="60" rx="5" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
          <text x="60" y="52" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#92400E">APP REQUEST</text>
          <text x="60" y="68" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#B45309">KEY LOOKUP</text>

          {/* Cache Hit / Miss Branch */}
          <path d="M 105 50 L 180 50" stroke="#059669" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="142.5" cy="50" r="5" fill="#059669">
            <animate attributeName="cx" values="105;180" dur="1.5s" repeatCount="indefinite" />
          </circle>

          {/* Redis RAM Grid */}
          <rect x="180" y="20" width="160" height="85" rx="6" fill="#FEF2F2" stroke="#DC2626" strokeWidth="2" />
          {renderSvgMultiLine(storeLabel, 260, 42, '#991B1B', 8.5, 900, 15)}
          <rect x="195" y="55" width="130" height="18" rx="3" fill="#FEE2E2" />
          <text x="260" y="67" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#B91C1C">SETNX ATOMIC 1ms</text>
          <text x="260" y="90" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="#7F1D1D">{p.ttl || 'TTL EXPIRY: 60s'}</text>

          {/* Hit Result */}
          <path d="M 340 62 L 375 62" stroke="#059669" strokeWidth="2" markerEnd="url(#mui-ten-xanh)" />
          <rect x="375" y="32" width="60" height="60" rx="5" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          <text x="405" y="56" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="900" fill="#065F46">CACHE</text>
          <text x="405" y="70" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#047857">HIT 1ms</text>
        </svg>
      );
    }

    // ------------------------------------------------------------------------
    // ARCHETYPE 6: MESSAGE QUEUE & OUTBOX CONVEYOR (Kafka, Outbox Worker)
    // ------------------------------------------------------------------------
    case 'queue_outbox_conveyor':
    case 'hang_doi_dieu_tiet': {
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Producer / DB Outbox */}
          <rect x="15" y="32" width="90" height="60" rx="5" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
          <text x="60" y="52" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#92400E">OUTBOX DB</text>
          <text x="60" y="68" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#B45309">TRANSACTIONAL</text>

          {/* Conveyor Belt (Băng chuyền sự kiện) */}
          <rect x="135" y="38" width="180" height="48" rx="24" fill="#F3F4F6" stroke="#1A1D24" strokeWidth="2" />
          <text x="225" y="30" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="900" fill="#1A1D24">EVENT STREAM BUS</text>

          {/* Event Packets di chuyển trên băng chuyền */}
          <circle cx="165" cy="62" r="10" fill="#3B82F6">
            <animate attributeName="cx" values="165;285;165" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="205" cy="62" r="10" fill="#6366F1">
            <animate attributeName="cx" values="205;285;165;205" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="245" cy="62" r="10" fill="#8B5CF6">
            <animate attributeName="cx" values="245;285;165;245" dur="4s" repeatCount="indefinite" />
          </circle>

          {/* Worker Pool Đích */}
          <path d="M 315 62 L 350 62" stroke="#059669" strokeWidth="2" markerEnd="url(#mui-ten-xanh)" />
          <rect x="350" y="32" width="85" height="60" rx="5" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          <text x="392.5" y="52" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#065F46">WORKER POOL</text>
          <text x="392.5" y="68" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#047857">ASYNC REPLAY</text>
        </svg>
      );
    }

    // ------------------------------------------------------------------------
    // ARCHETYPE 7: HEXAGONAL PORTS & EXTERNAL ADAPTERS (Ports & Adapters)
    // ------------------------------------------------------------------------
    case 'hexagonal_ports': {
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Lục giác trung tâm (Domain Core) */}
          <polygon points="180,62 210,25 270,25 300,62 270,99 210,99" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2.2" />
          <text x="240" y="58" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fontWeight="900" fill="#3730A3">PROMOTION</text>
          <text x="240" y="70" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#4F46E5">DOMAIN CORE</text>

          {/* Port 1: Catalog Port (Trái) */}
          <path d="M 120 40 L 185 45" stroke="#D97706" strokeWidth="1.8" strokeDasharray="3 3" />
          <rect x="15" y="24" width="105" height="32" rx="4" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
          <text x="67.5" y="44" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#92400E">CATALOG PORT</text>

          {/* Port 2: Payment Port (Trái dưới) */}
          <path d="M 120 85 L 185 80" stroke="#059669" strokeWidth="1.8" strokeDasharray="3 3" />
          <rect x="15" y="70" width="105" height="32" rx="4" fill="#ECFDF5" stroke="#059669" strokeWidth="1.5" />
          <text x="67.5" y="90" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#065F46">PAYMENT PORT</text>

          {/* Port 3: Checkout Port (Phải) */}
          <path d="M 295 45 L 360 40" stroke="#2563EB" strokeWidth="1.8" strokeDasharray="3 3" />
          <rect x="330" y="24" width="105" height="32" rx="4" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.5" />
          <text x="382.5" y="44" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#1E40AF">CHECKOUT PORT</text>

          {/* Port 4: Identity Port (Phải dưới) */}
          <path d="M 295 80 L 360 85" stroke="#7C3AED" strokeWidth="1.8" strokeDasharray="3 3" />
          <rect x="330" y="70" width="105" height="32" rx="4" fill="#F5F3FF" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="382.5" y="90" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#5B21B6">IDENTITY PORT</text>
        </svg>
      );
    }

    // ------------------------------------------------------------------------
    // ARCHETYPE 8: CRYPTOGRAPHIC HASH CHAIN & MERKLE TREE (Audit Trail)
    // ------------------------------------------------------------------------
    case 'cryptographic_hash_chain':
    case 'audit_hash_chain': {
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Block 1 */}
          <rect x="15" y="28" width="115" height="68" rx="5" fill="#F9FAFB" stroke="#1A1D24" strokeWidth="1.8" />
          <text x="72.5" y="46" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="900" fill="#1A1D24">BLOCK #001</text>
          <text x="72.5" y="60" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="#6B7280">PREV: 0x00000</text>
          <rect x="25" y="68" width="95" height="18" rx="2" fill="#DBEAFE" />
          <text x="72.5" y="80" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fontWeight="800" fill="#1E40AF">HASH: 0x8F3A2</text>

          {/* Link Hash */}
          <path d="M 130 62 L 165 62" stroke="#2563EB" strokeWidth="2" markerEnd="url(#mui-ten-den)" />

          {/* Block 2 */}
          <rect x="165" y="28" width="115" height="68" rx="5" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
          <text x="222.5" y="46" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="900" fill="#1E40AF">BLOCK #002</text>
          <text x="222.5" y="60" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="#3B82F6">PREV: 0x8F3A2</text>
          <rect x="175" y="68" width="95" height="18" rx="2" fill="#BFDBFE" />
          <text x="222.5" y="80" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fontWeight="800" fill="#1E40AF">HASH: 0xC49E1</text>

          {/* Link Hash */}
          <path d="M 280 62 L 315 62" stroke="#2563EB" strokeWidth="2" markerEnd="url(#mui-ten-den)" />

          {/* Block 3 */}
          <rect x="315" y="28" width="120" height="68" rx="5" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          <text x="375" y="46" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="900" fill="#065F46">BLOCK #003</text>
          <text x="375" y="60" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="#059669">PREV: 0xC49E1</text>
          <rect x="325" y="68" width="100" height="18" rx="2" fill="#A7F3D0" />
          <text x="375" y="80" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fontWeight="800" fill="#064E3B">TAMPER-PROOF</text>
        </svg>
      );
    }

    // ------------------------------------------------------------------------
    // ARCHETYPE 9: RBAC POLICY DECISION MATRIX (Role Hierarchy & Any-Of Check)
    // ------------------------------------------------------------------------
    case 'rbac_policy_matrix':
    case 'pdp_policy': {
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* User Subject */}
          <rect x="15" y="32" width="90" height="60" rx="5" fill="#F5F3FF" stroke="#7C3AED" strokeWidth="1.8" />
          <text x="60" y="52" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="900" fill="#5B21B6">PRINCIPAL</text>
          <text x="60" y="66" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6D28D9">ROLES: [SELLER]</text>
          <text x="60" y="78" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6.5" fill="#7C3AED">TENANT: VN_SHOP</text>

          {/* Flow sang PDP Engine */}
          <path d="M 105 62 L 175 62" stroke="#7C3AED" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="140" cy="62" r="5" fill="#7C3AED">
            <animate attributeName="cx" values="105;175" dur="1.8s" repeatCount="indefinite" />
          </circle>

          {/* PDP Decision Matrix Engine */}
          <rect x="175" y="20" width="150" height="85" rx="6" fill="#EDE9FE" stroke="#6D28D9" strokeWidth="2" />
          <text x="250" y="38" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fontWeight="900" fill="#4C1D95">RBAC PDP ENGINE</text>
          <rect x="185" y="48" width="130" height="22" rx="3" fill="#DDD6FE" />
          <text x="250" y="62" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#5B21B6">ANY-OF (ROLE MATCH)</text>
          <text x="250" y="88" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="#6D28D9">Hierarchy: Admin &gt; User</text>

          {/* Permit / Deny Output */}
          <path d="M 325 62 L 365 62" stroke="#059669" strokeWidth="2" markerEnd="url(#mui-ten-xanh)" />
          <rect x="365" y="32" width="70" height="60" rx="5" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          <text x="400" y="56" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fontWeight="900" fill="#065F46">PERMIT</text>
          <text x="400" y="72" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="#047857">ACCESS GRANTED</text>
        </svg>
      );
    }

    // ------------------------------------------------------------------------
    // ARCHETYPE 10: RESILIENCE, BACKOFF & CIRCUIT BREAKER (Exponential Backoff)
    // ------------------------------------------------------------------------
    case 'circuit_breaker_backoff':
    case 'va_cham_song_song': {
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          <rect x="15" y="32" width="90" height="60" rx="5" fill="#FEF2F2" stroke="#DC2626" strokeWidth="1.8" />
          <text x="60" y="52" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#991B1B">TIMEOUT 1.2s</text>
          <text x="60" y="68" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#B91C1C">RETRY STORM</text>

          {/* Exponential Backoff Curve */}
          <path d="M 105 80 Q 175 80 210 35" fill="none" stroke="#D97706" strokeWidth="2.5" />
          <text x="175" y="30" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#D97706">BACKOFF + JITTER (1s, 2s, 4s)</text>

          {/* Circuit Breaker State Pod */}
          <rect x="250" y="24" width="185" height="76" rx="6" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
          <text x="342.5" y="46" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="900" fill="#92400E">CIRCUIT BREAKER</text>
          <rect x="265" y="56" width="155" height="24" rx="3" fill="#FDE68A" />
          <text x="342.5" y="72" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#78350F">STATE: HALF-OPEN (PROBING)</text>
        </svg>
      );
    }

    // ------------------------------------------------------------------------
    // ARCHETYPE 11: TOKEN LINEAGE & RTR FAMILY TREE (Refresh Token Rotation)
    // ------------------------------------------------------------------------
    case 'token_family_tree':
    case 'oauth2_oidc': {
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          {/* Token #1 (Revoked) */}
          <rect x="15" y="32" width="100" height="60" rx="5" fill="#FEF2F2" stroke="#DC2626" strokeWidth="1.8" />
          <text x="65" y="50" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill="#991B1B">REFRESH TOKEN #1</text>
          <rect x="25" y="62" width="80" height="16" rx="2" fill="#FEE2E2" />
          <text x="65" y="73" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fontWeight="800" fill="#DC2626">REVOKED (USED)</text>

          {/* Rotation Arrow */}
          <path d="M 115 62 L 165 62" stroke="#4F46E5" strokeWidth="2" markerEnd="url(#mui-ten-den)" />
          <text x="140" y="54" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fontWeight="800" fill="#4F46E5">1-TIME</text>

          {/* Token #2 (Active in Family ID) */}
          <rect x="165" y="24" width="125" height="76" rx="6" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2" />
          <text x="227.5" y="44" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fontWeight="900" fill="#3730A3">REFRESH TOKEN #2</text>
          <rect x="175" y="54" width="105" height="18" rx="3" fill="#DBEAFE" />
          <text x="227.5" y="66" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#1E40AF">ACTIVE PAIR</text>
          <text x="227.5" y="88" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6.5" fill="#6B7280">FAMILY ID: fam_8f3a92</text>

          {/* Replay Attack Detection Guard */}
          <path d="M 290 62 L 340 62" stroke="#059669" strokeWidth="2" markerEnd="url(#mui-ten-xanh)" />
          <rect x="340" y="32" width="95" height="60" rx="5" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          <text x="387.5" y="52" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#065F46">REPLAY GUARD</text>
          <text x="387.5" y="68" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="#047857">AUTO-REVOKE ALL</text>
        </svg>
      );
    }

    // ------------------------------------------------------------------------
    // ARCHETYPE 12: FAN-OUT / FAN-IN & BATCH AGGREGATOR (Batch Resolvers)
    // ------------------------------------------------------------------------
    case 'fanout_batch_aggregator':
    default: {
      return (
        <svg width="100%" height="100%" viewBox="0 0 450 125">
          <rect x="15" y="35" width="90" height="55" rx="5" fill="#F3F4F6" stroke="#1A1D24" strokeWidth="1.8" />
          {renderSvgMultiLine(p.actor || 'INGRESS', 60, 56, '#1A1D24', 8.5, 800, 11)}
          <text x="60" y="76" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#6B7280">BATCH INPUT</text>

          {/* Fan-out Arrows */}
          <path d="M 105 50 L 175 35" stroke="#4F46E5" strokeWidth="1.8" strokeDasharray="3 3" />
          <path d="M 105 62 L 175 62" stroke="#4F46E5" strokeWidth="1.8" strokeDasharray="3 3" />
          <path d="M 105 75 L 175 90" stroke="#4F46E5" strokeWidth="1.8" strokeDasharray="3 3" />

          {/* Central Process Node */}
          <rect x="175" y="20" width="150" height="85" rx="6" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2" />
          {renderSvgMultiLine(p.component || 'BATCH AGGREGATOR', 250, 48, '#3730A3', 8.5, 900, 14)}
          <rect x="190" y="68" width="120" height="18" rx="3" fill="#E0E7FF" />
          <text x="250" y="80" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="800" fill="#4338CA">
            {p.status || 'RESOLVED (100%)'}
          </text>

          {/* Fan-in Output */}
          <path d="M 325 62 L 360 62" stroke="#059669" strokeWidth="2" markerEnd="url(#mui-ten-xanh)" />
          <rect x="360" y="35" width="75" height="55" rx="5" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
          {renderSvgMultiLine(p.target || 'DOWNSTREAM', 397.5, 56, '#065F46', 8, 800, 10)}
          <text x="397.5" y="76" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fill="#059669" fontWeight="800">DONE</text>
        </svg>
      );
    }
  }
};
