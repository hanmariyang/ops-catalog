/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 검색엔진 인덱싱 차단 (D16) — meta tag 와 별개로 헤더에서도 차단
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
