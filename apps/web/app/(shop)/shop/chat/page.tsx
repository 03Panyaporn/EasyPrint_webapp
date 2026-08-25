"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
import ChatPage from "@/components/chat/chatpage";

export default function ShopChatPage() {
  return (
    <div className="space-y-4">
      {/* Page Heading */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-200">
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              แชทข้อความ
            </h1>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <ShopChatContent />
      </Suspense>
    </div>
  );
}

function ShopChatContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? undefined;

  return <ChatPage currentUser="shop" initialOrderId={orderId} />;
}
