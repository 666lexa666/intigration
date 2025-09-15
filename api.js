import fetch from "node-fetch";

const MERCHANT_ORDER_ID = "game-refill-pro"; // фиксированный id для теста
const MERCHANT_TSP_ID = 1408;
const MERCHANT_CALLBACK = "https://webhook-ooo.vercel.app/api/webhook";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { fullName, phone, telegram, platform, steamId, pubgUid, amount } = req.body;

    const commission = platform === "steam" ? 0.10 : 0.08;
    const total = Math.ceil(amount * (1 + commission));
    const totalInCents = total * 100; // в копейках

    // Отправка уведомления в Telegram
    const message = `
🆕 Новая заявка на пополнение
👤 ФИО: ${fullName}
📱 Телефон: ${phone}
📞 Telegram: @${telegram}
🎮 Платформа: ${platform === "steam" ? "Steam" : "PUBG Mobile"}
${platform === "steam" ? `🆔 Steam ID: ${steamId}` : `🆔 PUBG UID: ${pubgUid}`}
💰 Сумма пополнения: ${amount} руб.
💳 К оплате: ${total} руб.
    `;
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
    });

    // Авторизация в Pay2Day
    const authRes = await fetch("https://identity.authpoint.pro/api/v1/public/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: "khrulenko.y@gmail.com", password: "8Pb4JqFq" }),
    });
    const authData = await authRes.json();
    if (!authData.accessToken) throw new Error("Ошибка авторизации");

    // Создание заказа (обязательно paymentAmount для RUB!)
    const orderRes = await fetch("https://pay.kanyon.pro/api/v1/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authData.accessToken}`,
      },
      body: JSON.stringify({
        merchantOrderId: MERCHANT_ORDER_ID,
        paymentAmount: totalInCents,
        orderCurrency: "RUB",
        tspId: MERCHANT_TSP_ID,
        description: `Пополнение ${platform}`,
        callbackUrl: MERCHANT_CALLBACK,
      }),
    });
    const orderData = await orderRes.json();
    if (!orderData.order || !orderData.order.id) {
      throw new Error("Ошибка создания заказа: " + JSON.stringify(orderData));
    }

    // Регистрация QR
    const qrRes = await fetch(`https://pay.kanyon.pro/api/v1/order/qrcData/${orderData.order.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authData.accessToken}`,
      },
    });
    const qrData = await qrRes.json();
    if (!qrData.order || !qrData.order.payload) {
      throw new Error("Ошибка получения QR: " + JSON.stringify(qrData));
    }

    // Отправляем QR на фронт
    return res.status(200).json({ qrPayload: qrData.order.payload });
  } catch (error) {
    console.error("Ошибка:", error);
    return res.status(500).json({ error: error.message });
  }
}


{/* Payment Modal */}
{showPaymentModal && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-gray-800 rounded-2xl max-w-md w-full">
      <div className="p-6 text-center">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Оплата</h3>
          <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Центрируем QR и задаем фиксированные размеры контейнера */}
        <div className="flex justify-center bg-white p-4 rounded-lg mb-4 w-max mx-auto">
          {qrPayload ? (
            <QRCode value={qrPayload || ""} size={192} />
          ) : (
            <p className="text-gray-400">Загрузка QR...</p>
          )}
        </div>

        <p className="text-gray-300 mb-4">Сканируйте QR-код для оплаты</p>
        <p className="text-sm text-gray-400">Заявка отправлена. После оплаты с вами свяжется оператор.</p>
      </div>
    </div>
  </div>
)}