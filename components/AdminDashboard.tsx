"use client";

/**
 * ============================================================================
 * FILE: components/AdminDashboard.tsx
 * MỤC ĐÍCH: Bảng điều khiển quản trị (Admin Dashboard) tại Tab "Quản Lý Bắt Lỗi & Phản Hồi"
 * CHỨC NĂNG:
 *   1. Thống kê 4 thẻ trạng thái (Tổng đề, Pass, Đang lỗi, QC Sai)
 *   2. Nút mở Modal "Bảng tính lương Nội Dung" (KpiTable)
 *   3. Nút "Tạo Đề Mới" và các tiện ích quản trị
 * ============================================================================
 */

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
import { KpiTable } from "@/components/KpiTable";

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

  const [isKpiOpen, setIsKpiOpen] = useState<boolean>(false);
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
        {/* Nhóm KPI rút gọn - Tối ưu mượt mà trên Mobile (2 cột), iPad/Tablet (4 cột), Laptop/Desktop (4 cột) */}
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

        {/* Nút bấm Mở Bảng Lương Nội Dung */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => setIsKpiOpen(true)}
            aria-label="Mở bảng tính lương Nội Dung"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-4 sm:px-5 py-3 font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 h-11 flex-shrink-0 active:scale-[0.98]"
          >
            <span>Bảng tính lương Nội Dung</span>
          </Button>
        </div>
      </div>

      {/* 3. TRANG CON / MODAL KPI BẢNG LƯƠNG */}
      <Dialog open={isKpiOpen} onOpenChange={setIsKpiOpen}>
        <DialogContent className="w-[calc(100%-1rem)] sm:w-full max-w-5xl lg:max-w-6xl max-h-[92vh] sm:max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50 dark:bg-slate-900 rounded-3xl border-slate-200 dark:border-slate-800 shadow-2xl">
          
          <DialogHeader className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl flex-shrink-0">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  Bảng Tính Lương Nội Dung
                </DialogTitle>
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 mt-0.5">
                  Phân loại số câu theo {`"Note"`} và {`"Leader Check"`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsKpiOpen(false)}
                variant="outline"
                size="sm"
                className="rounded-xl px-4 font-bold text-xs"
              >
                Đóng
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-900">
            <KpiTable />
          </div>
          
        </DialogContent>
      </Dialog>
    </>
  );
};
