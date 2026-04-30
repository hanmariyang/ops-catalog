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
  // /api/* 의 same-origin proxy 는 app/api/[...path]/route.ts 에서 처리.
  // rewrites() 의 destination 은 빌드 시 manifest 에 박혀서 prod 환경변수 갱신 안 됨 —
  // Route Handler 가 runtime 에서 매번 process.env.BACKEND_API_URL 읽음.
};

export default nextConfig;
