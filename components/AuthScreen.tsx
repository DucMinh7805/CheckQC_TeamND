"use client";

/**
 * ============================================================================
 * FILE: components/AuthScreen.tsx
 * MỤC ĐÍCH: Màn hình Đăng nhập / Chọn danh tính nhân sự
 * CHỨC NĂNG:
 *   1. Lấy danh sách nhân sự từ tab Users của Google Sheets
 *   2. Hỗ trợ đăng nhập nhanh bằng cách chọn tên và nhập mã PIN bảo mật
 *   3. Ghi nhớ phiên đăng nhập (Session) trên trình duyệt
 * ============================================================================
 */

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  CloudDownload,
  ArrowRight,
  Lock,
  Loader2,
  AlertCircle,
  Sparkles,
  Layers,
  Activity,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";

export const AuthScreen: React.FC = () => {
  const { listUsers, isSyncingUsers, fetchUsersForLogin, login } = useApp();
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Tự động tải danh sách thành viên ngay khi mở trang (chỉ gọi 1 lần khi mount)
  useEffect(() => {
    fetchUsersForLogin().catch(() => {
      // Nếu đã có cache từ trước thì không hiện lỗi gây hoang mang
      if (listUsers.length === 0) {
        setErrorMessage("Lỗi kết nối máy chủ Google! Vui lòng bấm thử lại.");
      }
    });
  }, [fetchUsersForLogin]);

  const handleSyncUsers = async () => {
    setErrorMessage("");
    try {
      await fetchUsersForLogin();
    } catch (e: any) {
      setErrorMessage("Lỗi kết nối máy chủ Google! Vui lòng thử lại.");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setErrorMessage("Vui lòng chọn tài khoản của bạn!");
      return;
    }

    const result = await login(selectedUser, password);
    if (!result.success) {
      setErrorMessage(result.message || "Mật khẩu không chính xác!");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#f0f4f9] dark:bg-[#060a12] p-3 sm:p-6 lg:p-10 overflow-x-hidden transition-colors selection:bg-blue-600 selection:text-white">
      {/* Hiệu ứng Ánh sáng Nền Ambient Glow */}
      <div className="absolute top-10 left-10 w-72 sm:w-96 h-72 sm:h-96 bg-blue-500/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-500/15 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
        {/* CỘT TRÁI: Artwork & Giới thiệu tổng quan (Chỉ hiện trên màn hình lớn Desktop lg+) */}
        <div className="hidden lg:block lg:col-span-6 space-y-6 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-left-6 duration-500">
          {/* Logo & Brand Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-800 p-2 shadow-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-center hover:scale-105 transition-transform duration-300 relative overflow-hidden">
              <Image
                src="/Logo Marvel Team.png"
                alt="Marvel Team Logo"
                width={64}
                height={64}
                className="w-full h-full object-contain rounded-2xl drop-shadow-xs"
                priority
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 font-extrabold text-[11px] uppercase tracking-wider border border-blue-200 dark:border-blue-800 mb-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Không Gian Làm Việc Trực Tuyến</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                Trung tâm Nội Dung
              </h1>
            </div>
          </div>

          <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
            Hệ thống kiểm tra, rà soát, báo lỗi dành cho Team Nội Dung và Team QC
          </p>

          {/* Visual Artwork Showcase Card */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[11px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Workspace Hub
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-700 shadow-2xs">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">Đồng bộ liên tục</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  Cập nhật tức thì dữ liệu các đề bài
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-700 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">Theo dõi tiến độ</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  Quản lý trạng thái và phản hồi nhanh
                </p>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>Hệ thống trực tuyến và sẵn sàng làm việc</span>
          </div>
        </div>

        {/* CỘT PHẢI: Khung Đăng Nhập Kính Mờ Cao Cấp (Tập trung trọng tâm trên cả Mobile và Desktop) */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-400">
          <Card className="shadow-2xl border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-2 pt-6 sm:pt-8 px-5 sm:px-8">
              {/* Logo Marvel Team */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-md border border-slate-200/80 dark:border-slate-700 mx-auto mb-2.5 p-1.5 hover:scale-105 transition-transform duration-200 relative overflow-hidden">
                <Image
                  src="/Logo Marvel Team.png"
                  alt="Marvel Team"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain rounded-xl"
                  priority
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Đăng Nhập
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                Chọn tài khoản để truy cập Trung tâm Nội Dung
              </p>
            </CardHeader>

            <CardContent className="space-y-4 px-5 sm:px-8 pb-6 sm:pb-8 pt-2">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span className="flex-1">{errorMessage}</span>
                  <button
                    type="button"
                    onClick={handleSyncUsers}
                    aria-label="Thử tải lại danh sách nhân sự"
                    className="underline text-[11px] font-extrabold hover:text-rose-950 dark:hover:text-rose-100"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Chọn tài khoản */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Tài khoản thành viên</span>
                    {isSyncingUsers && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Đang tải...
                      </span>
                    )}
                  </label>
                  <Select
                    value={selectedUser}
                    onValueChange={(val) => {
                      if (val) setSelectedUser(val);
                      setErrorMessage("");
                    }}
                    disabled={isSyncingUsers && listUsers.length === 0}
                  >
                    <SelectTrigger className="w-full bg-slate-50/90 dark:bg-slate-800 hover:bg-slate-100/80 rounded-xl font-bold text-xs sm:text-sm py-2.5 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white transition-all h-11">
                      <span>
                        {isSyncingUsers && listUsers.length === 0
                          ? "Đang đồng bộ danh sách..."
                          : selectedUser || "-- Chọn tài khoản của bạn --"}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl max-h-64 animate-in fade-in zoom-in-95 duration-150">
                      {listUsers.map((user) => (
                        <SelectItem key={user.name} value={user.name} className="py-2.5 font-semibold text-xs sm:text-sm cursor-pointer">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                            <span>{user.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mật khẩu */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage("");
                      }}
                      className="bg-slate-50/90 dark:bg-slate-800 rounded-xl font-medium pr-10 border-slate-200 dark:border-slate-700 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus-visible:ring-blue-500 transition-all h-11"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Nút Đăng nhập */}
                <Button
                  type="submit"
                  disabled={isSyncingUsers && listUsers.length === 0}
                  aria-label="Đăng nhập vào hệ thống"
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-black h-11 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 transition-all text-xs sm:text-sm"
                >
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                {/* Nút Làm mới danh sách nhân sự */}
                <div className="pt-1 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSyncUsers}
                    disabled={isSyncingUsers}
                    aria-label="Đồng bộ lại danh sách nhân sự từ Google Sheets"
                    className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition py-1 h-auto"
                  >
                    {isSyncingUsers ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 text-blue-500" />
                    ) : (
                      <CloudDownload className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                    )}
                    <span>Đồng bộ lại danh sách nhân sự</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

