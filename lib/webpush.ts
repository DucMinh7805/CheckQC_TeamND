import webpush from "web-push";

// Cấu hình VAPID keys
// Chúng ta lưu Public Key vào NEXT_PUBLIC_VAPID_PUBLIC_KEY để Frontend có thể lấy
// Và Private Key ở VAPID_PRIVATE_KEY
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const privateKey = process.env.VAPID_PRIVATE_KEY || "";

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    "mailto:admin@marvelteam.com",
    publicKey,
    privateKey
  );
}

export const sendWebPush = async (subscription: any, payload: any) => {
  if (!publicKey || !privateKey) {
    console.warn("VAPID keys chưa được cấu hình.");
    return;
  }
  
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error("Lỗi gửi Web Push:", error);
  }
};
