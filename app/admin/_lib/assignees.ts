export type Assignee = { id: string; name: string };

function parseCsv(v?: string): Assignee[] {
  if (!v) return [];
  return v
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .map(pair => {
      const [id, ...rest] = pair.split(":");
      const name = rest.join(":").trim() || id.trim();
      return { id: id.trim(), name };
    })
    .filter(x => x.id);
}

const defaultLawyers: Assignee[] = [
  { id: "lawyer_1", name: "Lawyer 1" },
  { id: "lawyer_2", name: "Lawyer 2" },
];

const defaultAgents: Assignee[] = [
  { id: "agent_1", name: "Agent 1" },
  { id: "agent_2", name: "Agent 2" },
];

export const LAWYERS = parseCsv(process.env.NEXT_PUBLIC_LAWYERS_CSV) || defaultLawyers;
export const AGENTS  = parseCsv(process.env.NEXT_PUBLIC_AGENTS_CSV)  || defaultAgents;
