"use client";

/**
 * ============================================================================
 * FILE: context/AppContext.tsx
 * MỤC ĐÍCH: Kho dữ liệu trạng thái toàn cục (Global Context Provider) của toàn App
 * ============================================================================
 */

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
  MonthlyAssignmentItem,
  MonthlyAssignmentsMap,
  QCQuestionStatItem,
  TabCounts,
  DashboardStats,
  QcPersonalStats,
  TeamQuestionTotals,
} from "@/types";
import {
  cleanStr,
  getVal,
  getStatusObj,
  isMultiError,
  isPending3Days,
  sortMonthsChronological,
  normalizeMonthStr,
  isTaskInQcSalaryMonth,
} from "@/lib/helpers";
import { fetchAppData, postAppData } from "@/lib/api";
import {
  calculateTabCounts,
  calculateDashboardAndTeamStats,
  calculateQcPersonalStats,
} from "@/lib/stats";

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
  stats: DashboardStats;
  workerStats: WorkerStatItem[];
  qcTeamStats: QCStatItem[];
  qcPersonalStats: QcPersonalStats;
  editingTask: TaskItem | null;
  isCreateModalOpen: boolean;
  impersonatedRole: "ADMIN" | "QC" | "WORKER" | null;
  monthlyAssignments: MonthlyAssignmentsMap | null;
  availableAssignmentMonths: string[];
  selectedAssignmentMonth: string;
  setSelectedAssignmentMonth: (month: string) => void;
  qcQuestionStats: QCQuestionStatItem[];
  teamQuestionTotals: TeamQuestionTotals;
  adminActiveTab: "TASKS" | "ASSIGNMENT_REPORT";
  appConfig: Record<string, any> | null;
  saveConfigToServer: (key: string, value: any) => Promise<boolean>;
  setAdminActiveTab: (tab: "TASKS" | "ASSIGNMENT_REPORT") => void;
  setImpersonatedRole: (role: "ADMIN" | "QC" | "WORKER" | null) => void;
  setEditingTask: (task: TaskItem | null) => void;
  setIsCreateModalOpen: (isOpen: boolean) => void;
  fetchUsersForLogin: () => Promise<User[]>;
  login: (name: string, pass: string) => Promise<{ success: boolean; message?: string }>;
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
  updateTaskQcDone: (rowIndex: number, isDone: boolean) => Promise<{ success: boolean; message?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [listUsers, setListUsers] = useState<User[]>([]);
  const [appData, setAppData] = useState<TaskItem[]>([]);
  const [monthlyAssignments, setMonthlyAssignments] = useState<MonthlyAssignmentsMap | null>(null);
  const [selectedAssignmentMonthState, setSelectedAssignmentMonthState] = useState<string>("");
  const [adminActiveTab, setAdminActiveTab] = useState<"TASKS" | "ASSIGNMENT_REPORT">("TASKS");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncingUsers, setIsSyncingUsers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedMonthState, setSelectedMonthState] = useState<string>("ALL");
  const [selectedWorker, setSelectedWorker] = useState<string>("ALL");
  const [currentTab, setCurrentTab] = useState<TabFilterType>("ALL");
  const [advancedFilter, setAdvancedFilter] = useState<AdvancedFilterType>("ALL");

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [themeAccent, setThemeAccentState] = useState<ThemeAccent>("blue");

  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [impersonatedRole, setImpersonatedRole] = useState<"ADMIN" | "QC" | "WORKER" | null>(null);

  const [appConfig, setAppConfig] = useState<Record<string, any> | null>(null);

  const applyAccentCSS = useCallback((accent: ThemeAccent) => {
    const accents: ThemeAccent[] = ["blue", "indigo", "purple", "emerald", "rose", "amber"];
    accents.forEach((a) => document.documentElement.classList.remove(`accent-${a}`));
    document.documentElement.classList.add(`accent-${accent}`);
  }, []);

  // Khởi tạo đọc bộ nhớ đệm (Cache) khi khởi động
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem("qc_auth");
      if (savedAuth) {
        const user = JSON.parse(savedAuth);
        if (user && user.name) setCurrentUser(user);
      }
      const cachedUsers = localStorage.getItem("qc_users_cache");
      if (cachedUsers) {
        try {
          const parsed = JSON.parse(cachedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) setListUsers(parsed);
        } catch (e) {}
      }
      const cachedData = localStorage.getItem("qc_app_data_cache");
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (Array.isArray(parsed) && parsed.length > 0) setAppData(parsed);
        } catch (e) {}
      }
      const cachedMonthly = localStorage.getItem("qc_monthly_assignments_cache");
      if (cachedMonthly) {
        try {
          const parsed = JSON.parse(cachedMonthly);
          if (parsed && typeof parsed === "object") {
            setMonthlyAssignments(parsed);
            const mKeys = Object.keys(parsed);
            if (mKeys.length > 0) setSelectedAssignmentMonthState(mKeys[0]);
          }
        } catch (e) {}
      }
      const cachedConfig = localStorage.getItem("qc_app_config_cache");
      if (cachedConfig) {
        try {
          const parsed = JSON.parse(cachedConfig);
          if (parsed && typeof parsed === "object") setAppConfig(parsed);
        } catch (e) {}
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

  // Tải danh sách Users để đăng nhập
  const fetchUsersForLogin = useCallback(async (): Promise<User[]> => {
    setIsSyncingUsers(true);
    try {
      const json = await fetchAppData();
      if (json && Array.isArray(json.users) && json.users.length > 0) {
        setListUsers(json.users);
        try {
          localStorage.setItem("qc_users_cache", JSON.stringify(json.users));
        } catch (e) {}
        return json.users;
      }
      return listUsers;
    } catch (e) {
      return listUsers;
    } finally {
      setIsSyncingUsers(false);
    }
  }, [listUsers]);

  // Xử lý đăng nhập
  const login = useCallback(
    async (name: string, pass: string): Promise<{ success: boolean; message?: string }> => {
      let currentUsersList = listUsers;
      if (!currentUsersList || currentUsersList.length === 0) {
        currentUsersList = await fetchUsersForLogin();
      }

      const cleanInputName = cleanStr(name).toLowerCase();
      const user = currentUsersList.find(
        (u) => cleanStr(u.name).toLowerCase() === cleanInputName
      );

      if (!user) {
        return { success: false, message: "Tên đăng nhập không tồn tại trong hệ thống!" };
      }

      const inputPassClean = String(pass || "").trim();
      const userPassClean = String(user.password || "").trim();

      if (userPassClean === inputPassClean || !userPassClean) {
        setCurrentUser(user);
        try {
          localStorage.setItem("qc_auth", JSON.stringify(user));
          const userSavedMonth = localStorage.getItem(`qc_selected_month_${user.name}`);
          if (userSavedMonth) {
            setSelectedMonthState(userSavedMonth);
          }
        } catch (e) {}
        return { success: true };
      }
      return { success: false, message: "Mật khẩu không chính xác!" };
    },
    [listUsers, fetchUsersForLogin]
  );

  // Xử lý đăng xuất
  const logout = useCallback(() => {
    localStorage.removeItem("qc_auth");
    setCurrentUser(null);
    setAppData([]);
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
      const json = await fetchAppData();

      if (json && Array.isArray(json.data)) {
        const validData: TaskItem[] = json.data.filter(
          (t: TaskItem) => cleanStr(getVal(t, "Ai làm")) !== "" || cleanStr(getVal(t, "Tên đề")) !== ""
        );
        setAppData(validData);
        try {
          localStorage.setItem("qc_app_data_cache", JSON.stringify(validData));
        } catch (e) {}

        if (Array.isArray(json.users) && json.users.length > 0) {
          setListUsers(json.users);
          try {
            localStorage.setItem("qc_users_cache", JSON.stringify(json.users));
          } catch (e) {}
        }

        if (json.monthly_assignments && typeof json.monthly_assignments === "object") {
          setMonthlyAssignments(json.monthly_assignments);
          try {
            localStorage.setItem("qc_monthly_assignments_cache", JSON.stringify(json.monthly_assignments));
          } catch (e) {}

          const mList = Object.keys(json.monthly_assignments);
          if (mList.length > 0) {
            setSelectedAssignmentMonthState((prev) => {
              if (prev && mList.includes(prev)) return prev;
              return mList[0];
            });
          }
        }

        if (json.config && typeof json.config === "object") {
          setAppConfig(json.config);
          try {
            localStorage.setItem("qc_app_config_cache", JSON.stringify(json.config));
            if (json.config.nd_salary_rates) {
              localStorage.setItem("nd_salary_rates", JSON.stringify(json.config.nd_salary_rates));
            }
            if (json.config.qc_salary_rate_question !== undefined) {
              localStorage.setItem("qc_salary_rate_question", String(json.config.qc_salary_rate_question));
            }
            if (json.config.qc_salary_rate_error !== undefined) {
              localStorage.setItem("qc_salary_rate_error", String(json.config.qc_salary_rate_error));
            }
          } catch (e) {}
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

        const userSpecificMonth = currentUser?.name ? localStorage.getItem(`qc_selected_month_${currentUser.name}`) : null;
        const savedMonth = userSpecificMonth || localStorage.getItem("qc_selected_month");
        if (savedMonth) {
          if (savedMonth === "ALL" || months.includes(savedMonth)) {
            setSelectedMonthState(savedMonth);
          }
        } else if (months.length > 0) {
          setSelectedMonthState(months[0]);
        }
      }
    } catch (e: any) {
      setError(e.message || "Lỗi tải dữ liệu!");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Lưu cấu hình đơn giá lương lên server
  const saveConfigToServer = useCallback(async (key: string, value: any) => {
    try {
      const payload = {
        action: "SAVE_CONFIG",
        key,
        value,
      };
      await postAppData(payload);
      setAppConfig((prev) => ({ ...prev, [key]: value }));
      return true;
    } catch (e) {
      console.error("Lỗi lưu cấu hình lên server:", e);
      return false;
    }
  }, []);

  // Đồng bộ dữ liệu ngầm không giật màn hình
  const syncDataSilently = useCallback(async () => {
    try {
      const json = await fetchAppData();
      if (json && Array.isArray(json.data)) {
        const validData: TaskItem[] = json.data.filter(
          (t: TaskItem) => cleanStr(getVal(t, "Ai làm")) !== "" || cleanStr(getVal(t, "Tên đề")) !== ""
        );
        if (validData.length > 0) {
          setAppData(validData);
          try {
            localStorage.setItem("qc_app_data_cache", JSON.stringify(validData));
          } catch (e) {}
        }
        if (Array.isArray(json.users) && json.users.length > 0) {
          setListUsers(json.users);
          try {
            localStorage.setItem("qc_users_cache", JSON.stringify(json.users));
          } catch (e) {}
        }
        if (json.monthly_assignments && typeof json.monthly_assignments === "object") {
          setMonthlyAssignments(json.monthly_assignments);
          try {
            localStorage.setItem("qc_monthly_assignments_cache", JSON.stringify(json.monthly_assignments));
          } catch (e) {}
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
      const pollInterval = setInterval(() => {
        syncDataSilently();
      }, 10000);
      return () => clearInterval(pollInterval);
    }
  }, [currentUser, loadData, syncDataSilently]);

  const setSelectedMonth = useCallback((month: string) => {
    setSelectedMonthState(month);
    try {
      localStorage.setItem("qc_selected_month", month);
      if (currentUser?.name) {
        localStorage.setItem(`qc_selected_month_${currentUser.name}`, month);
      }
    } catch (e) {}
  }, [currentUser]);

  // Danh sách các tháng hợp nhất từ cả Sheet 1 và Sheet 2
  const availableMonths = useMemo(() => {
    const fromSheet1 = appData.map((t) =>
      normalizeMonthStr(getVal(t, "ID/ tháng") || getVal(t, "ID/tháng"))
    );
    const fromSheet2 = Object.keys(monthlyAssignments || {}).map((tab) =>
      normalizeMonthStr(tab)
    );
    const allUnique = Array.from(new Set([...fromSheet1, ...fromSheet2])).filter(Boolean);
    return sortMonthsChronological(allUnique);
  }, [appData, monthlyAssignments]);

  const availableWorkers = useMemo(() => {
    const usersNames = listUsers.map((u) => cleanStr(u.name)).filter(Boolean);
    const dataNames = appData.map((t) => cleanStr(getVal(t, "Ai làm"))).filter(Boolean);
    const allUnique = Array.from(new Set([...usersNames, ...dataNames]));
    return allUnique.sort();
  }, [listUsers, appData]);

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

  // Tập dữ liệu theo tháng và nhân sự
  const baseMonthWorkerTasks = useMemo(() => {
    if (!currentUser) return [];

    return appData.filter((item) => {
      const idThang = normalizeMonthStr(
        getVal(item, "ID/ tháng") || getVal(item, "ID/tháng")
      );
      
      // Hỗ trợ cơ chế đề tồn: Lọc task theo đúng tháng lương (nếu là đề tồn T8 thì hiển thị ở T9)
      const mMatch = selectedMonthState === "ALL" || isTaskInQcSalaryMonth(
        idThang, 
        getVal(item, "Note"), 
        getVal(item, "Leader check") || getVal(item, "Leader check "), 
        selectedMonthState
      );

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
  }, [appData, currentUser, effectiveRole, selectedMonthState, selectedWorker]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return calculateTabCounts(baseMonthWorkerTasks);
  }, [baseMonthWorkerTasks]);

  // Filtered tasks
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

  // Thống kê tổng hợp & đội ngũ
  const { stats, workerStats, qcTeamStats } = useMemo(() => {
    if (!currentUser) {
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
    return calculateDashboardAndTeamStats(baseMonthWorkerTasks);
  }, [baseMonthWorkerTasks, currentUser]);

  // Thống kê cá nhân QC
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
    return calculateQcPersonalStats(appData, currentUser.name, selectedMonthState);
  }, [appData, currentUser, selectedMonthState]);

  // Thao tác tạo đề mới
  const createNewTask = useCallback(
    async (payload: CreateTaskPayload) => {
      try {
        const result = await postAppData(payload);
        if (result && result.status === "success") {
          await loadData();
          return { success: true };
        }
        return { success: false, message: result?.message || "Lỗi tạo đề bài!" };
      } catch (e: any) {
        return { success: false, message: e.message || "Lỗi kết nối máy chủ!" };
      }
    },
    [loadData]
  );

  // Thao tác lưu chi tiết đề bài
  const saveTaskDetails = useCallback(
    async (payload: SaveTaskPayload) => {
      try {
        const result = await postAppData(payload);
        if (result && result.status === "success") {
          await loadData();
          return { success: true };
        }
        return { success: false, message: result?.message || "Lỗi cập nhật đề bài!" };
      } catch (e: any) {
        return { success: false, message: e.message || "Lỗi kết nối máy chủ!" };
      }
    },
    [loadData]
  );

  // Cập nhật trạng thái đề bài
  const updateTaskStatus = useCallback(
    async (payload: UpdateStatusPayload) => {
      try {
        const result = await postAppData(payload);
        if (result && result.status === "success") {
          await loadData();
          return { success: true };
        }
        return { success: false, message: result?.message || "Lỗi cập nhật trạng thái!" };
      } catch (e: any) {
        return { success: false, message: e.message || "Lỗi kết nối máy chủ!" };
      }
    },
    [loadData]
  );

  // Cập nhật QC done
  const updateTaskQcDone = useCallback(
    async (rowIndex: number, isDone: boolean) => {
      try {
        const payload = {
          action: "UPDATE_QC_DONE",
          rowIndex,
          qc_done: isDone,
        };
        const result = await postAppData(payload);
        if (result && result.status === "success") {
          await loadData();
          return { success: true };
        }
        return { success: false, message: result?.message || "Lỗi cập nhật trạng thái QC Done!" };
      } catch (e: any) {
        return { success: false, message: e.message || "Lỗi kết nối máy chủ!" };
      }
    },
    [loadData]
  );

  const availableAssignmentMonths = useMemo(() => {
    if (!monthlyAssignments) return [];
    return Object.keys(monthlyAssignments);
  }, [monthlyAssignments]);

  const selectedAssignmentMonth = useMemo(() => {
    if (selectedAssignmentMonthState && availableAssignmentMonths.includes(selectedAssignmentMonthState)) {
      return selectedAssignmentMonthState;
    }
    return availableAssignmentMonths[0] || "";
  }, [selectedAssignmentMonthState, availableAssignmentMonths]);

  const setSelectedAssignmentMonth = useCallback((month: string) => {
    setSelectedAssignmentMonthState(month);
  }, []);

  // QC Question Stats & Team Question Totals
  const { qcQuestionStats, teamQuestionTotals } = useMemo(() => {
    if (!monthlyAssignments || !selectedAssignmentMonth) {
      return {
        qcQuestionStats: [],
        teamQuestionTotals: {
          totalTasks: 0,
          totalAssignedQuestions: 0,
          totalCheckedQuestions: 0,
          completionRate: 0,
        },
      };
    }

    const currentTasks: MonthlyAssignmentItem[] =
      monthlyAssignments[selectedAssignmentMonth] || [];

    const qcMap = new Map<string, QCQuestionStatItem>();

    let totalTasks = 0;
    let totalAssignedQuestions = 0;
    let totalCheckedQuestions = 0;

    currentTasks.forEach((t) => {
      const qcNameRaw = t.qc_name || "Chưa phân công";
      const qcName = cleanStr(qcNameRaw) || "Chưa phân công";
      const soCau = typeof t.so_cau === "number" ? t.so_cau : parseInt(String(t.so_cau), 10) || 0;
      const isDone = t.qc_done === true;

      totalTasks += 1;
      totalAssignedQuestions += soCau;
      if (isDone) totalCheckedQuestions += soCau;

      let item = qcMap.get(qcName.toLowerCase());
      if (!item) {
        item = {
          qcName: qcNameRaw,
          totalAssignedTasks: 0,
          totalAssignedQuestions: 0,
          totalCheckedQuestions: 0,
          completionRate: 0,
          tasksList: [],
        };
        qcMap.set(qcName.toLowerCase(), item);
      }

      item.totalAssignedTasks += 1;
      item.totalAssignedQuestions += soCau;
      item.tasksList.push(t);

      if (isDone) {
        item.totalCheckedQuestions += soCau;
      }

      item.completionRate =
        item.totalAssignedQuestions > 0
          ? Math.round((item.totalCheckedQuestions / item.totalAssignedQuestions) * 100)
          : 0;
    });

    const statsList = Array.from(qcMap.values()).sort(
      (a, b) => b.totalAssignedQuestions - a.totalAssignedQuestions
    );

    const completionRate =
      totalAssignedQuestions > 0
        ? Math.round((totalCheckedQuestions / totalAssignedQuestions) * 100)
        : 0;

    return {
      qcQuestionStats: statsList,
      teamQuestionTotals: {
        totalTasks,
        totalAssignedQuestions,
        totalCheckedQuestions,
        completionRate,
      },
    };
  }, [monthlyAssignments, selectedAssignmentMonth]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        listUsers,
        appData,
        isLoading,
        isSyncingUsers,
        error,
        selectedMonth: selectedMonthState,
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
        monthlyAssignments,
        availableAssignmentMonths,
        selectedAssignmentMonth,
        setSelectedAssignmentMonth,
        qcQuestionStats,
        teamQuestionTotals,
        adminActiveTab,
        appConfig,
        saveConfigToServer,
        setAdminActiveTab,
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
        updateTaskQcDone,
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
