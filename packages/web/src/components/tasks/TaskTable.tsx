import { useMemo } from 'react';
import {
  Table, Checkbox, Button, Space, Popconfirm, Input, InputNumber, DatePicker,
} from 'antd';
import {
  EditOutlined, DeleteOutlined, UnorderedListOutlined,
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
  showSummary = true,
}: TaskTableProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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
      if (editable && r.fixedDuration != null && r.fixedDuration !== '') {
        return (
          <InputNumber
            value={Number(r.fixedDuration)}
            min={0}
            step={0.25}
            style={{ width: 90 }}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v !== Number(r.fixedDuration)) {
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
          <Input
            defaultValue={r.name}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => {
              if (e.target.value && e.target.value !== r.name) {
                onUpdate!(r.id, { name: e.target.value });
              }
            }}
          />
        );
      }
      return r.name;
    },
  });

  if (mode === 'project') {
    columns.push({
      title: '', key: 'actions', width: 140,
      render: (_: any, r: any) => (
        <Space onClick={(e) => e.stopPropagation()}>
          {onShowSessions && (
            <Button size="small" icon={<UnorderedListOutlined />} onClick={() => onShowSessions(r)} />
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

  if (!useDnd) return tableEl;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sortedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tableEl}
      </SortableContext>
    </DndContext>
  );
}
