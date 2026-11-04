// Shared with middleware; keep this module independent of Node and Prisma.
export function isBlogPublishingRequest(pathname: string, method: string): boolean {
  if (pathname === "/api/admin/blog-posts" || pathname === "/api/admin/blog-tags") {
    return method === "GET" || method === "POST";
  }
  if (/^\/api\/admin\/blog-posts\/[1-9]\d*$/.test(pathname)) {
    return method === "GET" || method === "PATCH";
  }
  if (/^\/api\/admin\/blog-posts\/[1-9]\d*\/translation-link$/.test(pathname)
    || pathname === "/api/admin/blog-posts/bulk-status"
    || pathname === "/api/admin/blog-images") {
    return method === "POST";
  }
  return false;
}
