"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { AuthScreen } from "@/components/AuthScreen";
import { Sidebar } from "@/components/Sidebar";
import { TaskBoard } from "@/components/TaskBoard";
import { NotificationCenter } from "@/components/NotificationCenter";
import { NotificationBanner } from "@/components/NotificationBanner";
import { ArrowUp, Moon, Sun, PlusCircle, SlidersHorizontal, X, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

import { AdminDashboard } from "@/components/AdminDashboard";
import { QCDashboard } from "@/components/QCDashboard";
import { TaskModal } from "@/components/TaskModal";
import { CreateTaskModal } from "@/components/CreateTaskModal";

export default function HomePage() {
  const {
    currentUser,
    editingTask,
    setEditingTask,
    isCreateModalOpen,
    setIsCreateModalOpen,
    impersonatedRole,
    themeAccent,
    theme,
    toggleTheme,
  } = useApp();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<"FILTER" | "DASHBOARD">("FILTER");

  useEffect(() => {
    setIsMounted(true);

    const handleScroll = () => {
      if (window.scrollY > 280) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Đăng ký Service Worker cho PWA & nhận thông báo nền trên di động
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lắng nghe Phím tắt thông minh toàn cục (Global Keyboard Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + K hoặc Cmd + K -> Focus thanh tìm kiếm đề bài
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[aria-label="Tìm kiếm theo tên đề bài hoặc người làm"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // Esc -> Đóng drawer mobile
      if (e.key === "Escape") {
        if (isMobileDrawerOpen) setIsMobileDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileDrawerOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f7fb] dark:bg-slate-950">
        <div className="w-8 h-8 rounded-full border-3 border-slate-900 dark:border-white border-t-transparent animate-spin" />
      </div>
    );
  }

  // Nếu chưa đăng nhập, hiển thị màn hình Login
  if (!currentUser) {
    return <AuthScreen />;
  }

  const effectiveRole = impersonatedRole || currentUser.role;
  const canCreateTask = effectiveRole === "QC" || effectiveRole === "ADMIN";
  const hasDashboard = effectiveRole === "ADMIN" || effectiveRole === "QC";

  let roleLabel = "Nội Dung";
  let roleBadgeClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";

  if (effectiveRole === "QC") {
    roleLabel = "QC Manager";
    roleBadgeClass = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800";
  } else if (effectiveRole === "ADMIN") {
    roleLabel = "Super Admin";
    roleBadgeClass = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
  }

  // Lớp viền/accent động theo màu Admin đã chọn
  let accentBorderClass = "";
  if (themeAccent === "indigo") accentBorderClass = "accent-indigo";
  else if (themeAccent === "purple") accentBorderClass = "accent-purple";
  else if (themeAccent === "emerald") accentBorderClass = "accent-emerald";
  else if (themeAccent === "rose") accentBorderClass = "accent-rose";
  else if (themeAccent === "amber") accentBorderClass = "accent-amber";

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-[#f4f7fb] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative ${accentBorderClass}`}>
      {/* THANH TOP BAR CỐ ĐỊNH RIÊNG CHO ĐIỆN THOẠI (Mobile Sticky Navigation) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          {/* Nút Mở Thanh Công Cụ / Bộ Lọc & Dashboard Bên Trái Trên Mobile */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileDrawerOpen(true)}
            title="Mở Bộ Lọc & Dashboard"
            aria-label="Mở Bộ Lọc & Dashboard"
            className="rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 h-9 w-9 hover:scale-105 active:scale-95 transition-all flex-shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </Button>

          <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xs flex-shrink-0 relative overflow-hidden">
            <Image
              src="/Logo Marvel Team.png"
              alt="Logo Marvel Team"
              width={32}
              height={32}
              className="w-full h-full object-contain rounded-lg"
              priority
            />
          </div>

          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {currentUser.name}
              </span>
              <Badge
                variant="outline"
                className={`text-[9px] font-black uppercase tracking-wider rounded-md px-1 py-0 ${roleBadgeClass}`}
              >
                {roleLabel}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 font-bold truncate">
              Trung tâm Nội Dung
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Nút Nhập Đề Nhanh Trên Mobile Cho QC/Admin */}
          {canCreateTask && (
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              aria-label="Nhập đề bài mới"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-8 px-2.5 font-extrabold text-[11px] flex items-center gap-1 shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Đề</span>
            </Button>
          )}

          {/* Chuông Thông Báo In-App */}
          <NotificationCenter />

          {/* Toggle Dark Mode */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            title={theme === "light" ? "Chuyển sang Chế độ Tối" : "Chuyển sang Chế độ Sáng"}
            aria-label={theme === "light" ? "Chuyển sang Chế độ Tối" : "Chuyển sang Chế độ Sáng"}
            className="rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 h-9 w-9 hover:scale-105 active:scale-95 transition-all flex-shrink-0"
          >
            {theme === "light" ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </Button>
        </div>
      </header>

      {/* THANH CÔNG CỤ TRƯỢT TRÁI (MOBILE SLIDE-OUT DRAWER) - Gọn gàng không chiếm diện tích màn hình */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Panel */}
          <div className="relative w-[90vw] max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full overflow-hidden border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-300 z-10">
            {/* Header Drawer */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-sm text-slate-900 dark:text-white">
                    Bảng Điều Khiển & Bộ Lọc
                  </h2>
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    Trung tâm Nội Dung Marvel
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="Đóng bảng điều khiển"
                className="rounded-xl h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Sub-tabs trong Drawer nếu là QC/Admin (Cho phép chuyển qua lại giữa Bộ Lọc và Dashboard) */}
            {hasDashboard && (
              <div className="px-4 pt-3 flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <button
                  onClick={() => setMobileTab("FILTER")}
                  aria-label="Chuyển sang tab Bộ Lọc & Nhân Sự"
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    mobileTab === "FILTER"
                      ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Bộ Lọc & Nhân Sự</span>
                </button>
                <button
                  onClick={() => setMobileTab("DASHBOARD")}
                  aria-label="Chuyển sang tab Thống Kê KPI"
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    mobileTab === "DASHBOARD"
                      ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Thống Kê KPI</span>
                </button>
              </div>
            )}

            {/* Body Drawer Cuộn Riêng Biệt */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {mobileTab === "FILTER" || !hasDashboard ? (
                <Sidebar inDrawer onCloseDrawer={() => setIsMobileDrawerOpen(false)} />
              ) : (
                <div className="p-3 space-y-4">
                  {effectiveRole === "ADMIN" && <AdminDashboard />}
                  {effectiveRole === "QC" && (
                    <QCDashboard
                      onOpenDetails={(task) => {
                        setIsMobileDrawerOpen(false);
                        setEditingTask(task);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="p-3 sm:p-5 lg:p-6 flex flex-col lg:flex-row gap-4 sm:gap-5 lg:gap-6 w-full max-w-full min-w-0">
        {/* Cột trái: Sidebar điều khiển & bộ lọc (Chỉ hiển thị cố định trên Desktop lg+) */}
        <Sidebar />

        {/* Cột phải: Content chính mở rộng tràn viền linh hoạt */}
        <main className="flex-1 flex flex-col gap-4 sm:gap-5 lg:gap-6 min-w-0 w-full max-w-full overflow-hidden" aria-label="Nội dung chính">
          {/* Admin Dashboard: Thống kê & Biểu đồ toàn diện (Hiện mượt mà trên cả Mobile, Tablet, Desktop) */}
          {effectiveRole === "ADMIN" && (
            <AdminDashboard />
          )}

          {/* QC Dashboard: Thống kê cá nhân và bảng đề đã check (Hiện trên Desktop, trên mobile xem qua menu trượt) */}
          {effectiveRole === "QC" && (
            <div className="hidden lg:block">
              <QCDashboard onOpenDetails={(task) => setEditingTask(task)} />
            </div>
          )}

          {/* Task Board: Danh sách đề và các Tabs (Trên mobile xuất hiện ngay đầu tiên cực kỳ trực quan) */}
          <TaskBoard onOpenDetails={(task) => setEditingTask(task)} />
        </main>
      </div>

      {/* Modal chỉnh sửa chi tiết đề bài */}
      <TaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
      />

      {/* Modal Nhập Liệu Đề Mới cho QC / Admin */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Banner thông báo nổi phong cách Zalo / Facebook */}
      <NotificationBanner />

      {/* Nút Trở Về Đầu Trang (Back to Top) - Nâng vị trí lên cao tránh thanh công cụ trình duyệt mobile */}
      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          title="Trở về đầu trang"
          aria-label="Cuộn về đầu trang"
          className="fixed bottom-20 sm:bottom-8 right-4 sm:right-6 z-40 rounded-full w-12 h-12 bg-slate-900 dark:bg-blue-600 text-white shadow-2xl hover:shadow-3xl hover:scale-110 active:scale-95 transition-all duration-300 ring-2 ring-white/60 dark:ring-blue-400/60 flex items-center justify-center animate-in fade-in zoom-in-75"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}


