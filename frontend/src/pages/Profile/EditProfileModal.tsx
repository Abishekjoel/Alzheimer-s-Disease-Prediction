import { Camera } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import { authApi } from "@/api/auth";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { BloodGroup, User } from "@/types/api";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function EditProfileModal({ open, onClose, user }: { open: boolean; onClose: () => void; user: User }) {
  const { setUser } = useAuth();
  const { push } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user.profile?.full_name ?? "");
  const [institution, setInstitution] = useState(user.profile?.institution ?? "");
  const [dob, setDob] = useState(user.profile?.date_of_birth ?? "");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(user.profile?.blood_group ?? ("" as BloodGroup));
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.profile?.profile_picture_url ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPictureFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const updated = await authApi.updateProfile({
        full_name: fullName,
        institution,
        date_of_birth: dob || null,
        blood_group: bloodGroup,
        profile_picture: pictureFile,
      });
      setUser(updated);
      push("Profile updated.", "success");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update your profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit profile" size="sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-strong bg-surface-elevated"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Profile preview" className="size-full object-cover" />
            ) : (
              <span className="text-lg font-semibold text-primary">{user.username.slice(0, 2).toUpperCase()}</span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-5 text-white" />
            </span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={onPictureChange} />
          <p className="text-[12px] text-ink-subtle">Click the avatar to change your profile picture (JPG or PNG).</p>
        </div>

        <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
        <Input label="Institution" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="University / lab name" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date of birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
          <Select label="Blood group" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}>
            <option value="">Unknown</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </Select>
        </div>

        {error && (
          <p role="alert" className="rounded-[var(--radius-md)] border border-danger/25 bg-danger-soft px-3 py-2 text-[13px] text-danger">
            {error}
          </p>
        )}

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
