import PortalClient from '@/components/PortalClient';

export default async function Portal({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  
  return <PortalClient sessionId={sessionId} />;
}