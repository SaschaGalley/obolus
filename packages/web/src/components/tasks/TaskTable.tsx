import { useMemo, useState } from 'react';
import {
  Table, Checkbox, Button, Space, Popconfirm, Input, InputNumber,
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
import SmartDatePicker from '../SmartDatePicker';

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

  const hasCheckbox = mode === 'project' && !!onToggleUse;

  if (hasCheckbox) {
    columns.push({
      title: '', width: 36, key: 'isActive',
      render: (_: any, r: any) => (
        <Checkbox
          checked={r.isActive}
          onChange={() => onToggleUse!(r)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    });
  }

  // Date
  columns.push({
    title: 'Datum', key: 'date', width: 140,
    render: (_: any, r: any) => {
      if (editable) {
        const value = r.fixedDate ? dayjs(r.fixedDate) : null;
        return (
          <SmartDatePicker
            value={value}
            allowClear
            placeholder={formatDate(getTaskDate(r))}
            format="DD.MM.YYYY"
            style={{ width: 130 }}
            onChange={(d) => onUpdate!(r.id, { fixedDate: d ? (d as dayjs.Dayjs).format('YYYY-MM-DD') : null })}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          />
        );
      }
      return formatDate(getTaskDate(r));
    },
  });

  // Hours
  columns.push({
    title: 'Stunden', key: 'hours', width: 110, align: 'right' as const,
    render: (_: any, r: any) => {
      if (editable) {
        if (r.fixedCost) {
          return <span style={{ color: '#aaa', userSelect: 'none' }}>—</span>;
        }
        const curVal = r.fixedDuration !== null && r.fixedDuration !== undefined && r.fixedDuration !== ''
          ? Number(r.fixedDuration) : undefined;
        return (
          <InputNumber
            key={`h-${r.id}-${curVal ?? ''}`}
            defaultValue={curVal}
            min={0}
            step={1}
            placeholder={formatDuration(getTaskDuration(r))}
            style={{ width: 90 }}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => {
              const raw = e.target.value.replace(',', '.');
              const v = parseFloat(raw);
              if (isNaN(v) || raw.trim() === '') {
                if (curVal !== undefined) onUpdate!(r.id, { fixedDuration: null });
              } else if (v !== curVal) {
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
              key={`rate-${r.id}-${effectiveRate}`}
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

  // Amount
  columns.push({
    title: 'Betrag', key: 'cost', width: 130, align: 'right' as const,
    render: (_: any, r: any) => {
      if (editable && r.fixedCost) {
        return (
          <InputNumber
            key={`cost-${r.id}-${Number(r.fixedCost)}`}
            defaultValue={Number(r.fixedCost)}
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

  // Name
  columns.push({
    title: 'Name', key: 'name',
    render: (_: any, r: any) => {
      if (editable) {
        return (
          <Input.TextArea
            key={r.id}
            defaultValue={r.name}
            autoSize={{ minRows: 1, maxRows: 7 }}
            style={{ resize: 'none' }}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => {
              const val = e.target.value.trim();
              if (val && val !== r.name) onUpdate!(r.id, { name: val });
            }}
          />
        );
      }
      return <span style={{ whiteSpace: 'pre-line' }}>{r.name}</span>;
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
                  onUpdate(r.id, { fixedCost: null });
                } else {
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

  // ── Summary (includes add row above Gesamt) ───────────────────────────────
  const colCount = columns.length;

  const addRowInSummary = onAdd ? (
    addMode ? (
      // Inline entry form as a summary row
      <Table.Summary.Row>
        {hasCheckbox && <Table.Summary.Cell index={0} />}
        {/* Date */}
        <Table.Summary.Cell index={hasCheckbox ? 1 : 0}>
          <SmartDatePicker
            value={newDate}
            format="DD.MM.YYYY"
            style={{ width: 130 }}
            onChange={(d) => setNewDate(d as dayjs.Dayjs | null)}
          />
        </Table.Summary.Cell>
        {/* Hours / mode toggle */}
        <Table.Summary.Cell index={hasCheckbox ? 2 : 1} align="right">
          <div style={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'flex-end' }}>
            <Button
              size="small"
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
                step={1}
                placeholder="0"
                style={{ width: 60 }}
                onChange={(v) => setNewHours(v as number | null)}
              />
            )}
          </div>
        </Table.Summary.Cell>
        {/* Cost (fixed mode) */}
        <Table.Summary.Cell index={hasCheckbox ? 3 : 2} align="right">
          {entryMode === 'fixed' && (
            <InputNumber
              value={newCost ?? undefined}
              min={0}
              step={1}
              placeholder="0"
              addonAfter="€"
              style={{ width: 110 }}
              onChange={(v) => setNewCost(v as number | null)}
            />
          )}
        </Table.Summary.Cell>
        {/* Name */}
        <Table.Summary.Cell index={hasCheckbox ? 4 : 3}>
          <Input.TextArea
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoSize={{ minRows: 1, maxRows: 7 }}
            style={{ resize: 'none' }}
            placeholder="Task-Name… (Enter zum Speichern)"
            onKeyDown={handleKeyDown}
          />
        </Table.Summary.Cell>
        {/* Actions */}
        <Table.Summary.Cell index={hasCheckbox ? 5 : 4}>
          <Space>
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
          </Space>
        </Table.Summary.Cell>
      </Table.Summary.Row>
    ) : (
      // Dashed "+" trigger row
      <Table.Summary.Row>
        <Table.Summary.Cell index={0} colSpan={colCount}>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={startAdd}
            block
          >
            Task hinzufügen
          </Button>
        </Table.Summary.Cell>
      </Table.Summary.Row>
    )
  ) : null;

  const summary = showSummary
    ? () => (
        <Table.Summary fixed>
          {addRowInSummary}
          <Table.Summary.Row>
            {hasCheckbox && <Table.Summary.Cell index={0} />}
            <Table.Summary.Cell index={hasCheckbox ? 1 : 0}>
              <strong>Gesamt</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={hasCheckbox ? 2 : 1} align="right">
              <strong>{formatDuration(totals.duration)}</strong>
            </Table.Summary.Cell>
            {mode === 'invoice' && <Table.Summary.Cell index={2} />}
            <Table.Summary.Cell index={hasCheckbox ? 3 : 3} align="right">
              <strong>{formatCurrency(totals.cost)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={hasCheckbox ? 4 : 4} />
            {mode === 'project' && <Table.Summary.Cell index={hasCheckbox ? 5 : 5} />}
          </Table.Summary.Row>
        </Table.Summary>
      )
    : onAdd
      ? () => (
          <Table.Summary>
            {addRowInSummary}
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

  if (!useDnd) return tableEl;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sortedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tableEl}
      </SortableContext>
    </DndContext>
  );
}
