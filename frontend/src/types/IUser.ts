import type { Rol } from "./Rol";

export interface IUser {
  id: number;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  loggedIn: boolean;
  role: Rol;
}
