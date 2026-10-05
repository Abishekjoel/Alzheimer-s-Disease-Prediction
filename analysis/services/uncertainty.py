"""
Uncertainty estimation.

IMPORTANT — what this module does NOT claim:
The "uncertainty score" and "confidence" values produced here describe how
consistent/peaked THIS MODEL'S output distribution is for a given input.
They are a property of the model's statistical behavior, not a clinical
probability. A LOW uncertainty score means the model is internally
consistent about its prediction — it does NOT mean the patient has a low
or high probability of clinically having Alzheimer's disease, and it must
never be presented to a user as such. All API responses and generated
reports that surface this value must keep it labeled as "model
uncertainty" and pair it with the disclaimer that this system does not
perform medical diagnosis (see analysis.services.report_generator).
"""

import math

import torch

from ml.config import UNCERTAINTY_CONFIG


def classify_uncertainty_level(score: float, config=None) -> str:
    cfg = config or UNCERTAINTY_CONFIG
    if score <= cfg["low_threshold"]:
        return "LOW"
    if score <= cfg["high_threshold"]:
        return "MEDIUM"
    return "HIGH"


def _normalized_entropy(probabilities, num_classes) -> float:
    eps = 1e-12
    entropy = -sum(p * math.log(p + eps) for p in probabilities)
    max_entropy = math.log(num_classes)
    return float(entropy / max_entropy) if max_entropy > 0 else 0.0


def estimate_uncertainty_entropy(probabilities: list) -> dict:
    """Normalized Shannon entropy of the softmax distribution, in [0, 1].
    A single deterministic forward pass — cheapest method, no repeated
    sampling required."""
    num_classes = len(probabilities)
    score = _normalized_entropy(probabilities, num_classes)
    return {"method": "entropy", "uncertainty_score": round(score, 4)}


def estimate_uncertainty_margin(probabilities: list) -> dict:
    """1 - (top1_prob - top2_prob): small margin between the top two
    classes means the model is torn between two diagnoses."""
    sorted_probs = sorted(probabilities, reverse=True)
    margin = sorted_probs[0] - sorted_probs[1] if len(sorted_probs) > 1 else sorted_probs[0]
    score = 1.0 - margin
    return {"method": "margin", "uncertainty_score": round(float(score), 4)}


@torch.no_grad()
def estimate_uncertainty_mc_dropout(model, image_tensor, num_classes, passes=None, device=None) -> dict:
    """Monte Carlo Dropout (Gal & Ghahramani, 2016): keeps dropout active
    at inference time and runs multiple stochastic forward passes. The
    mean prediction is used as the final probability estimate; the
    normalized entropy of that MEAN distribution is used as the
    uncertainty score (captures both per-pass ambiguity and disagreement
    across passes, since disagreement flattens the averaged distribution).

    `image_tensor`: single preprocessed image tensor, shape (3, H, W) — a
    batch dimension is added internally.
    """
    cfg = UNCERTAINTY_CONFIG
    n_passes = passes or cfg["mc_dropout_passes"]

    model.enable_mc_dropout()
    single = image_tensor.unsqueeze(0)
    if device is not None:
        single = single.to(device)

    # One batched forward pass instead of `n_passes` sequential ones. This
    # is mathematically identical, not an approximation: BatchNorm stays
    # in eval mode (enable_mc_dropout only flips Dropout to train), so it
    # uses fixed running statistics and is unaffected by what else is in
    # the batch — each of the n_passes replicated copies still gets its
    # own independently-sampled dropout mask, exactly as the sequential
    # loop produced, just computed together instead of one at a time.
    batch = single.repeat(n_passes, 1, 1, 1)
    outputs = model(batch)
    stacked = outputs["probabilities"].cpu()  # (passes, num_classes)
    mean_probs = stacked.mean(dim=0)
    std_probs = stacked.std(dim=0)

    score = _normalized_entropy(mean_probs.tolist(), num_classes)

    model.eval()  # restore fully deterministic mode for any caller reusing the model

    return {
        "method": "mc_dropout",
        "passes": n_passes,
        "mean_probabilities": mean_probs.tolist(),
        "std_probabilities": std_probs.tolist(),
        "uncertainty_score": round(score, 4),
    }


def estimate_uncertainty(model, image_tensor, probabilities=None, method=None, device=None) -> dict:
    """Dispatches to the configured method (ml.config.UNCERTAINTY_CONFIG).
    Always returns:
        {
            "method": str,
            "uncertainty_score": float in [0, 1],
            "uncertainty_level": "LOW" | "MEDIUM" | "HIGH",
            ... method-specific extra fields ...
        }
    """
    cfg = UNCERTAINTY_CONFIG
    selected_method = method or cfg["method"]
    num_classes = model.num_classes

    if selected_method == "mc_dropout":
        result = estimate_uncertainty_mc_dropout(model, image_tensor, num_classes, device=device)
    elif selected_method == "entropy":
        if probabilities is None:
            raise ValueError("probabilities must be provided for the 'entropy' uncertainty method.")
        result = estimate_uncertainty_entropy(probabilities)
    elif selected_method == "margin":
        if probabilities is None:
            raise ValueError("probabilities must be provided for the 'margin' uncertainty method.")
        result = estimate_uncertainty_margin(probabilities)
    else:
        raise ValueError(f"Unknown uncertainty method '{selected_method}'")

    result["uncertainty_level"] = classify_uncertainty_level(result["uncertainty_score"], cfg)
    return result
