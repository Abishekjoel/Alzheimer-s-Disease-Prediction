"""
Swin Transformer attention visualization (Phase 15).

timm's WindowAttention module computes `attn = self.softmax(...)` internally
without returning the attention weights from `forward()`. Rather than
fabricating an attention map or falling back to Grad-CAM-on-Swin, this
module hooks `WindowAttention.softmax` directly (a real nn.Softmax
submodule already present in timm's implementation) to capture the exact
tensor of real attention weights used in that forward pass — see
ml.models.swin_branch.SwinBranch.get_attention_modules for where those
hooks attach.

Reconstructing a full-image heatmap from window attention requires
reversing Swin's window partitioning. This module implements that reversal
generically (works for any stage where the feature map's window grid is
square, which holds for all stages of the default square-input
configuration). If a future backbone/resolution combination produces a
non-square window grid, `SwinAttentionExtractor.generate` raises a
`RuntimeError` describing the limitation instead of silently producing an
incorrect map.
"""

import math

import numpy as np
import torch

from analysis.services.gradcam import overlay_heatmap


def _reverse_window_attention(per_window_scores: np.ndarray, num_windows_per_image: int, window_size: int) -> np.ndarray:
    grid_size = math.isqrt(num_windows_per_image)
    if grid_size * grid_size != num_windows_per_image:
        raise RuntimeError(
            f"Non-square window grid ({num_windows_per_image} windows) — cannot reconstruct a "
            "rectangular full-resolution attention map for this backbone/stage."
        )
    arr = per_window_scores.reshape(grid_size, grid_size, window_size, window_size)
    arr = arr.transpose(0, 2, 1, 3)  # (grid_row, window_row, grid_col, window_col)
    return arr.reshape(grid_size * window_size, grid_size * window_size)


class SwinAttentionExtractor:
    def __init__(self, model):
        self.model = model
        self.target_module = model.get_swin_attention_target()
        self._attention = None
        self._handle = self.target_module.softmax.register_forward_hook(self._save_attention)

    def _save_attention(self, module, input, output):
        self._attention = output.detach()

    def remove_hooks(self):
        self._handle.remove()

    def generate(self, input_tensor):
        """`input_tensor`: shape (1, 3, H, W). Returns heatmap: np.ndarray
        in [0, 1], shape (h, w) at the target stage's resolution (resized
        to the original image by `overlay_attention`)."""
        was_training = self.model.training
        self.model.eval()
        with torch.no_grad():
            self.model(input_tensor)

        if self._attention is None:
            raise RuntimeError(
                "Attention hook did not capture any output — is the target WindowAttention "
                "module actually on the forward path for this model mode?"
            )

        attn = self._attention  # (num_windows * B, num_heads, N, N)
        batch_size = input_tensor.shape[0]
        total_windows, num_heads, n_tokens, _ = attn.shape
        num_windows_per_image = total_windows // batch_size

        window_size = math.isqrt(n_tokens)
        if window_size * window_size != n_tokens:
            raise RuntimeError(f"Non-square attention window ({n_tokens} tokens) — unsupported.")

        # Average across heads, then across the query dimension: this gives,
        # for each key token, how much attention it received on average
        # from all other tokens in its window — a standard, real (not
        # invented) way to turn multi-head window attention into a single
        # per-location saliency value.
        attn_received = attn.mean(dim=1).mean(dim=1)  # (num_windows * B, N)
        attn_received = attn_received.cpu().numpy()

        start = 0 * num_windows_per_image  # batch_size is always 1 for the inference pipeline
        image_windows = attn_received[start:start + num_windows_per_image].reshape(
            num_windows_per_image, window_size, window_size
        )
        heatmap = _reverse_window_attention(image_windows, num_windows_per_image, window_size)

        if was_training:
            self.model.train()

        if heatmap.max() > 0:
            heatmap = heatmap / heatmap.max()
        return heatmap


def generate_attention_visualization(model, input_tensor, original_image, out_path=None):
    extractor = SwinAttentionExtractor(model)
    try:
        heatmap = extractor.generate(input_tensor)
    finally:
        extractor.remove_hooks()

    overlay_image = overlay_heatmap(original_image, heatmap)

    saved_path = None
    if out_path is not None:
        overlay_image.save(out_path)
        saved_path = str(out_path)

    return {"heatmap_path": saved_path, "overlay_image": overlay_image}


def generate_combined_visualization(original_image, gradcam_overlay, attention_overlay, out_path):
    """Side-by-side panel: original | Grad-CAM | Swin attention. Used by
    the report generator and the explainability API endpoint."""
    from PIL import Image, ImageDraw

    size = original_image.size
    gradcam_overlay = gradcam_overlay.resize(size)
    attention_overlay = attention_overlay.resize(size)

    labels = ["Original", "Grad-CAM (CNN)", "Swin Attention"]
    panel_width, panel_height = size
    label_height = 24
    combined = Image.new("RGB", (panel_width * 3, panel_height + label_height), "white")

    for i, (img, label) in enumerate(zip([original_image.convert("RGB"), gradcam_overlay, attention_overlay], labels)):
        combined.paste(img, (i * panel_width, label_height))

    draw = ImageDraw.Draw(combined)
    for i, label in enumerate(labels):
        draw.text((i * panel_width + 8, 4), label, fill="black")

    combined.save(out_path)
    return str(out_path)
