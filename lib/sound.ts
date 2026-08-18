// Tiện ích âm thanh Web Audio API & Thông báo hệ thống (OS Push Notification)
// 0 KB file tải về, không tốn băng thông, âm thanh trong trẻo, tự động tuân theo âm lượng máy

class SoundService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Phát âm thanh thông báo "Ting" kiểu Zalo / Apple / Slack
  playNotificationSound(type: "alert" | "success" = "alert") {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (type === "alert") {
        // Âm thanh chuông 2 nốt báo lỗi/thông báo mới (F5 -> A5)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = "sine";
        osc2.type = "triangle";

        osc1.frequency.setValueAtTime(698.46, now); // F5
        osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.08); // A5

        osc2.frequency.setValueAtTime(880.0, now);
        osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // C6

        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.06);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
      } else {
        // Âm thanh thành công nhẹ nhàng (E5 -> G5)
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.1); // G5

        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      // Bỏ qua nếu trình duyệt chặn âm thanh tự động
    }
  }

  // Yêu cầu quyền thông báo hệ thống (OS Notification)
  async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission !== "denied") {
      const perm = await Notification.requestPermission();
      return perm === "granted";
    }
    return false;
  }

  // Bắn thông báo lên thanh trạng thái điện thoại / máy tính khi người dùng ẩn màn hình
  sendOSNotification(title: string, body: string, onClick?: () => void) {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
      const notif = new Notification(title, {
        body,
        icon: "/Logo Marvel Team.png",
        badge: "/Logo Marvel Team.png",
        silent: false, // Để hệ điều hành tự phát tiếng hoặc rung theo cấu hình máy
      });

      if (onClick) {
        notif.onclick = () => {
          window.focus();
          onClick();
          notif.close();
        };
      }
    } catch (e) {
      console.warn("Lỗi gửi thông báo OS:", e);
    }
  }
}

export const soundService = new SoundService();
