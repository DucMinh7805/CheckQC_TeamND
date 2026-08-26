"use client";

/**
 * ============================================================================
 * FILE: components/KpiTable.tsx
 * MỤC ĐÍCH: Bảng tính lương & Năng suất câu của Nhân sự Nội Dung theo loại đề
 * CHỨC NĂNG:
 *   1. Thống kê số lượng câu theo 7 định dạng: MCQ copy, MCQ gõ/AI khẩn, Đề tối khẩn, TH, AI create, CopyGT, Gõ GT
 *   2. Nhập đơn giá lương riêng cho từng loại định dạng đề (VNĐ/câu)
 *   3. Nút "OK / Áp dụng" để lưu và thu gọn bảng nhập giá giúp giao diện gọn gàng, đẹp mắt
 *   4. Cột TỔNG TIỀN (VNĐ) tự động nhân đơn giá theo từng hàng nhân sự
 *   5. Hỗ trợ sắp xếp (Sort Tăng / Giảm), Đồng bộ từ Sheet và ghi nhớ giá vào localStorage
 * ============================================================================
 */

import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { User, MonthlyAssignmentItem } from "@/types";
import { cleanStr } from "@/lib/helpers";
import {
  Calendar,
  MoveHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  SlidersHorizontal,
  Check,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SortField =
  | "name"
  | "mcqCopy"
  | "mcqGo"
  | "deToiKhan"
  | "th"
  | "aiCreate"
  | "copyGt"
  | "goGt"
  | "total"
  | "totalSalary";

interface NdRates {
  mcqCopy: number;
  mcqGo: number;
  deToiKhan: number;
  th: number;
  aiCreate: number;
  copyGt: number;
  goGt: number;
}

const DEFAULT_RATES: NdRates = {
  mcqCopy: 0,
  mcqGo: 0,
  deToiKhan: 0,
  th: 0,
  aiCreate: 0,
  copyGt: 0,
  goGt: 0,
};

export const KpiTable: React.FC = () => {
  const { monthlyAssignments, listUsers, loadData, isLoading } = useApp();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const availableMonths = useMemo(() => {
    return Object.keys(monthlyAssignments || {});
  }, [monthlyAssignments]);

  const [selectedKpiMonth, setSelectedKpiMonth] = useState<string>(
    availableMonths[0] || "ALL"
  );

  useEffect(() => {
    if (selectedKpiMonth === "ALL" && availableMonths.length > 0) {
      setSelectedKpiMonth(availableMonths[0]);
    }
  }, [availableMonths]);

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Cấu hình đơn giá lương cho 7 loại đề Nội Dung (Đơn vị: VNĐ/câu)
  const [rates, setRates] = useState<NdRates>(DEFAULT_RATES);
  const [isEditingRates, setIsEditingRates] = useState<boolean>(false);

  // Đọc đơn giá từ localStorage khi khởi động
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nd_salary_rates");
      if (saved) {
        setRates(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const handleSaveRates = () => {
    try {
      localStorage.setItem("nd_salary_rates", JSON.stringify(rates));
    } catch (e) {}
    setIsEditingRates(false);
  };

  const handleRateChange = (field: keyof NdRates, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setRates((prev) => ({ ...prev, [field]: num }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "desc") setSortOrder("asc");
      else {
        setSortField(null);
        setSortOrder("desc");
      }
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const kpiData = useMemo(() => {
    // 1. Lấy danh sách nhân sự trực tiếp từ Tab Users trên Google Sheet
    const dynamicWorkersOrder = listUsers.map((u: User) => cleanStr(u.name));

    // 2. Gom danh sách các đề từ sheet Nội Dung theo tháng được chọn
    let tasksList: MonthlyAssignmentItem[] = [];
    if (!monthlyAssignments || Object.keys(monthlyAssignments).length === 0) {
      tasksList = [];
    } else if (selectedKpiMonth === "ALL") {
      Object.values(monthlyAssignments).forEach((arr) => {
        if (Array.isArray(arr)) tasksList.push(...arr);
      });
    } else {
      tasksList = monthlyAssignments[selectedKpiMonth] || [];
    }

    // 3. Khởi tạo bảng dữ liệu cho từng nhân sự
    const dataMap: Record<string, any> = {};
    dynamicWorkersOrder.forEach((worker) => {
      dataMap[worker.toLowerCase()] = {
        name: worker,
        mcqCopy: 0,
        mcqGo: 0,
        deToiKhan: 0,
        th: 0,
        aiCreate: 0,
        copyGt: 0,
        goGt: 0,
        total: 0,
        totalSalary: 0,
      };
    });

    // 4. Quét từng dòng đề bài trong sheet Nội Dung
    tasksList.forEach((task: MonthlyAssignmentItem) => {
      const workerNameRaw = task.worker_name || "";
      const workerName = cleanStr(workerNameRaw).toLowerCase();
      if (!workerName) return;

      const note = cleanStr(task.note || "").toLowerCase();
      const leaderCheck = cleanStr(task.leader_check || "").toLowerCase();
      const title = cleanStr(task.task_title || "").toLowerCase();

      const soCau =
        typeof task.so_cau === "number"
          ? task.so_cau
          : parseInt(String(task.so_cau), 10) || 0;

      if (!dataMap[workerName]) {
        dataMap[workerName] = {
          name: cleanStr(workerNameRaw),
          mcqCopy: 0,
          mcqGo: 0,
          deToiKhan: 0,
          th: 0,
          aiCreate: 0,
          copyGt: 0,
          goGt: 0,
          total: 0,
          totalSalary: 0,
        };
      }

      // Logic phân loại 7 cột chuẩn xác
      const isUrgent =
        /t[ốổo]i\s*kh[ẩa]n/i.test(leaderCheck) ||
        /t[ốổo]i\s*kh[ẩa]n/i.test(note);

      const isAiKhan =
        /ai\s*kh[ẩa]n/i.test(note) ||
        /ai\s*kh[ẩa]n/i.test(leaderCheck);

      const isCopy =
        leaderCheck.includes("copy") ||
        note.includes("copy") ||
        title.includes("copy");

      const isThucHanh =
        title.includes("thực hành") ||
        title.includes("thuc hanh") ||
        leaderCheck.includes("thực hành") ||
        note.includes("thực hành");

      const isAi =
        leaderCheck.includes("ai") ||
        note.includes("ai") ||
        title.includes("ai");

      const isGiaiThich =
        leaderCheck.includes("giải thích") ||
        leaderCheck.includes("gt") ||
        note.includes("giải thích") ||
        note.includes("gt") ||
        title.includes("giải thích") ||
        title.includes("gt");

      // 1. Leader ghi đè "Đề copy" -> MCQ copy (190)
      if (leaderCheck.includes("copy")) {
        dataMap[workerName].mcqCopy += soCau;
      }
      // 2. AI Khẩn -> MCQ gõ / AI khẩn (89)
      else if (isAiKhan) {
        dataMap[workerName].mcqGo += soCau;
      }
      // 3. Đề tối khẩn -> Đề tối khẩn (244)
      else if (isUrgent) {
        dataMap[workerName].deToiKhan += soCau;
      }
      // 4. Giải thích + Copy -> CopyGT
      else if (isGiaiThich && isCopy) {
        dataMap[workerName].copyGt += soCau;
      }
      // 5. Giải thích thuần -> Gõ GT
      else if (isGiaiThich && !isCopy) {
        dataMap[workerName].goGt += soCau;
      }
      // 6. Thực hành -> TH (364)
      else if (isThucHanh) {
        dataMap[workerName].th += soCau;
      }
      // 7. Copy thông thường -> MCQ copy
      else if (isCopy) {
        dataMap[workerName].mcqCopy += soCau;
      }
      // 8. Tạo AI -> AI create (2328)
      else if (isAi) {
        dataMap[workerName].aiCreate += soCau;
      }
      // 9. Mặc định -> MCQ gõ / AI khẩn
      else {
        dataMap[workerName].mcqGo += soCau;
      }
    });

    // 5. Tính Tổng câu và Tổng tiền cho từng người
    Object.values(dataMap).forEach((row: any) => {
      row.total =
        (row.mcqCopy || 0) +
        (row.mcqGo || 0) +
        (row.deToiKhan || 0) +
        (row.th || 0) +
        (row.aiCreate || 0) +
        (row.copyGt || 0) +
        (row.goGt || 0);

      row.totalSalary =
        (row.mcqCopy || 0) * (rates.mcqCopy || 0) +
        (row.mcqGo || 0) * (rates.mcqGo || 0) +
        (row.deToiKhan || 0) * (rates.deToiKhan || 0) +
        (row.th || 0) * (rates.th || 0) +
        (row.aiCreate || 0) * (rates.aiCreate || 0) +
        (row.copyGt || 0) * (rates.copyGt || 0) +
        (row.goGt || 0) * (rates.goGt || 0);
    });

    // 6. Xếp đúng thứ tự danh sách Users
    let result: any[] = [];
    dynamicWorkersOrder.forEach((worker) => {
      const item = dataMap[worker.toLowerCase()];
      if (item) result.push(item);
    });

    // Bổ sung các nhân sự có trong sheet mà chưa có trong tab Users
    Object.keys(dataMap).forEach((k) => {
      if (!dynamicWorkersOrder.some((w) => w.toLowerCase() === k)) {
        result.push(dataMap[k]);
      }
    });

    // 7. Xử lý sắp xếp
    if (sortField) {
      result = [...result].sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortField === "name") {
          valA = a.name;
          valB = b.name;
          return sortOrder === "asc"
            ? valA.localeCompare(valB, "vi")
            : valB.localeCompare(valA, "vi");
        } else {
          valA = a[sortField] || 0;
          valB = b[sortField] || 0;
        }

        return sortOrder === "asc" ? valA - valB : valB - valA;
      });
    }

    return result;
  }, [monthlyAssignments, selectedKpiMonth, listUsers, rates, sortField, sortOrder]);

  // Tính tổng cộng toàn bộ theo từng cột
  const columnTotals = useMemo(() => {
    const totals = {
      mcqCopy: 0,
      mcqGo: 0,
      deToiKhan: 0,
      th: 0,
      aiCreate: 0,
      copyGt: 0,
      goGt: 0,
      grandTotal: 0,
      grandSalary: 0,
    };

    kpiData.forEach((row) => {
      totals.mcqCopy += row.mcqCopy || 0;
      totals.mcqGo += row.mcqGo || 0;
      totals.deToiKhan += row.deToiKhan || 0;
      totals.th += row.th || 0;
      totals.aiCreate += row.aiCreate || 0;
      totals.copyGt += row.copyGt || 0;
      totals.goGt += row.goGt || 0;
      totals.grandTotal += row.total || 0;
      totals.grandSalary += row.totalSalary || 0;
    });

    return totals;
  }, [kpiData]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-emerald-600/50 dark:text-emerald-400/50 ml-1 inline-block" />;
    }
    if (sortOrder === "asc") {
      return <ArrowUp className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-200 ml-1 inline-block" />;
    }
    return <ArrowDown className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-200 ml-1 inline-block" />;
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* Bộ lọc tháng, Nút Đơn giá & Nút làm mới dữ liệu */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-black text-slate-800 dark:text-slate-100">
            Lọc theo Tab Sheet Phân Công:
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 sm:hidden">
            <MoveHorizontal className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Vuốt ngang</span>
          </span>

          <Button
            variant={isEditingRates ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditingRates(!isEditingRates)}
            className={`rounded-xl font-bold text-xs h-8 px-3 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all ${
              isEditingRates
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isEditingRates ? "Đóng cài đặt giá" : "Cài đặt đơn giá lương"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isLoading || isRefreshing}
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await loadData();
              } finally {
                setIsRefreshing(false);
              }
            }}
            className="rounded-xl border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 font-bold text-xs h-8 px-3 flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
            <span>{isLoading || isRefreshing ? "Đang đồng bộ..." : "Đồng bộ từ Sheet"}</span>
          </Button>

          <select
            value={selectedKpiMonth}
            onChange={(e) => setSelectedKpiMonth(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer hover:border-emerald-500 transition shadow-2xs"
          >
            <option value="ALL">Tất cả các tháng</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Khung Nhập Đơn Giá Cho Từng Cột Nội Dung (Khi mở Cài đặt đơn giá) */}
      {isEditingRates && (
        <div className="bg-amber-50/80 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-600" />
              <span>Nhập Đơn Giá Lương Từng Loại Đề (VNĐ / Câu)</span>
            </h4>
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
              Nhập giá xong bấm OK để áp dụng tính tiền:
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block truncate">
                1. MCQ copy
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={rates.mcqCopy || ""}
                  onChange={(e) => handleRateChange("mcqCopy", e.target.value)}
                  className="bg-white dark:bg-slate-900 rounded-xl font-bold text-xs h-8 pr-6"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase block truncate">
                2. MCQ gõ / AI khẩn
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={rates.mcqGo || ""}
                  onChange={(e) => handleRateChange("mcqGo", e.target.value)}
                  className="bg-white dark:bg-slate-900 rounded-xl font-bold text-xs h-8 pr-6 border-blue-200"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase block truncate">
                3. Đề tối khẩn
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={rates.deToiKhan || ""}
                  onChange={(e) => handleRateChange("deToiKhan", e.target.value)}
                  className="bg-white dark:bg-slate-900 rounded-xl font-bold text-xs h-8 pr-6 border-rose-200"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase block truncate">
                4. TH (Thực hành)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={rates.th || ""}
                  onChange={(e) => handleRateChange("th", e.target.value)}
                  className="bg-white dark:bg-slate-900 rounded-xl font-bold text-xs h-8 pr-6 border-amber-200"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase block truncate">
                5. AI create
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={rates.aiCreate || ""}
                  onChange={(e) => handleRateChange("aiCreate", e.target.value)}
                  className="bg-white dark:bg-slate-900 rounded-xl font-bold text-xs h-8 pr-6 border-purple-200"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase block truncate">
                6. CopyGT
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={rates.copyGt || ""}
                  onChange={(e) => handleRateChange("copyGt", e.target.value)}
                  className="bg-white dark:bg-slate-900 rounded-xl font-bold text-xs h-8 pr-6 border-indigo-200"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase block truncate">
                7. Gõ GT
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={rates.goGt || ""}
                  onChange={(e) => handleRateChange("goGt", e.target.value)}
                  className="bg-white dark:bg-slate-900 rounded-xl font-bold text-xs h-8 pr-6 border-teal-200"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              onClick={handleSaveRates}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs h-8 px-4 flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>OK (Áp dụng & Lưu)</span>
            </Button>
          </div>
        </div>
      )}

      {/* Bảng Kẻ Khung Rõ Ràng - Kèm Cột TỔNG TIỀN (VNĐ) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto touch-pan-x w-full overscroll-x-contain scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
          <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[860px]">
            <thead>
              <tr className="bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-200 font-black uppercase tracking-wider text-[11px] sm:text-xs border-b-2 border-emerald-300 dark:border-emerald-800">
                <th
                  onClick={() => handleSort("name")}
                  className="p-3 sm:p-3.5 pl-4 border-r border-emerald-200/80 dark:border-emerald-800/80 sticky left-0 bg-emerald-100 dark:bg-emerald-950 z-20 w-28 cursor-pointer select-none hover:bg-emerald-200/80 transition shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                >
                  <div className="flex items-center justify-between">
                    <span>Tên</span>
                    {renderSortIcon("name")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("mcqCopy")}
                  className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[85px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
                >
                  <span>MCQ copy</span>
                  {renderSortIcon("mcqCopy")}
                </th>
                <th
                  onClick={() => handleSort("mcqGo")}
                  className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[120px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
                >
                  <span>MCQ gõ / AI khẩn</span>
                  {renderSortIcon("mcqGo")}
                </th>
                <th
                  onClick={() => handleSort("deToiKhan")}
                  className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[95px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
                >
                  <span>Đề tối khẩn</span>
                  {renderSortIcon("deToiKhan")}
                </th>
                <th
                  onClick={() => handleSort("th")}
                  className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[65px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
                >
                  <span>TH</span>
                  {renderSortIcon("th")}
                </th>
                <th
                  onClick={() => handleSort("aiCreate")}
                  className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[85px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
                >
                  <span>AI create</span>
                  {renderSortIcon("aiCreate")}
                </th>
                <th
                  onClick={() => handleSort("copyGt")}
                  className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[80px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
                >
                  <span>CopyGT</span>
                  {renderSortIcon("copyGt")}
                </th>
                <th
                  onClick={() => handleSort("goGt")}
                  className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[80px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
                >
                  <span>Gõ GT</span>
                  {renderSortIcon("goGt")}
                </th>
                <th
                  onClick={() => handleSort("total")}
                  className="p-3 sm:p-3.5 text-center font-black text-emerald-950 dark:text-emerald-100 bg-emerald-200/90 dark:bg-emerald-900/80 min-w-[95px] border-r border-emerald-300 dark:border-emerald-800 cursor-pointer select-none hover:bg-emerald-300 transition"
                >
                  <span>TỔNG CÂU</span>
                  {renderSortIcon("total")}
                </th>
                <th
                  onClick={() => handleSort("totalSalary")}
                  className="p-3 sm:p-3.5 text-center font-black text-amber-950 dark:text-amber-100 bg-amber-200/90 dark:bg-amber-900/80 min-w-[140px] cursor-pointer select-none hover:bg-amber-300 transition"
                >
                  <span>TỔNG TIỀN (VNĐ)</span>
                  {renderSortIcon("totalSalary")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-bold text-slate-800 dark:text-slate-200">
              {kpiData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                    Không có dữ liệu trong tháng này
                  </td>
                </tr>
              ) : (
                kpiData.map((row, idx) => {
                  const isEven = idx % 2 === 0;
                  const rowBg = isEven
                    ? "bg-white dark:bg-slate-900"
                    : "bg-slate-50/90 dark:bg-slate-800/50";

                  return (
                    <tr
                      key={row.name}
                      className={`${rowBg} hover:bg-emerald-50/50 dark:hover:bg-slate-800/80 transition`}
                    >
                      <td className={`p-3 sm:p-3.5 pl-4 font-black text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 sticky left-0 z-10 ${rowBg} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>
                        {row.name}
                      </td>
                      <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700">
                        {row.mcqCopy > 0 ? (
                          <span className="text-slate-900 dark:text-white font-extrabold">{row.mcqCopy}</span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700">
                        {row.mcqGo > 0 ? (
                          <span className="text-blue-700 dark:text-blue-400 font-extrabold">{row.mcqGo}</span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700">
                        {row.deToiKhan > 0 ? (
                          <span className="text-rose-700 dark:text-rose-400 font-extrabold">{row.deToiKhan}</span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700">
                        {row.th > 0 ? (
                          <span className="text-amber-700 dark:text-amber-400 font-extrabold">{row.th}</span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700">
                        {row.aiCreate > 0 ? (
                          <span className="text-purple-700 dark:text-purple-400 font-extrabold">{row.aiCreate}</span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700">
                        {row.copyGt > 0 ? (
                          <span className="text-indigo-700 dark:text-indigo-400 font-extrabold">{row.copyGt}</span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700">
                        {row.goGt > 0 ? (
                          <span className="text-teal-700 dark:text-teal-400 font-extrabold">{row.goGt}</span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="p-3 sm:p-3.5 text-center font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-r border-slate-200 dark:border-slate-700">
                        {row.total > 0 ? row.total.toLocaleString("vi-VN") : ""}
                      </td>
                      <td className="p-3 sm:p-3.5 text-center font-black text-amber-900 dark:text-amber-200 bg-amber-50/80 dark:bg-amber-950/40 text-sm">
                        {row.totalSalary > 0 ? `${row.totalSalary.toLocaleString("vi-VN")} ₫` : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {kpiData.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                  <td className="p-3 sm:p-3.5 pl-4 uppercase tracking-wider text-xs border-r border-slate-200 dark:border-slate-700 sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    TỔNG CỘNG
                  </td>
                  <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    {columnTotals.mcqCopy > 0 ? columnTotals.mcqCopy.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-400">
                    {columnTotals.mcqGo > 0 ? columnTotals.mcqGo.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-rose-700 dark:text-rose-400">
                    {columnTotals.deToiKhan > 0 ? columnTotals.deToiKhan.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-400">
                    {columnTotals.th > 0 ? columnTotals.th.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-purple-700 dark:text-purple-400">
                    {columnTotals.aiCreate > 0 ? columnTotals.aiCreate.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-400">
                    {columnTotals.copyGt > 0 ? columnTotals.copyGt.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-teal-700 dark:text-teal-400">
                    {columnTotals.goGt > 0 ? columnTotals.goGt.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/70 text-sm border-r border-slate-200 dark:border-slate-700">
                    {columnTotals.grandTotal.toLocaleString("vi-VN")}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center font-black text-amber-900 dark:text-amber-100 bg-amber-200/90 dark:bg-amber-900/80 text-base">
                    {columnTotals.grandSalary > 0 ? `${columnTotals.grandSalary.toLocaleString("vi-VN")} ₫` : "-"}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
