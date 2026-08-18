"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { TaskItem, AppNotification } from "@/types";
import { soundService } from "@/lib/sound";
import { getVal, getStatusObj, formatDateTime, cleanStr } from "@/lib/helpers";
import { X, Bell, AlertTriangle, ArrowRight, ShieldCheck, Volume2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const NotificationBanner: React.FC = () => {
  const { currentUser, appData, setEditingTask, impersonatedRole } = useApp();
  const [activeBanner, setActiveBanner] = useState<AppNotification | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  const seenSignaturesRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  // Kiểm tra quyền thông báo trên thiết bị
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setHasPermission(Notification.permission === "granted");
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await soundService.requestNotificationPermission();
    setHasPermission(granted);
    soundService.playNotificationSound("alert");
  };

  // Quản lý và phát hiện thông báo mới theo thời gian thực (Real-time Hash Signature)
  useEffect(() => {
    if (!currentUser || !appData || appData.length === 0) return;

    const myName = cleanStr(currentUser.name).toLowerCase();
    const effectiveRole = impersonatedRole || currentUser.role;
    const isWorker = effectiveRole === "WORKER";
    const isQC = effectiveRole === "QC";
    const isAdmin = effectiveRole === "ADMIN";

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
      const qcFb = cleanStr(getVal(task, "Phản hồi của QC"));
      const userFb = cleanStr(getVal(task, "Nội Dung Phản hồi"));

      let errDetail = "";
      if (l1) errDetail += `• Lỗi 1: ${l1} `;
      if (l2) errDetail += `• Lỗi 2: ${l2} `;
      if (l3) errDetail += `• Lỗi 3: ${l3} `;
      if (qcFb) errDetail += `• QC nhắn: ${qcFb} `;

      // 1. Cho Bạn làm nội dung: Báo khi QC bắt lỗi hoặc phản hồi cập nhật
      if (isWorker) {
        if (doer === myName || doer.includes(myName)) {
          if (status.code === "ERROR") {
            const signature = `worker_err_${task.row_index}_${l1}_${l2}_${l3}_${qcFb}_${status.code}`;
            candidates.push({
              id: signature,
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

      // 2. Cho QC: Báo khi Bạn Nội Dung phản hồi / giải trình
      if (isQC) {
        const qc = cleanStr(getVal(task, "QC")).toLowerCase();
        if (qc === myName || qc.includes(myName)) {
          if (userFb && status.code !== "PASS") {
            const signature = `qc_fb_${task.row_index}_${userFb}_${status.code}`;
            candidates.push({
              id: signature,
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

      // 3. Cho Admin: Báo tất cả phản hồi hoặc lỗi mới phát sinh
      if (isAdmin) {
        if (userFb && status.code !== "PASS") {
          const signature = `admin_fb_${task.row_index}_${userFb}_${status.code}`;
          candidates.push({
            id: signature,
            rowIndex: task.row_index,
            taskTitle: title,
            sender: doerOriginal,
            senderLabel: "Nội Dung Phản Hồi",
            type: "FEEDBACK",
            title: `[Nội Dung] ${title}`,
            message: `${doerOriginal}: ${userFb}`,
            time: timeStr,
            isRead: false,
          });
        }
      }
    });

    // Khi mới vào web lần đầu: ghi nhớ toàn bộ trạng thái hiện tại để không bắn spam hàng loạt
    if (isInitialLoadRef.current) {
      candidates.forEach((c) => seenSignaturesRef.current.add(c.id));
      isInitialLoadRef.current = false;
      return;
    }

    // Phát hiện thông báo hoặc cập nhật mới chưa từng thấy
    const newNotif = candidates.find((c) => !seenSignaturesRef.current.has(c.id));
    if (newNotif) {
      seenSignaturesRef.current.add(newNotif.id);
      setActiveBanner(newNotif);

      // 1. Phát chuông thông báo âm lượng lớn & Rung điện thoại
      soundService.playNotificationSound("alert");

      // 2. Bắn thông báo lên thanh trạng thái / màn hình khóa điện thoại (OS Lock Screen)
      soundService.sendOSNotification(
        newNotif.title,
        `${newNotif.senderLabel} từ ${newNotif.sender}: ${newNotif.message}`,
        () => {
          const targetTask = appData.find((t) => String(t.row_index) === String(newNotif.rowIndex));
          if (targetTask) setEditingTask(targetTask);
        }
      );
    }
  }, [appData, currentUser, impersonatedRole, setEditingTask]);

  // Tự động đóng banner nổi sau 8 giây
  useEffect(() => {
    if (activeBanner) {
      const timer = setTimeout(() => {
        setActiveBanner(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [activeBanner]);

  const handleOpenTask = () => {
    if (!activeBanner) return;
    const targetTask = appData.find((t) => String(t.row_index) === String(activeBanner.rowIndex));
    setActiveBanner(null);
    if (targetTask) {
      setEditingTask(targetTask);
    }
  };

  return (
    <>
      {/* Nút Nhắc Kích Hoạt Quyền Thông Báo & Thử Chuông (Chỉ hiện khi chưa bật thông báo) */}
      {!hasPermission && (
        <div className="fixed bottom-4 left-4 z-40 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Button
            size="sm"
            onClick={handleRequestPermission}
            className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xl flex items-center gap-2 py-2 px-3.5 border border-amber-300"
          >
            <Bell className="w-4 h-4 animate-bounce" />
            <span>Bật chuông & Thông báo nổi</span>
          </Button>
        </div>
      )}

      {/* Banner Thông Báo Nổi Kiểu Zalo / Shopee / Facebook */}
      {activeBanner && (
        <div className="fixed z-50 top-3 sm:top-5 right-2 sm:right-6 left-2 sm:left-auto max-w-full sm:max-w-md animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border-2 border-rose-400 dark:border-rose-700 shadow-2xl shadow-rose-500/20 flex items-start gap-3 relative overflow-hidden ring-2 ring-rose-400/30">
            
            {/* Dải sáng chuyển động */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-blue-500 animate-pulse" />

            {/* Icon Avatar */}
            <div className="mt-0.5 w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center flex-shrink-0 shadow-md">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>

            {/* Nội dung Toast */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-1.5">
                <Badge className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md">
                  {activeBanner.senderLabel}
                </Badge>
                <span className="text-[10px] font-bold text-slate-400 truncate">
                  {activeBanner.time}
                </span>
              </div>

              <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate">
                {activeBanner.taskTitle}
              </h4>

              <p className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 line-clamp-2 leading-snug">
                {activeBanner.message}
              </p>

              <div className="pt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                  <span>Từ: <strong className="text-slate-800 dark:text-slate-200">{activeBanner.sender}</strong></span>
                </span>

                <Button
                  size="sm"
                  onClick={handleOpenTask}
                  className="rounded-xl h-8 px-3 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 shadow-md active:scale-95 transition-transform"
                >
                  <span>Xem ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
      )}
    </>
  );
};
