export interface MessageData {
    id: string;
    sender_name: string;
    email: string
    message_text: string;
    createdAt: string;
    read?: boolean;
}

export interface CreateMessageData {
    sender_name: string;
    email: string;
    message_text: string;
}
