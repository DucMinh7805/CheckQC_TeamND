"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Hash,
  Users,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertOctagon,
  Hourglass,
  ShieldCheck,
  BarChart3,
  X,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportTasksToCSV } from "@/lib/helpers";

ChartJS.register(ArcElement, Tooltip, Legend);

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    stats,
    workerStats,
    qcTeamStats,
    filteredTasks,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
  } = useApp();

  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);
  const [showWorkerTable, setShowWorkerTable] = useState<boolean>(true);
  const [showQCTable, setShowQCTable] = useState<boolean>(true);

  if (currentUser?.role !== "ADMIN") return null;

  // Tính tỷ lệ pass
  const passRate = useMemo(() => {
    return stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;
  }, [stats.total, stats.pass]);

  // Cấu hình dữ liệu biểu đồ tròn tối ưu với Memoize
  const chartData = useMemo(() => {
    return {
      labels: ["Đã Pass", "Đang Lỗi", "QC Sai", "Chờ Duyệt"],
      datasets: [
        {
          data: [stats.pass, stats.error, stats.wrong, stats.pending],
          backgroundColor: [
            "#10b981", // Emerald 500
            "#f43f5e", // Rose 500
            "#f59e0b", // Amber 500
            "#64748b", // Slate 500
          ],
          hoverBackgroundColor: [
            "#059669",
            "#e11d48",
            "#d97706",
            "#475569",
          ],
          borderWidth: 2,
          borderColor: "#ffffff",
          hoverOffset: 6,
        },
      ],
    };
  }, [stats.pass, stats.error, stats.wrong, stats.pending]);

  // Cấu hình Options biểu đồ
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
        legend: {
          display: false,
        },
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
              return ` ${label}: ${value} đề (${percentage}%)`;
            },
          },
        },
      },
    };
  }, [stats.total]);

  return (
    <>
      {/* 1. KHUNG TỔNG QUAN NHANH TRÊN MÀN HÌNH CHÍNH (Gọn gàng, tải cực nhanh, không tràn viền) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 transition-all">
        {/* Nhóm KPI rút gọn */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block truncate">Tổng Đề</span>
            <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 block">{stats.total}</span>
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-emerald-200/60 dark:border-emerald-900/60">
            <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block truncate">Đã Pass</span>
            <span className="text-base sm:text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">{stats.pass}</span>
          </div>

          <div className="bg-rose-50/70 dark:bg-rose-950/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-rose-200/60 dark:border-rose-900/60">
            <span className="text-[10px] font-extrabold text-rose-800 dark:text-rose-300 uppercase tracking-wider block truncate">Đang Lỗi</span>
            <span className="text-base sm:text-xl font-black text-rose-700 dark:text-rose-400 mt-0.5 block">{stats.error}</span>
          </div>

          <div className="bg-blue-50/70 dark:bg-blue-950/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-blue-200/60 dark:border-blue-900/60">
            <span className="text-[10px] font-extrabold text-blue-800 dark:text-blue-300 uppercase tracking-wider block truncate">Tổng Câu</span>
            <span className="text-base sm:text-xl font-black text-blue-700 dark:text-blue-400 mt-0.5 block">{stats.totalQuestions}</span>
          </div>
        </div>

        {/* Nút bấm Mở Trang Con Báo Cáo & Biểu Đồ Toàn Diện */}
        <Button
          onClick={() => setIsAnalyticsOpen(true)}
          aria-label="Mở trang báo cáo phân tích và biểu đồ chi tiết"
          className="bg-slate-900 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-2xl px-4 sm:px-5 py-3 font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 h-11 flex-shrink-0 group active:scale-[0.98]"
        >
          <BarChart3 className="w-4 h-4 text-blue-400 dark:text-white group-hover:scale-110 transition-transform" />
          <span>Báo Cáo & Biểu Đồ Chi Tiết</span>
        </Button>
      </div>

      {/* 2. TRANG CON / MODAL BÁO CÁO PHÂN TÍCH TOÀN DIỆN (CÂN ĐỐI TRÊN MOBILE, TABLET, DESKTOP) */}
      <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <DialogContent className="w-[calc(100%-1rem)] sm:w-full max-w-5xl lg:max-w-6xl max-h-[92vh] sm:max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header Báo Cáo */}
          <DialogHeader className="p-4 sm:p-6 pr-12 sm:pr-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 sm:p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-md shadow-blue-500/25 flex-shrink-0">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2 flex-wrap">
                  <span>Trung Tâm Phân Tích & Báo Cáo KPI</span>
                </DialogTitle>
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                  Dữ liệu kiểm duyệt chất lượng nội dung Marvel Team
                </p>
              </div>
            </div>

            {/* Bộ chọn tháng nhanh + Nút Xuất Excel */}
            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Tháng:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent font-black text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="ALL" className="dark:bg-slate-900">Tất cả tháng</option>
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

          {/* Body Báo Cáo Cuộn Riêng Biệt - Tối ưu tỷ lệ 3 thiết bị */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain bg-slate-50/30 dark:bg-slate-950/30">
            
            {/* HÀNG 1: BIỂU ĐỒ TRÒN NÂNG CẤP & 4 THẺ KPI CHÍNH */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
              
              {/* KHỐI BIỂU ĐỒ TRÒN THIẾT KẾ ĐỈNH CAO (lg:col-span-5) */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Phân Phối Trạng Thái
                    </h3>
                  </div>
                  <Badge className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black text-[10px]">
                    {stats.total} Đề
                  </Badge>
                </div>

                {/* Vùng vẽ biểu đồ Donut với Tâm Thông Tin */}
                <div className="my-4 relative h-48 sm:h-56 w-full flex items-center justify-center">
                  <Doughnut data={chartData} options={chartOptions} />
                  
                  {/* Tâm tròn ở giữa hiển thị Tỷ lệ Pass */}
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

                {/* Chú thích Legend dạng Card Pill hiện đại */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-200">Đã Pass</span>
                    </div>
                    <strong className="text-xs font-black text-emerald-800 dark:text-emerald-300">{stats.pass}</strong>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-[11px] font-extrabold text-rose-900 dark:text-rose-200">Đang Lỗi</span>
                    </div>
                    <strong className="text-xs font-black text-rose-800 dark:text-rose-300">{stats.error}</strong>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-[11px] font-extrabold text-amber-900 dark:text-amber-200">QC Sai</span>
                    </div>
                    <strong className="text-xs font-black text-amber-800 dark:text-amber-300">{stats.wrong}</strong>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                      <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">Chờ Duyệt</span>
                    </div>
                    <strong className="text-xs font-black text-slate-700 dark:text-slate-300">{stats.pending}</strong>
                  </div>
                </div>
              </div>

              {/* KHỐI 4 THẺ KPI & CÁC CHỈ SỐ CẢNH BÁO (lg:col-span-7) */}
              <div className="lg:col-span-7 flex flex-col justify-between gap-4">
                
                {/* 4 Thẻ KPI chính */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Tổng Đề Bài</span>
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                        <FileText className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">{stats.total}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">Khối lượng công việc</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">Tổng Số Câu</span>
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Hash className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl sm:text-4xl font-black text-blue-700 dark:text-blue-400">{stats.totalQuestions}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">Quy mô câu hỏi</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Đã Duyệt Pass</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400">{stats.pass}</p>
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{passRate}% hoàn thành</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">Đang Báo Lỗi</span>
                      <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl sm:text-4xl font-black text-rose-700 dark:text-rose-400">{stats.error}</p>
                      <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-0.5">Cần xử lý khắc phục</p>
                    </div>
                  </div>
                </div>

                {/* Khối thống kê chi tiết từng loại lỗi & Cảnh báo ưu tiên */}
                <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                    <span>Chi Tiết Phân Loại Lỗi & Điểm Nóng</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
                    <div className="bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-2xl border border-amber-200/70 dark:border-amber-900/50 flex flex-col justify-between">
                      <span className="text-[10px] font-extrabold text-amber-900 dark:text-amber-200 uppercase">Lỗi Lần 1</span>
                      <span className="text-lg font-black text-amber-800 dark:text-amber-300 mt-1">{stats.totalLoi1}</span>
                    </div>

                    <div className="bg-orange-50/70 dark:bg-orange-950/30 p-2.5 rounded-2xl border border-orange-200/70 dark:border-orange-900/50 flex flex-col justify-between">
                      <span className="text-[10px] font-extrabold text-orange-900 dark:text-orange-200 uppercase">Lỗi Lần 2</span>
                      <span className="text-lg font-black text-orange-800 dark:text-orange-300 mt-1">{stats.totalLoi2}</span>
                    </div>

                    <div className="bg-rose-50/70 dark:bg-rose-950/30 p-2.5 rounded-2xl border border-rose-200/70 dark:border-rose-900/50 flex flex-col justify-between">
                      <span className="text-[10px] font-extrabold text-rose-900 dark:text-rose-200 uppercase">Lỗi Lần 3</span>
                      <span className="text-lg font-black text-rose-800 dark:text-rose-300 mt-1">{stats.totalLoi3}</span>
                    </div>

                    <div className="bg-amber-100/90 dark:bg-amber-950/50 p-2.5 rounded-2xl border border-amber-300 dark:border-amber-800 flex flex-col justify-between">
                      <span className="text-[10px] font-extrabold text-amber-950 dark:text-amber-200 uppercase flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3" />
                        <span>Lỗi ≥ 2</span>
                      </span>
                      <span className="text-lg font-black text-amber-950 dark:text-amber-200 mt-1">{stats.multiErrorCount}</span>
                    </div>

                    <div className="bg-rose-100/90 dark:bg-rose-950/50 p-2.5 rounded-2xl border border-rose-300 dark:border-rose-800 flex flex-col justify-between col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-extrabold text-rose-950 dark:text-rose-200 uppercase flex items-center gap-1">
                        <Hourglass className="w-3 h-3" />
                        <span>Tồn &gt; 3 ngày</span>
                      </span>
                      <span className="text-lg font-black text-rose-950 dark:text-rose-200 mt-1">{stats.pending3DaysCount}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* HÀNG 2: BẢNG XẾP HẠNG & HIỆU SUẤT NHÂN SỰ NỘI DUNG */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      1. Hiệu suất Team Nội Dung
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500">Sắp xếp theo số lượng câu hỏi và tỷ lệ Pass</p>
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
                  <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[620px]">
                    <thead>
                      <tr className="bg-slate-50/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-700 text-[11px]">
                        <th className="p-3.5 pl-4">Hạng & Nhân Sự</th>
                        <th className="p-3.5 text-center">Số Đề</th>
                        <th className="p-3.5 text-center">Tổng Câu</th>
                        <th className="p-3.5 text-center text-emerald-800 dark:text-emerald-300">Đã Pass</th>
                        <th className="p-3.5 text-center text-amber-800 dark:text-amber-300">Lỗi 1</th>
                        <th className="p-3.5 text-center text-orange-800 dark:text-orange-300">Lỗi 2</th>
                        <th className="p-3.5 text-center text-rose-800 dark:text-rose-300">Lỗi 3</th>
                        <th className="p-3.5 text-center">Tỷ lệ Pass</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {workerStats.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-5 text-center text-slate-500 font-semibold">
                            Chưa có dữ liệu nhân sự trong tháng này
                          </td>
                        </tr>
                      ) : (
                        workerStats.map((ws, idx) => (
                          <tr key={ws.workerName} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition font-medium">
                            <td className="p-3.5 pl-4 font-black text-slate-900 dark:text-white flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                idx === 0 ? "bg-amber-400 text-slate-900 shadow-xs" : idx === 1 ? "bg-slate-300 text-slate-800" : idx === 2 ? "bg-amber-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                              }`}>
                                {idx + 1}
                              </span>
                              <span>{ws.workerName}</span>
                            </td>
                            <td className="p-3.5 text-center font-bold text-slate-700 dark:text-slate-300">{ws.totalTasks}</td>
                            <td className="p-3.5 text-center font-black text-blue-700 dark:text-blue-400">{ws.totalQuestions}</td>
                            <td className="p-3.5 text-center font-black text-emerald-700 dark:text-emerald-400">{ws.passCount}</td>
                            <td className="p-3.5 text-center font-semibold text-amber-700 dark:text-amber-400">
                              {ws.loi1Count > 0 ? ws.loi1Count : "-"}
                            </td>
                            <td className="p-3.5 text-center font-semibold text-orange-700 dark:text-orange-400">
                              {ws.loi2Count > 0 ? ws.loi2Count : "-"}
                            </td>
                            <td className="p-3.5 text-center font-semibold text-rose-700 dark:text-rose-400">
                              {ws.loi3Count > 0 ? ws.loi3Count : "-"}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                                ws.passRate >= 80 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : ws.passRate >= 50 ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              }`}>
                                {ws.passRate}%
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* HÀNG 3: BẢNG ĐÁNH GIÁ ĐỘI NGŨ QC */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      2. Hiệu Suất Đội Ngũ QC ({qcTeamStats.length} QC)
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500">Đánh giá tiến độ kiểm tra và phát hiện lỗi</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQCTable(!showQCTable)}
                  className="rounded-xl text-xs font-bold"
                >
                  {showQCTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>

              {showQCTable && (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[620px]">
                    <thead>
                      <tr className="bg-purple-50/80 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 font-extrabold uppercase tracking-wider border-b border-purple-200/80 dark:border-purple-800 text-[11px]">
                        <th className="p-3.5 pl-4">QC Phụ Trách</th>
                        <th className="p-3.5 text-center">Đề Phụ Trách</th>
                        <th className="p-3.5 text-center">Số Câu Đã Check</th>
                        <th className="p-3.5 text-center text-emerald-700 dark:text-emerald-400">Đã Duyệt Pass</th>
                        <th className="p-3.5 text-center text-rose-700 dark:text-rose-400">Tổng Lỗi Bắt Được</th>
                        <th className="p-3.5 text-center">Tỷ Lệ Pass</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {qcTeamStats.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-5 text-center text-slate-400 font-semibold">
                            Chưa có dữ liệu QC trong tháng này
                          </td>
                        </tr>
                      ) : (
                        qcTeamStats.map((qs) => (
                          <tr key={qs.qcName} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition font-medium">
                            <td className="p-3.5 pl-4 font-black text-slate-900 dark:text-white flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-purple-500" />
                              <span>{qs.qcName}</span>
                            </td>
                            <td className="p-3.5 text-center font-bold text-slate-700 dark:text-slate-300">{qs.totalCheckedTasks}</td>
                            <td className="p-3.5 text-center font-black text-blue-700 dark:text-blue-400">{qs.totalQuestionsChecked}</td>
                            <td className="p-3.5 text-center font-black text-emerald-600 dark:text-emerald-400">{qs.totalPassed}</td>
                            <td className="p-3.5 text-center font-black text-rose-600 dark:text-rose-400">
                              {qs.totalErrorsFound > 0 ? qs.totalErrorsFound : "-"}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-black text-[11px]">
                                {qs.passRate}%
                              </span>
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
              Đang xem thống kê tháng: <strong className="text-slate-900 dark:text-white">{selectedMonth === "ALL" ? "Tất cả các tháng" : selectedMonth}</strong>
            </span>
            <Button
              onClick={() => setIsAnalyticsOpen(false)}
              className="rounded-xl font-black text-xs px-5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              Đóng Báo Cáo
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
};
