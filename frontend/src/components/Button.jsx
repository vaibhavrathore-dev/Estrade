export default function Button({ variant = 'primary', busy = false, disabled, children, type = 'button', className = '', ...props }) {
  return <button {...props} type={type} disabled={disabled || busy} aria-busy={busy || undefined} className={`operation-button operation-${variant} ${className}`}>{busy ? 'Processing…' : children}</button>;
}
