import { useMemo, useState } from 'react';
import {
  Table, Checkbox, Button, Space, Popconfirm, Input, InputNumber, DatePicker,
} from 'antd';
import {
  EditOutlined, DeleteOutlined, UnorderedListOutlined, PlusOutlined,
  CheckOutlined, CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  formatCurrency, formatDate, formatDuration,
} from '../../utils/format';
import {
  getTaskDuration, getTaskCost, getTaskDate, sumTasks, getHourlyRate,
} from './taskCalculations';

export type TaskTableMode = 'project' | 'invoice';

export interface NewTaskData {
  name: string;
  fixedDate: string | null;
  fixedDuration: number | null;
  fixedCost: number | null;
  hourlyRate: number | null;
}

export interface TaskTableProps {
  tasks: any[];
  project?: any;
  mode: TaskTableMode;
  onToggleUse?: (task: any) => void;
  onUpdate?: (taskId: number, patch: Record<string, any>) => void;
  onEdit?: (task: any) => void;
  onDelete?: (task: any) => void;
  onShowSessions?: (task: any) => void;
  onReorder?: (newOrder: { id: number; order: number }[]) => void;
  onAdd?: (data: NewTaskData) => Promise<void>;
  showSummary?: boolean;
}

function SortableRow(props: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: props['data-row-key'],
  });
  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
    transition,
    cursor: 'move',
  };
  return <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />;
}

const PlainRow = (props: any) => <tr {...props} />;

export default function TaskTable({
  tasks,
  project,
  mode,
  onToggleUse,
  onUpdate,
  onEdit,
  onDelete,
  onShowSessions,
  onReorder,
  onAdd,
  showSummary = true,
}: TaskTableProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // ── Add-row state ──────────────────────────────────────────────────────────
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [entryMode, setEntryMode] = useState<'hours' | 'fixed'>('hours');
  const [newHours, setNewHours] = useState<number | null>(null);
  const [newCost, setNewCost] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }, [tasks]);

  const totals = useMemo(
    () => sumTasks(sortedTasks, project),
    [sortedTasks, project],
  );

  const editable = mode === 'project' && !!onUpdate;

  const handleDragEnd = (event: any) => {
    if (!onReorder) return;
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = sortedTasks.findIndex((t) => t.id === active.id);
      const newIndex = sortedTasks.findIndex((t) => t.id === over.id);
      const newOrder = arrayMove(sortedTasks, oldIndex, newIndex);
      onReorder(newOrder.map((t, i) => ({ id: t.id, order: i })));
    }
  };

  // ── Add-row handlers ───────────────────────────────────────────────────────
  const startAdd = () => {
    setNewName('');
    setNewDate(dayjs());
    setEntryMode('hours');
    setNewHours(null);
    setNewCost(null);
    setAddMode(true);
  };

  const cancelAdd = () => setAddMode(false);

  const handleSave = async () => {
    if (!newName.trim() || !onAdd || isSaving) return;
    setIsSaving(true);
    try {
      await onAdd({
        name: newName.trim(),
        fixedDate: newDate ? newDate.format('YYYY-MM-DD') : null,
        fixedDuration: entryMode === 'hours' ? newHours : null,
        fixedCost: entryMode === 'fixed' ? newCost : null,
        hourlyRate: null,
      });
      // Reset for next quick entry — stay in add mode
      setNewName('');
      setNewDate(dayjs());
      setNewHours(null);
      setNewCost(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      cancelAdd();
    }
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: any[] = [];

  if (mode === 'project' && onToggleUse) {
    columns.push({
      title: '', width: 36, key: 'isActive',
      render: (_: any, r: any) => (
        <Checkbox
          checked={r.isActive}
          onChange={() => onToggleUse(r)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    });
  }

  // Date — first
  columns.push({
    title: 'Datum', key: 'date', width: 140,
    render: (_: any, r: any) => {
      if (editable) {
        const value = r.fixedDate ? dayjs(r.fixedDate) : null;
        return (
          <DatePicker
            value={value}
            allowClear
            placeholder={formatDate(getTaskDate(r))}
            format="DD.MM.YYYY"
            style={{ width: 130 }}
            onChange={(d) => onUpdate!(r.id, { fixedDate: d ? d.format('YYYY-MM-DD') : null })}
            onClick={(e) => e.stopPropagation()}
          />
        );
      }
      return formatDate(getTaskDate(r));
    },
  });

  // Hours — second
  columns.push({
    title: 'Stunden', key: 'hours', width: 110, align: 'right' as const,
    render: (_: any, r: any) => {
      if (editable) {
        // Fixed-cost mode: hours not applicable
        if (r.fixedCost) {
          return <span style={{ color: '#aaa', userSelect: 'none' }}>—</span>;
        }
        const curVal = r.fixedDuration !== null && r.fixedDuration !== undefined && r.fixedDuration !== ''
          ? Number(r.fixedDuration)
          : undefined;
        return (
          <InputNumber
            key={`h-${r.id}`}
            value={curVal}
            min={0}
            step={0.25}
            placeholder={formatDuration(getTaskDuration(r))}
            style={{ width: 90 }}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => {
              const raw = e.target.value.replace(',', '.');
              const v = parseFloat(raw);
              if (isNaN(v) || raw.trim() === '') {
                if (r.fixedDuration !== null && r.fixedDuration !== undefined && r.fixedDuration !== '') {
                  onUpdate!(r.id, { fixedDuration: null });
                }
              } else if (v !== Number(r.fixedDuration)) {
                onUpdate!(r.id, { fixedDuration: v });
              }
            }}
          />
        );
      }
      return formatDuration(getTaskDuration(r));
    },
  });

  // Rate — invoice mode only
  if (mode === 'invoice') {
    columns.push({
      title: 'Stundensatz', key: 'rate', width: 120, align: 'right' as const,
      render: (_: any, r: any) => {
        if (r.fixedCost) return '-';
        const effectiveRate = getHourlyRate(r, project);
        if (onUpdate) {
          return (
            <InputNumber
              key={`${r.id}-${effectiveRate}`}
              defaultValue={effectiveRate}
              min={0}
              step={1}
              style={{ width: 100 }}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => {
                const v = parseFloat((e.target as HTMLInputElement).value);
                if (!isNaN(v) && v !== effectiveRate) {
                  onUpdate(r.id, { hourlyRate: v });
                }
              }}
            />
          );
        }
        return `€ ${effectiveRate}`;
      },
    });
  }

  // Amount — third
  columns.push({
    title: 'Betrag', key: 'cost', width: 130, align: 'right' as const,
    render: (_: any, r: any) => {
      if (editable && r.fixedCost) {
        return (
          <InputNumber
            value={Number(r.fixedCost)}
            min={0}
            step={1}
            style={{ width: 110 }}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v !== Number(r.fixedCost)) {
                onUpdate!(r.id, { fixedCost: v });
              }
            }}
          />
        );
      }
      return formatCurrency(getTaskCost(r, project));
    },
  });

  // Name — after the numeric columns
  columns.push({
    title: 'Name', key: 'name',
    render: (_: any, r: any) => {
      if (editable) {
        return (
          <Input.TextArea
            key={r.id}
            defaultValue={r.name}
            autoSize={{ minRows: 1 }}
            style={{ resize: 'none' }}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => {
              const val = e.target.value.trim();
              if (val && val !== r.name) {
                onUpdate!(r.id, { name: val });
              }
            }}
          />
        );
      }
      return (
        <span style={{ whiteSpace: 'pre-line' }}>{r.name}</span>
      );
    },
  });

  if (mode === 'project') {
    columns.push({
      title: '', key: 'actions', width: 156,
      render: (_: any, r: any) => (
        <Space onClick={(e) => e.stopPropagation()}>
          {onShowSessions && (
            <Button size="small" icon={<UnorderedListOutlined />} onClick={() => onShowSessions(r)} />
          )}
          {onUpdate && (
            <Button
              size="small"
              title={r.fixedCost ? 'Auf Stunden umstellen' : 'Auf Fixbetrag setzen'}
              onClick={() => {
                if (r.fixedCost) {
                  // Switch to hours mode: clear fixedCost
                  onUpdate(r.id, { fixedCost: null });
                } else {
                  // Switch to fixed-cost mode: pre-fill with calculated cost, clear fixedDuration
                  const cost = Math.round(getTaskCost(r, project) * 100) / 100;
                  onUpdate(r.id, { fixedCost: cost, fixedDuration: null });
                }
              }}
            >
              {r.fixedCost ? 'h' : '€'}
            </Button>
          )}
          {onEdit && (
            <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(r)} />
          )}
          {onDelete && (
            <Popconfirm title="Task löschen?" onConfirm={() => onDelete(r)} okText="Ja" cancelText="Nein">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    });
  }

  const summary = showSummary
    ? () => (
        <Table.Summary fixed>
          <Table.Summary.Row>
            {mode === 'project' && onToggleUse && (
              <Table.Summary.Cell index={0} />
            )}
            <Table.Summary.Cell index={mode === 'project' ? 1 : 0}>
              <strong>Gesamt</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={mode === 'project' ? 2 : 1} align="right">
              <strong>{formatDuration(totals.duration)}</strong>
            </Table.Summary.Cell>
            {mode === 'invoice' && <Table.Summary.Cell index={2} />}
            <Table.Summary.Cell index={mode === 'project' ? 3 : 3} align="right">
              <strong>{formatCurrency(totals.cost)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={mode === 'project' ? 4 : 4} />
            {mode === 'project' && <Table.Summary.Cell index={5} />}
          </Table.Summary.Row>
        </Table.Summary>
      )
    : undefined;

  const useDnd = mode === 'project' && !!onReorder;

  const tableEl = (
    <Table
      dataSource={sortedTasks}
      columns={columns}
      rowKey="id"
      pagination={false}
      size="small"
      components={{ body: { row: useDnd ? SortableRow : PlainRow } }}
      summary={summary}
    />
  );

  // ── Inline add row ─────────────────────────────────────────────────────────
  const hasCheckbox = mode === 'project' && !!onToggleUse;

  const addRow = onAdd ? (
    <div style={{ marginTop: 4 }}>
      {addMode ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 4,
            padding: '8px 8px',
            background: '#f0f9ff',
            borderRadius: 8,
            border: '1px dashed #0ea5e9',
          }}
        >
          {/* Checkbox slot */}
          {hasCheckbox && <div style={{ width: 36, flexShrink: 0 }} />}

          {/* Date */}
          <div style={{ width: 130, flexShrink: 0 }}>
            <DatePicker
              value={newDate}
              format="DD.MM.YYYY"
              style={{ width: '100%' }}
              onChange={(d) => setNewDate(d)}
            />
          </div>

          {/* Hours / mode toggle */}
          <div style={{ width: 106, flexShrink: 0, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              size="small"
              type="default"
              title={entryMode === 'hours' ? 'Wechseln auf Fixbetrag' : 'Wechseln auf Stunden'}
              style={{ width: 28, padding: 0, flexShrink: 0, fontWeight: 600 }}
              onClick={() => setEntryMode(entryMode === 'hours' ? 'fixed' : 'hours')}
            >
              {entryMode === 'hours' ? 'h' : '€'}
            </Button>
            {entryMode === 'hours' && (
              <InputNumber
                value={newHours ?? undefined}
                min={0}
                step={0.25}
                placeholder="0"
                style={{ flex: 1 }}
                onChange={(v) => setNewHours(v as number | null)}
              />
            )}
          </div>

          {/* Fixed cost input */}
          <div style={{ width: 126, flexShrink: 0 }}>
            {entryMode === 'fixed' ? (
              <InputNumber
                value={newCost ?? undefined}
                min={0}
                step={1}
                placeholder="0"
                addonAfter="€"
                style={{ width: '100%' }}
                onChange={(v) => setNewCost(v as number | null)}
              />
            ) : null}
          </div>

          {/* Name */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Input.TextArea
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoSize={{ minRows: 1 }}
              style={{ resize: 'none' }}
              placeholder="Task-Name… (Enter zum Speichern)"
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Actions */}
          <div style={{ flexShrink: 0, display: 'flex', gap: 4 }}>
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              loading={isSaving}
              disabled={!newName.trim()}
              onClick={handleSave}
            >
              Hinzufügen
            </Button>
            <Button size="small" icon={<CloseOutlined />} onClick={cancelAdd} />
          </div>
        </div>
      ) : (
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={startAdd}
          block
          style={{ marginTop: 4 }}
        >
          Task hinzufügen
        </Button>
      )}
    </div>
  ) : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  const content = (
    <>
      {useDnd ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tableEl}
          </SortableContext>
        </DndContext>
      ) : tableEl}
      {addRow}
    </>
  );

  return content;
}
