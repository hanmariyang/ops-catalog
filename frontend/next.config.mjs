/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 검색엔진 인덱싱 차단 (D16)
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
