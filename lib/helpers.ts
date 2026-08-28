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
  text?: string;
  raw?: string;
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
      results.push({ title: title || "Link tài liệu", url, text: title || "Link tài liệu", raw: mdMatch[0] });
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
      results.push({ title: title || "Link tài liệu", url, text: title || "Link tài liệu", raw: sMatch[0] });
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
      results.push({ title: title, url, text: title, raw: bMatch[0] });
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
      results.push({ title: title || "Link đính kèm", url, text: title || "Link đính kèm", raw: prMatch[0] });
      seenUrls.add(url);
    }
  }

  // 5. Dạng URL thuần
  const urlRegex = /(https?:\/\/[^\s\)]+)/g;
  let uMatch;
  while ((uMatch = urlRegex.exec(text)) !== null) {
    const url = formatURL(uMatch[1]);
    if (!seenUrls.has(url)) {
      results.push({ title: "Đường dẫn đính kèm", url, text: "Đường dẫn đính kèm", raw: uMatch[0] });
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

// Chuẩn hóa định dạng ID/Tháng (hỗ trợ nhập tay "8/2026", "08/2026", "8.2026", "Tháng 8.2026", "Tháng 8/2026", "T8.2026", "00:00:00 1/8/2026")
export const normalizeMonthStr = (str: string): string => {
  if (!str) return "";
  let cleaned = cleanStr(str)
    .replace(/^tháng\s*/i, "")
    .replace(/^t\s*/i, "")
    .trim();
  
  // Chuẩn hóa dạng phụ "8.1.2026", "8.1/2026", "08.1.2026", "Tháng 8.1.2026" -> "8.1/2026"
  const subMatch = cleaned.match(/^0?(\d{1,2})\.1[\.\/](\d{4})$/);
  if (subMatch) {
    const month = parseInt(subMatch[1], 10);
    const year = subMatch[2];
    return `${month}.1/${year}`;
  }

  // Chuẩn hóa dạng chuẩn "08/2026", "8/2026", "8.2026", "08.2026", "Tháng 8.2026", "Tháng 9.2026" -> "8/2026", "9/2026"
  const mMatch = cleaned.match(/^0?(\d{1,2})[\.\/](\d{4})$/);
  if (mMatch) {
    const month = parseInt(mMatch[1], 10);
    const year = mMatch[2];
    return `${month}/${year}`;
  }

  // Trường hợp Google Sheet tự ép kiểu ngày: "00:00:00 1/8/2026" hoặc "01/08/2026 00:00:00"
  const dmyMatch = cleaned.match(/(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})/);
  if (dmyMatch) {
    const month = parseInt(dmyMatch[2], 10);
    const year = dmyMatch[3];
    return `${month}/${year}`;
  }

  return cleaned;
};

// Kiểm tra đề bài có thuộc kỳ tính lương QC được chọn hay không (hỗ trợ đề tồn T8 -> T9, 8.1/2026, Note "Đề tồn T8")
export const isTaskInQcSalaryMonth = (
  originMonthStr: string | null | undefined,
  noteText: string | null | undefined,
  leaderCheckText: string | null | undefined,
  selectedMonth: string
): boolean => {
  if (!selectedMonth || selectedMonth === "ALL") return true;

  const targetMonthNorm = normalizeMonthStr(selectedMonth);
  const originMonthNorm = normalizeMonthStr(originMonthStr || "");

  const combinedNote = `${cleanStr(noteText)} ${cleanStr(leaderCheckText)}`.toLowerCase();

  // Kiểm tra từ khóa "đề tồn" / "tồn" (ví dụ "đề tồn t8", "tồn t8", "tồn tháng 8", "đề tồn", "de ton", "tồn t11", "tồn t12")
  const tonMatch = combinedNote.match(/(?:đề\s*)?t[ồo]n\s*(?:t|tháng\s*)?(\d{1,2}(?:\.\d{1,2})?)/i) || 
                   (combinedNote.includes("đề tồn") || combinedNote.includes("de ton") ? true : null);

  const subMonthMatch = originMonthNorm.match(/^(\d{1,2})\.1\/(\d{4})/);

  if (tonMatch || subMonthMatch) {
    let tonMonthNum = 0;
    if (Array.isArray(tonMatch) && tonMatch[1]) {
      tonMonthNum = parseFloat(tonMatch[1]);
    } else if (subMonthMatch) {
      tonMonthNum = parseInt(subMonthMatch[1], 10);
    } else if (originMonthNorm) {
      const m = originMonthNorm.match(/^(\d{1,2})/);
      if (m) tonMonthNum = parseFloat(m[1]);
    }

    // Nếu xem đúng tháng gốc của đề tồn (ví dụ đang lọc T8 mà đề ghi "Đề tồn T8", hoặc lọc T11 mà đề ghi "Đề tồn T11") -> BỎ QUA không tính lương tháng gốc
    if (tonMonthNum > 0 && (targetMonthNorm === `${tonMonthNum}/2026` || targetMonthNorm === `${tonMonthNum}/2025` || targetMonthNorm.startsWith(`${tonMonthNum}/`))) {
      return false;
    }

    // Nếu đang lọc tháng sau (T8 -> T9, T11 -> T12, T12 -> T1) hoặc kỳ phụ (8.1, 11.1) -> TÍNH VÀO KỲ NÀY
    const nextMonthNum = tonMonthNum === 12 ? 1 : tonMonthNum + 1;
    if (
      targetMonthNorm.startsWith(`${nextMonthNum}/`) ||
      targetMonthNorm.startsWith(`${tonMonthNum}.1/`) ||
      targetMonthNorm.includes(`${tonMonthNum}.1`)
    ) {
      return true;
    }

    // Nếu note có ghi đích đến cụ thể (ví dụ "tính t9", "lương t9", "tính t12", "lương t12")
    const explicitMatch = combinedNote.match(/(?:t[íi]nh|l[ươu]ng\s*(?:qc)?|chuy[ểe]n\s*sang)?\s*t(?:háng)?\s*(\d{1,2}(?:\.\d{1,2})?)/i);
    if (explicitMatch && explicitMatch[1]) {
      const dest = explicitMatch[1];
      if (targetMonthNorm.startsWith(`${dest}/`) || targetMonthNorm.includes(dest)) {
        return true;
      }
    }
  }

  // Trường hợp bình thường: khớp đúng tháng
  return (
    originMonthNorm === targetMonthNorm ||
    originMonthNorm.replace("/", ".") === targetMonthNorm.replace("/", ".")
  );
};

// Bóc tách chính xác số lượng lỗi từ chuỗi mô tả lỗi (cấu trúc X/Y ví dụ "2/40", "1/40", "25/45", "1: 1/99")
export const parseQcErrorCount = (text: string | null | undefined): number => {
  if (!text) return 0;
  const cleaned = cleanStr(text);
  if (!cleaned) return 0;

  const nonErrorWords = ["không", "ko", "k", "none", "0", "-", "pass", "ok", "đạt", "xong", "đã sửa", "fixed"];
  if (nonErrorWords.includes(cleaned.toLowerCase().trim())) return 0;

  // Tìm tất cả các mẫu dạng X/Y (ví dụ "2/40", "1/40", "25/45", "1: 1/99", "Lỗi lần 3: 1/33")
  const regex = /(\d+)\s*\/\s*\d+/g;
  let match;
  let totalErrors = 0;
  let foundAny = false;

  while ((match = regex.exec(cleaned)) !== null) {
    foundAny = true;
    totalErrors += parseInt(match[1], 10);
  }

  if (foundAny) {
    return totalErrors;
  }

  // Nếu không có dạng X/Y nhưng có text mô tả lỗi thực tế
  return 1;
};

// Kiểm tra trạng thái Done của QC (hỗ trợ cả Sheet ND và Sheet QC với mọi định dạng)
export const isQcDone = (val: any): boolean => {
  if (!val) return false;
  if (val === true) return true;
  const s = cleanStr(val).toLowerCase();
  return (
    s === "true" ||
    s === "✅" ||
    s === "☑" ||
    s === "1" ||
    s === "xong" ||
    s === "done" ||
    s === "pass" ||
    s === "đạt" ||
    s === "dat" ||
    s === "hoàn thành"
  );
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

// Xuất file CSV bảng tính lương & lỗi QC
export const exportQcSalaryStatsToCSV = (
  qcSalaryStats: any[],
  totals: { doneTasks: number; doneQuestions: number; totalErrors: number; grandSalary?: number },
  monthName: string
) => {
  if (!qcSalaryStats || qcSalaryStats.length === 0) return;

  let csv = "\uFEFF";
  csv += `BẢNG TÍNH LƯƠNG & LỖI QC - ${monthName}\r\n\r\n`;
  csv += "Nhân sự QC,Vai trò,Số đề đã check,Số câu đã check,Số lỗi đã check,Tổng tiền (VNĐ)\r\n";

  qcSalaryStats.forEach((q) => {
    csv += `"${q.qcName}","${q.role || "QC"}",${q.doneTasksCount || 0},${q.doneQuestionsCount || 0},${q.totalErrorsChecked || 0},${q.totalSalary || 0}\r\n`;
  });

  if (totals) {
    csv += `\r\n"TỔNG CỘNG","-",${totals.doneTasks},${totals.doneQuestions},${totals.totalErrors},${totals.grandSalary || 0}\r\n`;
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Bang_Tinh_Luong_Loi_QC_${monthName.replace(/[\s\.\/]/g, "_")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

