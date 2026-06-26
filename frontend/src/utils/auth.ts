import type { IUser } from "../types/IUser";
import { getUsers } from "./localStorage";

export function isEmailTaken(email: string): boolean {
  const users: IUser[] = getUsers();
  return users.some((u) => u.email === email);
}

export function loginUser(email: string, password: string): IUser | null {
  const users: IUser[] = getUsers();
  const normalizedEmail: string = email.trim().toLowerCase();
  const user: IUser | undefined = users.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password,
  );
  return user ?? null;
}
