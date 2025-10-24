import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export type UserRole = 'ADMIN' | 'USUARIO';

export interface User {
  id: number;
  username: string;
  firstName: string | null;
  role: UserRole;
}

interface ApiUser {
  id: number;
  user: string;
  first_name?: string | null;
  firstName?: string | null;
  rol: UserRole;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  firstName?: string | null;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:7090/dev/api/users';

  getUsers(): Observable<User[]> {
    return this.http.get<ApiUser[]>(this.baseUrl).pipe(map((users) => users.map(mapUserFromApi)));
  }

  createUser(payload: CreateUserRequest): Observable<User> {
    const body = {
      username: payload.username,
      password: payload.password,
      firstName: payload.firstName ?? undefined,
      role: payload.role
    };

    return this.http.post<ApiUser>(this.baseUrl, body).pipe(map(mapUserFromApi));
  }
}

function mapUserFromApi(user: ApiUser): User {
  return {
    id: user.id,
    username: user.user,
    firstName: (user.firstName ?? user.first_name ?? '') || null,
    role: user.rol
  };
}
