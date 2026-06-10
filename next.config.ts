import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * dev 서버를 ngrok 터널로 외부 공유할 때 /_next/* 정적 자원의
   * cross-origin 요청을 허용 (dev 모드 전용 — production 빌드에는 영향 없음).
   * NextAuth 쪽은 src/auth.ts의 trustHost: true가 ngrok 호스트를 수용한다.
   */
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.app",
    "*.ngrok.dev",
    "*.ngrok.io",
  ],
};

export default nextConfig;
