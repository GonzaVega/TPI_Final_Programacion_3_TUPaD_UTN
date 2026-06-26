import type { IUser } from "./types/IUser";
import { getCurrentUser } from "./utils/localStorage";

function guardRoute(): void {
  const user: IUser | null = getCurrentUser();
  const path: string = window.location.pathname;

  const isAuthPage: boolean =
    path.endsWith("/src/pages/auth/login/login.html") ||
    path.endsWith("/src/pages/auth/login/registro.html");

  if (!user && !isAuthPage) {
    window.location.href = "/src/pages/auth/login/login.html";
    return;
  }

  if (user?.role === "client" && path.includes("/admin")) {
    window.location.href = "/src/pages/store/home/home.html";
    return;
  }

  if (user && isAuthPage) {
    if (user.role === "admin") {
      window.location.href = "/src/pages/admin/adminHome/adminHome.html";
    } else {
      window.location.href = "/src/pages/store/home/home.html";
    }
  }
}

guardRoute();
