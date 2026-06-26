import type { IUser } from "../types/IUser";
import { setCurrentUser, getUsers } from "../utils/localStorage";
import type { Rol } from "../types/Rol";

interface JsonUser {
  id: number;
  nombre: string;
  apellido: string;
  mail: string;
  celular: string;
  password: string;
  rol: string;
}

function mapJsonUser(jsonUser: JsonUser): IUser {
  return {
    id: jsonUser.id,
    firstName: jsonUser.nombre,
    lastName: jsonUser.apellido,
    email: jsonUser.mail,
    phone: jsonUser.celular,
    password: jsonUser.password,
    role: (jsonUser.rol === "ADMIN" ? "admin" : "client") as Rol,
    loggedIn: false,
  };
}

const form = document.querySelector<HTMLFormElement>("form");
const errorEl = document.getElementById("login-error");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailInput = document.getElementById("email") as HTMLInputElement | null;
    const passwordInput = document.getElementById("password") as HTMLInputElement | null;

    const email = emailInput?.value.trim() ?? "";
    const password = passwordInput?.value.trim() ?? "";

    if (!email || !password) {
      if (errorEl) {
        errorEl.textContent = "Email y contraseña son obligatorios.";
        errorEl.hidden = false;
      }
      return;
    }

    try {
      const response = await fetch("/data/usuarios.json");
      const jsonUsers: JsonUser[] = await response.json();
      const jsonMapped: IUser[] = jsonUsers.map(mapJsonUser);

      const localUsers: IUser[] = getUsers();

      const mergedMap = new Map<string, IUser>();
      for (const u of jsonMapped) {
        mergedMap.set(u.email, u);
      }
      for (const u of localUsers) {
        mergedMap.set(u.email, u);
      }
      const mergedUsers = Array.from(mergedMap.values());

      const user = mergedUsers.find(
        (u) => u.email === email && u.password === password,
      );

      if (!user) {
        if (errorEl) {
          errorEl.textContent = "Credenciales inválidas.";
          errorEl.hidden = false;
        }
        return;
      }

      if (errorEl) {
        errorEl.hidden = true;
      }

      const userToStore = { ...user };
      delete (userToStore as Record<string, unknown>).password;
      setCurrentUser(userToStore);

      if (user.role === "admin") {
        window.location.href = "/src/pages/admin/adminHome/adminHome.html";
      } else {
        window.location.href = "/src/pages/store/home/home.html";
      }
    } catch {
      if (errorEl) {
        errorEl.textContent = "Error al conectar con el servidor.";
        errorEl.hidden = false;
      }
    }
  });
}
