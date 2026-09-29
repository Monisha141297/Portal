import { useStore } from '../store/useStore';

export default function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div id="toast">
      {toasts.map((t) => (
        <div key={t.id} className={'toast ' + (t.kind || '')}>{t.text}</div>
      ))}
    </div>
  );
}
