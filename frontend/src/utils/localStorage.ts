import type { IUser } from "../types/IUser";
import { initialUsers } from "../data/users";

const USERS_KEY: string = "users";
const USER_DATA_KEY: string = "userData";

export function getUsers(): IUser[] {
  const raw: string | null = localStorage.getItem(USERS_KEY);

  if (!raw) {
    if (initialUsers.length > 0) {
      localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
      return [...initialUsers];
    }
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const users: IUser[] = parsed as IUser[];

      const mergedUsers: IUser[] = [...users];
      let hasChanges: boolean = false;

      initialUsers.forEach((seedUser) => {
        const exists: boolean = mergedUsers.some(
          (u) => u.email === seedUser.email,
        );
        if (!exists) {
          mergedUsers.push(seedUser);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        localStorage.setItem(USERS_KEY, JSON.stringify(mergedUsers));
      }

      return mergedUsers;
    }
  } catch {
    console.error("Error parseando usuarios desde el localStorage:", raw);
  }
  return [];
}

export function saveUsers(users: IUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): IUser | null {
  const raw: string | null = localStorage.getItem(USER_DATA_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IUser;
  } catch {
    console.error("Error parseando usuario actual desde el localStorage:", raw);
    return null;
  }
}

export function setCurrentUser(user: IUser | null): void {
  if (!user) {
    localStorage.removeItem(USER_DATA_KEY);
    return;
  }
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
}
