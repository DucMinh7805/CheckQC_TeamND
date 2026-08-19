import { TaskItem, StatusObj, StatusCode } from "@/types";

export const cleanStr = (val: any): string => {
  if (val === null || val === undefined) return "";
  return String(val).trim();
};

export const getVal = (item: TaskItem, keyName: string): any => {
  if (!item) return "";
  if (item[keyName] !== undefined) return item[keyName];

  // Tìm kiếm key tương đương (bỏ khoảng trắng thừa và không phân biệt hoa thường)
  const normKey = keyName.toLowerCase().replace(/[\s\/\_\-]+/g, "");
  for (const k of Object.keys(item)) {
    if (k.toLowerCase().replace(/[\s\/\_\-]+/g, "") === normKey) {
      return item[k];
    }
  }
  return "";
};

export const formatURL = (url: any): string => {
  if (!url) return "";
  const trimmed = String(url).trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export interface ExtractedLinkItem {
  title: string;
  url: string;
}

// Bóc tách toàn bộ link trong văn bản (hỗ trợ [Tên chữ](url), =HYPERLINK("url", "tên"), hoặc url thuần)
export const extractRichLinks = (text: string): ExtractedLinkItem[] => {
  if (!text) return [];
  const results: ExtractedLinkItem[] = [];
  const seenUrls = new Set<string>();

  // 1. Dạng Markdown: [Chữ hiển thị](https://...)
  const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
  let mdMatch;
  while ((mdMatch = mdRegex.exec(text)) !== null) {
    const title = mdMatch[1].trim();
    const url = formatURL(mdMatch[2]);
    if (!seenUrls.has(url)) {
      results.push({ title: title || "Link tài liệu", url });
      seenUrls.add(url);
    }
  }

  // 2. Dạng Google Sheet: =HYPERLINK("url", "tên")
  const sheetRegex = /HYPERLINK\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/gi;
  let sMatch;
  while ((sMatch = sheetRegex.exec(text)) !== null) {
    const url = formatURL(sMatch[1]);
    const title = sMatch[2].trim();
    if (!seenUrls.has(url)) {
      results.push({ title: title || "Link tài liệu", url });
      seenUrls.add(url);
    }
  }

  // 3. Dạng [Tên: https://...] hoặc (Tên: https://...) hoặc (Link Tên: https://...)
  const bracketRegex = /[\[\(]([a-zA-Z0-9\u00C0-\u1EF9\s\_\-]+)?(?:\s*Link)?:\s*(https?:\/\/[^\s\]\)]+)[\]\)]/gi;
  let bMatch;
  while ((bMatch = bracketRegex.exec(text)) !== null) {
    const title = bMatch[1]?.trim() || "Minh chứng";
    const url = formatURL(bMatch[2]);
    if (!seenUrls.has(url)) {
      results.push({ title: title, url });
      seenUrls.add(url);
    }
  }

  // 4. Dạng text có prefix: Minh chứng: https://... hoặc Slide: https://...
  const prefixRegex = /(?:^|\n|\r)([a-zA-Z0-9\u00C0-\u1EF9\s\_\-]+):\s*(https?:\/\/[^\s]+)/gi;
  let prMatch;
  while ((prMatch = prefixRegex.exec(text)) !== null) {
    const title = prMatch[1].trim();
    const url = formatURL(prMatch[2]);
    if (!seenUrls.has(url)) {
      results.push({ title: title || "Link đính kèm", url });
      seenUrls.add(url);
    }
  }

  // 5. Các đường link thô còn lại https://...
  const rawUrlRegex = /(https?:\/\/[^\s\)\],]+)/g;
  let rMatch;
  while ((rMatch = rawUrlRegex.exec(text)) !== null) {
    const url = formatURL(rMatch[1]);
    if (!seenUrls.has(url)) {
      let shortTitle = "Mở Link";
      try {
        const u = new URL(url);
        shortTitle = u.hostname.replace("www.", "");
      } catch (e) {}
      results.push({ title: shortTitle, url });
      seenUrls.add(url);
    }
  }

  return results;
};


export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return "";
  const cleaned = cleanStr(dateStr);
  if (!cleaned) return "";

  if (cleaned.includes("tháng") || cleaned.includes("h:") || cleaned.includes("p,")) {
    return cleaned;
  }

  try {
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) {
      const hours = d.getHours().toString().padStart(2, "0");
      const mins = d.getMinutes().toString().padStart(2, "0");
      const day = d.getDate();
      const month = d.getMonth() + 1;
      return `${hours}h:${mins}p, ${day} tháng ${month}`;
    }
  } catch (e) {}

  return cleaned;
};

// Chuẩn hóa định dạng ID/Tháng (hỗ trợ nhập tay "8/2026", "08/2026", "Tháng 8/2026", "00:00:00 1/8/2026")
export const normalizeMonthStr = (str: string): string => {
  if (!str) return "";
  let cleaned = cleanStr(str).replace(/^tháng\s*/i, "").trim();
  
  // Chuẩn hóa dạng "08/2026" -> "8/2026"
  const mMatch = cleaned.match(/^0?(\d{1,2})\/(\d{4})$/);
  if (mMatch) {
    const month = parseInt(mMatch[1], 10);
    const year = mMatch[2];
    return `${month}/${year}`;
  }

  // Trường hợp Google Sheet tự ép kiểu ngày: "00:00:00 1/8/2026" hoặc "01/08/2026 00:00:00"
  const dmyMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const month = parseInt(dmyMatch[2], 10);
    const year = dmyMatch[3];
    return `${month}/${year}`;
  }

  return cleaned;
};

// Tự động nhận diện trạng thái đề dù nhập tay bất kỳ định dạng nào trên Google Sheets
export const getStatusObj = (item: TaskItem): StatusObj => {
  if (!item) {
    return {
      code: "PENDING",
      label: "Chờ duyệt",
      style: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      iconName: "Clock",
    };
  }

  const rawQcDone = cleanStr(
    getVal(item, "QC done") ||
    getVal(item, "QC Done") ||
    getVal(item, "Trạng thái QC") ||
    getVal(item, "Trạng thái") ||
    getVal(item, "Status") ||
    getVal(item, "Duyệt") ||
    getVal(item, "Ket qua") ||
    getVal(item, "Kết quả")
  ).toUpperCase();

  const l1 = cleanStr(getVal(item, "Lỗi lần 1"));
  const l2 = cleanStr(getVal(item, "Lỗi lần 2"));
  const l3 = cleanStr(getVal(item, "Lỗi lần 3"));

  // Các biến thể người dùng có thể gõ trên Sheet cho Đã Pass: ✅, TRUE, 1, PASS, ĐÃ PASS, OK, DONE, ĐẠT...
  const passKeywords = ["✅", "TRUE", "1", "PASS", "ĐÃ PASS", "DA PASS", "OK", "DONE", "XONG", "ĐẠT", "DAT", "PASSED", "HOÀN THÀNH", "HOAN THANH"];
  if (passKeywords.some((k) => rawQcDone === k || rawQcDone.includes(k))) {
    return {
      code: "PASS",
      label: "Đã Pass",
      style: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      iconName: "CheckCircle2",
    };
  }

  // Các biến thể người dùng có thể gõ trên Sheet cho QC Sai: ❌, QC SAI, SAI, FALSE, 0, FAIL...
  const wrongKeywords = ["❌", "QC SAI", "SAI", "FALSE", "0", "FAIL", "LOI QC", "LỖI QC", "REJECT", "KHÔNG ĐẠT", "KHONG DAT"];
  if (wrongKeywords.some((k) => rawQcDone === k || rawQcDone.includes(k))) {
    return {
      code: "WRONG",
      label: "QC Sai",
      style: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
      iconName: "AlertTriangle",
    };
  }

  // Nếu có nội dung lỗi thực tế và không phải từ khóa phủ định
  const nonErrorWords = ["không", "ko", "k", "none", "0", "-", "null", "undefined", "đã sửa", "da sua", "fixed", "pass", "ok", "đạt", "xong"];
  const isErr1 = l1 && !nonErrorWords.includes(l1.toLowerCase().trim());
  const isErr2 = l2 && !nonErrorWords.includes(l2.toLowerCase().trim());
  const isErr3 = l3 && !nonErrorWords.includes(l3.toLowerCase().trim());

  if (isErr1 || isErr2 || isErr3) {
    return {
      code: "ERROR",
      label: "Đang lỗi",
      style: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
      iconName: "XCircle",
    };
  }

  return {
    code: "PENDING",
    label: "Chờ duyệt",
    style: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    iconName: "Clock",
  };
};

export const isMultiError = (item: TaskItem): boolean => {
  let count = 0;
  const l1 = cleanStr(getVal(item, "Lỗi lần 1"));
  const l2 = cleanStr(getVal(item, "Lỗi lần 2"));
  const l3 = cleanStr(getVal(item, "Lỗi lần 3"));
  if (l1 && !["không", "ko", "k", "none", "0", "-"].includes(l1.toLowerCase())) count++;
  if (l2 && !["không", "ko", "k", "none", "0", "-"].includes(l2.toLowerCase())) count++;
  if (l3 && !["không", "ko", "k", "none", "0", "-"].includes(l3.toLowerCase())) count++;
  return count >= 2;
};

export const isPending3Days = (item: TaskItem): boolean => {
  const status = getStatusObj(item);
  if (status.code !== "PENDING" && status.code !== "ERROR") return false;

  const timeStr = cleanStr(getVal(item, "Thời gian"));
  if (!timeStr) return false;

  try {
    const match = timeStr.match(/(\d+)\s+tháng\s+(\d+)/i);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const currentYear = new Date().getFullYear();
      const taskDate = new Date(currentYear, month, day);
      const now = new Date();
      const diffMs = now.getTime() - taskDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays > 3;
    }
  } catch (e) {
    return false;
  }
  return false;
};

// Phân tích định dạng ID/Tháng (e.g. "8/2026", "11/2026") thành số để sắp xếp thời gian chính xác
export const parseMonthYear = (str: string): number => {
  if (!str) return 0;
  const norm = normalizeMonthStr(str);
  const parts = norm.split('/');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const y = parseInt(parts[1], 10) || 0;
    return y * 100 + m; // e.g. 11/2026 -> 202611, 10/2026 -> 202610, 9/2026 -> 202609, 8/2026 -> 202608
  }
  return 0;
};

// Sắp xếp mảng tháng theo thứ tự thời gian mới nhất lên đầu
export const sortMonthsChronological = (months: string[]): string[] => {
  return [...months].sort((a, b) => parseMonthYear(b) - parseMonthYear(a));
};

export const exportTasksToCSV = (tasks: TaskItem[], selectedMonth: string) => {
  if (!tasks || tasks.length === 0) {
    alert("Không có dữ liệu đề bài để xuất báo cáo!");
    return;
  }

  const headers = [
    "STT",
    "Tháng",
    "Thời gian",
    "Tên đề",
    "Số câu",
    "Ai làm",
    "QC phụ trách",
    "Trạng thái QC",
    "Link sản phẩm",
    "Link minh chứng",
    "Lỗi lần 1",
    "Lỗi lần 2",
    "Lỗi lần 3",
    "Nội dung phản hồi",
    "Phản hồi QC",
    "Ghi chú (Note)",
  ];

  const rows = tasks.map((task, idx) => {
    const status = getStatusObj(task);
    return [
      idx + 1,
      `"${getVal(task, "ID/ tháng") || getVal(task, "ID/tháng") || ""}"`,
      `"${getVal(task, "Thời gian") || ""}"`,
      `"${cleanStr(getVal(task, "Tên đề")).replace(/"/g, '""')}"`,
      getVal(task, "Số câu") || 0,
      `"${getVal(task, "Ai làm") || ""}"`,
      `"${getVal(task, "QC") || ""}"`,
      `"${status.label}"`,
      `"${getVal(task, "Link sản phẩm") || ""}"`,
      `"${getVal(task, "Minh chứng") || ""}"`,
      `"${cleanStr(getVal(task, "Lỗi lần 1")).replace(/"/g, '""')}"`,
      `"${cleanStr(getVal(task, "Lỗi lần 2")).replace(/"/g, '""')}"`,
      `"${cleanStr(getVal(task, "Lỗi lần 3")).replace(/"/g, '""')}"`,
      `"${cleanStr(getVal(task, "Nội Dung Phản hồi")).replace(/"/g, '""')}"`,
      `"${cleanStr(getVal(task, "Phản hồi của QC")).replace(/"/g, '""')}"`,
      `"${cleanStr(getVal(task, "Note")).replace(/"/g, '""')}"`,
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute(
    "href",
    url
  );
  link.setAttribute(
    "download",
    `Bao_Cao_QC_NoiDung_${selectedMonth === "ALL" ? "TatCa" : selectedMonth.replace("/", "_")}_${dateStr}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Xuất file CSV báo cáo số câu QC
export const exportQcQuestionStatsToCSV = (
  qcQuestionStats: any[],
  teamTotals: any,
  monthName: string
) => {
  if (!qcQuestionStats || qcQuestionStats.length === 0) return;

  let csv = "\uFEFF";
  csv += `BÁO CÁO TIẾN ĐỘ & SỐ CÂU QC - ${monthName}\r\n\r\n`;
  csv += "Nhân sự QC,Tổng đề giao,Tổng số câu giao,Số câu đã check,Tỷ lệ hoàn thành (%)\r\n";

  qcQuestionStats.forEach((q) => {
    csv += `"${q.qcName}",${q.totalAssignedTasks},${q.totalAssignedQuestions},${q.totalCheckedQuestions},"${q.completionRate}%"\r\n`;
  });

  if (teamTotals) {
    csv += `\r\n"TỔNG TOÀN TEAM",${teamTotals.totalTasks},${teamTotals.totalAssignedQuestions},${teamTotals.totalCheckedQuestions},"${teamTotals.completionRate}%"\r\n\r\n`;
  }

  csv += "CHI TIẾT ĐỀ BÀI TỪNG QC\r\n";
  csv += "QC,Tên đề,Số câu thực,Người làm,Trạng thái QC,Link đề,Link SP,Ghi chú\r\n";

  qcQuestionStats.forEach((q) => {
    (q.tasksList || []).forEach((t: any) => {
      const statusText = t.qc_done ? "Đã check" : "Chưa check";
      csv += `"${q.qcName}","${cleanStr(t.task_title).replace(/"/g, '""')}",${t.so_cau},"${cleanStr(t.worker_name)}","${statusText}","${t.link_de || ""}","${t.link_sp || ""}","${cleanStr(t.note).replace(/"/g, '""')}"\r\n`;
    });
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `BaoCao_SoCau_QC_${monthName.replace(/[\s\.\/]/g, "_")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
