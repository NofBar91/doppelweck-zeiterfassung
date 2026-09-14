import AccountForm from "@/components/ui/AccountForm";
export const metadata = { title: "Passwort zurücksetzen" };
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AccountForm mode="reset" token={token} />;
}
