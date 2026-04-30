/**
 * 인증 도입 전 — 로그인 불필요. /manage 로 redirect.
 */
import { redirect } from "next/navigation";

export default function LoginPage() {
  redirect("/manage");
}
