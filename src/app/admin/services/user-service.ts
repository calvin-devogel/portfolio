import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CreateUserResponse, UserData } from '@app/auth/interfaces/user-data';
import { generateUUID } from '@app/shared/utils/uuid';

const ROLE_MAP: Record<'admin' | 'user' | 'chat_user', string> = {
	admin: 'admin',
	user: 'user',
	chat_user: 'chat_user',
};

@Injectable({
	providedIn: 'root',
})
export class UserService {
	private http = inject(HttpClient);

	getUsers(): Observable<UserData[] | null> {
		return this.http.get<UserData[]>('/v1/admin/users', { withCredentials: true });
	}
	// need to add idempotency key header just like messageService
	createUser(email: string): Observable<CreateUserResponse | null> {
		const headers = new HttpHeaders({
			'Content-Type': 'application/json',
			'Idempotency-Key': generateUUID(),
		});
		return this.http.post<CreateUserResponse>(
			'/v1/admin/create_user',
			{ email, role: ROLE_MAP['user'] },
			{
				headers,
				withCredentials: true,
			},
		);
	}

	setRole(userId: string, role: 'admin' | 'user' | 'chat_user'): Observable<void> {
		return this.http
			.patch(
				`/v1/admin/users/${userId}/role`,
				{ role },
				{ withCredentials: true, observe: 'response' },
			)
			.pipe(map(() => void 0));
	}

	resetPassword(userId: string): Observable<void> {
		return this.http
			.post(
				`/v1/admin/users/${userId}/reset_password`,
				{},
				{ withCredentials: true, observe: 'response' },
			)
			.pipe(map(() => void 0));
	}
}
