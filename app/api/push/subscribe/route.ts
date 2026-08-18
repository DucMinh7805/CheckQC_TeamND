import { NextRequest, NextResponse } from "next/server";

const GOOGLE_SCRIPT_URL =
  process.env.GOOGLE_SCRIPT_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://script.google.com/macros/s/AKfycbyNT2uE0TqPZ0UTptU6IkFLrDkC2BVtEKIYZk59MfTgdYyHFQ_-mc-dcD_FS9PB5UU0zg/exec";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // body includes: name (userName) and subscription object
    const payload = {
      action: "SUBSCRIBE",
      ...body
    };

    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return NextResponse.json({ status: "error", message: "Failed to save subscription" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Lỗi Server Proxy Subscribe:", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Lỗi ghi dữ liệu subscription" },
      { status: 500 }
    );
  }
}
