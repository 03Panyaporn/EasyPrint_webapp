"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle2, AlertTriangle, Info, ShoppingCart, MessageSquare, Megaphone, Store } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info" | "order" | "chat" | "system" | "shop";

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const duration = toast.duration || 5000;

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, duration, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case "success": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "error": return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "order": return <ShoppingCart className="w-5 h-5 text-orange-500" />;
      case "chat": return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case "shop": return <Store className="w-5 h-5 text-purple-500" />;
      case "system": return <Megaphone className="w-5 h-5 text-indigo-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case "success": return "bg-emerald-50 border-emerald-200 text-emerald-800";
      case "error": return "bg-red-50 border-red-200 text-red-800";
      case "warning": return "bg-amber-50 border-amber-200 text-amber-800";
      case "order": return "bg-orange-50 border-orange-200 text-orange-800";
      case "chat": return "bg-blue-50 border-blue-200 text-blue-800";
      case "shop": return "bg-purple-50 border-purple-200 text-purple-800";
      case "system": return "bg-indigo-50 border-indigo-200 text-indigo-800";
      default: return "bg-white border-gray-200 text-gray-800";
    }
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 w-[340px] rounded-xl shadow-lg border animate-in slide-in-from-right-8 fade-in duration-300 ${getBgColor()}`}
    >
      <div className="shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold truncate mb-0.5">{toast.title}</h4>
        <p className="text-xs opacity-90 leading-relaxed line-clamp-2">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 opacity-50 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
