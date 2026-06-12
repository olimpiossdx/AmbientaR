import { FadWorkspaceEditPage } from "./fad-workspace-edit-page";

type PageProps = { params: Promise<{ workspaceId: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { workspaceId } = await params;
  return { title: `Imóvel ${workspaceId.slice(0, 8)}… — FAD` };
}

export default async function FadWorkspaceEditRoute({ params }: PageProps) {
  const { workspaceId } = await params;
  return <FadWorkspaceEditPage workspaceId={workspaceId} />;
}
