import { useState } from 'react';
import { DatePicker } from 'antd';
import type { DatePickerProps } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

/**
 * DatePicker with keyboard arrow-key stepping (when popup is closed):
 *   ↑ / ↓        → ±1 day
 *   Shift+↑ / ↓  → ±7 days (1 week)
 */
export default function SmartDatePicker({ onOpenChange, onChange, ...props }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isOpen) return;
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

    e.preventDefault();
    e.stopPropagation();

    const current = props.value ? dayjs(props.value as Dayjs) : dayjs();
    const delta = e.key === 'ArrowUp' ? 1 : -1;
    const days = e.shiftKey ? 7 : 1;
    const next = current.add(delta * days, 'day');

    onChange?.(next, next.format('DD.MM.YYYY'));
  };

  return (
    <div onKeyDownCapture={handleKeyDown} style={{ display: 'contents' }}>
      <DatePicker
        {...props}
        onChange={onChange}
        onOpenChange={(open) => {
          setIsOpen(open);
          onOpenChange?.(open);
        }}
      />
    </div>
  );
}
