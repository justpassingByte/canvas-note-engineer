import React, { useState, useEffect } from 'react';
import { X, FileText, Upload, Sparkles, FolderOpen, CheckCircle, AlertCircle, FileCode, RotateCcw } from 'lucide-react';
import { useGraphStore } from '../../store/useGraphStore.js';

interface RagDoc {
  filename: string;
  size: number;
  updatedAt: number;
  title: string;
}

interface BrainstormRagModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrainstormRagModal: React.FC<BrainstormRagModalProps> = ({ isOpen, onClose }) => {
  const { setGraph } = useGraphStore();
  const [activeTab, setActiveTab] = useState<'files' | 'upload' | 'paste'>('files');
  const [documents, setDocuments] = useState<RagDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string>('');
  const [docPreview, setDocPreview] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Nạp danh sách tài liệu trong folder rag/
  useEffect(() => {
    if (isOpen) {
      fetchDocs();
    }
  }, [isOpen]);

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/rag/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        if (data.documents?.length > 0 && !selectedDoc) {
          loadDocPreview(data.documents[0].filename);
        }
      }
    } catch (err) {
      console.error('Không thể tải danh sách tài liệu RAG:', err);
    }
  };

  const loadDocPreview = async (filename: string) => {
    setSelectedDoc(filename);
    try {
      const res = await fetch(`/api/rag/document/${encodeURIComponent(filename)}`);
      if (res.ok) {
        const data = await res.json();
        setDocPreview(data.content);
      }
    } catch (err) {
      setDocPreview('Không thể đọc nội dung tài liệu.');
    }
  };

  // Xử lý nạp từ file có sẵn trong rag/
  const handleIngestExisting = async () => {
    if (!selectedDoc) return;
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/rag/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedDoc })
      });
      const data = await res.json();
      if (data.success && data.graph) {
        setGraph(data.graph);
        setStatusMessage({
          type: 'success',
          text: `Đã sinh Cụm '${data.cluster_name}' (${data.nodeCount} nodes) thành công!`
        });
        setTimeout(() => onClose(), 1200);
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Không thể sinh cụm từ tài liệu.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Lỗi kết nối máy chủ.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Xử lý upload file từ máy
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setUploadedFile({ name: file.name, content });
    };
    reader.readAsText(file);
  };

  const handleIngestUpload = async () => {
    if (!uploadedFile) return;
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/rag/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: uploadedFile.name, content: uploadedFile.content })
      });
      const data = await res.json();
      if (data.success && data.graph) {
        setGraph(data.graph);
        setStatusMessage({
          type: 'success',
          text: `Đã lưu vào rag/ và sinh Cụm '${data.cluster_name}' (${data.nodeCount} nodes)!`
        });
        setTimeout(() => onClose(), 1200);
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Không thể sinh cụm.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Lỗi tải lên.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Xử lý dán trực tiếp Brainstorm text
  const handleIngestRawText = async () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/rag/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: rawText, filename: 'custom_brainstorm.md' })
      });
      const data = await res.json();
      if (data.success && data.graph) {
        setGraph(data.graph);
        setStatusMessage({
          type: 'success',
          text: `Đã phân tích và sinh Cụm '${data.cluster_name}' (${data.nodeCount} nodes)!`
        });
        setTimeout(() => onClose(), 1200);
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Không thể phân tích tài liệu.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Lỗi phân tích.' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(3px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '760px',
          maxWidth: '92vw',
          maxHeight: '88vh',
          background: '#FFFFFF',
          border: '2px solid #1A1D24',
          borderRadius: '8px',
          boxShadow: '6px 6px 0px #1A1D24',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'JetBrains Mono, monospace'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '2px solid #1A1D24',
            background: '#F9FAFB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={18} color="#4F46E5" />
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>
              RAG BRAINSTORM DOC INGESTION & SPAWN ENGINE
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex'
            }}
          >
            <X size={18} color="#4B5563" />
          </button>
        </div>

        {/* Tab Selection */}
        <div
          style={{
            display: 'flex',
            borderBottom: '2px solid #E5E7EB',
            background: '#F3F4F6'
          }}
        >
          <button
            onClick={() => setActiveTab('files')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: activeTab === 'files' ? '#FFFFFF' : 'transparent',
              fontWeight: 700,
              fontSize: '11px',
              color: activeTab === 'files' ? '#4F46E5' : '#6B7280',
              borderBottom: activeTab === 'files' ? '2px solid #4F46E5' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <FileText size={14} />
            <span>Folder rag/ ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: activeTab === 'upload' ? '#FFFFFF' : 'transparent',
              fontWeight: 700,
              fontSize: '11px',
              color: activeTab === 'upload' ? '#4F46E5' : '#6B7280',
              borderBottom: activeTab === 'upload' ? '2px solid #4F46E5' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Upload size={14} />
            <span>Upload File (.md / .json)</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: activeTab === 'paste' ? '#FFFFFF' : 'transparent',
              fontWeight: 700,
              fontSize: '11px',
              color: activeTab === 'paste' ? '#4F46E5' : '#6B7280',
              borderBottom: activeTab === 'paste' ? '2px solid #4F46E5' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <FileCode size={14} />
            <span>Dán trực tiếp Brainstorm</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {statusMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                fontWeight: 600,
                background: statusMessage.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                color: statusMessage.type === 'success' ? '#065F46' : '#991B1B',
                border: `1px solid ${statusMessage.type === 'success' ? '#A7F3D0' : '#FECACA'}`
              }}
            >
              {statusMessage.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Tab 1: Danh sách file trong folder rag/ */}
          {activeTab === 'files' && (
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '12px', minHeight: '260px' }}>
              <div style={{ border: '1.5px solid #E5E7EB', borderRadius: '6px', overflowY: 'auto', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF' }}>CÁC FILE TRONG RAG/</span>
                  <button onClick={fetchDocs} title="Quét lại folder rag/" style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#4F46E5', fontWeight: 600 }}>
                    <RotateCcw size={10} /> Làm mới
                  </button>
                </div>
                {documents.map((doc) => (
                  <button
                    key={doc.filename}
                    onClick={() => loadDocPreview(doc.filename)}
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      border: selectedDoc === doc.filename ? '1.5px solid #4F46E5' : '1px solid transparent',
                      background: selectedDoc === doc.filename ? '#EEF2FF' : 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: selectedDoc === doc.filename ? '#3730A3' : '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <FileText size={13} color={selectedDoc === doc.filename ? '#4F46E5' : '#9CA3AF'} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.filename}
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ border: '1.5px solid #E5E7EB', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', background: '#F9FAFB' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', marginBottom: '6px' }}>
                  NỘI DUNG XEM TRƯỚC: {selectedDoc}
                </span>
                <pre
                  style={{
                    flex: 1,
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '4px',
                    padding: '10px',
                    fontSize: '10px',
                    lineHeight: '1.4',
                    overflowY: 'auto',
                    maxHeight: '220px',
                    color: '#1F2937'
                  }}
                >
                  {docPreview || 'Chọn một file bên trái để xem trước...'}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 2: Upload file mới */}
          {activeTab === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label
                style={{
                  border: '2px dashed #9CA3AF',
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#F9FAFB'
                }}
              >
                <Upload size={24} color="#4F46E5" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                  {uploadedFile ? `Đã chọn: ${uploadedFile.name}` : 'Nhấp để chọn file .md, .txt hoặc .json từ máy tính'}
                </div>
                <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '4px' }}>
                  Tự động lưu vào thư mục rag/ và phân tích sinh cụm
                </div>
                <input
                  type="file"
                  accept=".md,.txt,.json"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>

              {uploadedFile && (
                <div style={{ border: '1.5px solid #E5E7EB', borderRadius: '6px', padding: '10px', background: '#F9FAFB' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280' }}>XEM TRƯỚC NỘI DUNG:</span>
                  <pre
                    style={{
                      marginTop: '6px',
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '4px',
                      padding: '10px',
                      fontSize: '10px',
                      maxHeight: '160px',
                      overflowY: 'auto'
                    }}
                  >
                    {uploadedFile.content}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Dán trực tiếp */}
          {activeTab === 'paste' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280' }}>
                  DÁN BẢN THIẾT KẾ KIẾN TRÚC HOẶC BRAINSTORM TEXT:
                </span>
                <button
                  onClick={() => setRawText(`[DOMAIN]: AUTHENTICATION & IDENTITY PLATFORM\n\n[SERVICE CLUSTER]: OIDC IDENTITY SERVICE\n- [API Gateway (PEP)]: Zero-Trust Policy Enforcement Point xác thực mTLS.\n- [OIDC Provider Server]: Cấp phát JWT và luân chuyển khóa RS256.\n\n[SUB-CLUSTER]: AUTH REDIS CLUSTER\n(Namespace: auth:*)\n- [Token Revocation Blacklist]: Thu hồi token tức thì qua Redis.\n`)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#4F46E5',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + Dùng mẫu gợi ý
                </button>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste tài liệu brainstorm hoặc cấu trúc Domain -> Service -> Sub-cluster vào đây..."
                style={{
                  width: '100%',
                  height: '220px',
                  borderRadius: '6px',
                  border: '1.5px solid #D1D5DB',
                  padding: '10px',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  resize: 'vertical'
                }}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '2px solid #1A1D24',
            background: '#F9FAFB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '10px', color: '#6B7280' }}>
            RAG Engine: 0 Token AI, Phân tích cục bộ 100%
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '7px 14px',
                border: '1.5px solid #D1D5DB',
                borderRadius: '6px',
                background: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#374151'
              }}
            >
              Hủy
            </button>

            {activeTab === 'files' && (
              <button
                disabled={isProcessing || !selectedDoc}
                onClick={handleIngestExisting}
                style={{
                  padding: '7px 16px',
                  border: '2px solid #1A1D24',
                  borderRadius: '6px',
                  background: isProcessing ? '#9CA3AF' : '#4F46E5',
                  boxShadow: isProcessing ? 'none' : '2px 2px 0px #1A1D24',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={13} />
                <span>{isProcessing ? 'Đang phân tích...' : 'Nạp & Tự Động Sinh Cụm'}</span>
              </button>
            )}

            {activeTab === 'upload' && (
              <button
                disabled={isProcessing || !uploadedFile}
                onClick={handleIngestUpload}
                style={{
                  padding: '7px 16px',
                  border: '2px solid #1A1D24',
                  borderRadius: '6px',
                  background: isProcessing || !uploadedFile ? '#9CA3AF' : '#059669',
                  boxShadow: isProcessing || !uploadedFile ? 'none' : '2px 2px 0px #1A1D24',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: isProcessing || !uploadedFile ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Upload size={13} />
                <span>{isProcessing ? 'Đang lưu & sinh...' : 'Lưu Vào RAG & Sinh Cụm'}</span>
              </button>
            )}

            {activeTab === 'paste' && (
              <button
                disabled={isProcessing || !rawText.trim()}
                onClick={handleIngestRawText}
                style={{
                  padding: '7px 16px',
                  border: '2px solid #1A1D24',
                  borderRadius: '6px',
                  background: isProcessing || !rawText.trim() ? '#9CA3AF' : '#7C3AED',
                  boxShadow: isProcessing || !rawText.trim() ? 'none' : '2px 2px 0px #1A1D24',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: isProcessing || !rawText.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={13} />
                <span>{isProcessing ? 'Đang phân tích...' : 'Phân Tích & Sinh Cụm Lên Canvas'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
