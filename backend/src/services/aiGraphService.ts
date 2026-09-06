import { ProviderFactory } from '../providers/providerFactory.js';
import {
  DomainType,
  detectDomainFromTopic,
  buildUniversalSystemPrompt,
  buildExpandNodePrompt
} from './universalDomainPrompts.js';
import { sqliteClient } from '../db/sqliteClient.js';
import { GraphData, NodeEntity, EdgeEntity, SpawnClusterPayload } from '../types/graphTypes.js';
import {
  toolHandlers,
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

  /**
   * Sinh một Cụm Phân Hệ (Cluster) hoàn chỉnh từ yêu cầu prompt của người dùng
   * TÁI SỬ DỤNG 100% ENGINE CỦA toolHandlers.spawnConceptCluster:
   * Tự động sinh sub-clusters, reflex drills, incident dossiers, bounded context layout và SQLite persistence.
   */
  public static async spawnClusterWithAI(params: {
    prompt: string;
    position?: { x: number; y: number };
    connectedToNodeId?: string;
  }): Promise<{ graph: GraphData; message: string; newNodesCount: number; cluster_id?: string }> {
    let current = sqliteClient.getCurrentGraph();
    if (!current) {
      const genRes = await this.generateNewGraph({ topic: params.prompt });
      return {
        graph: genRes.graph,
        message: `Đã khởi tạo đồ thị và sinh cụm mới từ: ${params.prompt}`,
        newNodesCount: genRes.graph.nodes.length
      };
    }

    if (current.nodes.length >= MAX_GRAPH_NODES) {
      throw new Error(`Đồ thị đã đạt ngưỡng trần an toàn (${MAX_GRAPH_NODES} nodes).`);
    }

    const provider = ProviderFactory.getActiveProvider();
    if (!provider) {
      throw new Error('Chưa cấu hình AI Provider. Hãy mở Cài đặt AI Provider (⚙️).');
    }

    const domain = detectDomainFromTopic(current.topic);
    const systemPrompt = buildUniversalSystemPrompt(domain);
    const existingTitles = current.nodes.map(n => n.tieu_de);

    const userPrompt = `Người dùng yêu cầu sinh một CỤM PHÂN HỆ KIẾN TRÚC MỚI (Cluster) trên đồ thị hiện tại.
Yêu cầu của người dùng: "${params.prompt}"
Đồ thị hiện có các thành phần: ${existingTitles.slice(0, 10).join(', ')}.

Hãy phân tích và sinh cấu trúc JSON tương thích SpawnClusterPayload:
- cluster_name: Tên cụm phân hệ (in hoa, ngắn gọn, chuẩn DDD Bounded Context, ví dụ: PAYMENT_GATEWAY, IDENTITY_AUTH, PROMOTION_ENGINE, ORDER_FULFILLMENT)
- nodes: Danh sách từ 2 đến 4 nodes cốt lõi trong cụm dịch vụ chính:
  + title: Tên thành phần
  + role: Vai trò kiến trúc ('gateway' | 'service' | 'engine' | 'worker')
  + summary: Tóm tắt chức năng (1 câu)
  + ban_chat: Bản chất thiết kế kỹ thuật
- sub_clusters: (TỰ SINH NẾU PHÙ HỢP LOGIC KIẾN TRÚC):
  Cụm con hạ tầng chuyên biệt nội bộ của phân hệ này (ví dụ: sub-cluster cache Redis, sub-cluster queue Kafka, sub-cluster DB)
  Mỗi sub_cluster gồm: { "name": string, "infra_type": "redis" | "kafka" | "postgres", "nodes": [{ "title": string, "summary": string }] }
- connect_to_shared_infra: (TÙY CHỌN): Mảng các hạ tầng dùng chung cần liên kết nếu không có sub-cluster riêng: ['cache', 'queue', 'db']

Format JSON DUY NHẤT:
{
  "cluster_name": "TÊN_CỤM",
  "nodes": [
    { "title": "...", "role": "gateway", "summary": "...", "ban_chat": "..." }
  ],
  "sub_clusters": [
    { "name": "...", "infra_type": "redis", "nodes": [{ "title": "...", "summary": "..." }] }
  ],
  "connect_to_shared_infra": ["cache", "db"]
}`;

    const rawOutput = await provider.generateCompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      jsonMode: true
    });

    const parsed = extractJsonFromLlmOutput(rawOutput);
    const rawNodes = Array.isArray(parsed.nodes) && parsed.nodes.length > 0 ? parsed.nodes : [
      { title: `${params.prompt} Gateway`, role: 'gateway', summary: `Cổng tiếp nhận của ${params.prompt}` },
      { title: `${params.prompt} Core Service`, role: 'service', summary: `Dịch vụ xử lý trung tâm của ${params.prompt}` }
    ];

    // TÁI SỬ DỤNG 100% ENGINE CỦA toolHandlers.spawnConceptCluster
    const clusterResult = await toolHandlers.spawnConceptCluster({
      cluster_name: parsed.cluster_name || params.prompt,
      nodes: rawNodes,
      sub_clusters: Array.isArray(parsed.sub_clusters) ? parsed.sub_clusters : undefined,
      connect_to_shared_infra: Array.isArray(parsed.connect_to_shared_infra) ? parsed.connect_to_shared_infra : undefined,
      position: params.position
    });

    if (!clusterResult.spawned) {
      throw new Error(clusterResult.message);
    }

    // Nếu chỉ định kết nối từ một Node đã có trên đồ thị, cắm dây từ node đó sang Public Gateway của cụm mới
    if (params.connectedToNodeId) {
      const updatedGraph = sqliteClient.getCurrentGraph();
      if (updatedGraph) {
        const parentNode = updatedGraph.nodes.find(n => n.id === params.connectedToNodeId);
        const clusterIngressNode = updatedGraph.nodes.find(n => n.cluster_id === clusterResult.cluster_id && n.is_public_interface)
          || updatedGraph.nodes.find(n => n.cluster_id === clusterResult.cluster_id);

        if (parentNode && clusterIngressNode && parentNode.id !== clusterIngressNode.id) {
          const bridgeEdge: EdgeEntity = {
            from: parentNode.id,
            to: clusterIngressNode.id,
            nhan: sanitizeProtocolEdgeLabel('Cluster Ingress Flow'),
            giai_thich: `Kết nối luồng từ ${parentNode.tieu_de} sang Cụm ${parsed.cluster_name || params.prompt}`,
            kieu: 'duong-xung-em-ai',
            loai_lien_ket: 'HOA_GIAI'
          };
          const validated = validateAndSanitizeEdges(updatedGraph.nodes, [...updatedGraph.edges, bridgeEdge]);
          updatedGraph.edges = validated;
          sqliteClient.saveGraph(updatedGraph);
          clusterResult.graph = updatedGraph;
        }
      }
    }

    return {
      graph: clusterResult.graph,
      message: clusterResult.message,
      newNodesCount: clusterResult.graph.nodes.length,
      cluster_id: clusterResult.cluster_id
    };
  }

  /**
   * Sinh một Concept / Miền nghiệp vụ (Domain Boundary) đơn lẻ
   * TÁI SỬ DỤNG 100% ENGINE CỦA toolHandlers.spawnConceptNode
   */
  public static async spawnConceptWithAI(params: {
    prompt: string;
    position?: { x: number; y: number };
  }): Promise<{ graph: GraphData; message: string; newNode: NodeEntity }> {
    let current = sqliteClient.getCurrentGraph();
    if (!current) {
      const genRes = await this.generateNewGraph({ topic: params.prompt });
      return {
        graph: genRes.graph,
        message: `Đã khởi tạo đồ thị với concept: ${params.prompt}`,
        newNode: genRes.graph.nodes[0]
      };
    }

    if (current.nodes.length >= MAX_GRAPH_NODES) {
      throw new Error(`Đồ thị đã đạt ngưỡng trần an toàn (${MAX_GRAPH_NODES} nodes).`);
    }

    const provider = ProviderFactory.getActiveProvider();
    if (!provider) {
      throw new Error('Chưa cấu hình AI Provider. Hãy mở Cài đặt AI Provider (⚙️).');
    }

    const domain = detectDomainFromTopic(current.topic);
    const systemPrompt = buildUniversalSystemPrompt(domain);

    const userPrompt = `Người dùng muốn tạo một NODE KHÁI NIỆM / MIỀN NGHIỆP VỤ MỚI (Concept / Domain Boundary) độc lập trên đồ thị kiến trúc:
Mô tả/Chủ đề: "${params.prompt}"

Hãy sinh 1 node duy nhất phản ánh bản chất khái niệm này.
Format JSON:
{
  "title": "Tên Khái Niệm / Domain (ngắn gọn, chuẩn kỹ thuật)",
  "category": "ARCHITECTURAL_LAYER (vd: DOMAIN / CONTEXT, GATEWAY / INGRESS, DATA / STORAGE)",
  "description": "1-2 câu giải thích cô đọng bản chất",
  "ban_chat": "Phân tích bản chất và ranh giới kiến trúc"
}`;

    const rawOutput = await provider.generateCompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      jsonMode: true
    });

    const parsed = extractJsonFromLlmOutput(rawOutput);

    // TÁI SỬ DỤNG 100% ENGINE CỦA toolHandlers.spawnConceptNode
    const spawnResult = await toolHandlers.spawnConceptNode({
      concept_type: 'custom',
      title: parsed.title || params.prompt,
      category: sanitizeNodeLayerLabel(parsed.category || 'DOMAIN / CONCEPT', parsed.title || params.prompt),
      description: parsed.description || params.prompt,
      ban_chat: parsed.ban_chat,
      position: params.position
    });

    if (!spawnResult.spawned || !spawnResult.node) {
      throw new Error(spawnResult.message || 'Không thể tạo Concept');
    }

    return {
      graph: spawnResult.graph,
      message: spawnResult.message,
      newNode: spawnResult.node
    };
  }

  /**
   * Đọc hiểu và phân tích sâu tài liệu kỹ thuật bất kỳ (PRD, RFC, Specs, Free-form Text)
   * Sử dụng AI Provider để sinh kiến trúc phân cấp chuẩn DDD Bounded Context
   */
  public static async ingestDocumentWithAI(params: {
    rawText: string;
    filename?: string;
  }): Promise<{ payload: SpawnClusterPayload; providerUsed: string }> {
    const provider = ProviderFactory.getActiveProvider();
    if (!provider) {
      throw new Error('Chưa cấu hình AI Provider. Vui lòng mở Cài đặt AI Provider (⚙️) trên Toolbar để nhập API Key.');
    }

    const systemPrompt = `Bạn là một Principal System Architect / Distinguished Systems Engineer.
Nhiệm vụ của bạn là đọc hiểu TOÀN BỘ tài liệu kỹ thuật được cung cấp (dù là PRD, RFC, System Specification, Meeting Notes, Post-Mortem hay văn bản tự do bằng tiếng Việt hoặc tiếng Anh) và bóc tách thành một Kiến trúc Hệ thống chuẩn Domain-Driven Design (DDD) Bounded Context dạng JSON SpawnClusterPayload.

QUY TẮC THIẾT KẾ BẮT BUỘC:
1. BOUNDED CONTEXT & SERVICE CLUSTER:
   - "cluster_name": Tên Phân Hệ Dịch Vụ chính (in hoa, ngắn gọn, chuẩn DDD, ví dụ: "PAYMENT_SETTLEMENT_GATEWAY", "VIDEO_TRANSCODING_PIPELINE", "HOTEL_RESERVATION_CORE", "REALTIME_LOCATION_TRACKING").
   - "domain_id": Slug định danh miền nghiệp vụ (ví dụ: "domain-payment", "domain-transcoding").
   - "cluster_theme": Chọn 1 trong các mã màu: "emerald" (thanh toán/tài chính), "indigo" (xác thực/bảo mật), "purple" (bảo mật/WAF), "amber" (kiểm toán/log/giám sát), "blue" (hạ tầng), "rose" (cảnh báo/sự cố).

2. DANH SÁCH NODES CỐT LÕI TRONG CỤM DỊCH VỤ (2 đến 4 nodes):
   - Phân chia vai trò rõ ràng:
     + 1 Node Ingress / Public API Gateway: "is_public_interface": true, "role": "gateway", "schematic_template": "pipeline_filter" hoặc "zero_trust_pep".
     + 1 Node Core Domain Engine: "is_public_interface": false, "role": "engine", "schematic_template": "split_allocation" hoặc "state_machine".
     + 1 Node Application Service / Orchestrator: "is_public_interface": false, "role": "service", "schematic_template": "two_phase_state_machine".
     + 1 Node Worker / Outbox Consumer (nếu tài liệu có xử lý nền hoặc hàng đợi): "role": "worker", "schematic_template": "hexagonal_ports".
   - Mỗi node BẮT BUỘC có các trường chi tiết kỹ thuật:
     + "title": Tên thành phần kỹ thuật chính xác.
     + "nhan_buoc": TẦNG KIẾN TRÚC IN HOA (vd: "GATEWAY / INGRESS", "COMPUTE / CONCURRENCY", "DOMAIN / CORE LOGIC"). TUYỆT ĐỐI KHÔNG dùng tiền tố tuyến tính "Bước 1", "Step 1".
     + "summary": Tóm tắt 1 câu rõ ràng.
     + "ban_chat": Giải thích bản chất kỹ thuật 2-3 câu, ranh giới dữ liệu và luồng xử lý.
     + "ca_thuc_te": Mảng 2 case sự cố/tình huống thực tế.
     + "rui_ro": Mảng 2 rủi ro kỹ thuật nghiêm trọng (deadlock, OOM, starvation, stampede).
     + "chuoi_sup_do": Mảng 4 bước domino (1. Trigger -> 2. Saturation -> 3. Failure Cascade -> 4. Blast Radius).
     + "incident_cases": Mảng 1-2 sự cố với cấu trúc:
       { "id": "...", "title": "...", "traffic_profile": "...", "root_cause_analysis": "...", "blast_radius": "...", "cascading_failure_path": ["1. Trigger...", "2. Saturation...", "3. Cascade...", "4. Blast..."], "mitigation_strategy": "..." }
     + "trac_nghiem": Câu hỏi trắc nghiệm phản xạ kiến trúc:
       { "cau_hoi": "...", "lua_chon": ["Đáp án đúng", "Đáp án sai"], "dung": 0, "giai_thich": "..." }

3. SUB-CLUSTERS HẠ TẦNG CỤC BỘ (TỰ ĐỘNG PHÁT HIỆN TỪ TÀI LIỆU):
   - Nếu tài liệu đề cập đến cơ sở dữ liệu quan hệ, ACID, giao dịch tài chính, lưu trữ bền vững:
     -> Sinh sub_cluster với "name": Tên Sub-Cluster DB cụ thể (vd: "PostgreSQL Storage & Ledger Subsystem"), "infra_type": "postgres", "nodes": [{ "title": "...", "summary": "...", "schematic_template": "table_row_lock" }].
   - Nếu tài liệu đề cập đến cache, RAM, sliding window rate limit, lock phân tán:
     -> Sinh sub_cluster với "name": Tên Sub-Cluster Cache cụ thể (vd: "Redis Cache & Rate Limit Subsystem"), "infra_type": "redis", "nodes": [{ "title": "...", "summary": "...", "schematic_template": "cache_ttl_lock" }].
   - Nếu tài liệu đề cập đến hàng đợi, message broker, sự kiện bất đồng bộ, outbox:
     -> Sinh sub_cluster với "name": Tên Sub-Cluster Queue cụ thể (vd: "Transactional Outbox & Event Queue"), "infra_type": "kafka", "nodes": [{ "title": "...", "summary": "...", "schematic_template": "queue_outbox_conveyor" }].

4. ĐỊNH DẠNG ĐẦU RA:
   - BẮT BUỘC trả về DUY NHẤT một khối JSON hợp lệ theo format:
{
  "cluster_name": "TÊN_CỤM_DỊCH_VỤ",
  "domain_id": "domain-slug",
  "cluster_theme": "emerald",
  "nodes": [ ... ],
  "sub_clusters": [ ... ]
}`;

    const userPrompt = `Dưới đây là tài liệu kỹ thuật cần đọc hiểu và chuyển hóa thành kiến trúc hệ thống:
Tên tài liệu: ${params.filename || 'Tài liệu không tên'}
Nội dung tài liệu:
"""
${params.rawText.slice(0, 20000)}
"""

Hãy phân tích toàn diện và sinh JSON SpawnClusterPayload hoàn chỉnh.`;

    const rawOutput = await provider.generateCompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      jsonMode: true
    });

    const parsed = extractJsonFromLlmOutput(rawOutput);

    if (!parsed || !parsed.cluster_name || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
      throw new Error('AI không sinh được payload kiến trúc hợp lệ từ tài liệu.');
    }

    return {
      payload: parsed as SpawnClusterPayload,
      providerUsed: `${provider.config.name} (${provider.config.model})`
    };
  }
}
