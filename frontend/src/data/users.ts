import type { IUser } from "../types/IUser";

export const initialUsers: IUser[] = [
  {
    id: 1,
    firstName: "Admin",
    lastName: "Test",
    email: "admin@test.com",
    password: "password123",
    loggedIn: false,
    role: "admin",
  },
  {
    id: 2,
    firstName: "Juan",
    lastName: "Perez",
    email: "juan@perez.com",
    password: "password123",
    loggedIn: false,
    role: "client",
  },
];
