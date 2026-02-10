export interface MessageData {
    id: string;
    name: string;
    email: string
    message: string;
    createdAt: string;
    read?: boolean;
}

export interface CreateMessageData {
    name: string;
    email: string;
    message: string;
}
