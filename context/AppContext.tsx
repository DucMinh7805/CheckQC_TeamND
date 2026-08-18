"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import {
  User,
  TaskItem,
  TabFilterType,
  AdvancedFilterType,
  ThemeAccent,
  CreateTaskPayload,
  SaveTaskPayload,
  UpdateStatusPayload,
  WorkerStatItem,
  QCStatItem,
} from "@/types";
import {
  cleanStr,
  getVal,
  getStatusObj,
  isMultiError,
  isPending3Days,
  sortMonthsChronological,
  normalizeMonthStr,
} from "@/lib/helpers";

const PRIMARY_API = "/api/qc";
const FALLBACK_DIRECT_API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://script.google.com/macros/s/AKfycbyNT2uE0TqPZ0UTptU6IkFLrDkC2BVtEKIYZk59MfTgdYyHFQ_-mc-dcD_FS9PB5UU0zg/exec";

interface StatsData {
  total: number;
  pass: number;
  error: number;
  wrong: number;
  pending: number;
  totalQuestions: number;
  totalLoi1: number;
  totalLoi2: number;
  totalLoi3: number;
  multiErrorCount: number;
  pending3DaysCount: number;
}

interface QCPersonalStats {
  totalTasks: number;
  totalQuestions: number;
  totalErrorsFound: number;
  totalPassed: number;
  tasksList: TaskItem[];
}

interface TabCounts {
  ALL: number;
  PENDING: number;
  ERROR: number;
  WRONG: number;
  PASS: number;
}

interface AppContextType {
  currentUser: User | null;
  listUsers: User[];
  appData: TaskItem[];
  isLoading: boolean;
  isSyncingUsers: boolean;
  error: string | null;
  selectedMonth: string;
  selectedWorker: string;
  currentTab: TabFilterType;
  advancedFilter: AdvancedFilterType;
  theme: "light" | "dark";
  themeAccent: ThemeAccent;
  availableMonths: string[];
  availableWorkers: string[];
  availableQCs: string[];
  filteredTasks: TaskItem[];
  tabCounts: TabCounts;
  stats: StatsData;
  workerStats: WorkerStatItem[];
  qcTeamStats: QCStatItem[];
  qcPersonalStats: QCPersonalStats;
  editingTask: TaskItem | null;
  isCreateModalOpen: boolean;
  impersonatedRole: string | null;
  setImpersonatedRole: (role: string | null) => void;
  setEditingTask: (task: TaskItem | null) => void;
  setIsCreateModalOpen: (open: boolean) => void;
  fetchUsersForLogin: () => Promise<void>;
  login: (name: string, pass: string) => { success: boolean; message?: string };
  logout: () => void;
  loadData: () => Promise<void>;
  setSelectedMonth: (month: string) => void;
  setSelectedWorker: (worker: string) => void;
  setCurrentTab: (tab: TabFilterType) => void;
  setAdvancedFilter: (filter: AdvancedFilterType) => void;
  toggleTheme: () => void;
  setThemeAccent: (accent: ThemeAccent) => void;
  createNewTask: (payload: CreateTaskPayload) => Promise<{ success: boolean; message?: string }>;
  saveTaskDetails: (payload: SaveTaskPayload) => Promise<{ success: boolean; message?: string }>;
  updateTaskStatus: (payload: UpdateStatusPayload) => Promise<{ success: boolean; message?: string }>;
  sendNotificationEmail: (task: TaskItem, customMessage?: string) => Promise<{ success: boolean; message?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ACCENT_COLOR_MAP: Record<
  ThemeAccent,
  {
    color: string;
    glow: string;
    glowDark: string;
    light: string;
    darkBg: string;
    border: string;
    neonDark: string;
  }
> = {
  blue: {
    color: "#3b82f6",
    glow: "rgba(59, 130, 246, 0.25)",
    glowDark: "rgba(96, 165, 250, 0.45)",
    light: "rgba(59, 130, 246, 0.08)",
    darkBg: "rgba(30, 58, 138, 0.35)",
    border: "#93c5fd",
    neonDark: "#60a5fa",
  },
  indigo: {
    color: "#6366f1",
    glow: "rgba(99, 102, 241, 0.25)",
    glowDark: "rgba(129, 140, 248, 0.45)",
    light: "rgba(99, 102, 241, 0.08)",
    darkBg: "rgba(49, 46, 129, 0.35)",
    border: "#a5b4fc",
    neonDark: "#818cf8",
  },
  purple: {
    color: "#a855f7",
    glow: "rgba(168, 85, 247, 0.25)",
    glowDark: "rgba(192, 132, 252, 0.45)",
    light: "rgba(168, 85, 247, 0.08)",
    darkBg: "rgba(88, 28, 135, 0.35)",
    border: "#d8b4fe",
    neonDark: "#c084fc",
  },
  emerald: {
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.25)",
    glowDark: "rgba(52, 211, 153, 0.45)",
    light: "rgba(16, 185, 129, 0.08)",
    darkBg: "rgba(6, 78, 59, 0.35)",
    border: "#6ee7b7",
    neonDark: "#34d399",
  },
  rose: {
    color: "#f43f5e",
    glow: "rgba(244, 63, 94, 0.25)",
    glowDark: "rgba(251, 113, 133, 0.45)",
    light: "rgba(244, 63, 94, 0.08)",
    darkBg: "rgba(136, 19, 55, 0.35)",
    border: "#fda4af",
    neonDark: "#fb7185",
  },
  amber: {
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.25)",
    glowDark: "rgba(251, 191, 36, 0.45)",
    light: "rgba(245, 158, 11, 0.08)",
    darkBg: "rgba(120, 53, 15, 0.35)",
    border: "#fcd34d",
    neonDark: "#fbbf24",
  },
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [listUsers, setListUsers] = useState<User[]>([]);
  const [appData, setAppData] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncingUsers, setIsSyncingUsers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonthState] = useState<string>("ALL");
  const [selectedWorker, setSelectedWorker] = useState<string>("ALL");
  const [currentTab, setCurrentTab] = useState<TabFilterType>("ALL");
  const [advancedFilter, setAdvancedFilter] = useState<AdvancedFilterType>("ALL");
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [impersonatedRole, setImpersonatedRole] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [themeAccent, setThemeAccentState] = useState<ThemeAccent>("blue");

  // Áp dụng biến CSS tùy chỉnh màu chủ đạo cho toàn bộ ứng dụng
  const applyAccentCSS = useCallback((accent: ThemeAccent) => {
    const config = ACCENT_COLOR_MAP[accent] || ACCENT_COLOR_MAP.blue;
    document.documentElement.style.setProperty("--accent-primary", config.color);
    document.documentElement.style.setProperty("--accent-glow", config.glow);
    document.documentElement.style.setProperty("--accent-glow-dark", config.glowDark);
    document.documentElement.style.setProperty("--accent-light", config.light);
    document.documentElement.style.setProperty("--accent-dark-bg", config.darkBg);
    document.documentElement.style.setProperty("--accent-border", config.border);
    document.documentElement.style.setProperty("--accent-neon", config.neonDark);
  }, []);

  // Khởi tạo Auth, Theme và Cấu hình từ localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("qc_auth");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
      const savedMonth = localStorage.getItem("qc_selected_month");
      if (savedMonth) {
        setSelectedMonthState(savedMonth);
      }
      const savedTheme = (localStorage.getItem("qc_theme") as "light" | "dark") || "light";
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      const savedAccent = (localStorage.getItem("qc_accent") as ThemeAccent) || "blue";
      setThemeAccentState(savedAccent);
      applyAccentCSS(savedAccent);
    } catch (e) {
      console.error("Lỗi đọc dữ liệu từ localStorage:", e);
    }
  }, [applyAccentCSS]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const nextTheme = prev === "light" ? "dark" : "light";
      localStorage.setItem("qc_theme", nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return nextTheme;
    });
  }, []);

  const setThemeAccent = useCallback((accent: ThemeAccent) => {
    setThemeAccentState(accent);
    localStorage.setItem("qc_accent", accent);
    applyAccentCSS(accent);
  }, [applyAccentCSS]);

  // Gọi API GET
  const apiGet = async () => {
    try {
      const res = await fetch(PRIMARY_API, { cache: "no-store" });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Proxy GET lỗi, gọi trực tiếp fallback...");
    }
    const resDirect = await fetch(FALLBACK_DIRECT_API);
    return await resDirect.json();
  };

  // Gọi API POST
  const apiPost = async (payload: any) => {
    try {
      const res = await fetch(PRIMARY_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Proxy POST lỗi, gọi trực tiếp fallback...");
    }

    const resDirect = await fetch(FALLBACK_DIRECT_API, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return await resDirect.json();
  };

  // Lấy danh sách nhân sự để đăng nhập
  const fetchUsersForLogin = useCallback(async () => {
    setIsSyncingUsers(true);
    setError(null);
    try {
      const json = await apiGet();
      if (json && Array.isArray(json.users)) {
        setListUsers(json.users);
      }
    } catch (e: any) {
      setError(e.message || "Lỗi tải danh sách nhân sự.");
      throw e;
    } finally {
      setIsSyncingUsers(false);
    }
  }, []);

  // Xử lý đăng nhập
  const login = useCallback(
    (name: string, pass: string) => {
      const user = listUsers.find((u) => cleanStr(u.name) === cleanStr(name));
      if (user && user.pass === pass) {
        setCurrentUser(user);
        localStorage.setItem("qc_auth", JSON.stringify(user));
        return { success: true };
      }
      return { success: false, message: "Mật khẩu không chính xác!" };
    },
    [listUsers]
  );

  // Xử lý đăng xuất
  const logout = useCallback(() => {
    localStorage.removeItem("qc_auth");
    localStorage.removeItem("qc_selected_month");
    setCurrentUser(null);
    setAppData([]);
    setSelectedMonthState("ALL");
    setSelectedWorker("ALL");
    setCurrentTab("ALL");
    setAdvancedFilter("ALL");
    setImpersonatedRole(null);
    setIsCreateModalOpen(false);
  }, []);

  // Tải dữ liệu toàn bộ bảng tính
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const json = await apiGet();

      if (json && Array.isArray(json.data)) {
        const validData: TaskItem[] = json.data.filter(
          (t: TaskItem) => cleanStr(getVal(t, "Ai làm")) !== "" || cleanStr(getVal(t, "Tên đề")) !== ""
        );
        setAppData(validData);

        if (Array.isArray(json.users)) {
          setListUsers(json.users);
        }

        const rawMonths = Array.from(
          new Set(
            validData
              .map((t) =>
                normalizeMonthStr(getVal(t, "ID/ tháng") || getVal(t, "ID/tháng"))
              )
              .filter(Boolean)
          )
        );

        const months = sortMonthsChronological(rawMonths);

        const savedMonth = localStorage.getItem("qc_selected_month");
        if (savedMonth && months.includes(savedMonth)) {
          setSelectedMonthState(savedMonth);
        } else if (months.length > 0) {
          setSelectedMonthState(months[0]);
        }
      }
    } catch (e: any) {
      setError(e.message || "Lỗi tải dữ liệu!");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, loadData]);

  const setSelectedMonth = useCallback((month: string) => {
    setSelectedMonthState(month);
    if (month !== "ALL") {
      localStorage.setItem("qc_selected_month", month);
    }
  }, []);

  // Danh sách các tháng được chuẩn hóa và sắp xếp chuẩn theo thời gian (mới nhất lên đầu)
  const availableMonths = useMemo(() => {
    const rawMonths = Array.from(
      new Set(
        appData
          .map((t) =>
            normalizeMonthStr(getVal(t, "ID/ tháng") || getVal(t, "ID/tháng"))
          )
          .filter(Boolean)
      )
    );
    return sortMonthsChronological(rawMonths);
  }, [appData]);

  // Danh sách nhân sự: Lấy toàn bộ từ tab Users (Cột Họ và tên) + người xuất hiện trên Sheet
  const availableWorkers = useMemo(() => {
    const usersNames = listUsers.map((u) => cleanStr(u.name)).filter(Boolean);
    const dataNames = appData.map((t) => cleanStr(getVal(t, "Ai làm"))).filter(Boolean);
    const allUnique = Array.from(new Set([...usersNames, ...dataNames]));
    return allUnique.sort();
  }, [listUsers, appData]);

  // Danh sách QC: Lọc từ tab Users có role QC hoặc ADMIN
  const availableQCs = useMemo(() => {
    const qcsFromUsers = listUsers
      .filter((u) => cleanStr(u.role).toUpperCase() === "QC" || cleanStr(u.role).toUpperCase() === "ADMIN")
      .map((u) => cleanStr(u.name));
    const qcsFromData = appData.map((t) => cleanStr(getVal(t, "QC"))).filter(Boolean);
    const allUnique = Array.from(new Set([...qcsFromUsers, ...qcsFromData]));
    return allUnique.sort();
  }, [listUsers, appData]);

  const effectiveRole = useMemo(() => {
    if (currentUser?.role === "ADMIN" && impersonatedRole) {
      return impersonatedRole;
    }
    return currentUser?.role;
  }, [currentUser, impersonatedRole]);

  // Tập dữ liệu theo tháng và nhân sự (Chuẩn hóa so sánh sạch sẽ, normalize tháng)
  const baseMonthWorkerTasks = useMemo(() => {
    if (!currentUser) return [];

    return appData.filter((item) => {
      const idThang = normalizeMonthStr(
        getVal(item, "ID/ tháng") || getVal(item, "ID/tháng")
      );
      const mMatch = selectedMonth === "ALL" || idThang === selectedMonth;

      let uMatch = true;
      if (effectiveRole !== "WORKER") {
        if (selectedWorker !== "ALL") {
          const itemDoer = cleanStr(getVal(item, "Ai làm")).toLowerCase();
          const targetWorker = cleanStr(selectedWorker).toLowerCase();
          uMatch = itemDoer === targetWorker || itemDoer.includes(targetWorker);
        }
      }

      return mMatch && uMatch;
    });
  }, [appData, currentUser, effectiveRole, selectedMonth, selectedWorker]);

  // Đếm số lượng theo từng Tab
  const tabCounts = useMemo(() => {
    const counts: TabCounts = {
      ALL: baseMonthWorkerTasks.length,
      PENDING: 0,
      ERROR: 0,
      WRONG: 0,
      PASS: 0,
    };

    baseMonthWorkerTasks.forEach((item) => {
      const code = getStatusObj(item).code;
      if (code === "PASS") counts.PASS += 1;
      else if (code === "ERROR") counts.ERROR += 1;
      else if (code === "WRONG") counts.WRONG += 1;
      else counts.PENDING += 1;
    });

    return counts;
  }, [baseMonthWorkerTasks]);

  // Danh sách đề sau khi lọc theo Tab & Bộ Lọc Nâng Cao (bao gồm ⭐ Đề của tôi, ⚠️ Lỗi >=2, ⏳ Tồn >3 ngày)
  const filteredTasks = useMemo(() => {
    let list = baseMonthWorkerTasks;

    if (currentTab !== "ALL") {
      list = list.filter((item) => getStatusObj(item).code === currentTab);
    }

    if (advancedFilter === "MY_TASKS") {
      const myName = cleanStr(currentUser?.name).toLowerCase();
      return list.filter((item) => {
        const doer = cleanStr(getVal(item, "Ai làm")).toLowerCase();
        const qc = cleanStr(getVal(item, "QC")).toLowerCase();
        if (currentUser?.role === "WORKER") return doer === myName || doer.includes(myName);
        if (currentUser?.role === "QC") return qc === myName || qc.includes(myName);
        return doer === myName || qc === myName || doer.includes(myName) || qc.includes(myName);
      });
    } else if (advancedFilter === "MULTI_ERROR") {
      const priorityTasks = list.filter(isMultiError);
      const otherTasks = list.filter((item) => !isMultiError(item));
      return [...priorityTasks, ...otherTasks];
    } else if (advancedFilter === "PENDING_3_DAYS") {
      const priorityTasks = list.filter(isPending3Days);
      const otherTasks = list.filter((item) => !isPending3Days(item));
      return [...priorityTasks, ...otherTasks];
    }

    return list;
  }, [baseMonthWorkerTasks, currentTab, advancedFilter, currentUser]);

  // Thống kê tổng hợp & Hiệu suất Nhân sự Nội Dung & Hiệu suất Đội ngũ QC (Tối ưu Single-Pass O(N))
  const { stats, workerStats, qcTeamStats } = useMemo(() => {
    if (!currentUser || baseMonthWorkerTasks.length === 0) {
      return {
        stats: {
          total: 0,
          pass: 0,
          error: 0,
          wrong: 0,
          pending: 0,
          totalQuestions: 0,
          totalLoi1: 0,
          totalLoi2: 0,
          totalLoi3: 0,
          multiErrorCount: 0,
          pending3DaysCount: 0,
        },
        workerStats: [],
        qcTeamStats: [],
      };
    }

    let pass = 0;
    let error = 0;
    let wrong = 0;
    let pending = 0;
    let totalQuestions = 0;
    let totalLoi1 = 0;
    let totalLoi2 = 0;
    let totalLoi3 = 0;
    let multiErrorCount = 0;
    let pending3DaysCount = 0;

    const workerMap = new Map<string, WorkerStatItem>();
    const qcMap = new Map<string, QCStatItem>();

    for (let i = 0; i < baseMonthWorkerTasks.length; i++) {
      const item = baseMonthWorkerTasks[i];
      const statusObj = getStatusObj(item);
      const statusCode = statusObj.code;

      if (statusCode === "PASS") pass++;
      else if (statusCode === "ERROR") error++;
      else if (statusCode === "WRONG") wrong++;
      else pending++;

      const qs = parseInt(getVal(item, "Số câu")) || 0;
      totalQuestions += qs;

      const hasLoi1 = !!getVal(item, "Lỗi lần 1");
      const hasLoi2 = !!getVal(item, "Lỗi lần 2");
      const hasLoi3 = !!getVal(item, "Lỗi lần 3");

      if (hasLoi1) totalLoi1++;
      if (hasLoi2) totalLoi2++;
      if (hasLoi3) totalLoi3++;
      if (isMultiError(item)) multiErrorCount++;
      if (isPending3Days(item)) pending3DaysCount++;

      const errorTotal = (hasLoi1 ? 1 : 0) + (hasLoi2 ? 1 : 0) + (hasLoi3 ? 1 : 0);
      const workerName = cleanStr(getVal(item, "Ai làm")) || "Chưa rõ";
      const qcName = cleanStr(getVal(item, "QC")) || "Chưa phân công";

      // Cập nhật thống kê Worker
      let curW = workerMap.get(workerName);
      if (!curW) {
        curW = {
          workerName,
          totalTasks: 0,
          totalQuestions: 0,
          passCount: 0,
          errorCount: 0,
          wrongCount: 0,
          pendingCount: 0,
          loi1Count: 0,
          loi2Count: 0,
          loi3Count: 0,
          totalErrors: 0,
          passRate: 0,
        };
        workerMap.set(workerName, curW);
      }
      curW.totalTasks += 1;
      curW.totalQuestions += qs;
      if (statusCode === "PASS") curW.passCount += 1;
      else if (statusCode === "ERROR") curW.errorCount += 1;
      else if (statusCode === "WRONG") curW.wrongCount += 1;
      else curW.pendingCount += 1;

      if (hasLoi1) curW.loi1Count += 1;
      if (hasLoi2) curW.loi2Count += 1;
      if (hasLoi3) curW.loi3Count += 1;
      curW.totalErrors = curW.loi1Count + curW.loi2Count + curW.loi3Count;
      curW.passRate = curW.totalTasks > 0 ? Math.round((curW.passCount / curW.totalTasks) * 100) : 0;

      // Cập nhật thống kê QC
      let curQC = qcMap.get(qcName);
      if (!curQC) {
        curQC = {
          qcName,
          totalCheckedTasks: 0,
          totalQuestionsChecked: 0,
          totalErrorsFound: 0,
          totalPassed: 0,
          passRate: 0,
        };
        qcMap.set(qcName, curQC);
      }
      curQC.totalCheckedTasks += 1;
      curQC.totalQuestionsChecked += qs;
      curQC.totalErrorsFound += errorTotal;
      if (statusCode === "PASS") curQC.totalPassed += 1;
      curQC.passRate = curQC.totalCheckedTasks > 0 ? Math.round((curQC.totalPassed / curQC.totalCheckedTasks) * 100) : 0;
    }

    const workerStatsList = Array.from(workerMap.values()).sort(
      (a, b) => b.totalQuestions - a.totalQuestions
    );

    const qcTeamStatsList = Array.from(qcMap.values()).sort(
      (a, b) => b.totalQuestionsChecked - a.totalQuestionsChecked
    );

    return {
      stats: {
        total: baseMonthWorkerTasks.length,
        pass,
        error,
        wrong,
        pending,
        totalQuestions,
        totalLoi1,
        totalLoi2,
        totalLoi3,
        multiErrorCount,
        pending3DaysCount,
      },
      workerStats: workerStatsList,
      qcTeamStats: qcTeamStatsList,
    };
  }, [baseMonthWorkerTasks, currentUser]);

  // Thống kê cá nhân dành riêng cho QC
  const qcPersonalStats = useMemo(() => {
    if (!currentUser) {
      return {
        totalTasks: 0,
        totalQuestions: 0,
        totalErrorsFound: 0,
        totalPassed: 0,
        tasksList: [],
      };
    }

    const currentQCName = cleanStr(currentUser.name).toLowerCase();
    const isQC = currentUser.role === "QC";

    const qcTasks = appData.filter((item) => {
      const idThang = normalizeMonthStr(
        getVal(item, "ID/ tháng") || getVal(item, "ID/tháng")
      );
      const mMatch = selectedMonth === "ALL" || idThang === selectedMonth;
      const qcMatch = isQC ? cleanStr(getVal(item, "QC")).toLowerCase() === currentQCName : true;
      return mMatch && qcMatch;
    });

    let totalQuestions = 0;
    let totalErrorsFound = 0;
    let totalPassed = 0;

    qcTasks.forEach((item) => {
      const qs = parseInt(getVal(item, "Số câu")) || 0;
      totalQuestions += qs;

      if (getVal(item, "Lỗi lần 1")) totalErrorsFound++;
      if (getVal(item, "Lỗi lần 2")) totalErrorsFound++;
      if (getVal(item, "Lỗi lần 3")) totalErrorsFound++;

      if (getStatusObj(item).code === "PASS") totalPassed++;
    });

    return {
      totalTasks: qcTasks.length,
      totalQuestions,
      totalErrorsFound,
      totalPassed,
      tasksList: qcTasks,
    };
  }, [appData, currentUser, selectedMonth]);

  // Tạo đề bài mới (QC & Admin)
  const createNewTask = useCallback(
    async (payload: CreateTaskPayload) => {
      try {
        const result = await apiPost(payload);
        if (result && result.status === "success") {
          await loadData();
          return { success: true };
        }
        return { success: false, message: result?.message || "Lỗi tạo đề bài từ Google Apps Script!" };
      } catch (e: any) {
        return { success: false, message: e.message || "Lỗi kết nối máy chủ!" };
      }
    },
    [loadData]
  );

  // Lưu chi tiết đề bài
  const saveTaskDetails = useCallback(
    async (payload: SaveTaskPayload) => {
      try {
        const result = await apiPost(payload);
        if (result && result.status === "success") {
          await loadData();
          return { success: true };
        }
        return { success: false, message: result?.message || "Lỗi ghi dữ liệu từ Google Apps Script!" };
      } catch (e: any) {
        return { success: false, message: e.message || "Lỗi kết nối máy chủ!" };
      }
    },
    [loadData]
  );

  // Cập nhật trạng thái duyệt
  const updateTaskStatus = useCallback(
    async (payload: UpdateStatusPayload) => {
      try {
        const result = await apiPost(payload);
        if (result && result.status === "success") {
          await loadData();
          return { success: true };
        }
        return { success: false, message: result?.message || "Lỗi cập nhật trạng thái từ Google!" };
      } catch (e: any) {
        return { success: false, message: e.message || "Lỗi kết nối máy chủ!" };
      }
    },
    [loadData]
  );

  // Gửi email thông báo trực tiếp cho bạn Nội dung
  const sendNotificationEmail = useCallback(
    async (task: TaskItem, customMessage?: string) => {
      const doerName = cleanStr(getVal(task, "Ai làm")).toLowerCase();
      const userObj = listUsers.find((u) => cleanStr(u.name).toLowerCase() === doerName);
      if (!userObj || !userObj.email) {
        return {
          success: false,
          message: `Không tìm thấy địa chỉ email của bạn "${getVal(task, "Ai làm")}" trong danh sách!`,
        };
      }

      const payload = {
        row_index: task.row_index,
        task_title: getVal(task, "Tên đề"),
        worker_name: userObj.name,
        worker_email: userObj.email,
        send_email: true,
        loi_1: getVal(task, "Lỗi lần 1"),
        loi_2: getVal(task, "Lỗi lần 2"),
        loi_3: getVal(task, "Lỗi lần 3"),
        note: customMessage || getVal(task, "Note"),
      };

      try {
        const result = await apiPost(payload);
        if (result && result.status === "success") {
          if (result.email_status && String(result.email_status).startsWith("failed")) {
            return {
              success: false,
              message: `Lỗi gửi mail Apps Script: ${result.email_status}`,
            };
          }
          return { success: true, message: "Đã gửi email thành công!" };
        }
        return { success: false, message: result?.message || "Lỗi gửi email!" };
      } catch (e: any) {
        return { success: false, message: e.message || "Lỗi kết nối máy chủ!" };
      }
    },
    [listUsers]
  );

  return (
    <AppContext.Provider
      value={{
        currentUser,
        listUsers,
        appData,
        isLoading,
        isSyncingUsers,
        error,
        selectedMonth,
        selectedWorker,
        currentTab,
        advancedFilter,
        theme,
        themeAccent,
        availableMonths,
        availableWorkers,
        availableQCs,
        filteredTasks,
        tabCounts,
        stats,
        workerStats,
        qcTeamStats,
        qcPersonalStats,
        editingTask,
        isCreateModalOpen,
        impersonatedRole,
        setImpersonatedRole,
        setEditingTask,
        setIsCreateModalOpen,
        fetchUsersForLogin,
        login,
        logout,
        loadData,
        setSelectedMonth,
        setSelectedWorker,
        setCurrentTab,
        setAdvancedFilter,
        toggleTheme,
        setThemeAccent,
        createNewTask,
        saveTaskDetails,
        updateTaskStatus,
        sendNotificationEmail,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp phải được sử dụng bên trong AppProvider");
  }
  return context;
};
