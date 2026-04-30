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
  // Same-origin proxy — client 가 /api/* 호출 시 backend 로 server-side 전달.
  // 이렇게 하면 NEXT_PUBLIC_API_URL 의 build-time inline 문제를 회피
  // (BACKEND_API_URL 은 runtime 환경변수이므로 dev/prod 어디든 동작).
  async rewrites() {
    const backend =
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8002";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
    ];
  },
};

export default nextConfig;
