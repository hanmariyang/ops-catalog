/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // /api/* 의 trailing slash redirect 차단 — Django 의 APPEND_SLASH 와 충돌 방지.
  // 이 옵션 없으면 Next.js 가 '/api/v1/...//' 받자마자 '/api/v1/.../'(slash 없음) 으로
  // 308 redirect 하고, redirect 된 URL 은 rewrites 로 가지 않아 404/500.
  skipTrailingSlashRedirect: true,
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
