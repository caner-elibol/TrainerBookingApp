import InviteResumeForm from "./InviteResumeForm";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InviteResumeForm token={token} />;
}
