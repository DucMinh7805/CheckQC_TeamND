"use client";

/**
 * ============================================================================
 * FILE: components/Sidebar.tsx
 * MỤC ĐÍCH: Thanh điều khiển bên trái (Cố định Sticky trên PC, cuộn linh hoạt trên Mobile)
 * CHỨC NĂNG:
 *   1. Hiển thị thông tin người dùng đang đăng nhập & Nút Đăng xuất
 *   2. Chuyển đổi vai trò giả lập (Dành cho Admin test quyền: WORKER, QC, ADMIN)
 *   3. Bộ lọc thời gian (Chọn tháng), Bộ lọc nhân sự (Ai làm, QC)
 *   4. Chuyển đổi giao diện Sáng / Tối (Theme Light / Dark) & Nút Đồng bộ dữ liệu mới nhất
 * ============================================================================
 */

import React from "react";
import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  LogOut,
  CalendarDays,
  Users,
  RefreshCw,
  Loader2,
  Eye,
  CheckCircle,
  Sun,
  Moon,
  FileSpreadsheet,
  Filter,
  PlusCircle,
  Palette,
} from "lucide-react";
import { exportTasksToCSV } from "@/lib/helpers";
import { ThemeAccent } from "@/types";
import { NotificationCenter } from "./NotificationCenter";
import Image from "next/image";

export const Sidebar: React.FC<{ inDrawer?: boolean; onCloseDrawer?: () => void }> = ({
  inDrawer = false,
  onCloseDrawer,
}) => {
  const {
    currentUser,
    logout,
    selectedMonth,
    setSelectedMonth,
    selectedWorker,
    setSelectedWorker,
    availableMonths,
    availableWorkers,
    loadData,
    isLoading,
    impersonatedRole,
    setImpersonatedRole,
    theme,
    toggleTheme,
    themeAccent,
    setThemeAccent,
    filteredTasks,
    advancedFilter,
    setAdvancedFilter,
    setIsCreateModalOpen,
  } = useApp();

  if (!currentUser) return null;

  const effectiveRole = impersonatedRole || currentUser.role;
  const canCreateTask = effectiveRole === "QC" || effectiveRole === "ADMIN";

  let roleLabel = "Nội Dung";
  let roleBadgeClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";

  if (effectiveRole === "QC") {
    roleLabel = "QC Manager";
    roleBadgeClass = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800";
  } else if (effectiveRole === "ADMIN") {
    roleLabel = "Super Admin";
    roleBadgeClass = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
  }

  const firstLetter = currentUser.name
    ? currentUser.name.charAt(0).toUpperCase()
    : "?";

  const handleExportCSV = () => {
    exportTasksToCSV(filteredTasks, selectedMonth);
  };

  const getAdvancedFilterLabel = () => {
    if (advancedFilter === "MY_TASKS") return "⭐ Đề của tôi";
    if (advancedFilter === "MULTI_ERROR") return "⚠️ Đề bị lỗi ≥ 2 lần";
    if (advancedFilter === "PENDING_3_DAYS") return "⏳ Đề tồn đọng > 3 ngày";
    return "Toàn bộ danh sách";
  };

  const accentColors: { id: ThemeAccent; label: string; bg: string }[] = [
    { id: "blue", label: "Xanh Dương", bg: "bg-blue-500" },
    { id: "indigo", label: "Indigo", bg: "bg-indigo-500" },
    { id: "purple", label: "Tím", bg: "bg-purple-500" },
    { id: "emerald", label: "Emerald", bg: "bg-emerald-500" },
    { id: "rose", label: "Đỏ Rose", bg: "bg-rose-500" },
    { id: "amber", label: "Vàng Amber", bg: "bg-amber-500" },
  ];

  const handleLogout = () => {
    if (onCloseDrawer) onCloseDrawer();
    logout();
  };

  return (
    <aside className={`w-full ${inDrawer ? "" : "hidden lg:flex lg:w-80 flex-shrink-0 lg:sticky lg:top-4 h-fit lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto scrollbar-none flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300 z-20"}`} aria-label="Thanh điều hướng và bộ lọc">
      <div className={`bg-white dark:bg-slate-900 ${inDrawer ? "p-4" : "rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md"} transition-all space-y-4 sm:space-y-5`}>
        {/* Brand Header & Notification + Dark Mode Toggle (Hiện trên Desktop, trên Mobile đã có Sticky Header) */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs flex-shrink-0 hover:scale-105 transition-transform duration-300 relative overflow-hidden">
              <Image
                src="/Logo Marvel Team.png"
                alt="Marvel Team Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain rounded-xl drop-shadow-xs"
                priority
              />
            </div>
            <div>
              <h1 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white leading-tight">
                Trung tâm Nội Dung
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge
                  variant="outline"
                  className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-lg px-2 py-0.5 ${roleBadgeClass}`}
                >
                  {roleLabel}
                </Badge>
                {impersonatedRole && (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 animate-pulse">
                    Mô phỏng
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Chuông Thông Báo In-App */}
            <NotificationCenter />

            {/* Toggle Dark Mode */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              title={theme === "light" ? "Chuyển sang Chế độ Tối (Dark Mode)" : "Chuyển sang Chế độ Sáng"}
              aria-label={theme === "light" ? "Chuyển sang Chế độ Tối (Dark Mode)" : "Chuyển sang Chế độ Sáng"}
              className="rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 h-9 w-9 hover:scale-105 active:scale-95 transition-all"
            >
              {theme === "light" ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </Button>
          </div>
        </div>

        {/* User Card */}
        <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-xs">
              {firstLetter}
            </div>
            <div className="truncate pr-2">
              <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                {currentUser.name}
              </p>
              <p className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Trực tuyến
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Đăng xuất khỏi hệ thống"
            aria-label="Đăng xuất khỏi hệ thống"
            className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition h-8 w-8 hover:scale-105"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Nút Nhập Liệu Đề Mới (dành riêng cho QC & Admin) */}
        {canCreateTask && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            aria-label="Nhập liệu đề mới cho QC"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl py-3.5 font-black text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Nhập Liệu Đề Mới (QC)</span>
          </Button>
        )}

        {/* Chế độ Toàn quyền Admin: Đổi góc nhìn mô phỏng */}
        {currentUser.role === "ADMIN" && (
          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>Góc nhìn mô phỏng (Admin)</span>
            </div>
            <Select
              value={impersonatedRole || "ADMIN"}
              onValueChange={(val) => {
                if (val === "ADMIN") setImpersonatedRole(null);
                else if (val) setImpersonatedRole(val);
              }}
            >
              <SelectTrigger className="w-full bg-white dark:bg-slate-900 font-bold text-xs py-2 rounded-xl border-amber-300 dark:border-amber-700">
                <span>{impersonatedRole === "QC" ? "🛡️ Góc nhìn QC Manager" : impersonatedRole === "WORKER" ? "📝 Góc nhìn Nội dung" : "👑 Toàn quyền Admin"}</span>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-lg">
                <SelectItem value="ADMIN" className="font-bold">👑 Toàn quyền Admin</SelectItem>
                <SelectItem value="QC" className="font-bold">🛡️ Góc nhìn QC Manager</SelectItem>
                <SelectItem value="WORKER" className="font-bold">📝 Góc nhìn Nội dung</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tùy Chỉnh Màu Sắc Chủ Đạo Cho Toàn Trang (Dành Cho Admin) */}
        {currentUser.role === "ADMIN" && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5 text-blue-500" />
              <span>Tùy Chỉnh Màu Sắc Chủ Đạo</span>
            </div>
            <div className="flex items-center gap-2 justify-between pt-1">
              {accentColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setThemeAccent(color.id)}
                  title={color.label}
                  aria-label={`Chọn màu chủ đạo ${color.label}`}
                  className={`w-6 h-6 rounded-full ${color.bg} transition-all transform hover:scale-125 ${
                    themeAccent === color.id
                      ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110 shadow-md"
                      : "opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bộ lọc dữ liệu */}
        <div className="space-y-3.5 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Bộ Lọc Dữ Liệu
            </h2>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Đã lưu
            </span>
          </div>

          {/* Month Filter (Sắp xếp theo thời gian mới nhất lên đầu) */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>ID / Tháng làm việc</span>
            </label>
            <Select
              value={selectedMonth}
              onValueChange={(val) => {
                if (val) setSelectedMonth(val);
              }}
            >
              <SelectTrigger className="w-full bg-slate-50/80 dark:bg-slate-800 font-bold text-xs sm:text-sm py-2.5 rounded-2xl border-slate-200 dark:border-slate-700">
                <span>{selectedMonth === "ALL" ? "Tất cả thời gian" : `Tháng ${selectedMonth}`}</span>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xl max-h-56">
                <SelectItem value="ALL" className="font-bold text-xs sm:text-sm py-2">
                  Tất cả thời gian
                </SelectItem>
                {availableMonths.map((m) => (
                  <SelectItem key={m} value={m} className="font-bold text-xs sm:text-sm py-2">
                    Tháng {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Worker Filter (Lấy từ tất cả thành viên trong cột Họ và tên tab Users) */}
          {effectiveRole !== "WORKER" && (
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Lọc Theo Bạn Nội Dung</span>
              </label>
              <Select
                value={selectedWorker}
                onValueChange={(val) => {
                  if (val) setSelectedWorker(val);
                }}
              >
                <SelectTrigger className="w-full bg-slate-50/80 dark:bg-slate-800 font-bold text-xs sm:text-sm py-2.5 rounded-2xl border-slate-200 dark:border-slate-700">
                  <span>{selectedWorker === "ALL" ? "Tất cả Nội dung" : selectedWorker}</span>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xl max-h-56">
                  <SelectItem value="ALL" className="font-bold text-xs sm:text-sm py-2">
                    Tất cả Nội dung
                  </SelectItem>
                  {availableWorkers.map((w) => (
                    <SelectItem key={w} value={w} className="font-bold text-xs sm:text-sm py-2">
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Bộ Lọc Ưu Tiên (Tích hợp ⭐ Đề của tôi, ⚠️ Bị lỗi >=2, ⏳ Tồn đọng >3 ngày) */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-500" />
              <span>Bộ Lọc Ưu Tiên</span>
            </label>
            <Select
              value={advancedFilter}
              onValueChange={(val: any) => {
                if (val) setAdvancedFilter(val);
              }}
            >
              <SelectTrigger className="w-full bg-amber-50/50 dark:bg-amber-950/20 font-bold text-xs py-2.5 rounded-2xl border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300">
                <span>{getAdvancedFilterLabel()}</span>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xl">
                <SelectItem value="ALL" className="font-bold text-xs py-2">
                  Toàn bộ danh sách
                </SelectItem>
                <SelectItem value="MY_TASKS" className="font-bold text-xs py-2 text-blue-700 dark:text-blue-400">
                  ⭐ Đề của tôi
                </SelectItem>
                <SelectItem value="MULTI_ERROR" className="font-bold text-xs py-2 text-amber-700 dark:text-amber-400">
                  ⚠️ Đề bị lỗi ≥ 2 lần
                </SelectItem>
                <SelectItem value="PENDING_3_DAYS" className="font-bold text-xs py-2 text-rose-700 dark:text-rose-400">
                  ⏳ Đề tồn đọng &gt; 3 ngày
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nút Xuất Báo Cáo Excel */}
          <Button
            onClick={handleExportCSV}
            variant="outline"
            aria-label="Xuất Báo Cáo Excel (CSV)"
            className="w-full py-3 text-xs sm:text-sm font-black border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-2xl flex items-center justify-center gap-2 transition shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 mt-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Xuất Báo Cáo Excel (CSV)</span>
          </Button>

          {/* Nút Làm Mới Dữ Liệu */}
          <Button
            variant="outline"
            onClick={() => loadData()}
            disabled={isLoading}
            aria-label="Đồng bộ & Làm mới dữ liệu từ Google Sheets"
            className="w-full py-3 text-xs sm:text-sm font-black border-dashed border-2 border-slate-300 dark:border-slate-700 hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl flex items-center justify-center gap-2 transition shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-700 dark:text-slate-300" />
            ) : (
              <RefreshCw className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            )}
            <span>Đồng bộ & Làm mới</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};
