import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Role, UserStatus } from '../../types';

export function openUserEditor(id: string | null) {
  useStore.getState().openModal(<UserEditorModal id={id} />);
}

function UserEditorModal({ id }: { id: string | null }) {
  const users = useStore((s) => s.users);
  const saveUser = useStore((s) => s.saveUser);
  const closeModal = useStore((s) => s.closeModal);
  const toast = useStore((s) => s.toast);

  const existing = id ? users.find((u) => u.id === id) : null;
  const [emp, setEmp] = useState(existing?.emp || '');
  const [name, setName] = useState(existing?.name || '');
  const [role, setRole] = useState<Role>(existing?.role || 'participant');
  const [desig, setDesig] = useState(existing?.desig || '');
  const [dept, setDept] = useState(existing?.dept || '');
  const [plant, setPlant] = useState(existing?.plant || '');
  const [location, setLocation] = useState(existing?.location || '');
  const [mobile, setMobile] = useState(existing?.mobile || '');
  const [status, setStatus] = useState<UserStatus>(existing?.status || 'Active');

  function submit() {
    const empClean = emp.trim().toUpperCase();
    if (!empClean || !name.trim()) { toast('Employee ID and name are required', 'bad'); return; }
    const err = saveUser(id, { emp: empClean, name: name.trim(), role, desig, dept, plant, location, mobile, status });
    if (err === 'dup') { toast('That Employee ID already exists', 'bad'); return; }
    closeModal();
    toast('User saved', 'ok');
  }

  return (
    <div className="modal">
      <div className="modal-h"><h3>{id ? 'Edit' : 'Create'} user</h3><button className="btn ghost" onClick={closeModal}>✕</button></div>
      <div className="modal-b">
        <div className="fieldrow">
          <div><label className="f">Employee ID <span className="req">*</span></label><input className="inp mono" value={emp} onChange={(e) => setEmp(e.target.value)} placeholder="EMP1008" /></div>
          <div><label className="f">Full name <span className="req">*</span></label><input className="inp" value={name} onChange={(e) => setName(e.target.value)} /></div>
        </div>
        <div className="fieldrow mt">
          <div><label className="f">Application role</label>
            <select className="inp" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option>participant</option><option>trainer</option><option>admin</option>
            </select>
          </div>
          <div><label className="f">Designation</label><input className="inp" value={desig} onChange={(e) => setDesig(e.target.value)} /></div>
        </div>
        <div className="fieldrow mt">
          <div><label className="f">Department</label><input className="inp" value={dept} onChange={(e) => setDept(e.target.value)} /></div>
          <div><label className="f">Plant</label><input className="inp" value={plant} onChange={(e) => setPlant(e.target.value)} /></div>
        </div>
        <div className="fieldrow mt">
          <div><label className="f">Location</label><input className="inp" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          <div><label className="f">Registered mobile (for OTP)</label><input className="inp" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="98••••1234" /></div>
        </div>
        <label className="f mt">Account status</label>
        <select className="inp" value={status} onChange={(e) => setStatus(e.target.value as UserStatus)}>
          <option>Active</option><option>Inactive</option>
        </select>
        <div className="hint">The administrator manages users and access only. Learning content, question banks and examinations are managed by trainers.</div>
      </div>
      <div className="modal-f"><button className="btn" onClick={closeModal}>Cancel</button><button className="btn pri" onClick={submit}>Save user</button></div>
    </div>
  );
}
