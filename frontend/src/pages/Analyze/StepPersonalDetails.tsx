import { ArrowRight, Droplet, User, Weight } from "lucide-react";
import { useEffect, useState } from "react";

import { PhotoPicker } from "@/components/common/PhotoPicker";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { BloodGroup, CaseSex } from "@/types/api";

export interface PersonalDetails {
  full_name: string;
  age_years: string;
  sex: CaseSex;
  blood_group: BloodGroup;
  weight_kg: string;
  photo: File | null;
}

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface StepPersonalDetailsProps {
  value: PersonalDetails;
  onChange: (value: PersonalDetails) => void;
  onContinue: () => void;
  loading: boolean;
}

function validate(v: PersonalDetails): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!v.full_name.trim()) errors.full_name = "Full name is required.";
  if (v.age_years) {
    const age = Number(v.age_years);
    if (!Number.isInteger(age) || age < 0 || age > 130) errors.age_years = "Enter a valid age (0–130).";
  }
  if (v.weight_kg) {
    const weight = Number(v.weight_kg);
    if (!(weight > 0) || weight > 500) errors.weight_kg = "Enter a valid weight (0–500 kg).";
  }
  if (v.sex === "U") errors.sex = "Please select a gender.";
  return errors;
}

export function StepPersonalDetails({ value, onChange, onContinue, loading }: StepPersonalDetailsProps) {
  const [touched, setTouched] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const errors = validate(value);
  const hasErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    if (!value.photo) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value.photo);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value.photo]);

  function set<K extends keyof PersonalDetails>(key: K, val: PersonalDetails[K]) {
    onChange({ ...value, [key]: val });
  }

  function handleContinue() {
    setTouched(true);
    if (!hasErrors) onContinue();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Card className="flex flex-col gap-4">
        <Input
          label="Full name"
          value={value.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          error={touched ? errors.full_name : undefined}
          placeholder="e.g. Abishek Joel"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Age"
            type="number"
            min={0}
            max={130}
            value={value.age_years}
            onChange={(e) => set("age_years", e.target.value)}
            error={touched ? errors.age_years : undefined}
            placeholder="52"
          />
          <Input
            label="Weight (kg)"
            type="number"
            min={0}
            max={500}
            step="0.1"
            iconLeft={<Weight />}
            value={value.weight_kg}
            onChange={(e) => set("weight_kg", e.target.value)}
            error={touched ? errors.weight_kg : undefined}
            placeholder="68"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Gender" value={value.sex} onChange={(e) => set("sex", e.target.value as CaseSex)}>
            <option value="U">Select gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </Select>
          <Select label="Blood group" value={value.blood_group} onChange={(e) => set("blood_group", e.target.value as BloodGroup)}>
            <option value="">Unknown</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </Select>
        </div>
        {touched && errors.sex && <p className="-mt-2 text-[12px] text-danger">{errors.sex}</p>}

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-[13px] font-medium text-ink-muted">Photo (optional)</p>
          <PhotoPicker file={value.photo} onChange={(file) => set("photo", file)} />
        </div>

        <Button size="lg" iconRight={<ArrowRight />} onClick={handleContinue} loading={loading} className="mt-2 w-full sm:w-fit">
          Continue to MRI upload
        </Button>
      </Card>

      <Card className="flex flex-col items-center gap-4 bg-surface-elevated text-center">
        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Profile preview</span>
        <div className="flex size-24 items-center justify-center overflow-hidden rounded-full border border-border-strong bg-surface">
          {photoPreviewUrl ? (
            <img src={photoPreviewUrl} alt="" className="size-full object-cover" />
          ) : (
            <User className="size-9 text-ink-subtle" />
          )}
        </div>
        <div>
          <p className="text-[16px] font-semibold text-ink">{value.full_name || "Full name"}</p>
          <div className="mt-2 flex flex-col gap-1.5 text-[13px] text-ink-muted">
            <span>Age: {value.age_years || "—"}</span>
            <span className="flex items-center justify-center gap-1.5">
              <Droplet className="size-3.5" /> Blood Group: {value.blood_group || "—"}
            </span>
            <span>Weight: {value.weight_kg ? `${value.weight_kg} kg` : "—"}</span>
            <span>Gender: {value.sex === "M" ? "Male" : value.sex === "F" ? "Female" : "—"}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
