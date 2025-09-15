import React, { useState, useEffect } from 'react';
import { Gamepad2, Shield, Clock, Phone, Mail, X, Check } from 'lucide-react';

import QRCode from "react-qr-code";

interface FormData {
  fullName: string;
  phone: string;
  telegram: string;
  platform: 'steam' | 'pubg';
  steamId: string;
  pubgUid: string;
  amount: number;
}

function App() {
  const [isAgreed, setIsAgreed] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentDoc, setCurrentDoc] = useState('');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    telegram: '',
    platform: 'steam',
    steamId: '',
    pubgUid: '',
    amount: 0
  });

  const calculateTotal = (amount: number, platform: 'steam' | 'pubg') => {
    const commission = platform === 'steam' ? 0.10 : 0.08;
    return Math.ceil(amount * (1 + commission));
  };

  const [qrPayload, setQrPayload] = useState<string | null>(null);

const handleFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Ошибка при создании заказа");

    console.log("Ответ сервера:", data);

    setQrPayload(data.qrPayload);
    setShowOrderModal(false);
    setShowPaymentModal(true);
  } catch (err) {
    console.error(err);
    alert("Не удалось создать заказ");
  }
};
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