import React, { useId, useState } from 'react';
import type { FieldErrors } from '../lib/validation';

export function useFormValidation(rules: FieldErrors) {
  const prefix = useId();
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  return {
    validate() {
      setSubmitted(true);
      setServerErrors({});
      const first = Object.keys(rules).find((key) => rules[key]);
      if (first)
        requestAnimationFrame(() => document.getElementById(`${prefix}-${first}`)?.focus());
      return !first;
    },
    field(key: string, label: string) {
      return {
        id: `${prefix}-${key}`,
        name: key,
        'aria-label': label,
        error: serverErrors[key] || (submitted || touched[key] ? rules[key] : undefined),
        onBlur: () => setTouched((t) => ({ ...t, [key]: true })),
        onInput: () => setServerErrors((e) => ({ ...e, [key]: undefined })),
      };
    },
    error(key: string) {
      return serverErrors[key] || (submitted || touched[key] ? rules[key] : undefined);
    },
    server(error: unknown) {
      setServerErrors((error as { fields?: FieldErrors })?.fields || {});
    },
    reset() {
      setSubmitted(false);
      setTouched({});
      setServerErrors({});
    },
  };
}
export function ValidationInput({
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <>
      <input
        {...props}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : props['aria-describedby']}
      />
      {error && (
        <p id={`${props.id}-error`} role="status" className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </>
  );
}
export function ValidationSelect({
  error,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <>
      <select
        {...props}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : props['aria-describedby']}
      />
      {error && (
        <p id={`${props.id}-error`} role="status" className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </>
  );
}
