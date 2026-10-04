# 🎬 Hồ Phim - Trải Nghiệm Điện Ảnh Đỉnh Cao

**Hồ Phim** là nền tảng xem phim trực tuyến thế hệ mới, được thiết kế với triết lý tối giản nhưng đầy quyền năng. Không chỉ là một ứng dụng xem phim, Hồ Phim là một "rạp chiếu phim thông minh" ngay trong túi của bạn, mang đến trải nghiệm mượt mà, đẳng cấp như đang sử dụng các sản phẩm từ Apple.

---

## ✨ Điểm Nét Nổi Bật (Key Features)

### 🚀 1. Siêu Tìm Kiếm & Đa Nguồn Phát (Ultimate Multi-Source)
*   **Hợp nhất 5+ Nguồn API**: Kết nối trực tiếp với các kho phim khổng lồ như OPhim, KKPhim, NguonC, VS-MOV, TopXX... đảm bảo bạn luôn tìm thấy bộ phim mình yêu thích.
*   **Thông minh & Luôn sẵn sàng**: Tự động chuyển đổi máy chủ (Mirrors) nếu một nguồn gặp sự cố, mang đến khả năng phát trực tuyến không gián đoạn.

### 💎 2. Thiết Kế Apple HIG & Glassmorphism
*   **Giao diện "Ánh gương"**: Áp dụng phong cách thiết kế Glassmorphism hiện đại với các hiệu ứng mờ nhòe (backdrop-blur) tinh tế.
*   **Trải nghiệm chuẩn Apple**: Các chuyển động mượt mà, logic điều hướng trực quan theo chuẩn Apple Human Interface Guidelines (HIG).

### 🧠 3. Hệ Thống Metadata Thông Minh (TMDB Enrichment)
*   **Tự động nâng cấp dữ liệu**: Tích hợp sâu với TMDB để tự động lấy poster chất lượng cao (4K/HD), trailer, và điểm số đánh giá từ IMDb, Rotten Tomatoes.
*   **Thông tin diễn viên chi tiết**: Khám phá tiểu sử, bộ sưu tập hình ảnh và danh sách phim của các ngôi sao yêu thích ngay trên ứng dụng.

### 📱 4. Tối Ưu Hóa Đa Thiết Bị (Omnichannel Optimized)
*   **Responsive Tuyệt Đối**: Hiển thị hoàn hảo từ điện thoại iPhone, máy tính bảng iPad cho đến trình duyệt Desktop.
*   **TV Mode**: Chế độ tối ưu riêng cho Smart TV (LG WebOS, Samsung Tizen) với khả năng điều hướng bằng Remote và giao diện phóng đại dễ nhìn.

### 🕒 5. Tính Năng Cá Nhân Hóa (Personalization)
*   **Lịch sử xem phim**: Tự động lưu lại tiến trình xem (Resume Playback) để bạn có thể xem tiếp bất cứ lúc nào.
*   **Danh sách yêu thích**: Lưu trữ những bộ phim mong muốn vào Watchlist cá nhân.
*   **Lịch sử tách biệt**: Chế độ TopXX với lịch sử xem độc lập, đảm bảo sự riêng tư và cá nhân hóa tối đa.

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

*   **Framework**: Next.js 15 (App Router)
*   **UI/UX**: Tailwind CSS 4, Framer Motion (Animations), Lucide Icons
*   **Data Handling**: React Query, TMDB API, Firebase Integration
*   **Performance**: Caching request-level, SEO Metadata thông minh, Image Optimization

---

## 🚀 Bắt Đầu (Setup)

1.  **Clone dự án**:
    ```bash
    git clone https://github.com/hoguom28790/Movies.git
    ```

2.  **Cài đặt dependencies**:
    ```bash
    npm install
    ```

3.  **Chạy môi trường phát triển**:
    ```bash
    npm run dev
    ```

---

## 📄 Giấy Phép (License)

Dự án này được phát triển với mục đích học tập và nghiên cứu. Nội dung phim được lấy từ các API công khai của bên thứ ba.

---
*Phát triển bởi Hồ Phim Team với ❤️.*

---

## ☁️ Deploy lên Cloudflare Workers

Dùng `@opennextjs/cloudflare` (cấu hình: `wrangler.jsonc`, `open-next.config.ts`).

```bash
npm run preview:cf   # build + chạy thử cục bộ bằng workerd
npm run deploy:cf    # build + deploy
```

*   Đặt biến môi trường: `NEXT_PUBLIC_*` (build time, đặt trong `.env.production` hoặc CI) và secret server (`ANILIST_CLIENT_SECRET`, `TRAKT_CLIENT_SECRET`, `TOPXX_PASSWORD`) bằng `npx wrangler secret put <TÊN>`.
*   Gắn tên miền: Cloudflare dashboard → Workers → `ho-phim` → Settings → Domains & Routes (miền cần dùng nameserver Cloudflare).
*   Nên dùng gói Workers Paid ($5/tháng): gói Free chỉ 100k request/ngày và 10ms CPU/request.
