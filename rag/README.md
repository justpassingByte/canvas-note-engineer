# Thư mục RAG Brainstorm Documents

Nơi lưu trữ các tài liệu kiến trúc, bản thiết kế kỹ thuật (RFC), sơ đồ phân cấp (Domain -> Service -> Sub-cluster -> Node).

## Định dạng hỗ trợ:
1. **Markdown Brainstorm chuẩn**:
```text
[DOMAIN]: TÊN DOMAIN
[SERVICE CLUSTER]: TÊN SERVICE
- [Tên Node 1]: Tóm tắt vai trò
- [Tên Node 2]: Tóm tắt vai trò

[SUB-CLUSTER]: TÊN SUB-CLUSTER (vd: Auth Redis Cluster)
(Namespace: auth:*)
- [Tên Node Hạ Tầng]: Tóm tắt
```

2. **File JSON cấu trúc** trực tiếp theo định dạng `SpawnClusterPayload`.
