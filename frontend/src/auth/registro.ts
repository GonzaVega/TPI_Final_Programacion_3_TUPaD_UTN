import type { IUser } from "../types/IUser";
import { getUsers, saveUsers, setCurrentUser } from "../utils/localStorage";
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
const messageEl = document.getElementById("register-message");

function showError(text: string): void {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = "form-message error";
  messageEl.hidden = false;
}

function showSuccess(text: string): void {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = "form-message success";
  messageEl.hidden = false;
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const firstName = (
      document.getElementById("firstName") as HTMLInputElement | null
    )?.value.trim() ?? "";
    const lastName = (
      document.getElementById("lastName") as HTMLInputElement | null
    )?.value.trim() ?? "";
    const email = (
      document.getElementById("email") as HTMLInputElement | null
    )?.value.trim() ?? "";
    const phone = (
      document.getElementById("phone") as HTMLInputElement | null
    )?.value.trim() ?? "";
    const password = (
      document.getElementById("password") as HTMLInputElement | null
    )?.value.trim() ?? "";
    const confirmPassword = (
      document.getElementById("confirmPassword") as HTMLInputElement | null
    )?.value.trim() ?? "";

    if (!email || !password || !confirmPassword) {
      showError("Email y contraseña son obligatorios.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError("El email ingresado no es válido.");
      return;
    }

    if (password.length < 6) {
      showError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Las contraseñas no coinciden.");
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

      const exists = mergedMap.has(email);
      if (exists) {
        showError("Ya existe un usuario registrado con ese email.");
        return;
      }

      const users: IUser[] = getUsers();

      const newUser: IUser = {
        id: Date.now(),
        firstName,
        lastName,
        email,
        phone,
        password,
        role: "client",
        loggedIn: false,
      };

      users.push(newUser);
      saveUsers(users);

      const userToStore = { ...newUser };
      delete (userToStore as Record<string, unknown>).password;
      setCurrentUser(userToStore);

      showSuccess("¡Registro exitoso! Redirigiendo...");

      setTimeout(() => {
        window.location.href = "/src/pages/store/home/home.html";
      }, 1500);
    } catch {
      showError("Error al conectar con el servidor.");
    }
  });
}
