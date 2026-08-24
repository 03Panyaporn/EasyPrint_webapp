"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    Search,
    Paperclip,
    Send,
    Phone,
    CheckCheck,
    ArrowLeft,
} from "lucide-react";

type Sender = "customer" | "shop";

export type ChatMessage = {
    id: string;
    text: string;
    sender: Sender;
    time?: string;
    createdAt: string;
    status?: "read" | "sent";
    file?: {
        name: string;
        url: string;
    };
};


type ChatRoom = {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    online?: boolean;
    avatar?: string;
};

const mockRooms: ChatRoom[] = [
    {
        id: "shop-1",
        name: "ร้านปริ้นท์ ไอที",
        lastMessage: "สอบถามรายละเอียดงานได้เลยครับ",
        time: "10:30",
        online: true,
    },
    {
        id: "shop-2",
        name: "พิมพ์ดี ไอที",
        lastMessage: "รอรับงานได้เลยครับ",
        time: "09:45",
    },
    {
        id: "shop-3",
        name: "คิดPrint เซอร์วิส",
        lastMessage: "รับงานครับ",
        time: "09:20",
    },
    {
        id: "shop-4",
        name: "สมพร ดิจิทัล",
        lastMessage: "ไฟล์เรียบร้อยแล้วครับ",
        time: "08:50",
    },
];

const mockMessages: ChatMessage[] = [
    {
        id: "1",
        sender: "shop",
        text: "สอบถามรายละเอียดงานได้เลยครับ",
        createdAt: new Date().toISOString(),
    },
    {
        id: "2",
        sender: "customer",
        text: "ไม่ทราบว่ารับงานพิมพ์สี A4 ไหมครับ",
        createdAt: new Date().toISOString(),
    },
    {
        id: "3",
        sender: "shop",
        text: "รับครับ สามารถส่งไฟล์มาให้ตรวจสอบก่อนได้ครับ",
        createdAt: new Date().toISOString(),
    },
    {
        id: "4",
        sender: "customer",
        text: "ได้ครับ เดี๋ยวผมส่งไฟล์ให้",
        createdAt: new Date().toISOString(),
    },
];

export default function ChatPage({
    currentUser = "customer",
}: {
    currentUser?: Sender;
}) {
    const [rooms] = useState<ChatRoom[]>(mockRooms);
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom>(mockRooms[0]);
    const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
    const [text, setText] = useState("");
    const [showChat, setShowChat] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);

    const handleSend = () => {
        if (!text.trim()) return;

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: currentUser,
            text: text.trim(),
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setText("");
    };

    const selectRoom = (room: ChatRoom) => {
        setSelectedRoom(room);
        setShowChat(true);
    };

    return (
        <div className="h-[calc(100vh-64px)] bg-slate-50 flex overflow-hidden">

            {/* ================================================= */}
            {/* CHAT LIST */}
            {/* ================================================= */}

            <aside
                className={`
                    w-[500px]
                    shrink-0
                    bg-white
                    border-r border-slate-300
                    flex flex-col
                    h-full

                    ${showChat ? "hidden md:flex" : "flex"}
                `}
            >

                {/* SEARCH */}

                <div className="p-3 border-b border-slate-100">

                    <div className="
                        h-9
                        rounded-xl
                        border border-slate-300
                        bg-slate-50
                        flex items-center
                        px-3
                        gap-2
                    ">

                        <Search
                            size={15}
                            className="text-slate-500 shrink-0"
                        />

                        <input
                            className="
                                flex-1
                                min-w-0
                                bg-transparent
                                outline-none
                                text-xs
                                text-slate-700
                                placeholder:text-slate-400
                            "
                            placeholder="ค้นหาร้านค้า"
                        />

                    </div>

                </div>


                {/* ROOM LIST */}

                <div className="flex-1 overflow-y-auto">

                    {rooms.map((room) => {

                        const active =
                            selectedRoom.id === room.id;

                        return (
                            <button
                                key={room.id}
                                onClick={() => selectRoom(room)}
                                className={`
                                    w-full
                                    flex
                                    items-center
                                    gap-2.5
                                    px-3
                                    py-3
                                    text-left
                                    border-b border-slate-100
                                    transition

                                    ${active
                                        ? "bg-orange-50"
                                        : "hover:bg-slate-50"
                                    }
                                `}
                            >

                                {/* AVATAR */}

                                <div className="
                                    w-10
                                    h-10
                                    shrink-0
                                    rounded-full
bg-orange-400
text-white
                                    flex
                                    items-center
                                    justify-center
                                    text-sm
                                ">
                                    {room.name.charAt(0)}
                                </div>


                                {/* INFO */}

                                <div className="min-w-0 flex-1">

                                    <div className="
                                        flex
                                        items-center
                                        justify-between
                                        gap-3
                                    ">

                                        <p className="text-sm  text-slate-800 truncate">
                                            {room.name}
                                        </p>

                                        <span className="
                                            text-[9px]
                                            text-slate-400
                                            shrink-0
                                        ">
                                            {room.time}
                                        </span>

                                    </div>

                                    <p className="
                                        text-[11px] text-slate-400 truncate mt-1
                                    ">
                                        {room.lastMessage}
                                    </p>

                                </div>

                            </button>
                        );
                    })}

                </div>

            </aside>


            {/* ================================================= */}
            {/* CHAT */}
            {/* ================================================= */}

            <main
                className={`
                    flex-1
                    min-w-0
                    flex
                    flex-col
                    bg-white
                    h-full
                    overflow-hidden
                    border

                    ${showChat ? "flex" : "hidden md:flex"}
                `}
            >

                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

                <header className="
                    h-[72px]
                    shrink-0
                    border-b border-slate-300
                    bg-white
                    flex
                    items-center
                    justify-between
                    px-4
                    md:px-5
                ">

                    <div className="flex items-center gap-2.5">

                        {/* MOBILE BACK */}

                        <button
                            onClick={() => setShowChat(false)}
                            className="
                                md:hidden
                                w-10
                                h-10
                                rounded-lg
                                flex
                                items-center
                                justify-center
                                text-slate-400
                                hover:bg-orange-50
                                hover:text-orange-500
                            "
                        >
                            <ArrowLeft size={18} />
                        </button>


                        {/* AVATAR */}

                        <div className="
                            w-10
                            h-10
                            rounded-full
                            bg-orange-400
                            text-white
                            flex
                            items-center
                            justify-center
                            text-sm
                        ">
                            {selectedRoom.name.charAt(0)}
                        </div>


                        {/* NAME */}

                        <div>

                            <h1 className="
                                text-sm
                                md:text-sm
                                text-slate-1000
                            ">
                                {selectedRoom.name}
                            </h1>

                            <div className="
                                flex
                                items-center
                                gap-1
                                mt-0.5
                            ">


                                <span className="text-[10px] text-green-500">ออนไลน์</span>

                            </div>

                        </div>

                    </div>


                    {/* ACTION */}

                    <div className="flex items-center gap-1">

                        <button
                            className="
                                w-8
                                h-8
                                rounded-lg
                                flex
                                items-center
                                justify-center
                                bg-orange-50
                                text-orange-500
                            "
                        >
                            <Phone size={16} />
                        </button>
                    </div>

                </header>


                {/* ================================================= */}
                {/* MESSAGES */}
                {/* ================================================= */}

                <div className="
                    flex-1
                    min-h-0
                    overflow-y-auto
                    px-2
                    sm:px-5
                    py-5
                ">

                    <div className="
    max-w-[920px]
    mx-auto
    space-y-4
">

                        {messages.map((message) => {

                            const isMine =
                                message.sender === currentUser;

                            return (
                                <div
                                    key={message.id}
                                    className={`
                                        flex
                                        items-end
                                        gap-2
                                        ${isMine
                                            ? "justify-end"
                                            : "justify-start"
                                        }
                                    `}
                                >

                                    {/* AVATAR SHOP */}

                                    {!isMine && (
                                        <div className="
                                            w-7
                                            h-7
                                            shrink-0
                                            rounded-full
                                            bg-orange-100
                                            text-orange-500
                                            flex
                                            items-center
                                            justify-center
                                            text-[10px]
                                        ">
                                            {selectedRoom.name.charAt(0)}
                                        </div>
                                    )}


                                    {/* MESSAGE */}

                                    <div
                                        className={`
                                            max-w-[75%]
                                            sm:max-w-[60%]
                                            rounded-2xl
                                            px-3.5
                                            py-2
                                            shadow-md

                                            ${isMine
                                                ? `
                                                        bg-gradient-to-r
                                                        from-orange-500
                                                        to-amber-500
                                                        text-white
                                                        rounded-br-md
                                                    `
                                                : `
                                                        bg-white
                                                        border
                                                        border-slate-100
                                                        text-slate-700
                                                        rounded-bl-md
                                                    `
                                            }
                                        `}
                                    >

                                        <p className="
                                            text-xs
                                            md:text-sm
                                            leading-5
                                            break-words
                                        ">
                                            {message.text}
                                        </p>

                                        <div
                                            className={`
                                                flex
                                                items-center
                                                justify-end
                                                gap-1
                                                mt-0.5
                                                ${isMine
                                                    ? "text-orange-100"
                                                    : "text-slate-400"
                                                }
                                            `}
                                        >

                                            <span className="text-[9px]">
                                                {new Date(
                                                    message.createdAt
                                                ).toLocaleTimeString(
                                                    "th-TH",
                                                    {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    }
                                                )}
                                            </span>

                                            {isMine && (
                                                <CheckCheck size={11} />
                                            )}

                                        </div>

                                    </div>

                                </div>
                            );
                        })}

                        <div ref={messagesEndRef} />

                    </div>

                </div>


                {/* ================================================= */}
                {/* INPUT */}
                {/* ================================================= */}

                <div className="
                    shrink-0
                    border-t
                    border-slate-100
                    bg-white
                    px-3
                    sm:px-4
                    py-2.5
                ">

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="
                            max-w-3xl
                            mx-auto
                            flex
                            items-center
                            gap-1.5
                            bg-white
                            border
                            border-slate-200
                            rounded-xl
                            px-1.5
                            py-1.5
                            shadow-md
                        "
                    >

                        {/* ATTACH */}

                        <button
                            type="button"
                            className="
                                w-8
                                h-8
                                shrink-0
                                rounded-lg
                                flex
                                items-center
                                justify-center
                                text-slate-400
                                hover:bg-orange-50
                                hover:text-orange-500
                            "
                        >
                            <Paperclip size={17} />
                        </button>


                        {/* TEXT */}

                        <div className="
                            flex-1
                            min-w-0
                            h-9
                            rounded-lg
                            bg-slate-50
                            flex
                            items-center
                            px-3
                            gap-2
                            focus-within:bg-orange-50/40
                        ">

                            <input
                                value={text}
                                onChange={(e) =>
                                    setText(e.target.value)
                                }
                                placeholder="พิมพ์ข้อความ..."
                                className="
                                    flex-1
                                    min-w-0
                                    outline-none
                                    bg-transparent
                                    text-xs
                                    text-slate-700
                                    placeholder:text-slate-400
                                "
                            />
                        </div>


                        {/* SEND */}

                        <button
                            type="submit"
                            disabled={!text.trim()}
                            className="
                                w-9
                                h-9
                                shrink-0
                                rounded-lg
                                bg-orange-500
                                hover:bg-orange-600
                                disabled:bg-slate-200
                                disabled:text-slate-400
                                text-white
                                flex
                                items-center
                                justify-center
                                shadow-md
                                transition
                                active:scale-95
                            "
                        >
                            <Send size={15} />
                        </button>

                    </form>

                </div>

            </main>

        </div >
    );
}