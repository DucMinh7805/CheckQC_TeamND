"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { TaskItem, AppNotification } from "@/types";
import { soundService } from "@/lib/sound";
import { getVal, getStatusObj, formatDateTime, cleanStr } from "@/lib/helpers";
import { X, Bell, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const NotificationBanner: React.FC = () => {
  const { currentUser, appData, setEditingTask, impersonatedRole } = useApp();
  const [activeBanner, setActiveBanner] = useState<AppNotification | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  // Yêu cầu quyền thông báo hệ thống khi mở web
  useEffect(() => {
    if (currentUser) {
      soundService.requestNotificationPermission().catch(() => {});
    }
  }, [currentUser]);

  // Quản lý và phát hiện thông báo mới theo thời gian thực
  useEffect(() => {
    if (!currentUser || !appData || appData.length === 0) return;

    const myName = cleanStr(currentUser.name).toLowerCase();
    const effectiveRole = impersonatedRole || currentUser.role;
    const isWorker = effectiveRole === "WORKER";
    const isQC = effectiveRole === "QC";

    // Tìm các thông báo quan trọng cần bắn Toast
    const candidates: AppNotification[] = [];

    appData.forEach((task) => {
      const doer = cleanStr(getVal(task, "Ai làm")).toLowerCase();
      const doerOriginal = getVal(task, "Ai làm") || "Chưa rõ";
      const qcOriginal = getVal(task, "QC") || "Chưa rõ";
      const title = cleanStr(getVal(task, "Tên đề"));
      if (!title || !doer) return;

      const status = getStatusObj(task);
      const rawTime = getVal(task, "Thời gian");
      const timeStr = formatDateTime(rawTime) || "Vừa xong";
      const l1 = cleanStr(getVal(task, "Lỗi lần 1"));
      const l2 = cleanStr(getVal(task, "Lỗi lần 2"));
      const l3 = cleanStr(getVal(task, "Lỗi lần 3"));
      let errDetail = "";
      if (l1) errDetail += `• Lỗi 1: ${l1} `;
      if (l2) errDetail += `• Lỗi 2: ${l2} `;
      if (l3) errDetail += `• Lỗi 3: ${l3} `;

      // 1. Cho Bạn làm nội dung: Báo khi QC bắt lỗi hoặc phản hồi
      if (isWorker) {
        if (doer === myName || doer.includes(myName)) {
          if (status.code === "ERROR") {
            candidates.push({
              id: `err_${task.row_index}`,
              rowIndex: task.row_index,
              taskTitle: title,
              sender: qcOriginal,
              senderLabel: "QC Báo Lỗi",
              type: "ERROR",
              title: `[Lỗi QC] ${title}`,
              message: errDetail.trim() || `QC ${qcOriginal} báo lỗi cần khắc phục.`,
              time: timeStr,
              isRead: false,
            });
          }
        }
      }

      // 2. Cho QC & Admin: Báo khi đề đang chờ duyệt / Nội dung phản hồi
      if (isQC || effectiveRole === "ADMIN") {
        const qc = cleanStr(getVal(task, "QC")).toLowerCase();
        if (effectiveRole === "ADMIN" || qc === myName || qc.includes(myName)) {
          const userFb = cleanStr(getVal(task, "Nội Dung Phản hồi"));
          if (userFb && status.code !== "PASS") {
            candidates.push({
              id: `ndfb_${task.row_index}`,
              rowIndex: task.row_index,
              taskTitle: title,
              sender: doerOriginal,
              senderLabel: "Nội Dung Phản Hồi",
              type: "FEEDBACK",
              title: `[Đã phản hồi] ${title}`,
              message: `${doerOriginal}: ${userFb}`,
              time: timeStr,
              isRead: false,
            });
          }
        }
      }
    });

    // Lần đầu tải trang: ghi nhớ ID để không bắn spam toàn bộ dữ liệu cũ
    if (isInitialLoadRef.current) {
      candidates.forEach((c) => seenIdsRef.current.add(c.id));
      isInitialLoadRef.current = false;
      return;
    }

    // Tìm thông báo mới xuất hiện chưa thấy
    const newNotif = candidates.find((c) => !seenIdsRef.current.has(c.id));
    if (newNotif) {
      seenIdsRef.current.add(newNotif.id);
      setActiveBanner(newNotif);

      // 1. Phát âm thanh nhẹ nhàng theo âm lượng thiết bị
      soundService.playNotificationSound("alert");

      // 2. Nếu người dùng đang ẩn tab / tắt màn hình -> Bắn System Push Notification
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        soundService.sendOSNotification(
          newNotif.title,
          `${newNotif.senderLabel} từ ${newNotif.sender}: ${newNotif.message}`,
          () => {
            const targetTask = appData.find((t) => String(t.row_index) === String(newNotif.rowIndex));
            if (targetTask) setEditingTask(targetTask);
          }
        );
      }
    }
  }, [appData, currentUser, impersonatedRole, setEditingTask]);

  // Tự động đóng banner sau 7 giây
  useEffect(() => {
    if (activeBanner) {
      const timer = setTimeout(() => {
        setActiveBanner(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeBanner]);

  if (!activeBanner) return null;

  const handleOpenTask = () => {
    const targetTask = appData.find((t) => String(t.row_index) === String(activeBanner.rowIndex));
    setActiveBanner(null);
    if (targetTask) {
      setEditingTask(targetTask);
    }
  };

  return (
    <div className="fixed z-50 top-4 right-3 sm:right-6 max-w-[94vw] sm:max-w-md w-full animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border-2 border-rose-300 dark:border-rose-800 shadow-2xl shadow-rose-500/10 flex items-start gap-3 relative overflow-hidden ring-1 ring-rose-500/20">
        
        {/* Dải màu trang trí viền */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-blue-500" />

        {/* Icon Avatar */}
        <div className="mt-1 w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center flex-shrink-0 shadow-xs">
          <AlertTriangle className="w-5 h-5" />
        </div>

        {/* Nội dung Toast */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-1.5">
            <Badge className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md">
              {activeBanner.senderLabel}
            </Badge>
            <span className="text-[10px] font-bold text-slate-400 truncate">
              {activeBanner.time}
            </span>
          </div>

          <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate">
            {activeBanner.taskTitle}
          </h4>

          <p className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 line-clamp-2 leading-snug">
            {activeBanner.message}
          </p>

          <div className="pt-1.5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-500" />
              <span>Gửi bởi: <strong>{activeBanner.sender}</strong></span>
            </span>

            <Button
              size="sm"
              onClick={handleOpenTask}
              className="rounded-xl h-7 px-2.5 text-[11px] font-black bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 shadow-xs active:scale-95"
            >
              <span>Xem ngay</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Nút đóng banner */}
        <button
          type="button"
          onClick={() => setActiveBanner(null)}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
