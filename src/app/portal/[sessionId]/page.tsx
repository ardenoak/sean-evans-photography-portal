import PortalClient from '@/components/PortalClient';

export default async function Portal({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { sessionId } = await params;
  const { admin } = await searchParams;
  
  const isAdminView = admin === 'true';
  
  return <PortalClient sessionId={sessionId} adminView={isAdminView} />;
}