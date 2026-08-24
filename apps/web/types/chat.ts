export interface ChatMessage {
    id: string;
    sender: "customer" | "shop";
    text?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    createdAt: string;
}
