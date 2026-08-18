import { NextRequest, NextResponse } from "next/server";
import { sendWebPush } from "@/lib/webpush";

const GOOGLE_SCRIPT_URL =
  process.env.GOOGLE_SCRIPT_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://script.google.com/macros/s/AKfycbyNT2uE0TqPZ0UTptU6IkFLrDkC2BVtEKIYZk59MfTgdYyHFQ_-mc-dcD_FS9PB5UU0zg/exec";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Proxy GET request tới Google Apps Script theo thời gian thực (Zero Cache)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const timeParam = url.searchParams.get("t") || Date.now().toString();
    const targetUrl = `${GOOGLE_SCRIPT_URL}?_t=${timeParam}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { status: "error", message: `Google API error: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    console.error("Lỗi Server Proxy GET:", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Lỗi kết nối máy chủ Google" },
      { status: 500 }
    );
  }
}

// Proxy POST request tới Google Apps Script
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { status: "error", message: `Google API error: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    // Nếu có subscriptions trả về từ Apps Script (Web Push)
    if (data.subscriptions && Array.isArray(data.subscriptions)) {
      const isWorkerSaving = body.sender_role === "WORKER" || (body.nd_phan_hoi && !body.loi_1 && !body.loi_2 && !body.loi_3 && !body.qc_phan_hoi);
      const isQCSaving = !isWorkerSaving;

      let targetNames: string[] = [];
      let title = "";
      let message = "";

      if (isQCSaving) {
        // QC / Admin lưu -> Gửi tới Bạn làm ND (worker_name)
        if (body.worker_name) targetNames.push(body.worker_name);
        
        if (body.qc_done === "✅") {
          title = `[Đã Duyệt Pass] ${body.task_title || "Đề bài"}`;
          message = `QC ${body.qc_name || ""} đã duyệt Pass cho đề bài này.`;
        } else if (body.qc_done === "❌") {
          title = `[QC Báo Lỗi] ${body.task_title || "Đề bài"}`;
          message = `QC ${body.qc_name || ""} đánh dấu lỗi / cần làm lại.`;
        } else {
          title = `[QC Cập Nhật] ${body.task_title || "Đề bài"}`;
          let details: string[] = [];
          if (body.loi_1) details.push(`Lỗi 1: ${body.loi_1}`);
          if (body.loi_2) details.push(`Lỗi 2: ${body.loi_2}`);
          if (body.loi_3) details.push(`Lỗi 3: ${body.loi_3}`);
          if (body.qc_phan_hoi) details.push(`QC nhắn: ${body.qc_phan_hoi}`);
          if (body.note) details.push(`Ghi chú: ${body.note}`);
          message = details.length > 0 ? details.join(" • ") : `QC ${body.qc_name || ""} vừa cập nhật thông tin đề bài.`;
        }
      } else {
        // Bạn ND lưu / phản hồi -> Gửi tới QC và Admin
        if (body.qc_name) targetNames.push(body.qc_name);
        title = `[Nội Dung Phản Hồi] ${body.task_title || "Đề bài"}`;
        message = `${body.worker_name || "Nội Dung"}: ${body.nd_phan_hoi || "Đã cập nhật bài làm."}`;
      }

      // Gửi Web Push tới tất cả các thiết bị của người dùng mục tiêu
      data.subscriptions.forEach((subObj: any) => {
        const subName = (subObj.name || "").toLowerCase().replace(/\s/g, "");
        const isTarget = targetNames.some((t) => {
          const tClean = (t || "").toLowerCase().replace(/\s/g, "");
          return tClean && (subName.includes(tClean) || tClean.includes(subName));
        });

        if (isTarget && subObj.subscription) {
          sendWebPush(subObj.subscription, {
            title,
            body: message,
            url: "/",
          });
        }
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Lỗi Server Proxy POST:", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Lỗi ghi dữ liệu" },
      { status: 500 }
    );
  }
}
