export interface MessageData {
    id: string;
    sender_name: string;
    email: string
    message_text: string;
    created_at: string;
    read_message?: boolean;
}

export interface CreateMessageData {
    sender_name: string;
    email: string;
    message_text: string;
}
