"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
import ChatPage from "@/components/chat/chatpage";
import { LoadingSection } from "@/components/ui/Spinner";

export default function CustomerChatPage() {
  return (
    <main className="flex-1 bg-slate-50 px-4 py-6 ">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
                <MessageSquare size={21} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">
                  แชทข้อความ
                </h1>
                <p className="mt-0.5 text-xs text-slate-400 md:text-sm">
                  พูดคุยและสอบถามรายละเอียดกับร้านค้า
                </p>
              </div>
            </div>
          </div>
        </div>

        <Suspense
          fallback={
            <div
              className="h-[calc(100dvh-9.5rem)] sm:h-[calc(100dvh-10.5rem)] md:h-[540px] bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/60 flex items-center justify-center"
              aria-live="polite"
              aria-busy="true"
            >
              <LoadingSection label="กำลังโหลดแชท..." />
            </div>
          }
        >
          <CustomerChatContent />
        </Suspense>
      </div>
    </main>
  );
}

function CustomerChatContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? undefined;

  return <ChatPage currentUser="customer" initialOrderId={orderId} />;
}
