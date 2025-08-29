import { Suspense } from "react";
import LoginClient from "./LogInClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6">Lade…</div>}>
      <LoginClient />
    </Suspense>
  );
}
