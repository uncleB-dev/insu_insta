'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CompositionEvent,
  type CSSProperties,
} from 'react';

/**
 * IME-safe debounced textarea.
 *
 * Why this exists
 * ----------------
 * Korean (and other CJK) input goes through a 2-step composition:
 *   ㅎ → 하 → 한
 * If the parent re-renders during composition (because every keystroke
 * fires onChange → parent setState → full re-render), the IME composition
 * gets interrupted, characters get duplicated/dropped, or the cursor
 * jumps unexpectedly.
 *
 * This component:
 * 1. Holds a *local* string state so typing is instant and isolated from
 *    parent re-renders.
 * 2. Debounces the upstream onChange (default 350 ms) so heavy work
 *    (guardrail re-evaluation, server save, slide list re-render) only
 *    runs after the user pauses typing.
 * 3. Tracks composition events; never commits a change while composing.
 * 4. Adopts external value changes only when not actively editing.
 */
export function DebouncedTextarea({
  value,
  onChange,
  delay = 350,
  className,
  style,
  rows,
  placeholder,
  disabled,
  onFocus,
  onBlur,
}: {
  value: string;
  onChange: (next: string) => void;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
}) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composingRef = useRef(false);
  const lastSentRef = useRef(value);

  // Sync external value changes (e.g. switching slides) when not editing.
  useEffect(() => {
    if (composingRef.current) return;
    if (value !== lastSentRef.current) {
      setLocal(value);
      lastSentRef.current = value;
    }
  }, [value]);

  // Flush on unmount so an in-flight timer doesn't lose user input.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // Final commit if local diverges from last-sent
        if (local !== lastSentRef.current) {
          lastSentRef.current = local;
          onChange(local);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleCommit = (next: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lastSentRef.current = next;
      onChange(next);
    }, delay);
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setLocal(next);
    if (!composingRef.current) scheduleCommit(next);
  };

  const handleCompositionStart = (_e: CompositionEvent<HTMLTextAreaElement>) => {
    composingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleCompositionEnd = (e: CompositionEvent<HTMLTextAreaElement>) => {
    composingRef.current = false;
    const next = (e.target as HTMLTextAreaElement).value;
    setLocal(next);
    scheduleCommit(next);
  };

  return (
    <textarea
      value={local}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onFocus={onFocus}
      onBlur={onBlur}
      className={className}
      style={style}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
