import { describe, it, expect } from 'vitest';
import { enrichHtmlWithTooltips, TECHNICAL_DICTIONARY } from '../../dictionary/technicalDictionary.js';

describe('Hybrid Zero-Token Keyword Tooltip & Auto-Enricher', () => {
  it('should auto-detect technical terms in plain text without requiring <u> tags (0 tokens)', () => {
    const plainText = 'Hệ thống triển khai lá chắn WAF và kiểm soát lưu lượng qua sliding window trên RAM.';
    const enriched = enrichHtmlWithTooltips(plainText);

    expect(enriched).toContain('<u data-tooltip="');
    expect(enriched).toContain(TECHNICAL_DICTIONARY['waf']);
    expect(enriched).toContain(TECHNICAL_DICTIONARY['sliding window']);
    expect(enriched).toContain('<u data-tooltip="' + TECHNICAL_DICTIONARY['waf'] + '">WAF</u>');
    expect(enriched).toContain('<u data-tooltip="' + TECHNICAL_DICTIONARY['sliding window'] + '">sliding window</u>');
  });

  it('should prioritize longer multi-word phrases over single words', () => {
    const text = 'Mỗi yêu cầu cần đính kèm Idempotency Key duy nhất vào HTTP Header.';
    const enriched = enrichHtmlWithTooltips(text);

    // Should match "Idempotency Key" together, not just "Idempotency"
    expect(enriched).toContain('<u data-tooltip="' + TECHNICAL_DICTIONARY['idempotency key'] + '">Idempotency Key</u>');
    expect(enriched).not.toContain('<u data-tooltip="' + TECHNICAL_DICTIONARY['idempotency'] + '">Idempotency</u> Key');
  });

  it('should preserve and enrich pre-existing <u> tags without double wrapping', () => {
    const mixedHtml = 'Bảo chứng <u>ACID</u> và ghi nhận qua <u>Merkle Tree</u> mật mã.';
    const enriched = enrichHtmlWithTooltips(mixedHtml);

    expect(enriched).toContain('<u data-tooltip="' + TECHNICAL_DICTIONARY['acid'] + '">ACID</u>');
    expect(enriched).toContain('<u data-tooltip="' + TECHNICAL_DICTIONARY['merkle tree'] + '">Merkle Tree</u>');
    // Ensure no nested <u><u>
    expect(enriched).not.toContain('<u<u');
    expect(enriched).not.toContain('<u><u');
  });

  it('should preserve existing custom data-tooltip if already provided', () => {
    const customHtml = '<u data-tooltip="Giải thích tùy biến riêng từ tác giả">UUID v4</u>';
    const enriched = enrichHtmlWithTooltips(customHtml);

    expect(enriched).toBe('<u data-tooltip="Giải thích tùy biến riêng từ tác giả">UUID v4</u>');
  });
});
