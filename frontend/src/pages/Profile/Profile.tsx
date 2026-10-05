import { Building2, Cake, Calendar, Droplet, Mail, Pencil, ShieldCheck, User as UserIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/common/SectionHeading";
import { useAuth } from "@/context/AuthContext";
import { EditProfileModal } from "@/pages/Profile/EditProfileModal";
import { UNSPLASH } from "@/utils/images";
import { formatDate, titleCase } from "@/utils/format";

function InfoTile({ icon: Icon, label, value }: { icon: typeof UserIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-bg px-4 py-3">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary-soft text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">{label}</p>
        <p className="mt-0.5 truncate text-[13.5px] font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  if (!user) return null;
  // `profile` is null for accounts created outside the normal registration
  // flow (e.g. `manage.py createsuperuser`), which never creates the
  // related UserProfile row — every field below needs a fallback.
  const profile = user.profile;

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading eyebrow="Account" title="Profile" className="mb-8" />

      <Card padding="none" className="overflow-hidden">
        <div
          className="h-28 bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(rgba(11,16,32,0.35), rgba(11,16,32,0.55)), url(${UNSPLASH.iridescentBrain(1200)})` }}
        />
        <div className="flex flex-col items-center gap-3 px-6 pb-6 sm:flex-row sm:items-end sm:gap-5">
          <div className="-mt-10 flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-primary-soft text-2xl font-semibold text-primary shadow-[var(--shadow-md)]">
            {profile?.profile_picture_url ? (
              <img src={profile.profile_picture_url} alt="Profile" className="size-full object-cover" />
            ) : (
              user.username.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1 pt-2 text-center sm:pt-0 sm:text-left">
            <h2 className="truncate text-lg font-semibold text-ink">{profile?.full_name || user.username}</h2>
            {profile && (
              <Badge tone="primary" icon={<ShieldCheck />} className="mt-1.5">
                {titleCase(profile.role)}
              </Badge>
            )}
          </div>
          <Button variant="secondary" size="sm" iconLeft={<Pencil />} onClick={() => setEditOpen(true)} className="shrink-0">
            Edit profile
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-border p-6 sm:grid-cols-2">
          <InfoTile icon={Mail} label="Email" value={user.email} />
          <InfoTile icon={Building2} label="Institution" value={profile?.institution || "Not specified"} />
          <InfoTile icon={Cake} label="Date of birth" value={profile?.date_of_birth ? formatDate(profile.date_of_birth) : "Not specified"} />
          <InfoTile icon={UserIcon} label="Age" value={profile?.age !== null && profile?.age !== undefined ? `${profile.age} years` : "Not specified"} />
          <InfoTile icon={Droplet} label="Blood group" value={profile?.blood_group || "Not specified"} />
          <InfoTile icon={Calendar} label="Member since" value={formatDate(user.date_joined)} />
        </div>
      </Card>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} user={user} />
    </div>
  );
}
