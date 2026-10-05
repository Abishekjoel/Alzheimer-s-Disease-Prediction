import { SectionHeading } from "@/components/common/SectionHeading";
import { Card } from "@/components/ui/Card";

const SECTIONS = [
  {
    title: "Feature extraction",
    body: "A ResNet50 branch (ImageNet-pretrained) extracts local texture and fine-grained structural detail. A Swin Transformer branch (swin_tiny_patch4_window7_224) extracts broader, windowed contextual relationships across the slice. Both produce a fixed-length feature vector — neither performs classification on its own.",
  },
  {
    title: "Attention-gated fusion",
    body: "Both feature vectors are projected into a shared space, then treated as a 2-token sequence and refined through multi-head cross-attention. A sigmoid gate computed from the refined vectors decides, per feature channel, how much to weight CNN evidence vs. Swin evidence — a per-channel convex combination, more expressive than a single fixed scalar weight.",
  },
  {
    title: "Classification",
    body: "The fused representation passes through a small classifier head to produce logits over three classes (CN / MCI / AD), softmax probabilities, and a predicted class.",
  },
  {
    title: "Uncertainty estimation",
    body: "Monte Carlo Dropout (multiple stochastic forward passes with dropout active at inference) by default; the normalized entropy of the averaged prediction becomes the uncertainty score, bucketed into LOW / MEDIUM / HIGH. This reflects the model's own statistical consistency — not a clinical probability.",
  },
  {
    title: "Explainability",
    body: "Grad-CAM hooks the CNN branch's last residual block to compute a real gradient-weighted activation map for the predicted class. Swin attention is extracted by hooking the real softmax layer inside the transformer's window attention module and reconstructing a full-resolution map from the actual attention weights — neither is fabricated after the fact.",
  },
  {
    title: "Evaluation & ablation",
    body: "Accuracy, precision/recall/F1 (macro and per-class), sensitivity/specificity, and ROC-AUC are computed on held-out test data. An ablation framework trains and evaluates five configurations — CNN only, Swin only, naive concatenation, basic weighted fusion, and the proposed attention-gated fusion — under identical conditions.",
  },
];

export default function Research() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <SectionHeading
        eyebrow="Research"
        title="Methodology"
        description="How the hybrid CNN + Swin Transformer pipeline actually works, end to end."
        className="mb-14"
      />

      <div className="flex flex-col gap-4">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <h3 className="text-[14.5px] font-semibold text-ink">{section.title}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{section.body}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-8 border-warning/25 bg-warning-soft">
        <h3 className="text-[14px] font-semibold text-ink">Research limitations</h3>
        <ul className="mt-3 flex flex-col gap-2 text-[13px] leading-relaxed text-ink-muted">
          <li>• No real MRI dataset or trained weights ship by default — fresh installs run in demo mode, clearly labeled.</li>
          <li>• No clinical validation has been performed against any radiologist panel or regulatory process.</li>
          <li>• Model performance depends on the quality, size, and distribution of whatever dataset trains it.</li>
          <li>• A model trained on one dataset's distribution may not generalize to scans from different protocols.</li>
        </ul>
      </Card>
    </div>
  );
}
