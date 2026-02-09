export type TaskStatus = "NEW" | "ASSIGNED" | "IN_PROGRESS" | "NEEDS_INFO" | "SUBMITTED" | "FAILED" | "APPROVED";

export type ServiceId = "CREATE_DOCUMENT" | "GOVT_APPLICATION" | "LEGAL_FILING" | "ESTAMP" | "ESIGN" | "APPOINTMENT";

export interface Task {
  taskId: string;
  caseId: string;
  status: TaskStatus;
  assignedToRole?: "AGENT" | "LAWYER";
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Case {
  caseId: string;
  serviceId: ServiceId;
  createdAt: string;
  state: string;
  answers: Record<string, string>;
  lockedContext?: {
    state: string;
    language: string;
    channel: string;
    lockedAt: string;
  };
  audit: any[];
}

export interface AdminTaskDetail {
  task: Task;
  case: Case;
  artifact?: any;
}