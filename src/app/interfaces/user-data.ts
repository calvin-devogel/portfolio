export interface UserData {
    user_id: string;
    username: string;
    role: 'admin' | 'user' | 'chat_user';
    must_change_password: boolean;
}

export interface CreateUserData {
    email: string;
}

export interface CreateUserResponse {
    success: boolean;
    message: string;
    link: string;
}
