// Tiện ích âm thanh thông báo & Thông báo hệ thống (OS Push Notification)
// Hỗ trợ âm thanh tổng hợp Web Audio API siêu rõ (âm lượng lớn) + Hỗ trợ file MP3 tùy chỉnh nếu có

class SoundService {
  private audioCtx: AudioContext | null = null;
  private customAudio: HTMLAudioElement | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      // Tự động mở khóa AudioContext ngay khi người dùng chạm hoặc click màn hình lần đầu
      const unlock = () => {
        this.unlockAudio();
        window.removeEventListener("click", unlock);
        window.removeEventListener("touchstart", unlock);
        window.removeEventListener("keydown", unlock);
      };
      window.addEventListener("click", unlock, { passive: true });
      window.addEventListener("touchstart", unlock, { passive: true });
      window.addEventListener("keydown", unlock, { passive: true });

      // Khởi tạo trước file âm thanh tùy chỉnh nếu có đặt trong /public/notification.mp3
      try {
        this.customAudio = new Audio("/notification.mp3");
        this.customAudio.preload = "auto";
      } catch (e) {}
    }
  }

  // Mở khóa âm thanh cho trình duyệt Mobile (Safari iOS / Android Chrome)
  unlockAudio() {
    if (typeof window === "undefined") return;
    try {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {});
      } else {
        this.isUnlocked = true;
      }
    } catch (e) {}
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    return this.audioCtx;
  }

  // Phát âm thanh thông báo âm lượng lớn, rõ ràng và đặc trưng (kiểu Shopee / Zalo / Slack)
  playNotificationSound(type: "alert" | "success" = "alert") {
    if (typeof window === "undefined") return;

    // Rung nhẹ điện thoại nếu thiết bị hỗ trợ (Android / Haptic Devices)
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        if (type === "alert") {
          navigator.vibrate([180, 80, 180]);
        } else {
          navigator.vibrate([100]);
        }
      }
    } catch (e) {}

    // 1. Thử phát file MP3 tùy chỉnh nếu có sẵn
    if (this.customAudio) {
      try {
        this.customAudio.currentTime = 0;
        this.customAudio.volume = 1.0;
        const playPromise = this.customAudio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            return; // Đã phát thành công file MP3
          }).catch(() => {
            // Nếu file MP3 không tồn tại hoặc lỗi, tự động chuyển sang Web Audio tổng hợp
            this.playSynthesizedSound(type);
          });
          return;
        }
      } catch (e) {}
    }

    // 2. Mặc định: Phát âm thanh Web Audio tổng hợp âm lượng lớn (0.85 Gain)
    this.playSynthesizedSound(type);
  }

  // Âm thanh Web Audio tổng hợp âm sắc cao cấp, trong trẻo và âm lượng lớn
  private playSynthesizedSound(type: "alert" | "success") {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      if (type === "alert") {
        // Chuông báo 3 nốt cao cấp phong cách Zalo / Shopee (A5 -> C#6 -> E6)
        // Âm lượng lớn (Gain 0.85) với hòa âm Sine + Triangle
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.85, now);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        masterGain.connect(ctx.destination);

        const notes = [
          { freq: 880.0, time: 0.0, dur: 0.2 },    // A5
          { freq: 1108.73, time: 0.1, dur: 0.22 }, // C#6
          { freq: 1318.51, time: 0.22, dur: 0.4 }, // E6
        ];

        notes.forEach((n) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const noteGain = ctx.createGain();

          osc1.type = "sine";
          osc2.type = "triangle";

          osc1.frequency.setValueAtTime(n.freq, now + n.time);
          osc2.frequency.setValueAtTime(n.freq * 2, now + n.time); // Họa âm bậc 2

          noteGain.gain.setValueAtTime(0.7, now + n.time);
          noteGain.gain.exponentialRampToValueAtTime(0.01, now + n.time + n.dur);

          osc1.connect(noteGain);
          osc2.connect(noteGain);
          noteGain.connect(masterGain);

          osc1.start(now + n.time);
          osc2.start(now + n.time);
          osc1.stop(now + n.time + n.dur);
          osc2.stop(now + n.time + n.dur);
        });
      } else {
        // Chuông thành công êm ái (E5 -> G5 -> C6)
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.75, now);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        masterGain.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.setValueAtTime(783.99, now + 0.08);
        osc.frequency.setValueAtTime(1046.5, now + 0.16);

        osc.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch (e) {
      console.warn("Lỗi phát âm thanh Web Audio:", e);
    }
  }

  // Yêu cầu quyền thông báo hệ thống (OS Notification)
  async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    this.unlockAudio();
    if (Notification.permission === "granted") return true;
    if (Notification.permission !== "denied") {
      try {
        const perm = await Notification.requestPermission();
        return perm === "granted";
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  // Bắn thông báo lên thanh trạng thái điện thoại / màn hình khóa (OS Lock Screen)
  sendOSNotification(title: string, body: string, onClick?: () => void) {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
      const options: NotificationOptions = {
        body,
        icon: "/Logo Marvel Team.png",
        badge: "/Logo Marvel Team.png",
        silent: false,
        requireInteraction: true, // Giữ thông báo trên màn hình khóa
        tag: `qc_task_notif_${Date.now()}`,
      };

      // Ưu tiên ServiceWorker showNotification cho thiết bị di động (Android / iOS PWA)
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.showNotification(title, options);
          })
          .catch(() => {
            const notif = new Notification(title, options);
            if (onClick) {
              notif.onclick = () => {
                window.focus();
                onClick();
                notif.close();
              };
            }
          });
      } else {
        const notif = new Notification(title, options);
        if (onClick) {
          notif.onclick = () => {
            window.focus();
            onClick();
            notif.close();
          };
        }
      }
    } catch (e) {
      console.warn("Lỗi gửi thông báo OS:", e);
    }
  }
}

export const soundService = new SoundService();
