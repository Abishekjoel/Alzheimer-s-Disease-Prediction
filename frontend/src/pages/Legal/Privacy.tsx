import { LegalPage } from "@/pages/Legal/LegalPage";

export default function Privacy() {
  return (
    <LegalPage title="Privacy" updated="research preview">
      <p>
        NeuroVista is a research and educational platform. Case records store only a generated case ID, an optional
        age band, sex, and free-text notes — no names, dates of birth, or other directly-identifying information are
        collected.
      </p>
      <h3>What we store</h3>
      <p>
        Uploaded MRI images, generated Grad-CAM/attention visualizations, and prediction results are stored and
        associated with your account so you can review your analysis history.
      </p>
      <h3>What we don't do</h3>
      <p>We don't sell data, and we don't share uploaded images or results with third parties.</p>
      <h3>Research use</h3>
      <p>This system has not undergone clinical validation. It is intended for research and educational use only.</p>
    </LegalPage>
  );
}
