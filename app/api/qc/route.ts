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

    const res = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
    });

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

    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { status: "error", message: `Google API error: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    // Nếu có subscriptions trả về từ Apps Script (Web Push)
    if (data.subscriptions && Array.isArray(data.subscriptions)) {
      // Xác định ai là người nhận (Ai làm, hoặc QC)
      const targetUser = body.qc_done ? body.worker_name : body.qc_name; 
      const targetUserClean = (targetUser || "").toLowerCase().replace(/\s/g, "");
      
      const title = body.qc_done ? `[Phản hồi] ${body.task_title}` : `[Lỗi QC] ${body.task_title}`;
      let message = "";
      if (body.qc_done) {
        message = `${body.worker_name} đã xử lý/phản hồi lỗi.`;
      } else {
        message = `QC bắt lỗi: ${body.loi_1 || ""} ${body.loi_2 || ""} ${body.loi_3 || ""}`;
      }

      // Lọc các subscription của đúng người dùng mục tiêu
      data.subscriptions.forEach((subObj: any) => {
        const subName = (subObj.name || "").toLowerCase().replace(/\s/g, "");
        if (targetUserClean && subName.includes(targetUserClean) && subObj.subscription) {
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
