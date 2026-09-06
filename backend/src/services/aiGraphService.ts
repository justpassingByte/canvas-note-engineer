import { ProviderFactory } from '../providers/providerFactory.js';
import {
  DomainType,
  detectDomainFromTopic,
  buildUniversalSystemPrompt,
  buildExpandNodePrompt
} from './universalDomainPrompts.js';
import { sqliteClient } from '../db/sqliteClient.js';
import { GraphData, NodeEntity, EdgeEntity } from '../types/graphTypes.js';
import {
  validateAndSanitizeEdges,
  findSafeNodePosition,
  sanitizeNodeLayerLabel,
  sanitizeProtocolEdgeLabel,
  MAX_GRAPH_NODES
} from '../tools/toolHandlers.js';

function extractJsonFromLlmOutput(raw: string): any {
  if (!raw || typeof raw !== 'string') {
    throw new Error('LLM không trả về nội dung hợp lệ.');
  }

  // 1. Thử bóc tách từ block markdown ```json ... ```
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  let cleaned = codeBlockMatch ? codeBlockMatch[1].trim() : raw.trim();

  // 2. Tìm vị trí dấu { đầu tiên và } cuối cùng
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // 3. Xử lý xóa trailing commas thường gặp trong JSON sinh bởi LLM
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

  return JSON.parse(cleaned);
}

export class AIGraphService {
  /**
   * Sinh đồ thị tri thức mới hoàn chỉnh bằng AI Provider đang được cấu hình
   */
  public static async generateNewGraph(params: {
    topic: string;
    domain?: DomainType;
    userPrompt?: string;
  }): Promise<{ graph: GraphData; providerUsed: string; domainUsed: DomainType }> {
    const provider = ProviderFactory.getActiveProvider();
    if (!provider) {
      throw new Error(
        'Chưa cấu hình AI Provider! Vui lòng mở Cài đặt AI Provider (⚙️) trên thanh công cụ để nhập API Key và Base URL.'
      );
    }

    const domain = params.domain || detectDomainFromTopic(params.topic);
    const systemPrompt = buildUniversalSystemPrompt(domain);
    const userPrompt = `Hãy xây dựng một Đồ thị Tri thức Đa phân nhánh cho chủ đề sau:
Chủ đề: "${params.topic}"
${params.userPrompt ? `Yêu cầu bổ sung của người dùng: "${params.userPrompt}"` : ''}

Yêu cầu:
- Sinh từ 3 đến 5 nodes phản ánh các khía cạnh cốt lõi (Vấn đề gốc, Cơ chế tương tranh/quy luật, Rủi ro/Biến chứng, Biện pháp giải quyết).
- Sinh các edges liên kết mạch lạc giữa các nodes.
- Trả về DUY NHẤT định dạng JSON như đã chỉ dẫn.`;

    const rawOutput = await provider.generateCompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      jsonMode: true
    });

    const parsed = extractJsonFromLlmOutput(rawOutput);

    if (!parsed || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
      throw new Error('AI không sinh được danh sách Node hợp lệ. Vui lòng thử lại với chủ đề cụ thể hơn.');
    }

    const graphId = `graph-${Date.now()}`;
    const initialNodes: NodeEntity[] = [];

    // Vị trí mẫu cho các node ban đầu
    const basePositions = [
      { x: 120, y: 160 },
      { x: 500, y: 120 },
      { x: 500, y: 460 },
      { x: 880, y: 180 },
      { x: 880, y: 480 },
      { x: 1260, y: 320 }
    ];

    for (let i = 0; i < parsed.nodes.length; i++) {
      const rawNode = parsed.nodes[i];
      const basePos = basePositions[i] || { x: 150 + i * 360, y: 200 + (i % 2) * 280 };
      const safePos = findSafeNodePosition(basePos.x, basePos.y, initialNodes);

      const nodeSlug = rawNode.id ? String(rawNode.id).toLowerCase().replace(/[^a-z0-9_-]/g, '-') : `node-${i + 1}`;

      const node: NodeEntity = {
        id: nodeSlug,
        domain_id: `domain-${domain}`,
        cluster_id: `cluster-main`,
        is_public_interface: i === 0,
        fully_explored: false,
        is_collapsed: false,
        collapsed_count: 0,
        bieu_tuong: rawNode.bieu_tuong || (i === 0 ? 'su_co_canh_bao' : 'tranh_chap_phan_nhanh'),
        tieu_de: rawNode.tieu_de || `Thành phần ${i + 1}`,
        nhan_buoc: sanitizeNodeLayerLabel(rawNode.nhan_buoc, rawNode.tieu_de),
        tom_tat: rawNode.tom_tat || 'Đang cập nhật tóm tắt chuyên môn.',
        toa_do: safePos,
        tam: { x: safePos.x + 110, y: safePos.y + 72 },
        hoat_hoa: {
          mau: 'default',
          tham_so: {
            nguon: nodeSlug,
            dich: 'SYSTEM',
            trang_thai: 'HOAT_DONG'
          }
        },
        chi_tiet: {
          phan_loai: rawNode.chi_tiet?.phan_loai || 'PHÂN TÍCH CHUYÊN SÂU',
          tieu_de: rawNode.chi_tiet?.tieu_de || rawNode.tieu_de || 'Chi tiết khái niệm',
          ban_chat: rawNode.chi_tiet?.ban_chat || rawNode.tom_tat || '',
          chu_thich_so_do: rawNode.chi_tiet?.chu_thich_so_do || 'Sơ đồ luồng tác động',
          ca_thuc_te: Array.isArray(rawNode.chi_tiet?.ca_thuc_te)
            ? rawNode.chi_tiet.ca_thuc_te
            : ['Tình huống phát sinh trong môi trường thực chiến.'],
          rui_ro: Array.isArray(rawNode.chi_tiet?.rui_ro)
            ? rawNode.chi_tiet.rui_ro
            : ['Gây suy giảm hiệu năng hoặc đứt gãy luồng xử lý.'],
          chuoi_sup_do: Array.isArray(rawNode.chi_tiet?.chuoi_sup_do)
            ? rawNode.chi_tiet.chuoi_sup_do
            : ['1. Mắt xích khởi phát', '2. Lan truyền tác động', '3. Hậu quả thực tế']
        },
        trac_nghiem: rawNode.trac_nghiem || {
          cau_hoi: `Nguyên lý trọng yếu khi xử lý '${rawNode.tieu_de}' là gì?`,
          lua_chon: [
            'Ưu tiên tốc độ thực thi ngắn hạn và bỏ qua các cơ chế kiểm soát rủi ro',
            'Thiết lập ranh giới cô lập độc lập và cơ chế phòng vệ tự động'
          ],
          dung: 1,
          giai_thich: 'Mọi hệ thống bền vững đều yêu cầu ranh giới cô lập và kiểm soát lỗi tại chỗ.',
          phan_tang: rawNode.nhan_buoc || 'Kiến trúc cốt lõi'
        }
      };

      initialNodes.push(node);
    }

    // Xử lý các edges
    const rawEdges: EdgeEntity[] = Array.isArray(parsed.edges) ? parsed.edges : [];
    const validEdges = validateAndSanitizeEdges(initialNodes, rawEdges);

    // Nếu không có edges nào từ AI, tự tạo liên kết từ node 0 đến các node tiếp theo
    if (validEdges.length === 0 && initialNodes.length > 1) {
      for (let i = 1; i < initialNodes.length; i++) {
        validEdges.push({
          from: initialNodes[0].id,
          to: initialNodes[i].id,
          nhan: sanitizeProtocolEdgeLabel(`Luồng tác động chuyên môn`),
          giai_thich: `Tương tác trực tiếp giữa ${initialNodes[0].tieu_de} và ${initialNodes[i].tieu_de}`,
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'HOA_GIAI'
        });
      }
    }

    const newGraph: GraphData = {
      id: graphId,
      topic: parsed.topic || params.topic,
      nodes: initialNodes,
      edges: validEdges
    };

    sqliteClient.saveGraph(newGraph);

    return {
      graph: newGraph,
      providerUsed: provider.config.name,
      domainUsed: domain
    };
  }

  /**
   * Mở rộng thêm 1-2 node con từ một node cụ thể bằng AI Provider
   */
  public static async expandNodeWithAI(params: {
    nodeId: string;
    intent?: string;
    userInstruction?: string;
  }): Promise<{ graph: GraphData; message: string; newNodesCount: number }> {
    const current = sqliteClient.getCurrentGraph();
    if (!current) {
      throw new Error('Chưa có đồ thị nào trên không gian làm việc.');
    }

    if (current.nodes.length >= MAX_GRAPH_NODES) {
      throw new Error(`Đồ thị đã đạt ngưỡng trần an toàn (${MAX_GRAPH_NODES} nodes). Hãy thu gọn hoặc xóa bớt nhánh để tiếp tục.`);
    }

    const targetNode = current.nodes.find(n => n.id === params.nodeId);
    if (!targetNode) {
      throw new Error(`Không tìm thấy node '${params.nodeId}' trên đồ thị.`);
    }

    const provider = ProviderFactory.getActiveProvider();
    if (!provider) {
      throw new Error('Chưa cấu hình AI Provider. Hãy mở Cài đặt AI Provider (⚙️) trên Toolbar.');
    }

    const domain = detectDomainFromTopic(current.topic);
    const existingTitles = current.nodes.map(n => n.tieu_de);

    const systemPrompt = buildUniversalSystemPrompt(domain);
    const userPrompt = buildExpandNodePrompt(
      targetNode.tieu_de,
      targetNode.tom_tat,
      existingTitles,
      domain,
      params.intent,
      params.userInstruction
    );

    const rawOutput = await provider.generateCompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      jsonMode: true
    });

    const parsed = extractJsonFromLlmOutput(rawOutput);
    const candidateNodes: any[] = parsed.new_nodes || parsed.nodes || [];
    const candidateEdges: any[] = parsed.new_edges || parsed.edges || [];

    if (!Array.isArray(candidateNodes) || candidateNodes.length === 0) {
      throw new Error('AI không tìm thấy hướng mở rộng mới phù hợp.');
    }

    const newNodesToAdd: NodeEntity[] = [];

    for (let i = 0; i < candidateNodes.length; i++) {
      const raw = candidateNodes[i];
      const preferredX = targetNode.toa_do.x + (i + 1) * 340;
      const preferredY = targetNode.toa_do.y + (i % 2 === 0 ? 120 : -140);
      const safePos = findSafeNodePosition(preferredX, preferredY, [...current.nodes, ...newNodesToAdd]);

      const nodeSlug = raw.id ? String(raw.id).toLowerCase().replace(/[^a-z0-9_-]/g, '-') : `node-child-${Date.now()}-${i}`;

      const newNode: NodeEntity = {
        id: nodeSlug,
        parent_id: targetNode.id,
        domain_id: targetNode.domain_id || `domain-${domain}`,
        cluster_id: targetNode.cluster_id || 'cluster-main',
        is_public_interface: false,
        fully_explored: false,
        is_collapsed: false,
        collapsed_count: 0,
        bieu_tuong: raw.bieu_tuong || 'tranh_chap_phan_nhanh',
        tieu_de: raw.tieu_de || `Nhánh con ${i + 1}`,
        nhan_buoc: sanitizeNodeLayerLabel(raw.nhan_buoc, raw.tieu_de),
        tom_tat: raw.tom_tat || 'Đang cập nhật tóm tắt.',
        toa_do: safePos,
        tam: { x: safePos.x + 110, y: safePos.y + 72 },
        hoat_hoa: {
          mau: 'default',
          tham_so: {
            nguon: nodeSlug,
            dich: targetNode.id,
            trang_thai: 'MO_RONG_PHAN_NHANH'
          }
        },
        chi_tiet: {
          phan_loai: raw.chi_tiet?.phan_loai || 'PHÂN NHÁNH MỞ RỘNG',
          tieu_de: raw.chi_tiet?.tieu_de || raw.tieu_de,
          ban_chat: raw.chi_tiet?.ban_chat || raw.tom_tat,
          chu_thich_so_do: raw.chi_tiet?.chu_thich_so_do || 'Sơ đồ mở rộng nhánh',
          ca_thuc_te: Array.isArray(raw.chi_tiet?.ca_thuc_te) ? raw.chi_tiet.ca_thuc_te : ['Tình huống thực tế phát sinh.'],
          rui_ro: Array.isArray(raw.chi_tiet?.rui_ro) ? raw.chi_tiet.rui_ro : ['Rủi ro tiềm ẩn cần kiểm soát.'],
          chuoi_sup_do: Array.isArray(raw.chi_tiet?.chuoi_sup_do) ? raw.chi_tiet.chuoi_sup_do : ['1. Nguyên nhân', '2. Diễn tiến', '3. Kết cục']
        },
        trac_nghiem: raw.trac_nghiem || {
          cau_hoi: `Bài học then chốt khi mở rộng phân hệ '${raw.tieu_de}' là gì?`,
          lua_chon: [
            'Bỏ qua sự ràng buộc với các nút cha để tối đa hóa tính độc lập cục bộ',
            'Đảm bảo sự nhất quán với toàn thể cấu trúc và kiểm soát rủi ro biên'
          ],
          dung: 1,
          giai_thich: 'Mỗi nhánh mở rộng phải được liên kết có kiểm soát.',
          phan_tang: raw.nhan_buoc || 'Kiến trúc cốt lõi'
        }
      };

      newNodesToAdd.push(newNode);
    }

    // Chuẩn bị edges
    const allPotentialNodes = [...current.nodes, ...newNodesToAdd];
    const normalizedEdges: EdgeEntity[] = [];

    for (const e of candidateEdges) {
      const fromId = e.from === targetNode.tieu_de || !current.nodes.some(n => n.id === e.from) ? targetNode.id : e.from;
      const targetMatch = newNodesToAdd.find(n => n.tieu_de === e.to || n.id === e.to);
      const toId = targetMatch ? targetMatch.id : newNodesToAdd[0]?.id;

      if (fromId && toId && fromId !== toId) {
        normalizedEdges.push({
          from: fromId,
          to: toId,
          nhan: sanitizeProtocolEdgeLabel(e.nhan),
          giai_thich: e.giai_thich || `Liên kết từ ${targetNode.tieu_de}`,
          kieu: e.kieu || 'duong-xung-em-ai',
          loai_lien_ket: e.loai_lien_ket || 'HOA_GIAI'
        });
      }
    }

    // Nếu không có edge từ LLM, tự động nối từ targetNode đến tất cả newNodesToAdd
    if (normalizedEdges.length === 0) {
      for (const n of newNodesToAdd) {
        normalizedEdges.push({
          from: targetNode.id,
          to: n.id,
          nhan: sanitizeProtocolEdgeLabel(params.intent || 'Mở rộng phân nhánh'),
          giai_thich: `Được mở rộng từ ${targetNode.tieu_de}`,
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'HOA_GIAI'
        });
      }
    }

    const validatedEdges = validateAndSanitizeEdges(allPotentialNodes, normalizedEdges);

    const updated = sqliteClient.addDeltaNodes(
      current.id,
      targetNode.id,
      newNodesToAdd,
      validatedEdges
    );

    return {
      graph: updated || current,
      message: `Đã mở rộng thành công ${newNodesToAdd.length} node mới bằng ${provider.config.name}!`,
      newNodesCount: newNodesToAdd.length
    };
  }
}
