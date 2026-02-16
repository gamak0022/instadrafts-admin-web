import CaseClient from "./ui";

export default function AdminCasePage({ params, searchParams }: any) {
  return <CaseClient caseId={params.caseId} taskId={searchParams?.taskId || null} />;
}
