export interface MessageData {
	message_id: string;
	sender_name: string;
	email: string;
	message_text: string;
	created_at: string;
	read_message?: boolean;
}

export interface CreateMessageData {
	sender_name: string;
	email: string;
	message_text: string;
}

export interface MessageResponse {
	message: string;
	message_id: string;
}

export interface MessagesPageResponse {
	messages: MessageData[];
	page: number;
	page_size: number;
	total_items: number;
}

export interface RawMessagesPageResponse {
	messages?: MessageData[];
	page?: number;
	page_size?: number;
	total_items?: number;
	total_count?: number;
	total?: number;
	error?: string;
}
