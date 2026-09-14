import AccountForm from "@/components/ui/AccountForm";
export const metadata = { title: "Einladung annehmen" };
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AccountForm mode="invite" token={token} />;
}
