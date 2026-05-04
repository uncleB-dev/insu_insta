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
 *
 * Two interlocking problems break controlled React inputs:
 *   1. Every keystroke triggers parent setState → full re-render → React's
 *      controlled `value` prop fights the IME mid-composition → cursor jumps,
 *      duplicated chars, swallowed chars.
 *   2. During composition the DOM textarea has a partial value (e.g. "ㅎ")
 *      that differs from React's last-committed value. If we call setState
 *      with that partial value, the next render forces the DOM back to the
 *      stored value, breaking IME.
 *
 * Solution: leave the textarea **uncontrolled** while composing.
 *   - On compositionstart: set a flag, ignore input events.
 *   - On compositionend: read the final value from the DOM and sync.
 *   - Outside composition: behave like a normal debounced controlled input.
 *
 * Also debounces the upstream onChange (default 350 ms) so heavy parent work
 * (guardrail eval, server save, slide list re-render) only runs after a pause.
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
  const localRef = useRef(local);
  const onChangeRef = useRef(onChange);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // Keep refs in sync with the latest values for unmount cleanup
  useEffect(() => {
    localRef.current = local;
  }, [local]);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Adopt external value changes (slide switch etc.) only when not editing
  useEffect(() => {
    if (composingRef.current) return;
    if (value !== lastSentRef.current && value !== local) {
      setLocal(value);
      lastSentRef.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Flush on unmount so an in-flight timer doesn't lose the user's input
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (localRef.current !== lastSentRef.current) {
        lastSentRef.current = localRef.current;
        onChangeRef.current(localRef.current);
      }
    };
  }, []);

  const scheduleCommit = (next: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lastSentRef.current = next;
      onChangeRef.current(next);
    }, delay);
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    // During composition, don't touch React state. Let the browser/IME
    // own the textarea value natively. We'll sync on compositionend.
    if (composingRef.current) return;
    const next = e.target.value;
    setLocal(next);
    scheduleCommit(next);
  };

  const handleCompositionStart = (_e: CompositionEvent<HTMLTextAreaElement>) => {
    composingRef.current = true;
    // Cancel any pending commit so it doesn't fire mid-composition
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleCompositionEnd = (e: CompositionEvent<HTMLTextAreaElement>) => {
    composingRef.current = false;
    const next = (e.target as HTMLTextAreaElement).value;
    setLocal(next);
    scheduleCommit(next);
  };

  return (
    <textarea
      ref={taRef}
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
