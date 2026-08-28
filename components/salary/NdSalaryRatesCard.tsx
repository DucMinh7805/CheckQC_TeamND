"use client";

/**
 * ============================================================================
 * FILE: components/salary/NdSalaryRatesCard.tsx
 * MỤC ĐÍCH: Thẻ cấu hình đơn giá lương 7 loại đề Nội Dung dành cho Admin
 * ============================================================================
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Coins, SlidersHorizontal } from "lucide-react";

export interface NdRates {
  mcqCopy: number;
  mcqGo: number;
  deToiKhan: number;
  th: number;
  aiCreate: number;
  copyGt: number;
  goGt: number;
}

interface NdSalaryRatesCardProps {
  rates: NdRates;
  isEditingRates: boolean;
  setIsEditingRates: (editing: boolean) => void;
  onRateChange: (field: keyof NdRates, val: string) => void;
  onSaveRates: () => void;
}

export const NdSalaryRatesCard: React.FC<NdSalaryRatesCardProps> = ({
  rates,
  isEditingRates,
  setIsEditingRates,
  onRateChange,
  onSaveRates,
}) => {
  return (
    <div className="bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-amber-50/70 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 p-3 sm:p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/60 dark:border-amber-800/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-600 text-white rounded-xl shadow-xs">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
              <span>Cấu Hình Đơn Giá Lương Nội Dung</span>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/80 px-2 py-0.5 rounded-md">
                VNĐ / câu
              </span>
            </h4>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-bold">
              Tự động lưu và đồng bộ đa thiết bị khi chỉnh sửa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditingRates ? (
            <Button
              onClick={onSaveRates}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs h-8 px-3.5 flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>OK (Lưu)</span>
            </Button>
          ) : (
            <Button
              onClick={() => setIsEditingRates(true)}
              variant="outline"
              size="sm"
              className="border-amber-300 dark:border-amber-700 bg-white/80 dark:bg-slate-900 text-amber-900 dark:text-amber-200 hover:bg-amber-100 rounded-xl font-bold text-xs h-8 px-3 flex items-center gap-1 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span>Chỉnh sửa đơn giá</span>
            </Button>
          )}
        </div>
      </div>

      {isEditingRates ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">MCQ copy</label>
            <Input
              type="number"
              value={rates.mcqCopy || ""}
              onChange={(e) => onRateChange("mcqCopy", e.target.value)}
              placeholder="0"
              className="h-8 text-xs font-black bg-white dark:bg-slate-900 border-amber-300 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black text-blue-700 dark:text-blue-400">MCQ gõ / AI</label>
            <Input
              type="number"
              value={rates.mcqGo || ""}
              onChange={(e) => onRateChange("mcqGo", e.target.value)}
              placeholder="0"
              className="h-8 text-xs font-black bg-white dark:bg-slate-900 border-blue-300 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black text-rose-700 dark:text-rose-400">Đề tối khẩn</label>
            <Input
              type="number"
              value={rates.deToiKhan || ""}
              onChange={(e) => onRateChange("deToiKhan", e.target.value)}
              placeholder="0"
              className="h-8 text-xs font-black bg-white dark:bg-slate-900 border-rose-300 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black text-amber-700 dark:text-amber-400">Thực hành (TH)</label>
            <Input
              type="number"
              value={rates.th || ""}
              onChange={(e) => onRateChange("th", e.target.value)}
              placeholder="0"
              className="h-8 text-xs font-black bg-white dark:bg-slate-900 border-amber-300 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black text-purple-700 dark:text-purple-400">AI create</label>
            <Input
              type="number"
              value={rates.aiCreate || ""}
              onChange={(e) => onRateChange("aiCreate", e.target.value)}
              placeholder="0"
              className="h-8 text-xs font-black bg-white dark:bg-slate-900 border-purple-300 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black text-indigo-700 dark:text-indigo-400">CopyGT</label>
            <Input
              type="number"
              value={rates.copyGt || ""}
              onChange={(e) => onRateChange("copyGt", e.target.value)}
              placeholder="0"
              className="h-8 text-xs font-black bg-white dark:bg-slate-900 border-indigo-300 rounded-xl"
            />
          </div>
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="text-[11px] font-black text-teal-700 dark:text-teal-400">Gõ GT</label>
            <Input
              type="number"
              value={rates.goGt || ""}
              onChange={(e) => onRateChange("goGt", e.target.value)}
              placeholder="0"
              className="h-8 text-xs font-black bg-white dark:bg-slate-900 border-teal-300 rounded-xl"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
          <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="block text-[10px] font-bold text-slate-500">MCQ Copy</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              {rates.mcqCopy > 0 ? `${rates.mcqCopy.toLocaleString("vi-VN")} ₫` : "0 ₫"}
            </span>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="block text-[10px] font-bold text-blue-600">MCQ Gõ/AI</span>
            <span className="text-xs font-black text-blue-700 dark:text-blue-300">
              {rates.mcqGo > 0 ? `${rates.mcqGo.toLocaleString("vi-VN")} ₫` : "0 ₫"}
            </span>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="block text-[10px] font-bold text-rose-600">Đề tối khẩn</span>
            <span className="text-xs font-black text-rose-700 dark:text-rose-300">
              {rates.deToiKhan > 0 ? `${rates.deToiKhan.toLocaleString("vi-VN")} ₫` : "0 ₫"}
            </span>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="block text-[10px] font-bold text-amber-600">Thực hành (TH)</span>
            <span className="text-xs font-black text-amber-700 dark:text-amber-300">
              {rates.th > 0 ? `${rates.th.toLocaleString("vi-VN")} ₫` : "0 ₫"}
            </span>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="block text-[10px] font-bold text-purple-600">AI create</span>
            <span className="text-xs font-black text-purple-700 dark:text-purple-300">
              {rates.aiCreate > 0 ? `${rates.aiCreate.toLocaleString("vi-VN")} ₫` : "0 ₫"}
            </span>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="block text-[10px] font-bold text-indigo-600">CopyGT</span>
            <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">
              {rates.copyGt > 0 ? `${rates.copyGt.toLocaleString("vi-VN")} ₫` : "0 ₫"}
            </span>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center col-span-2 sm:col-span-1">
            <span className="block text-[10px] font-bold text-teal-600">Gõ GT</span>
            <span className="text-xs font-black text-teal-700 dark:text-teal-300">
              {rates.goGt > 0 ? `${rates.goGt.toLocaleString("vi-VN")} ₫` : "0 ₫"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
