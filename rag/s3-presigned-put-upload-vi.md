# Upload bằng Presigned PUT cho Kho Lưu trữ Tương thích S3

> Hướng dẫn triển khai cho phép trình duyệt upload file **trực tiếp lên kho lưu trữ tương thích S3** bằng URL `PUT` có chữ ký, thời hạn ngắn. Byte file không bao giờ chạm vào máy chủ của bạn; máy chủ chỉ ký URL sau khi xác thực yêu cầu. Áp dụng cho mọi kho lưu trữ nói giao thức S3 — AWS S3, Cloudflare R2, MinIO, Backblaze B2 (S3 API), DigitalOcean Spaces, Wasabi, Alibaba OSS, Google Cloud Storage endpoint S3, và các kho khác.

## Mô hình tư duy cốt lõi

- **Tương thích S3** — kho lưu trữ triển khai giao thức HTTP S3, bao gồm cơ chế ký (SigV4) và URL có chữ ký. Cùng một code client và định dạng URL hoạt động trên mọi nhà cung cấp; chỉ khác endpoint, region, credential, và một số chi tiết policy.
- **Presigned URL** — URL kho lưu trữ có query string mang **chữ ký**. Bất kỳ ai giữ nó có thể thực hiện *một yêu cầu cụ thể* (ở đây là `PUT` vào một object key cụ thể) trong một cửa sổ thời gian ngắn, mà không cần credential kho lưu trữ riêng.
- **Bên ký** — backend của bạn. Nó dùng credential của kho lưu trữ để tính chữ ký **cục bộ** (SDK không gọi lên kho để ký), sau đó trao URL cho trình duyệt.
- **Upload trực tiếp** — trình duyệt gửi byte thẳng lên kho. Máy chủ của bạn nằm ngoài đường dữ liệu, nên không bị nghẽn bởi kích thước file hay băng thông.

Mô hình tin cậy: URL **chính là** sự ủy quyền. Chỉ ký những gì bạn muốn cho phép, đặt thời hạn ngắn, và để máy chủ — không bao giờ là client — quyết định object key.

```
Trình duyệt  →  Máy chủ của bạn  →  Kho lưu trữ
1. Trình duyệt yêu cầu slot upload (tên file, content-type, kích thước)
2. Máy chủ xác thực người dùng, kiểm tra quyền, tự sinh Key
   [SDK ký cục bộ bằng credential kho, không gọi lên kho]
3. Máy chủ trả về presigned URL + các header bắt buộc
4. Trình duyệt PUT byte trực tiếp lên presigned URL
5. Kho trả về 200 OK, ETag
   [Byte file không bao giờ chạm máy chủ]
```

## Luồng hoạt động

1. **Trình duyệt** yêu cầu máy chủ cấp slot upload, chỉ gửi metadata nhẹ (tên file, content-type, kích thước).
2. **Máy chủ** xác thực người dùng, kiểm tra quyền upload, và **tự tạo object key** (ví dụ `uploads/<userId>/<uuid>-<tên-an-toàn>`). Đừng để client tự chọn đường dẫn.
3. **Máy chủ** ký URL `PUT` cho key đó, tùy chọn ràng buộc `Content-Type`, kích thước, và các header khác. Chữ ký được tính cục bộ — không có round-trip mạng lên kho.
4. **Máy chủ** trả về URL và chính xác các header mà trình duyệt phải gửi.
5. **Trình duyệt** gửi `PUT <presigned-url>` với file làm body và các header bắt buộc.
6. **Kho lưu trữ** kiểm tra chữ ký và thời hạn; nếu khớp, nó lưu object và trả về `200` + `ETag`.

Ký một header nghĩa là **ghim** nó: nếu `Content-Type` được ký, trình duyệt phải gửi đúng giá trị đó nếu không kho trả về `403 SignatureDoesNotMatch`.

## Ký — phía backend (Node.js)

SDK `@aws-sdk/client-s3` là client tiêu chuẩn cho *mọi* kho tương thích S3 — trỏ nó đến nhà cung cấp bằng `endpoint`, `region`, và credential. Dùng `forcePathStyle` cho MinIO, R2, và hầu hết các kho tự lưu trữ.

```js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

const s3 = new S3Client({
  region: process.env.S3_REGION,     // v.d. 'us-east-1', hoặc 'auto' cho R2
  endpoint: process.env.S3_ENDPOINT, // v.d. https://<acct>.r2.cloudflarestorage.com, http://minio:9000
  forcePathStyle: true,              // bắt buộc với MinIO/R2 và nhiều kho tự lưu trữ
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

async function issueUploadUrl(userId, { filename, contentType }) {
  const key = `uploads/${userId}/${randomUUID()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: 'my-uploads',
    Key: key,
    ContentType: contentType,   // bị ghim: client PHẢI gửi đúng giá trị này
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 120 }); // 2 phút

  return {
    url,
    headers: { 'Content-Type': contentType }, // echo lại những gì client phải gửi
    key,
  };
}
```

- `expiresIn` tính bằng giây. Dùng cửa sổ ngắn (60–300s); URL tương đương bearer token.
- Giới hạn thời hạn **phụ thuộc nhà cung cấp**: AWS S3, R2, B2, Spaces, và Wasabi giới hạn **7 ngày** (`604800`) với key dài hạn; MinIO có thể cấu hình. Với credential tạm thời (kiểu STS), URL hết hạn khi session token hết hạn, bất kể `expiresIn`.
- Chỉ ký những header bạn cũng sẽ yêu cầu client gửi — mỗi header được ký là một ràng buộc client phải thỏa mãn.

## Upload — phía trình duyệt

```js
async function uploadFile(file, { url, headers }) {
  const res = await fetch(url, {
    method: 'PUT',
    body: file,
    headers,                 // phải khớp với những gì đã ký (v.d. Content-Type)
  });

  if (!res.ok) throw new Error(`Upload thất bại: ${res.status} ${await res.text()}`);
  return res.headers.get('ETag');
}
```

- **Không** thêm `Authorization` — chữ ký nằm trong query string; header `Authorization` xung đột và kho từ chối.
- **Không** tự ý đặt thêm header tùy ý lên những header đã ký. Với metadata tùy chỉnh, ký header `x-amz-meta-*` thay vì thêm chúng ad hoc.
- `Content-Type` ở đây phải giống hệt từng byte với giá trị đã ký.

## CORS — bắt buộc trên bucket

PUT từ trình duyệt cross-origin bị chặn trừ khi cấu hình CORS của kho cho phép rõ ràng. Đây là nguyên nhân phổ biến nhất khiến presigned PUT "chạy được bằng curl nhưng thất bại trong trình duyệt." Hình dạng rule giống nhau trên mọi nhà cung cấp; giao diện cấu hình khác nhau.

```json
[
  {
    "AllowedOrigins": ["https://app.example.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type", "Content-MD5"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

- `AllowedOrigins` phải bao gồm chính xác origin phục vụ app của bạn.
- `ExposeHeaders` phải liệt kê `ETag` nếu client của bạn đọc nó từ response.
- Giới hạn `AllowedHeaders` chỉ đến những gì bạn ký và gửi.

## URL mang những gì

| Query param | Ý nghĩa |
|---|---|
| `X-Amz-Algorithm` | Thuật toán ký, `AWS4-HMAC-SHA256` (SigV4) |
| `X-Amz-Credential` | `<accessKey>/<date>/<region>/s3/aws4_request` |
| `X-Amz-Date` | Thời gian ký, ISO basic (`YYYYMMDDTHHMMSSZ`) |
| `X-Amz-Expires` | Thời hạn URL tính bằng giây |
| `X-Amz-SignedHeaders` | Các header được chữ ký bao phủ |
| `X-Amz-Signature` | Bản thân chữ ký |
| `X-Amz-Security-Token` | Session token — chỉ có **khi** dùng credential tạm thời (kiểu STS) |

Các tên `X-Amz-*` và terminator `aws4_request` là một phần của **giao thức dây SigV4** được *mọi* kho tương thích S3 sử dụng — chúng là artifact giao thức, không phải thương hiệu AWS. R2, MinIO, B2, Spaces, Wasabi đều dùng chính xác cùng các tên này. Đọc các tham số này cho bạn biết URL cho phép gì: method, key, thời hạn, và những header nào caller phải tái tạo.

## Cách credential được giữ an toàn

Đây là toàn bộ điểm của mô hình: trình duyệt upload **mà không bao giờ giữ credential kho lưu trữ**.

- **Không credential kho nào đến được client.** Access key, secret, và bất kỳ session token nào chỉ tồn tại trên bên ký. Ngay cả một trình duyệt bị xâm nhập hoàn toàn (XSS) cũng không thể trích xuất key dài hạn để tự tạo upload mới — nó cùng lắm chỉ dùng lại được các URL máy chủ đã phát hành.
- **Presigned URL là một capability, không phải credential.** Nó ủy quyền *một* yêu cầu (method + key) trong *một* TTL. Đánh cắp nó giống như đánh cắp vé ngắn hạn, không phải key ký đã phát hành ra nó.
- **URL để lộ access key *ID*, không bao giờ là secret.** `X-Amz-Credential` mang key ID, nhưng secret là key HMAC — chỉ đầu ra của nó (chữ ký) được truyền đi. Key ID một mình không thể ký gì cả.
- **Ký phía máy chủ. Ưu tiên credential ngắn hạn / giới hạn phạm vi nơi nhà cung cấp hỗ trợ** (STS trên AWS S3 và MinIO; API token giới hạn phạm vi trên R2; app key giới hạn phạm vi trên B2). Nơi chỉ có cặp key dài hạn, dùng **cặp key quyền tối thiểu chuyên dụng** cho bên ký, lưu trong trình quản lý secret và xoay định kỳ.
- **Giới hạn phạm vi theo từng yêu cầu nơi được hỗ trợ.** Với nhà cung cấp có khả năng STS, truyền Policy nội tuyến/phiên cấp `PutObject` trên chính xác key cho người dùng này, để một danh tính ký bị lạm dụng không thể ghi ra ngoài object đó.
- **TTL ngắn là lớp bảo vệ cuối cùng.** URL bị rò rỉ nguy hiểm trong vài phút (60–300s), không phải trong toàn bộ thời gian sống của key tĩnh.
- **Endpoint ký là cổng thật.** Xác thực và ủy quyền *trước khi* ký — đó là nơi "ai được upload gì" được quyết định. URL chỉ mang quyết định của máy chủ đến kho.
- **Coi presigned URL là nhạy cảm.** Toàn bộ query string là bearer token và có thể rơi vào log truy cập máy chủ, log CDN/proxy, hoặc lịch sử trình duyệt. TTL ngắn giới hạn thiệt hại; tránh lưu nó trong log dài hạn.
- **Chặn leo thang ACL nơi được hỗ trợ.** V.d. AWS S3 Object Ownership `BucketOwnerEnforced` vô hiệu hóa ACL để object upload lên không thể tự cấp quyền truy cập công khai; hành vi thay đổi theo nhà cung cấp.
- **Kiểm toán.** Dùng log truy cập máy chủ của kho (và, trên AWS, CloudTrail) — mỗi `PutObject` được ghi lại với principal ký, cho ra vết truy xuất về người dùng cuối.

| Tài sản | Đến được trình duyệt? | Rủi ro nếu URL bị rò rỉ |
|---|---|---|
| Secret access key | Không | — |
| Access key ID | Có (`X-Amz-Credential`) | Không một mình — nó không thể ký |
| Session token (STS) | Có (`X-Amz-Security-Token`) | Chỉ dùng lại được trong TTL |
| Bản thân presigned URL | Có | Bearer token cho đến khi hết hạn |

Tóm tắt tư duy: **secret ký, URL mang, key không bao giờ đi.** Phòng thủ chiều sâu sau đó là TTL ngắn + credential quyền tối thiểu + policy phiên theo key (nơi được hỗ trợ) + ủy quyền phía máy chủ.

## Khác biệt giữa các nhà cung cấp

Code và hình dạng URL giống nhau; cấu hình khác nhau.

| Nhà cung cấp | Hình dạng endpoint | Region | Path-style | Cred tạm | Giới hạn thời hạn |
|---|---|---|---|---|---|
| AWS S3 | `https://s3.<region>.amazonaws.com` | region thật | tùy chọn | STS | ≤ 7 ngày |
| Cloudflare R2 | `https://<account>.r2.cloudflarestorage.com` | `auto` | khuyến nghị | API token giới hạn | ≤ 7 ngày |
| MinIO | `http(s)://<host>:9000` | cấu hình được (thường `us-east-1`) | bắt buộc | STS | cấu hình được |
| Backblaze B2 (S3 API) | `https://s3.<region>.backblazeb2.com` | region | tùy chọn | app key giới hạn | ≤ 7 ngày |
| DigitalOcean Spaces | `https://<region>.digitaloceanspaces.com` | region | tùy chọn | cặp key | ≤ 7 ngày |
| Wasabi | `https://s3.<region>.wasabisys.com` | region | tùy chọn | cặp key | ≤ 7 ngày |

Giới hạn thời hạn và tên condition-key của policy khác nhau — xác nhận với docs của nhà cung cấp trước khi dựa vào một giới hạn cụ thể.

## PUT vs POST vs server-proxied

| Phương pháp | Byte qua máy chủ? | Giới hạn kích thước chặt | Tốt nhất cho |
|---|---|---|---|
| Presigned **PUT** | Không | Chỉ nếu `Content-Length` được ký | Client JS, upload đơn file đơn giản |
| Presigned **POST** (`createPresignedPost`) | Không | Có — `content-length-range` trong policy | Form HTML, giới hạn kích thước/loại chặt |
| Upload qua máy chủ | Có | Toàn quyền kiểm soát | Quét virus, biến đổi, hoặc file nhỏ |

Dùng **POST** khi bạn cần giới hạn kích thước tối đa có thể thực thi hoặc upload form HTML; `conditions` của POST policy cho phép bạn giới hạn `content-length-range` và ghim các trường theo cách PUT không thể.

## Checklist bảo mật

- **Credential quyền tối thiểu** — key/token/policy của bên ký chỉ cấp `PutObject` trên prefix cụ thể, không gì khác.
- **Máy chủ sở hữu key** — sinh nó từ danh tính đã xác thực; không bao giờ nhận path thô do client cung cấp.
- **TTL ngắn** — 60–300s. URL là bearer token; coi URL bị rò rỉ là hợp lệ cho đến khi hết hạn.
- **Ràng buộc những gì quan trọng** — ký `Content-Type` (và tùy chọn kích thước) để client không thể đổi sang loại object khác.
- **Thực thi SSE** — đặt mã hóa phía máy chủ trong signed command và/hoặc bucket policy yêu cầu nó, nơi được hỗ trợ.
- **Chỉ HTTPS** — bucket/access policy với điều kiện secure-transport nơi được hỗ trợ (`aws:SecureTransport` trên AWS S3/MinIO; kiểm tra tên key theo từng nhà cung cấp).
- **Access policy cho phạm vi** — giới hạn ghi vào prefix mà mỗi người dùng/tenant được phép dùng.
- **Độ hiển thị của object** — quyết định private (mặc định) vs public-read-after-write; không cấp ACL công khai trừ khi có chủ ý.

## Các lỗi phổ biến

- **`403 SignatureDoesNotMatch`** — client gửi giá trị header (hoặc method/body) khác với những gì đã ký. Thường là `Content-Type`. Echo các header bắt buộc về client và gửi chúng y nguyên.
- **Chạy được trong curl, thất bại trong trình duyệt** — thiếu hoặc sai khớp **bucket CORS** cho method `PUT` và origin.
- **Sai endpoint/region/path-style** — `endpoint`, `region` không khớp, hoặc thiếu `forcePathStyle` gây ra lỗi khớp chữ ký, lỗi DNS, hoặc "permanent redirect." Khớp cả ba với nhà cung cấp của bạn.
- **URL hết hạn trước khi upload lớn hoàn thành** — chọn `expiresIn` có tính đến thời gian upload trường hợp xấu nhất, hoặc dùng **multipart** presigning cho file rất lớn.
- **Bất ngờ credential tạm hết hạn** — với credential kiểu STS, presigned URL hết hạn khi session token hết hạn, bất kể `expiresIn`.
- **Header `Authorization` còn để lại** — header mặc định sót lại từ HTTP client chặn yêu cầu và phá nó; chữ ký là query-scoped, nên bỏ nó đi.
- **Client chọn key** — path mở cho phép người dùng ghi đè object hoặc ghi ra ngoài prefix của họ. Luôn để máy chủ tạo key.