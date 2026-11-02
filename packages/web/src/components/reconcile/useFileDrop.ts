import { useEffect, useRef, useState, type DragEvent as ReactDragEvent } from 'react';

const hasFiles = (e: ReactDragEvent | DragEvent) => !!e.dataTransfer?.types.includes('Files');

/**
 * Makes a whole element a drop zone for one file: `dragging` while a file is
 * held over it, `onFile` with the first file dropped. The drop is taken in the
 * capture phase, so an antd Upload inside does not handle it a second time.
 */
export function useFileDrop(onFile: (file: File) => void) {
  const [dragging, setDragging] = useState(false);
  // dragenter/dragleave also fire for every child; count to know when the pointer really left.
  const depth = useRef(0);

  const props = {
    onDragEnter: (e: ReactDragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current += 1;
      setDragging(true);
    },
    onDragOver: (e: ReactDragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: (e: ReactDragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    },
    onDropCapture: (e: ReactDragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      depth.current = 0;
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
  };

  return { dragging, props };
}

/** A file dropped beside every drop zone would open in the tab and take the unsaved forms with it. */
export function useNoStrayDrop() {
  useEffect(() => {
    const guard = (e: DragEvent) => {
      if (!hasFiles(e) || e.defaultPrevented) return;
      e.preventDefault();
      if (e.type === 'dragover') e.dataTransfer!.dropEffect = 'none';
    };
    window.addEventListener('dragover', guard);
    window.addEventListener('drop', guard);
    return () => {
      window.removeEventListener('dragover', guard);
      window.removeEventListener('drop', guard);
    };
  }, []);
}
