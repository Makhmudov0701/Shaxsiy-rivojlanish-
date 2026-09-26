export type FocusWorkspaceRecord = Record<string, unknown>;

export type FocusWorkspaceData = {
  tasks: FocusWorkspaceRecord[];
  sessions: FocusWorkspaceRecord[];
};

const EMPTY_FOCUS_WORKSPACE: FocusWorkspaceData = { tasks: [], sessions: [] };

function isRecord(value: unknown): value is FocusWorkspaceRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readFocusWorkspace(userId: string): { data: FocusWorkspaceData; error: boolean } {
  try {
    const raw = window.localStorage.getItem(`kundalik-focus-todo-${userId}`);
    if (raw === null) return { data: EMPTY_FOCUS_WORKSPACE, error: false };
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.sessions)) {
      return { data: EMPTY_FOCUS_WORKSPACE, error: true };
    }
    if (!parsed.tasks.every(isRecord) || !parsed.sessions.every(isRecord)) {
      return { data: EMPTY_FOCUS_WORKSPACE, error: true };
    }
    return {
      data: {
        tasks: parsed.tasks,
        sessions: parsed.sessions,
      },
      error: false,
    };
  } catch {
    return { data: EMPTY_FOCUS_WORKSPACE, error: true };
  }
}

export function getRecordedFocusMinutes(data: FocusWorkspaceData): number {
  return data.sessions.reduce((total, session) => {
    if (session.mode !== 'focus') return total;
    const minutes = Number(session.durationMinutes);
    return Number.isFinite(minutes) && minutes > 0 ? total + minutes : total;
  }, 0);
}