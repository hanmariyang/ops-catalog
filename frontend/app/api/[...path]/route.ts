/**
 * /api/* same-origin proxy → backend.
 *
 * Route Handler 가 매 request 마다 process.env.BACKEND_API_URL 을 읽으므로,
 * next.config.mjs 의 rewrites() 가 build 시 destination 을 manifest 에 박는
 * 문제 (.env.local 의 dev 값이 prod 에 그대로 inline) 를 회피.
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function backend() {
  return process.env.BACKEND_API_URL || "http://localhost:8002";
}

const HOP_BY_HOP = new Set([
  "host",
  "connection",
  "content-length",
  "content-encoding",
  "transfer-encoding",
  "keep-alive",
  "upgrade",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
]);

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const url = new URL(request.url);
  const target = `${backend()}/api/${path.join("/")}${url.search}`;

  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    if (!HOP_BY_HOP.has(k.toLowerCase())) headers[k] = v;
  });

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.text();
  }

  let res: Response;
  try {
    res = await fetch(target, init);
  } catch (err) {
    return NextResponse.json(
      { error: "proxy_failed", detail: String(err), target },
      { status: 502 }
    );
  }

  const respHeaders = new Headers();
  res.headers.forEach((v, k) => {
    if (!HOP_BY_HOP.has(k.toLowerCase())) respHeaders.set(k, v);
  });
  return new NextResponse(res.body, {
    status: res.status,
    headers: respHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
