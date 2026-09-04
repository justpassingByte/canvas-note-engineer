import { describe, it, expect } from 'vitest';
import { validateAndSanitizeEdges } from '../tools/toolHandlers.js';
import { NodeEntity, EdgeEntity } from '../types/graphTypes.js';

function createDummyNode(id: string): NodeEntity {
  return {
    id,
    bieu_tuong: 'khoi_tru_database',
    tieu_de: id,
    nhan_buoc: 'Step',
    tom_tat: 'Summary',
    toa_do: { x: 0, y: 0 },
    tam: { x: 0, y: 0 },
    fully_explored: false,
    hoat_hoa: { mau: '#000', tham_so: {} },
    chi_tiet: { phan_loai: 'Test', tieu_de: id, ban_chat: '', chu_thich_so_do: '', ca_thuc_te: [], rui_ro: [] },
    trac_nghiem: { cau_hoi: '', lua_chon: ['', ''], dung: 0, giai_thich: '' }
  };
}

describe('3-Layer Edge Sanitizer (AI Hallucination Defense)', () => {
  const nodes = [createDummyNode('node-A'), createDummyNode('node-B'), createDummyNode('node-C')];

  it('Layer 1a: should reject self-referential edges (from === to)', () => {
    const rawEdges: EdgeEntity[] = [
      { from: 'node-A', to: 'node-A', nhan: 'Self-loop', kieu: 'duong-noi-day' }
    ];

    const result = validateAndSanitizeEdges(nodes, rawEdges);
    expect(result).toHaveLength(0);
  });

  it('Layer 1b: should reject edges connecting non-existent nodes', () => {
    const rawEdges: EdgeEntity[] = [
      { from: 'node-A', to: 'ghost-node', nhan: 'Ghost link', kieu: 'duong-noi-day' },
      { from: 'phantom-source', to: 'node-B', nhan: 'Phantom link', kieu: 'duong-noi-day' }
    ];

    const result = validateAndSanitizeEdges(nodes, rawEdges);
    expect(result).toHaveLength(0);
  });

  it('Layer 2a: should eliminate duplicate edges between identical nodes', () => {
    const rawEdges: EdgeEntity[] = [
      { from: 'node-A', to: 'node-B', nhan: 'First link', kieu: 'duong-noi-day' },
      { from: 'node-A', to: 'node-B', nhan: 'Duplicate link', kieu: 'duong-noi-day' }
    ];

    const result = validateAndSanitizeEdges(nodes, rawEdges);
    expect(result).toHaveLength(1);
    expect(result[0].nhan).toBe('First link');
  });

  it('Layer 2b: should prevent direct reverse cycles (A -> B -> A)', () => {
    const rawEdges: EdgeEntity[] = [
      { from: 'node-A', to: 'node-B', nhan: 'Forward flow', kieu: 'duong-noi-day' },
      { from: 'node-B', to: 'node-A', nhan: 'Reverse cycle', kieu: 'duong-noi-day' }
    ];

    const result = validateAndSanitizeEdges(nodes, rawEdges);
    expect(result).toHaveLength(1);
    expect(result[0].from).toBe('node-A');
    expect(result[0].to).toBe('node-B');
  });

  it('Layer 3: should assign default metadata when properties are omitted', () => {
    const rawEdges: EdgeEntity[] = [
      { from: 'node-A', to: 'node-B', nhan: '', kieu: 'duong-noi-day' }
    ];

    const result = validateAndSanitizeEdges(nodes, rawEdges);
    expect(result).toHaveLength(1);
    expect(result[0].nhan).toBe('Liên kết hệ thống');
    expect(result[0].loai_lien_ket).toBe('HOA_GIAI');
  });
});
