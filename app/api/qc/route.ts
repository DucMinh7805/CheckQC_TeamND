import { NextRequest, NextResponse } from "next/server";

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
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Lỗi Server Proxy POST:", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Lỗi ghi dữ liệu" },
      { status: 500 }
    );
  }
}
