import { useStore } from '../store/useStore';

export default function ModalHost() {
  const modal = useStore((s) => s.modal);
  const closeModal = useStore((s) => s.closeModal);
  if (!modal) return null;
  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
      {modal}
    </div>
  );
}
