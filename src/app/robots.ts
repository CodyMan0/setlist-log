import type { MetadataRoute } from "next";

// 검색엔진 노출 차단 (내부용 도구)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
