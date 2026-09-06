import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIGraphService } from '../services/aiGraphService.js';
import { sqliteClient } from '../db/sqliteClient.js';
import { ProviderConfig } from '../config/providerConfig.js';
import { ProviderFactory } from '../providers/providerFactory.js';

describe('AIGraphService Pipeline & Persistence', () => {
  const testProviderConfig: ProviderConfig = {
    id: 'test-service-mock',
    provider_type: 'deepseek',
    name: 'Mock LLM Provider',
    base_url: 'https://api.mock.test/v1',
    api_key: 'sk-mock-key',
    model: 'mock-model-chat',
    temperature: 0.3,
    is_active: true
  };

  beforeEach(() => {
    sqliteClient.saveProviderConfig(testProviderConfig);
  });

  it('should generate a new knowledge graph from LLM output JSON', async () => {
    const mockLlmResponse = JSON.stringify({
      topic: 'Chẩn đoán & Xử trí Nhồi máu cơ tim cấp',
      domain: 'healthcare',
      nodes: [
        {
          id: 'node-dau-nguc-cap',
          tieu_de: 'Đau thắt ngực cấp tính',
          nhan_buoc: 'CHẨN ĐOÁN / LÂM SÀNG',
          tom_tat: 'Cơn đau thắt sau xương ức kéo dài > 20 phút không đáp ứng nitrate.',
          bieu_tuong: 'su_co_canh_bao',
          chi_tiet: {
            phan_loai: 'DẤU HIỆU LÂM SÀNG',
            tieu_de: 'Đau ngực kiểu mạch vành',
            ban_chat: 'Thiếu máu cục bộ cơ tim cấp do tắc nghẽn động mạch vành.',
            chu_thich_so_do: 'Luồng bộc phát thiếu máu cục bộ',
            ca_thuc_te: ['Bệnh nhân 55 tuổi đau ngực lan vai trái và hàm dưới.'],
            rui_ro: ['Rung thất và đột tử do loạn nhịp.'],
            chuoi_sup_do: ['1. Mảng xơ vữa nứt vỡ', '2. Huyết khối tắc mạch', '3. Hoại tử cơ tim']
          }
        },
        {
          id: 'node-troponin-tang',
          tieu_de: 'Men tim Troponin T/I tăng',
          nhan_buoc: 'CẬN LÂM SÀNG / XÉT NGHIỆM',
          tom_tat: 'Dấu ấn hoại tử tế bào cơ tim có giá trị chẩn đoán vàng.',
          bieu_tuong: 'tranh_chap_phan_nhanh',
          chi_tiet: {
            phan_loai: 'CHỈ SỐ SINH HỌC',
            tieu_de: 'Động học men tim',
            ban_chat: 'Phóng thích troponin vào tuần hoàn sau khi màng tế bào cơ tim vỡ.',
            chu_thich_so_do: 'Động học tăng giảm',
            ca_thuc_te: ['Troponin hs-cTnI tăng gấp 5 lần giới hạn trên.'],
            rui_ro: ['Chậm trễ can thiệp tái tưới máu.'],
            chuoi_sup_do: ['1. Tắc mạch', '2. Tế bào thiếu oxy', '3. Giải phóng enzyme']
          }
        },
        {
          id: 'node-can-thiep-pci',
          tieu_de: 'Can thiệp mạch vành qua da (PCI)',
          nhan_buoc: 'PHÁC ĐỒ / TÁI TƯỚI MÁU',
          tom_tat: 'Tái thông dòng chảy mạch vành trong thời gian cửa - bóng < 90 phút.',
          bieu_tuong: 'khoi_tru_database',
          chi_tiet: {
            phan_loai: 'THỦ THUẬT CAN THIỆP',
            tieu_de: 'Đặt stent mạch vành',
            ban_chat: 'Khôi phục tưới máu cơ tim khẩn cấp ngăn chặn lan rộng hoại tử.',
            chu_thich_so_do: 'Thủ thuật đặt stent',
            ca_thuc_te: ['Hút huyết khối và đặt stent phủ thuốc thành công.'],
            rui_ro: ['Tái hẹp trong stent hoặc xuất huyết sau can thiệp.'],
            chuoi_sup_do: ['1. Chụp mạch', '2. Nong bóng', '3. Áp stent']
          }
        }
      ],
      edges: [
        {
          from: 'node-dau-nguc-cap',
          to: 'node-troponin-tang',
          nhan: 'Kích hoạt chỉ định men tim',
          giai_thich: 'Đau ngực cấp cần định lượng men tim ngay lập tức',
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'KICH_HOAT'
        },
        {
          from: 'node-troponin-tang',
          to: 'node-can-thiep-pci',
          nhan: 'Chỉ định can thiệp khẩn cấp',
          giai_thich: 'Men tim dương tính kết hợp ECG xác lập chỉ định PCI khẩn',
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'HOA_GIAI'
        }
      ]
    });

    // Mock provider generateCompletion
    const mockProvider = {
      config: testProviderConfig,
      testConnection: vi.fn(),
      generateCompletion: vi.fn().mockResolvedValue(mockLlmResponse)
    };
    vi.spyOn(ProviderFactory, 'getActiveProvider').mockReturnValue(mockProvider as any);

    const result = await AIGraphService.generateNewGraph({
      topic: 'Chẩn đoán & Xử trí Nhồi máu cơ tim cấp',
      domain: 'healthcare'
    });

    expect(result.graph).toBeDefined();
    expect(result.graph.nodes.length).toBe(3);
    expect(result.graph.edges.length).toBe(2);
    expect(result.domainUsed).toBe('healthcare');

    // Kiểm tra tuân thủ quy tắc kiến trúc nhãn không có số thứ tự
    expect(result.graph.nodes[0].nhan_buoc).toBe('CHẨN ĐOÁN / LÂM SÀNG');
    expect(result.graph.nodes[0].nhan_buoc).not.toMatch(/bước|step/i);
    expect(result.graph.edges[0].nhan).not.toMatch(/^\d+\./);

    // Kiểm tra lưu vào SQLite thành công
    const saved = sqliteClient.getGraph(result.graph.id);
    expect(saved).not.toBeNull();
    expect(saved?.topic).toBe('Chẩn đoán & Xử trí Nhồi máu cơ tim cấp');
  });
});
