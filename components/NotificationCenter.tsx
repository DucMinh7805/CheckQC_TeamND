"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { AppNotification, TaskItem } from "@/types";
import { getVal, getStatusObj, formatDateTime, cleanStr } from "@/lib/helpers";
import {
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Check,
  CheckCheck,
  CircleDot,
  Inbox,
  Clock,
  ShieldCheck,
  User,
  ArrowRight,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { soundService } from "@/lib/sound";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const NotificationCenter: React.FC = () => {
  const { currentUser, appData, setEditingTask, impersonatedRole } = useApp();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "UNREAD" | "ERROR">("ALL");

  // Tải danh sách ID đã đọc từ localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`qc_read_notifs_${currentUser?.name}`);
      if (saved) {
        setReadIds(JSON.parse(saved));
      }
    } catch (e) {}
  }, [currentUser]);

  // Tạo danh sách thông báo thông minh dựa trên dữ liệu thật của hệ thống
  const rawNotifications: AppNotification[] = useMemo(() => {
    if (!currentUser || !appData || appData.length === 0) return [];

    const myName = cleanStr(currentUser.name).toLowerCase();
    const effectiveRole = impersonatedRole || currentUser.role;
    const isWorker = effectiveRole === "WORKER";
    const isQC = effectiveRole === "QC";
    const isAdmin = effectiveRole === "ADMIN";
    const notifs: AppNotification[] = [];

    appData.forEach((task) => {
      const doer = cleanStr(getVal(task, "Ai làm")).toLowerCase();
      const doerOriginal = getVal(task, "Ai làm") || "Chưa rõ";
      const qc = cleanStr(getVal(task, "QC")).toLowerCase();
      const qcOriginal = getVal(task, "QC") || "Chưa rõ";
      const title = cleanStr(getVal(task, "Tên đề"));
      
      // Bỏ qua nếu đề đã bị xóa khỏi Sheet hoặc không có tiêu đề/người làm hợp lệ
      if (!title || !doer) return;

      const rawTime = getVal(task, "Thời gian");
      const timeStr = formatDateTime(rawTime) || "Gần đây";
      const status = getStatusObj(task);
      const l1 = cleanStr(getVal(task, "Lỗi lần 1"));
      const l2 = cleanStr(getVal(task, "Lỗi lần 2"));
      const l3 = cleanStr(getVal(task, "Lỗi lần 3"));
      const userFb = cleanStr(getVal(task, "Nội Dung Phản hồi"));
      const qcFb = cleanStr(getVal(task, "Phản hồi của QC"));

      let errDetail = "";
      if (l1) errDetail += `• Lỗi 1: ${l1}\n`;
      if (l2) errDetail += `• Lỗi 2: ${l2}\n`;
      if (l3) errDetail += `• Lỗi 3: ${l3}\n`;

      // 1. DÀNH CHO BẠN NỘI DUNG (Chỉ thấy đề do chính mình làm khi có lỗi, QC Sai hoặc QC phản hồi)
      if (isWorker) {
        const isMyTask = doer === myName || doer.includes(myName);
        if (!isMyTask) return; // Bỏ qua hoàn toàn đề của người khác, tránh trôi thông báo

        if (status.code === "ERROR") {
          notifs.push({
            id: `err_${task.row_index}`,
            rowIndex: task.row_index,
            taskTitle: title,
            sender: qcOriginal,
            senderLabel: "QC báo lỗi",
            type: "ERROR",
            title: `[Lỗi QC] ${title}`,
            message: `Người làm: ${doerOriginal} • QC báo lỗi: ${qcOriginal}\n${errDetail.trim() || "Có lỗi cần khắc phục."}`,
            time: timeStr,
            isRead: false,
          });
        } else if (status.code === "WRONG") {
          notifs.push({
            id: `wrong_${task.row_index}`,
            rowIndex: task.row_index,
            taskTitle: title,
            sender: qcOriginal,
            senderLabel: "QC phụ trách",
            type: "WRONG",
            title: `[QC Sai] ${title}`,
            message: `Người làm: ${doerOriginal} • QC: ${qcOriginal}`,
            time: timeStr,
            isRead: false,
          });
        }

        if (qcFb && status.code !== "PASS") {
          notifs.push({
            id: `qcfb_${task.row_index}`,
            rowIndex: task.row_index,
            taskTitle: title,
            sender: qcOriginal,
            senderLabel: "QC phản hồi",
            type: "FEEDBACK",
            title: `[QC Phản hồi] ${title}`,
            message: `QC ${qcOriginal}: ${qcFb}`,
            time: timeStr,
            isRead: false,
          });
        }
      }

      // 2. DÀNH CHO QC (Chỉ thấy đề do chính QC này phụ trách)
      else if (isQC) {
        const isMyQCTask = qc === myName || qc.includes(myName);
        if (!isMyQCTask) return; // Bỏ qua đề của QC khác

        if (userFb) {
          notifs.push({
            id: `fb_${task.row_index}`,
            rowIndex: task.row_index,
            taskTitle: title,
            sender: doerOriginal,
            senderLabel: "Phản hồi từ",
            type: "FEEDBACK",
            title: `[Giải trình mới] ${title}`,
            message: `Nhân sự: ${doerOriginal} • QC phụ trách: ${qcOriginal}\nNội dung: ${userFb}`,
            time: timeStr,
            isRead: false,
          });
        } else if (status.code === "ERROR") {
          notifs.push({
            id: `qc_err_${task.row_index}`,
            rowIndex: task.row_index,
            taskTitle: title,
            sender: doerOriginal,
            senderLabel: "Nhân sự làm đề",
            type: "ERROR",
            title: `[Đề cần sửa] ${title}`,
            message: `Nhân sự: ${doerOriginal} • QC phụ trách: ${qcOriginal}\n${errDetail.trim() || "Chưa khắc phục xong."}`,
            time: timeStr,
            isRead: false,
          });
        }
      }

      // 3. DÀNH CHO SUPER ADMIN (Chỉ tập trung vào các đề đang có LỖI hoặc GIẢI TRÌNH cần xem xét, không spam đề Pass cũ)
      else if (isAdmin) {
        if (status.code === "ERROR") {
          notifs.push({
            id: `admin_err_${task.row_index}`,
            rowIndex: task.row_index,
            taskTitle: title,
            sender: `${doerOriginal} (QC: ${qcOriginal})`,
            senderLabel: "Nhân sự & QC",
            type: "ERROR",
            title: `[Lỗi QC] ${title}`,
            message: `Người làm: ${doerOriginal} • QC báo lỗi: ${qcOriginal}\n${errDetail.trim() || "Đang có lỗi cần xử lý."}`,
            time: timeStr,
            isRead: false,
          });
        } else if (userFb) {
          notifs.push({
            id: `admin_fb_${task.row_index}`,
            rowIndex: task.row_index,
            taskTitle: title,
            sender: `${doerOriginal} (QC: ${qcOriginal})`,
            senderLabel: "Phản hồi từ",
            type: "FEEDBACK",
            title: `[Giải trình] ${title}`,
            message: `Người làm: ${doerOriginal} • QC: ${qcOriginal}\n${userFb}`,
            time: timeStr,
            isRead: false,
          });
        }
      }
    });

    return notifs.map((n) => ({
      ...n,
      isRead: readIds.includes(n.id),
    }));
  }, [currentUser, appData, readIds, impersonatedRole]);

  // Bộ lọc thông báo
  const filteredNotifications = useMemo(() => {
    if (filterType === "UNREAD") return rawNotifications.filter((n) => !n.isRead);
    if (filterType === "ERROR") return rawNotifications.filter((n) => n.type === "ERROR");
    return rawNotifications;
  }, [rawNotifications, filterType]);

  const unreadCount = useMemo(() => {
    return rawNotifications.filter((n) => !n.isRead).length;
  }, [rawNotifications]);

  const markAsRead = (id: string) => {
    const updated = Array.from(new Set([...readIds, id]));
    setReadIds(updated);
    if (currentUser?.name) {
      localStorage.setItem(`qc_read_notifs_${currentUser.name}`, JSON.stringify(updated));
    }
  };

  const markAsUnread = (id: string) => {
    const updated = readIds.filter((item) => item !== id);
    setReadIds(updated);
    if (currentUser?.name) {
      localStorage.setItem(`qc_read_notifs_${currentUser.name}`, JSON.stringify(updated));
    }
  };

  const toggleReadStatus = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (readIds.includes(id)) {
      markAsUnread(id);
    } else {
      markAsRead(id);
    }
  };

  const markAllAsRead = () => {
    const allIds = rawNotifications.map((n) => n.id);
    setReadIds(allIds);
    if (currentUser?.name) {
      localStorage.setItem(`qc_read_notifs_${currentUser.name}`, JSON.stringify(allIds));
    }
  };

  const handleNotificationClick = (n: AppNotification) => {
    markAsRead(n.id);
    // So sánh linh hoạt cả kiểu số và chuỗi
    const targetTask = appData.find(
      (t) => String(t.row_index) === String(n.rowIndex) || Number(t.row_index) === Number(n.rowIndex)
    );
    if (targetTask) {
      setIsOpen(false);
      // Timeout ngắn để Base UI đóng modal thông báo mượt mà rồi mới mở TaskModal
      setTimeout(() => {
        setEditingTask(targetTask);
      }, 150);
    }
  };

  return (
    <>
      {/* Nút Chuông Thông Báo */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        title="Trung tâm Thông Báo & Cập Nhật Tiến Độ"
        aria-label={`Trung tâm thông báo, hiện có ${unreadCount} thông báo mới`}
        className="relative rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 h-9 w-9 hover:scale-105 active:scale-95 transition-all shadow-xs flex-shrink-0"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* POPUP MODAL TRUNG TÂM THÔNG BÁO - TỐI ƯU GIAO DIỆN DI ĐỘNG & DESKTOP */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[calc(100%-1.25rem)] sm:w-full max-w-2xl lg:max-w-3xl max-h-[86vh] sm:max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header Modal: Có padding-right pr-12 trên mobile để không bị nút đóng X đè */}
          <DialogHeader className="p-4 sm:p-6 pr-12 sm:pr-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 sm:p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/25 flex-shrink-0">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2 flex-wrap">
                  <span>Thông Báo</span>
                  {unreadCount > 0 && (
                    <Badge className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg shadow-xs">
                      {unreadCount} mới
                    </Badge>
                  )}
                </DialogTitle>
                <p className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                  Tiến độ kiểm tra, báo lỗi và phản hồi
                </p>
              </div>
            </div>

            {/* Nhóm nút thao tác: Thử chuông & Đánh dấu đọc */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => soundService.playNotificationSound("alert")}
                aria-label="Thử âm thanh chuông thông báo"
                className="rounded-xl border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 bg-amber-50/60 dark:bg-amber-950/40 hover:bg-amber-100 font-extrabold text-[11px] sm:text-xs flex items-center gap-1.5 py-1.5 px-3 shadow-2xs flex-shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Thử chuông</span>
              </Button>

              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  aria-label="Đánh dấu tất cả thông báo là đã đọc"
                  className="rounded-xl border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 font-extrabold text-[11px] sm:text-xs flex items-center gap-1.5 py-1.5 px-3 shadow-2xs flex-shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã đọc tất cả</span>
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Thanh Tab Lọc Phân Loại Thông Báo - Hỗ trợ vuốt ngang mượt mà */}
          <div className="px-3.5 sm:px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none flex-nowrap" role="tablist" aria-label="Phân loại thông báo">
            <button
              role="tab"
              aria-selected={filterType === "ALL"}
              aria-label={`Tất cả thông báo, tổng số ${rawNotifications.length}`}
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap ${
                filterType === "ALL"
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Tất cả ({rawNotifications.length})</span>
            </button>

            <button
              role="tab"
              aria-selected={filterType === "UNREAD"}
              aria-label={`Thông báo chưa đọc, hiện có ${unreadCount}`}
              onClick={() => setFilterType("UNREAD")}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap ${
                filterType === "UNREAD"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>Chưa đọc ({unreadCount})</span>
            </button>

            <button
              role="tab"
              aria-selected={filterType === "ERROR"}
              aria-label={`Thông báo báo lỗi, hiện có ${rawNotifications.filter((n) => n.type === "ERROR").length}`}
              onClick={() => setFilterType("ERROR")}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap ${
                filterType === "ERROR"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-rose-800 dark:text-rose-300 hover:bg-rose-50 border border-rose-200 dark:border-rose-900"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Báo Lỗi ({rawNotifications.filter((n) => n.type === "ERROR").length})</span>
            </button>
          </div>

          {/* Danh Sách Thông Báo Dạng Card - Tinh Chỉnh Padding & Tỷ Lệ Cân Đối Cho Mobile */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3 bg-slate-50/40 dark:bg-slate-900/40 overscroll-contain">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 sm:py-16 text-center space-y-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-black text-sm sm:text-base text-slate-800 dark:text-slate-200">
                    Không có thông báo nào
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                    Tất cả các đề bài đều đã được cập nhật hoặc không có thông báo mới trong mục này.
                  </p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`group relative p-3.5 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.98] ${
                    !n.isRead
                      ? "bg-white dark:bg-slate-800/90 border-blue-200 dark:border-blue-800/80 ring-1 ring-blue-300/40"
                      : "bg-white/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 opacity-90 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon Phân Loại */}
                    <div className="mt-0.5 flex-shrink-0">
                      {n.type === "ERROR" && (
                        <div className="p-2 sm:p-2.5 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 shadow-2xs">
                          <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      )}
                      {n.type === "WRONG" && (
                        <div className="p-2 sm:p-2.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 shadow-2xs">
                          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      )}
                      {n.type === "FEEDBACK" && (
                        <div className="p-2 sm:p-2.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 shadow-2xs">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      )}
                    </div>

                    {/* Nội Dung Chi Tiết */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug break-all [overflow-wrap:anywhere] break-words">
                            {n.title}
                          </h4>
                          {!n.isRead && (
                            <Badge className="bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-md shadow-2xs flex-shrink-0">
                              MỚI
                            </Badge>
                          )}
                        </div>

                        {/* Thời gian */}
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{n.time}</span>
                        </span>
                      </div>

                      {/* Khung Tin Nhắn / Bắt Lỗi */}
                      <div className={`p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm font-semibold leading-relaxed ${
                        n.type === "ERROR"
                          ? "bg-rose-50/80 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border border-rose-100 dark:border-rose-900/50"
                          : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800"
                      }`}>
                        <p className="whitespace-pre-line break-all [overflow-wrap:anywhere] break-words">{n.message}</p>
                      </div>

                      {/* Footer card: Nhãn vai trò + Nút đánh dấu chưa đọc (Zalo style) + Nút mở đề */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1.5 text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 border-t border-slate-100/80 dark:border-slate-800/80">
                        <span className="flex items-center gap-1.5 truncate">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                          <span className="truncate">
                            {n.senderLabel || "Người gửi"}: <strong className="text-slate-900 dark:text-white font-extrabold">{n.sender}</strong>
                          </span>
                        </span>

                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 justify-between sm:justify-end">
                          {/* Nút Đánh dấu chưa đọc / đã đọc chuẩn Zalo */}
                          <button
                            type="button"
                            onClick={(e) => toggleReadStatus(e, n.id)}
                            title={n.isRead ? "Đánh dấu là chưa đọc (giống Zalo)" : "Đánh dấu là đã đọc"}
                            aria-label={n.isRead ? "Đánh dấu là chưa đọc" : "Đánh dấu là đã đọc"}
                            className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1.5 transition-all shadow-2xs ${
                              n.isRead
                                ? "bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/80 dark:border-slate-600"
                                : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800"
                            }`}
                          >
                            {n.isRead ? (
                              <>
                                <RotateCcw className="w-3 h-3 text-blue-500" />
                                <span>Chưa đọc</span>
                              </>
                            ) : (
                              <>
                                <CheckCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Đã đọc</span>
                              </>
                            )}
                          </button>

                          <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-black group-hover:translate-x-0.5 transition-transform">
                            <span>Chi tiết</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Modal */}
          <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
              Tổng {rawNotifications.length} thông báo
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-4 py-1.5 font-bold text-xs text-slate-700 dark:text-slate-200"
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
