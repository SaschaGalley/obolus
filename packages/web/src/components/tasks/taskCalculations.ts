export const DEFAULT_HOURLY_RATE = 65;

export function getTaskDuration(task: any): number {
  if (task.fixedDuration != null && task.fixedDuration !== '') {
    return Number(task.fixedDuration);
  }
  return (task.sessions || [])
    .filter((s: any) => s.use)
    .reduce((sum: number, s: any) => sum + Number(s.duration), 0);
}

export function getHourlyRate(task: any, project?: any): number {
  if (task.hourlyRate) return Number(task.hourlyRate);
  const proj = project || task.project;
  if (proj?.hourlyRate) return Number(proj.hourlyRate);
  if (proj?.client?.hourlyRate) return Number(proj.client.hourlyRate);
  return DEFAULT_HOURLY_RATE;
}

export function getTaskCost(task: any, project?: any): number {
  if (task.fixedCost) return Number(task.fixedCost);
  return getTaskDuration(task) * getHourlyRate(task, project);
}

export function getTaskDate(task: any): string | undefined {
  return task.fixedDate || task.sessions?.[0]?.startedAt || task.createdAt;
}

export function sumTasks(tasks: any[], project?: any) {
  let duration = 0;
  let cost = 0;
  for (const t of tasks) {
    if (!t.use) continue;
    duration += getTaskDuration(t);
    cost += getTaskCost(t, project);
  }
  return { duration, cost };
}
