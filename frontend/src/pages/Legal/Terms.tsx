import { LegalPage } from "@/pages/Legal/LegalPage";

export default function Terms() {
  return (
    <LegalPage title="Terms" updated="research preview">
      <p>
        By using NeuroVista, you agree that this platform is provided for research and educational purposes only,
        with no warranty of accuracy, availability, or fitness for any clinical purpose.
      </p>
      <h3>Not medical advice</h3>
      <p>
        Model output is a statistical prediction, not a medical diagnosis. It must not be used to diagnose, treat, or
        make care decisions for any patient, and does not replace evaluation by a qualified professional.
      </p>
      <h3>No warranty</h3>
      <p>
        The system is provided "as is." Model performance is bounded by its training data and may not generalize to
        scans acquired under different conditions or protocols.
      </p>
    </LegalPage>
  );
}
