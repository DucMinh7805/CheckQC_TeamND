/**
 * ============================================================================
 * FILE: lib/api.ts
 * MỤC ĐÍCH: Quản lý toàn bộ kết nối API và mạng giao tiếp với Google Apps Script
 * ============================================================================
 */

export const PRIMARY_API = "/api/qc";
export const FALLBACK_DIRECT_API =
  "https://script.google.com/macros/s/AKfycbz_9lF5jSgqI6s3r7D6t8u9v0w1x2y3z/exec";

/**
 * Gửi yêu cầu GET để lấy dữ liệu với proxy và fallback tự động
 */
export async function fetchAppData(primaryUrl = PRIMARY_API, fallbackUrl = FALLBACK_DIRECT_API): Promise<any> {
  try {
    const res = await fetch(primaryUrl, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json && (Array.isArray(json.data) || Array.isArray(json.users))) {
        return json;
      }
    }
  } catch (e) {
    console.warn("Proxy GET lỗi, chuyển sang gọi fallback trực tiếp...", e);
  }

  // Fallback trực tiếp
  const resDirect = await fetch(fallbackUrl);
  if (resDirect.ok) return await resDirect.json();
  throw new Error("Không thể kết nối đến máy chủ dữ liệu Google Sheet!");
}

/**
 * Gửi yêu cầu POST để ghi dữ liệu / lưu cấu hình
 */
export async function postAppData(payload: any, primaryUrl = PRIMARY_API): Promise<any> {
  try {
    const res = await fetch(primaryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Proxy POST lỗi:", e);
  }
  throw new Error("Không thể lưu dữ liệu lên máy chủ!");
}
