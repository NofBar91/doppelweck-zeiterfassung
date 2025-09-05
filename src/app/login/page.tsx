import { Suspense } from "react";
import LoginClient from "./LogInClient";

// Suspense ist wichtig, weil useSearchParams clientseitig arbeitet
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6">Lade…</div>}>
      <LoginClient />
    </Suspense>
  );
}
