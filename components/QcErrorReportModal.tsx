"use client";

/**
 * ============================================================================
 * FILE: components/QcErrorReportModal.tsx
 * MỤC ĐÍCH: Cửa sổ Modal "Báo Cáo Lỗi của QC" (Bật lên khi click nút Báo lỗi QC)
 * CHỨC NĂNG:
 *   1. Biểu đồ tròn Donut phân phối trạng thái (Đã Pass, Đang Lỗi, QC Sai, Chờ Duyệt)
 *   2. 4 Thẻ KPI: Tổng Đề, Tổng Câu, Đã Pass, Đang Lỗi
 *   3. 4 Thẻ phân loại lỗi & điểm nóng: Lỗi 1, Lỗi 2, Lỗi 3, Tồn > 3 ngày
 *   4. Bảng "1. Báo cáo lỗi của Nội Dung" với tính năng Sort theo từng cột
 * ============================================================================
 */

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart3,
  Users,
  Hourglass,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Hash,
  ChevronDown,
  ChevronUp,
  Calendar,
  Sparkles,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { exportTasksToCSV } from "@/lib/helpers";

ChartJS.register(ArcElement, Tooltip, Legend);

type WorkerSortField =
  | "workerName"
  | "totalTasks"
  | "totalQuestions"
  | "passCount"
  | "loi1Count"
  | "loi2Count"
  | "loi3Count";

interface QcErrorReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QcErrorReportModal: React.FC<QcErrorReportModalProps> = ({
  open,
  onOpenChange,
}) => {
  const {
    stats,
    workerStats,
    availableMonths,
    selectedMonth,
    setSelectedMonth,
    filteredTasks,
  } = useApp();

  const [showWorkerTable, setShowWorkerTable] = useState<boolean>(true);
  const [workerSortField, setWorkerSortField] = useState<WorkerSortField | null>(null);
  const [workerSortOrder, setWorkerSortOrder] = useState<"asc" | "desc">("desc");

  // Tính tỷ lệ pass cho biểu đồ
  const passRate = useMemo(() => {
    return stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;
  }, [stats.total, stats.pass]);

  // Cấu hình dữ liệu biểu đồ tròn Donut
  const chartData = useMemo(() => {
    return {
      labels: ["Đã Pass", "Đang Lỗi", "QC Sai", "Chờ Duyệt"],
      datasets: [
        {
          data: [stats.pass, stats.error, stats.wrong, stats.pending],
          backgroundColor: ["#10b981", "#f43f5e", "#f59e0b", "#64748b"],
          hoverBackgroundColor: ["#059669", "#e11d48", "#d97706", "#475569"],
          borderWidth: 2,
          borderColor: "#ffffff",
          hoverOffset: 6,
        },
      ],
    };
  }, [stats.pass, stats.error, stats.wrong, stats.pending]);

  const chartOptions = useMemo(() => {
    return {
      cutout: "76%",
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 800,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.92)",
          titleFont: { size: 12, weight: 800 },
          bodyFont: { size: 12, weight: 700 },
          padding: 10,
          cornerRadius: 12,
          callbacks: {
            label: function (context: any) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const total = stats.total || 1;
              const percentage = Math.round((value / total) * 100);
              return " " + label + ": " + value + " đề (" + percentage + "%)";
            },
          },
        },
      },
    };
  }, [stats.total]);

  // Sắp xếp danh sách Worker trong Modal
  const sortedWorkerStats = useMemo(() => {
    if (!workerSortField) return workerStats;
    return [...workerStats].sort((a, b) => {
      if (workerSortField === "workerName") {
        return workerSortOrder === "asc"
          ? a.workerName.localeCompare(b.workerName, "vi")
          : b.workerName.localeCompare(a.workerName, "vi");
      }
      const valA = a[workerSortField] || 0;
      const valB = b[workerSortField] || 0;
      return workerSortOrder === "asc" ? valA - valB : valB - valA;
    });
  }, [workerStats, workerSortField, workerSortOrder]);

  const handleWorkerSort = (field: WorkerSortField) => {
    if (workerSortField === field) {
      if (workerSortOrder === "desc") setWorkerSortOrder("asc");
      else {
        setWorkerSortField(null);
        setWorkerSortOrder("desc");
      }
    } else {
      setWorkerSortField(field);
      setWorkerSortOrder("desc");
    }
  };

  const renderWorkerSortIcon = (field: WorkerSortField) => {
    if (workerSortField !== field)
      return <ArrowUpDown className="w-3 h-3 text-slate-400 ml-1 inline-block" />;
    return workerSortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ml-1 inline-block" />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] sm:w-full max-w-5xl lg:max-w-6xl max-h-[92vh] sm:max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Báo Cáo */}
        <DialogHeader className="p-4 sm:p-6 pr-12 sm:pr-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 sm:p-3 bg-gradient-to-br from-rose-600 to-red-700 text-white rounded-2xl shadow-md shadow-rose-500/25 flex-shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2 flex-wrap">
                <span>Báo Cáo Lỗi của QC</span>
              </DialogTitle>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                Dữ liệu kiểm duyệt chất lượng nội dung và tổng hợp các đề bài bị bắt lỗi
              </p>
            </div>
          </div>

          {/* Bộ chọn tháng nhanh + Nút Xuất Excel */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>Tháng:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-black text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="ALL" className="dark:bg-slate-900">
                  Tất cả tháng
                </option>
                {availableMonths.map((m) => (
                  <option key={m} value={m} className="dark:bg-slate-900">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTasksToCSV(filteredTasks, selectedMonth)}
              aria-label="Xuất dữ liệu báo cáo ra file Excel CSV"
              className="rounded-xl border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 font-extrabold text-[11px] sm:text-xs flex items-center gap-1.5 py-1.5 px-3 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất CSV</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Body Báo Cáo */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain bg-slate-50/30 dark:bg-slate-950/30">
          
          {/* HÀNG 1: BIỂU ĐỒ TRÒN & 4 THẺ KPI CHÍNH */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
            
            {/* KHỐI BIỂU ĐỒ TRÒN (lg:col-span-5) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Phân Phối Trạng Thái
                  </h3>
                </div>
                <Badge className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-black text-[10px]">
                  {stats.total} Đề
                </Badge>
              </div>

              <div className="my-3 relative h-44 sm:h-52 w-full flex items-center justify-center">
                <Doughnut data={chartData} options={chartOptions} />

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider">
                    Tỷ lệ Pass
                  </span>
                  <span className="text-2xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {passRate}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {stats.pass}/{stats.total} đề
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">
                    Đã Pass: <strong>{stats.pass}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">
                    Đang Lỗi: <strong>{stats.error}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">
                    QC Sai: <strong>{stats.wrong}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">
                    Chờ duyệt: <strong>{stats.pending}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* KHỐI 4 THẺ SỐ LIỆU TỔNG QUAN & PHÂN LOẠI LỖI (lg:col-span-7) */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-4">
              
              {/* 4 Thẻ Tổng Quan */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      Tổng Đề
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {stats.total}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">đề bài</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Tổng Câu
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Hash className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                      {stats.totalQuestions.toLocaleString("vi-VN")}
                    </p>
                    <p className="text-[10px] font-bold text-blue-500/80 mt-0.5">câu hỏi</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Đã Pass
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
                      {stats.pass}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {passRate}% hoàn thành
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      Đang Lỗi
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400">
                      {stats.error}
                    </p>
                    <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                      cần khắc phục
                    </p>
                  </div>
                </div>
              </div>

              {/* Khối thống kê 4 loại lỗi cân đối */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                  <span>Chi Tiết Phân Loại Lỗi & Điểm Nóng</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-2xl border border-amber-200/70 dark:border-amber-900/50 flex flex-col justify-between">
                    <span className="text-[10px] font-extrabold text-amber-900 dark:text-amber-200 uppercase">
                      Lỗi Lần 1
                    </span>
                    <span className="text-lg font-black text-amber-800 dark:text-amber-300 mt-1">
                      {stats.totalLoi1}
                    </span>
                  </div>

                  <div className="bg-orange-50/70 dark:bg-orange-950/30 p-2.5 rounded-2xl border border-orange-200/70 dark:border-orange-900/50 flex flex-col justify-between">
                    <span className="text-[10px] font-extrabold text-orange-900 dark:text-orange-200 uppercase">
                      Lỗi Lần 2
                    </span>
                    <span className="text-lg font-black text-orange-800 dark:text-orange-300 mt-1">
                      {stats.totalLoi2}
                    </span>
                  </div>

                  <div className="bg-rose-50/70 dark:bg-rose-950/30 p-2.5 rounded-2xl border border-rose-200/70 dark:border-rose-900/50 flex flex-col justify-between">
                    <span className="text-[10px] font-extrabold text-rose-900 dark:text-rose-200 uppercase">
                      Lỗi Lần 3
                    </span>
                    <span className="text-lg font-black text-rose-800 dark:text-rose-300 mt-1">
                      {stats.totalLoi3}
                    </span>
                  </div>

                  <div className="bg-rose-100/90 dark:bg-rose-950/50 p-2.5 rounded-2xl border border-rose-300 dark:border-rose-800 flex flex-col justify-between">
                    <span className="text-[10px] font-extrabold text-rose-950 dark:text-rose-200 uppercase flex items-center gap-1">
                      <Hourglass className="w-3 h-3" />
                      <span>Tồn &gt; 3 ngày</span>
                    </span>
                    <span className="text-lg font-black text-rose-950 dark:text-rose-200 mt-1">
                      {stats.pending3DaysCount}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* HÀNG 2: BẢNG BÁO CÁO LỖI CỦA NỘI DUNG */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    1. Báo cáo lỗi của Nội Dung
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500">
                    Tổng hợp số lượng lỗi phát hiện trong các đề bài
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWorkerTable(!showWorkerTable)}
                className="rounded-xl text-xs font-bold"
              >
                {showWorkerTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {showWorkerTable && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[550px]">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-700 text-[11px]">
                      <th
                        onClick={() => handleWorkerSort("workerName")}
                        className="p-3.5 pl-4 cursor-pointer select-none hover:text-blue-600 transition"
                      >
                        <div className="flex items-center gap-1">
                          <span>Nhân Sự</span>
                          {renderWorkerSortIcon("workerName")}
                        </div>
                      </th>
                      <th
                        onClick={() => handleWorkerSort("totalTasks")}
                        className="p-3.5 text-center cursor-pointer select-none hover:text-blue-600 transition"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Số Đề</span>
                          {renderWorkerSortIcon("totalTasks")}
                        </div>
                      </th>
                      <th
                        onClick={() => handleWorkerSort("totalQuestions")}
                        className="p-3.5 text-center cursor-pointer select-none hover:text-blue-600 transition"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Tổng Câu</span>
                          {renderWorkerSortIcon("totalQuestions")}
                        </div>
                      </th>
                      <th
                        onClick={() => handleWorkerSort("passCount")}
                        className="p-3.5 text-center text-emerald-800 dark:text-emerald-300 cursor-pointer select-none hover:text-emerald-600 transition"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Đã Pass</span>
                          {renderWorkerSortIcon("passCount")}
                        </div>
                      </th>
                      <th
                        onClick={() => handleWorkerSort("loi1Count")}
                        className="p-3.5 text-center text-amber-800 dark:text-amber-300 cursor-pointer select-none hover:text-amber-600 transition"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Lỗi 1</span>
                          {renderWorkerSortIcon("loi1Count")}
                        </div>
                      </th>
                      <th
                        onClick={() => handleWorkerSort("loi2Count")}
                        className="p-3.5 text-center text-orange-800 dark:text-orange-300 cursor-pointer select-none hover:text-orange-600 transition"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Lỗi 2</span>
                          {renderWorkerSortIcon("loi2Count")}
                        </div>
                      </th>
                      <th
                        onClick={() => handleWorkerSort("loi3Count")}
                        className="p-3.5 text-center text-rose-800 dark:text-rose-300 cursor-pointer select-none hover:text-rose-600 transition"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Lỗi 3</span>
                          {renderWorkerSortIcon("loi3Count")}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sortedWorkerStats.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-5 text-center text-slate-500 font-semibold">
                          Chưa có dữ liệu nhân sự trong tháng này
                        </td>
                      </tr>
                    ) : (
                      sortedWorkerStats.map((ws, idx) => (
                        <tr
                          key={ws.workerName}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition font-medium"
                        >
                          <td className="p-3.5 pl-4 font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                idx === 0
                                  ? "bg-amber-400 text-slate-900 shadow-xs"
                                  : idx === 1
                                  ? "bg-slate-300 text-slate-800"
                                  : idx === 2
                                  ? "bg-amber-700 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span>{ws.workerName}</span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                            {ws.totalTasks}
                          </td>
                          <td className="p-3.5 text-center font-black text-blue-700 dark:text-blue-400">
                            {ws.totalQuestions}
                          </td>
                          <td className="p-3.5 text-center font-black text-emerald-700 dark:text-emerald-400">
                            {ws.passCount}
                          </td>
                          <td className="p-3.5 text-center font-semibold text-amber-700 dark:text-amber-400">
                            {ws.loi1Count > 0 ? ws.loi1Count : "-"}
                          </td>
                          <td className="p-3.5 text-center font-semibold text-orange-700 dark:text-orange-400">
                            {ws.loi2Count > 0 ? ws.loi2Count : "-"}
                          </td>
                          <td className="p-3.5 text-center font-semibold text-rose-700 dark:text-rose-400">
                            {ws.loi3Count > 0 ? ws.loi3Count : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            Đang xem thống kê tháng:{" "}
            <strong className="text-slate-900 dark:text-white">
              {selectedMonth === "ALL" ? "Tất cả các tháng" : selectedMonth}
            </strong>
          </span>
          <Button
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-black text-xs px-5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            Đóng Báo Cáo
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};
