import { SiteHeader } from "@/components/SiteHeader";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-8 sm:py-14">
        <LoginForm />
      </main>
    </>
  );
}
