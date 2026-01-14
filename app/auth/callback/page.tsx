// Esta ruta no se puede exportar estáticamente porque usa request.url
// En Capacitor, el callback de auth se maneja mediante deep links o custom URL schemes
// Por lo tanto, esta ruta se excluye del build estático y redirige a login

import { redirect } from "next/navigation";

export default function CallbackPage() {
  // En Capacitor, esto nunca se ejecutará porque el callback se maneja mediante deep links
  redirect("/auth/login");
}
