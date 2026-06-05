import { Tag } from 'antd';

export type ProjectStatus = 'quoted' | 'active' | 'archived';

const META: Record<ProjectStatus, { label: string; color: string }> = {
  quoted:   { label: 'Angeboten',  color: 'gold' },
  active:   { label: 'Laufend',    color: 'green' },
  archived: { label: 'Archiviert', color: 'default' },
};

/**
 * Renders the project lifecycle status as an Ant tag. Falls back to "Laufend"
 * for legacy/unknown values so old data doesn't render as blank.
 */
export default function ProjectStatusTag({ status }: { status?: string | null }) {
  const m = META[(status as ProjectStatus) ?? 'active'] ?? META.active;
  return <Tag color={m.color}>{m.label}</Tag>;
}

export const PROJECT_STATUS_OPTIONS: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'quoted',   label: 'Angeboten' },
  { value: 'active',   label: 'Laufend' },
  { value: 'archived', label: 'Archiviert' },
];
