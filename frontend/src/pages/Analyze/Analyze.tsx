import { useState } from "react";

import { patientsApi } from "@/api/patients";
import { ApiError } from "@/api/client";
import { Stepper } from "@/components/analysis/Stepper";
import { SectionHeading } from "@/components/common/SectionHeading";
import { useToast } from "@/context/ToastContext";
import { StepMRIUpload } from "@/pages/Analyze/StepMRIUpload";
import { StepPersonalDetails, type PersonalDetails } from "@/pages/Analyze/StepPersonalDetails";
import { StepRunAnalysis } from "@/pages/Analyze/StepRunAnalysis";

const STEPS = [{ label: "Personal Details" }, { label: "MRI Upload" }, { label: "Analysis" }];

const EMPTY_DETAILS: PersonalDetails = {
  full_name: "",
  age_years: "",
  sex: "U",
  blood_group: "",
  weight_kg: "",
  photo: null,
};

export default function Analyze() {
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState<PersonalDetails>(EMPTY_DETAILS);
  const [caseId, setCaseId] = useState<number | null>(null);
  const [mriFile, setMriFile] = useState<File | null>(null);
  const [creatingCase, setCreatingCase] = useState(false);
  const { push } = useToast();

  async function onPersonalDetailsContinue() {
    setCreatingCase(true);
    try {
      const created = await patientsApi.createCase({
        full_name: details.full_name.trim(),
        age_years: details.age_years ? Number(details.age_years) : null,
        sex: details.sex,
        blood_group: details.blood_group,
        weight_kg: details.weight_kg ? Number(details.weight_kg) : null,
        photo: details.photo,
      });
      setCaseId(created.id);
      setStep(2);
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Couldn't save details. Please try again.", "danger");
    } finally {
      setCreatingCase(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <SectionHeading eyebrow="New analysis" title="Analyze an MRI" description="Complete each step to run the hybrid CNN + Swin Transformer pipeline." />

      <Stepper steps={STEPS} current={step} />

      {step === 1 && (
        <StepPersonalDetails value={details} onChange={setDetails} onContinue={onPersonalDetailsContinue} loading={creatingCase} />
      )}

      {step === 2 && (
        <StepMRIUpload file={mriFile} onChange={setMriFile} onBack={() => setStep(1)} onContinue={() => setStep(3)} />
      )}

      {step === 3 && caseId && mriFile && (
        <StepRunAnalysis
          details={details}
          caseId={caseId}
          file={mriFile}
          onBack={() => setStep(2)}
          onQualityRejected={() => {
            setMriFile(null);
            setStep(2);
          }}
        />
      )}
    </div>
  );
}
