"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
    Search,
    Paperclip,
    Send,
    CheckCheck,
    ArrowLeft,
    FileText,
    Download,
    Loader2,
} from "lucide-react";
import { uploadFile } from "@/lib/api/uploads";
import { getMe } from "@/lib/api/auth";
import {
    getChatRooms,
    getOrderMessages,
    sendChatMessage,
    sendChatFile,
    markOrderMessagesRead,
    type ChatRoomItem,
    type ChatMessageItem,
} from "@/lib/api/messages";
import { getOrder } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";

type Sender = "customer" | "shop";

const ROOMS_POLL_MS = 15000;
const MESSAGES_POLL_MS = 5000;

// ต้องตรงกับ IMAGE_MIME/PRINT_FILE_MIME ที่ apps/api/src/storage.ts (type "order-file") — รองรับแค่รูปภาพกับ PDF เท่านั้น
const ORDER_FILE_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const IMAGE_NAME_PATTERN = /\.(jpg|jpeg|png|webp)$/i;

export default function ChatPage({
    currentUser = "customer",
    initialOrderId,
}: {
    currentUser?: Sender;
    initialOrderId?: string;
}) {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [rooms, setRooms] = useState<ChatRoomItem[]>([]);
    const [roomsLoading, setRoomsLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState<ChatRoomItem | null>(null);
    const [messages, setMessages] = useState<ChatMessageItem[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [uploading, setUploading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const selectedOrderIdRef = useRef<string | null>(null);

    useEffect(() => {
        getMe()
            .then((res) => setCurrentUserId(res.user.id))
            .catch(() => setCurrentUserId(null));
    }, []);

    const loadRooms = useCallback(async () => {
        try {
            const res = await getChatRooms();
            setRooms(res.rooms);
            return res.rooms;
        } catch (err) {
            setLoadError(err instanceof ApiError ? err.message : "โหลดรายการแชทไม่สำเร็จ");
            return [];
        }
    }, []);

    // โหลดรายชื่อห้องแชท + ถ้ามี initialOrderId ที่ยังไม่เคยมีข้อความ ให้สร้างห้องแบบว่างจากข้อมูลออเดอร์
    useEffect(() => {
        (async () => {
            setRoomsLoading(true);
            const list = await loadRooms();

            if (initialOrderId) {
                const existing = list.find((r) => r.orderId === initialOrderId);
                if (existing) {
                    setSelectedRoom(existing);
                    setShowChat(true);
                } else {
                    try {
                        const { order } = await getOrder(initialOrderId);
                        const emptyRoom: ChatRoomItem = {
                            orderId: order.id,
                            orderCode: order.code,
                            shopId: order.shopId,
                            shopName: currentUser === "shop" ? "" : "ร้านค้า",
                            customerId: "",
                            customerName: order.customerName ?? "ลูกค้า",
                            lastMessageContent: null,
                            lastMessageAt: null,
                            unreadCount: 0,
                        };
                        setSelectedRoom(emptyRoom);
                        setShowChat(true);
                    } catch {
                        // ออเดอร์ไม่ถูกต้องหรือไม่มีสิทธิ์ — ปล่อยให้ผู้ใช้เลือกห้องแชทจากรายการเอง
                    }
                }
            } else if (list.length > 0) {
                setSelectedRoom(list[0]);
            }

            setRoomsLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialOrderId]);

    // Poll รายชื่อห้องแชท (unread count / ข้อความล่าสุด)
    useEffect(() => {
        const interval = setInterval(() => {
            loadRooms();
        }, ROOMS_POLL_MS);
        return () => clearInterval(interval);
    }, [loadRooms]);

    const loadMessages = useCallback(async (orderId: string) => {
        try {
            const res = await getOrderMessages(orderId);
            if (selectedOrderIdRef.current !== orderId) return;
            setMessages([...res.messages].reverse());
        } catch (err) {
            if (selectedOrderIdRef.current === orderId) {
                setLoadError(err instanceof ApiError ? err.message : "โหลดข้อความไม่สำเร็จ");
            }
        }
    }, []);

    // โหลดข้อความของห้องที่เลือก + mark read + poll ต่อเนื่อง
    useEffect(() => {
        selectedOrderIdRef.current = selectedRoom?.orderId ?? null;
        if (!selectedRoom) {
            setMessages([]);
            return;
        }

        setMessagesLoading(true);
        loadMessages(selectedRoom.orderId).finally(() => setMessagesLoading(false));
        markOrderMessagesRead(selectedRoom.orderId).catch(() => {});

        const interval = setInterval(() => {
            loadMessages(selectedRoom.orderId);
        }, MESSAGES_POLL_MS);
        return () => clearInterval(interval);
    }, [selectedRoom, loadMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!text.trim() || !selectedRoom || sending) return;
        const content = text.trim();
        setText("");
        setSending(true);
        try {
            const { message } = await sendChatMessage(selectedRoom.orderId, content);
            // กัน key ซ้ำถ้า optimistic update นี้มาชนกับรอบ poll ที่ดึงข้อความเดียวกันมาแล้ว (React StrictMode ก็ทำให้ updater นี้ถูกเรียกซ้ำได้ในโหมด dev)
            setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
            loadRooms();
        } catch (err) {
            window.alert(err instanceof ApiError ? err.message : "ส่งข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
            setText(content);
        } finally {
            setSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedRoom) return;

        setUploading(true);
        try {
            const res = await uploadFile(file, "order-file");
            const { message } = await sendChatFile(selectedRoom.orderId, res.path, file.name);
            setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
            loadRooms();
        } catch (err) {
            window.alert(err instanceof ApiError ? err.message : "แนบไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const selectRoom = (room: ChatRoomItem) => {
        setSelectedRoom(room);
        setShowChat(true);
    };

    const peerName = (room: ChatRoomItem) =>
        currentUser === "customer" ? (room.shopName || "ร้านค้า") : (room.customerName || "ลูกค้า");

    return (
        <div className="h-[calc(100dvh-9.5rem)] sm:h-[calc(100dvh-10.5rem)] md:h-[540px] bg-white flex rounded-xl sm:rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/60 overflow-hidden w-full">

            {/* CHAT LIST */}
            <aside
                className={`w-full md:w-80 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full ${showChat ? "hidden md:flex" : "flex"}`}
            >
                <div className="p-3 border-b border-slate-100">
                    <div className="h-9 rounded-xl border border-slate-300 bg-slate-50 flex items-center px-3 gap-2">
                        <Search size={15} className="text-slate-500 shrink-0" />
                        <input
                            className="flex-1 min-w-0 bg-transparent outline-none text-xs text-slate-700 placeholder:text-slate-400"
                            placeholder={currentUser === "customer" ? "ค้นหาร้านค้า" : "ค้นหาลูกค้า"}
                            disabled
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {roomsLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                            <Loader2 size={20} className="animate-spin" />
                            <p className="text-xs">กำลังโหลด...</p>
                        </div>
                    ) : rooms.length === 0 && !selectedRoom ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400">
                            <p className="text-xs">ยังไม่มีบทสนทนา</p>
                        </div>
                    ) : (
                        <>
                            {selectedRoom && !rooms.find((r) => r.orderId === selectedRoom.orderId) && (
                                <button
                                    key={selectedRoom.orderId}
                                    className="w-full flex items-center gap-2.5 px-3 py-3 text-left border-b border-slate-100 bg-orange-50"
                                >
                                    <div className="w-10 h-10 shrink-0 rounded-full bg-orange-400 text-white flex items-center justify-center text-sm">
                                        {peerName(selectedRoom).charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-slate-800 truncate">{peerName(selectedRoom)}</p>
                                        <p className="text-[11px] text-slate-400 truncate mt-1">ออเดอร์ {selectedRoom.orderCode} · เริ่มบทสนทนาใหม่</p>
                                    </div>
                                </button>
                            )}
                            {rooms.map((room) => {
                                const active = selectedRoom?.orderId === room.orderId;
                                return (
                                    <button
                                        key={room.orderId}
                                        onClick={() => selectRoom(room)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-3 text-left border-b border-slate-100 transition ${active ? "bg-orange-50" : "hover:bg-slate-50"}`}
                                    >
                                        <div className="w-10 h-10 shrink-0 rounded-full bg-orange-400 text-white flex items-center justify-center text-sm">
                                            {peerName(room).charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-sm text-slate-800 truncate">{peerName(room)}</p>
                                                {room.lastMessageAt && (
                                                    <span className="text-[9px] text-slate-400 shrink-0">
                                                        {new Date(room.lastMessageAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-[11px] text-slate-400 truncate mt-1">
                                                    {room.lastMessageContent ?? `ออเดอร์ ${room.orderCode}`}
                                                </p>
                                                {room.unreadCount > 0 && (
                                                    <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                                                        {room.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </>
                    )}
                </div>
            </aside>

            {/* CHAT */}
            <main className={`flex-1 min-w-0 flex flex-col bg-white h-full overflow-hidden ${showChat ? "flex" : "hidden md:flex"}`}>
                {!selectedRoom ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                        {loadError || "เลือกบทสนทนาเพื่อเริ่มแชท"}
                    </div>
                ) : (
                    <>
                        <header className="h-[72px] shrink-0 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-5">
                            <div className="flex items-center gap-2.5">
                                <button
                                    onClick={() => setShowChat(false)}
                                    className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-orange-50 hover:text-orange-500"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-orange-400 text-white flex items-center justify-center text-sm">
                                    {peerName(selectedRoom).charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-sm text-slate-1000">{peerName(selectedRoom)}</h1>
                                    <span className="text-[10px] text-slate-400">ออเดอร์ {selectedRoom.orderCode}</span>
                                </div>
                            </div>
                        </header>

                        <div className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-5 py-5">
                            <div className="max-w-[920px] mx-auto space-y-4">
                                {messagesLoading ? (
                                    <div className="flex items-center justify-center py-10 text-slate-400">
                                        <Loader2 size={20} className="animate-spin" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-xs text-slate-400 py-10">
                                        ยังไม่มีข้อความ เริ่มพูดคุยได้เลย
                                    </div>
                                ) : (
                                    messages.map((message) => {
                                        const isMine = message.senderId === currentUserId;
                                        const isImage = message.isFile && !!message.fileName && IMAGE_NAME_PATTERN.test(message.fileName);

                                        return (
                                            <div key={message.id} className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                                                {!isMine && (
                                                    <div className="w-7 h-7 shrink-0 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-[10px]">
                                                        {peerName(selectedRoom).charAt(0)}
                                                    </div>
                                                )}
                                                <div
                                                    className={`max-w-[75%] sm:max-w-[60%] rounded-2xl px-3.5 py-2 shadow-md ${isMine
                                                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-md"
                                                        : "bg-white border border-slate-100 text-slate-700 rounded-bl-md"
                                                        }`}
                                                >
                                                    {message.isFile ? (
                                                        message.fileUrl ? (
                                                            isImage ? (
                                                                <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-slate-200 shadow-xs max-w-xs hover:opacity-95 transition">
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img src={message.fileUrl} alt={message.fileName ?? "รูปภาพ"} className="w-full h-auto max-h-48 object-cover rounded-lg" />
                                                                </a>
                                                            ) : (
                                                                <a
                                                                    href={message.fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`flex items-center gap-2.5 p-2 rounded-xl border transition ${isMine ? "bg-white/15 border-white/20 text-white hover:bg-white/25" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                                                                >
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isMine ? "bg-white/20 text-white" : "bg-orange-100 text-orange-600"}`}>
                                                                        <FileText size={18} />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-xs font-semibold truncate">{message.fileName}</p>
                                                                        <span className="text-[10px] opacity-80 flex items-center gap-1">
                                                                            <Download size={10} /> ดาวน์โหลดไฟล์
                                                                        </span>
                                                                    </div>
                                                                </a>
                                                            )
                                                        ) : (
                                                            <p className="text-xs italic opacity-70">ลิงก์ไฟล์หมดอายุ — โหลดหน้าใหม่เพื่อดูไฟล์</p>
                                                        )
                                                    ) : (
                                                        <p className="text-xs md:text-sm leading-5 break-words">{message.content}</p>
                                                    )}

                                                    <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMine ? "text-orange-100" : "text-slate-400"}`}>
                                                        <span className="text-[9px]">
                                                            {new Date(message.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                        {isMine && <CheckCheck size={11} />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        <div className="shrink-0 sticky bottom-0 z-10 border-t border-slate-100 bg-white px-2 sm:px-4 py-2 sm:py-2.5">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend();
                                }}
                                className="max-w-3xl mx-auto flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-1.5 py-1.5 shadow-md"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept={ORDER_FILE_ACCEPT}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:bg-orange-50 hover:text-orange-500 disabled:opacity-50 transition"
                                    title="แนบไฟล์ / รูปภาพ"
                                >
                                    {uploading ? <Loader2 size={17} className="animate-spin text-orange-500" /> : <Paperclip size={17} />}
                                </button>

                                <div className="flex-1 min-w-0 h-9 rounded-lg bg-slate-50 flex items-center px-3 gap-2 focus-within:bg-orange-50/40">
                                    <input
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="พิมพ์ข้อความ..."
                                        className="flex-1 min-w-0 outline-none bg-transparent text-xs text-slate-700 placeholder:text-slate-400"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!text.trim() || sending}
                                    className="w-9 h-9 shrink-0 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center shadow-md transition active:scale-95"
                                >
                                    {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
