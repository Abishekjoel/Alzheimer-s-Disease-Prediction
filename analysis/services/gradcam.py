"""
Grad-CAM (Selvaraju et al., 2017) for the CNN branch (Phase 14).

Hooks the target convolutional layer (the CNN branch's last residual
block — see CNNBranch.get_target_layer) to capture its activations and the
gradient of the predicted class's logit with respect to those activations,
then combines them into a class-discriminative localization heatmap. This
is a real gradient computation against the actual model weights for the
actual input image — never a fabricated or placeholder heatmap.

Kept modular (`GradCAM` class only needs `model` + `target_layer`) so it
can be pointed at a different layer or reused for a different CNN backbone
without changes.
"""

import cv2
import numpy as np
import torch


class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self._activations = None
        self._gradients = None

        self._forward_handle = target_layer.register_forward_hook(self._save_activations)
        self._backward_handle = target_layer.register_full_backward_hook(self._save_gradients)

    def _save_activations(self, module, input, output):
        self._activations = output.detach()

    def _save_gradients(self, module, grad_input, grad_output):
        self._gradients = grad_output[0].detach()

    def remove_hooks(self):
        self._forward_handle.remove()
        self._backward_handle.remove()

    def generate(self, input_tensor, target_class_index=None):
        """`input_tensor`: preprocessed image tensor, shape (1, 3, H, W).
        Returns (heatmap: np.ndarray in [0, 1] shape (H, W), target_class_index: int)."""
        was_training = self.model.training
        self.model.eval()

        input_tensor = input_tensor.clone().requires_grad_(True)
        outputs = self.model(input_tensor)
        logits = outputs["logits"]

        if target_class_index is None:
            target_class_index = int(torch.argmax(logits, dim=-1).item())

        self.model.zero_grad(set_to_none=True)
        score = logits[0, target_class_index]
        score.backward()

        if self._activations is None or self._gradients is None:
            raise RuntimeError("Grad-CAM hooks did not capture activations/gradients — is target_layer part of the forward path for this model mode?")

        activations = self._activations[0]  # (C, H, W)
        gradients = self._gradients[0]  # (C, H, W)

        weights = gradients.mean(dim=(1, 2))  # (C,) global-average-pooled gradients = alpha_k
        cam = torch.zeros(activations.shape[1:], dtype=torch.float32)
        for k in range(activations.shape[0]):
            cam += weights[k] * activations[k]
        cam = torch.relu(cam)

        cam = cam.numpy()
        if cam.max() > 0:
            cam = cam / cam.max()

        if was_training:
            self.model.train()

        return cam, target_class_index


def overlay_heatmap(original_image, heatmap, alpha=0.4):
    """original_image: PIL.Image (RGB). heatmap: np.ndarray in [0, 1], any
    spatial size (resized to match original_image). Returns a PIL.Image."""
    from PIL import Image

    width, height = original_image.size
    heatmap_resized = cv2.resize(heatmap, (width, height))
    heatmap_uint8 = np.uint8(255 * heatmap_resized)
    heatmap_color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    heatmap_color = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)

    original_array = np.array(original_image.convert("RGB"))
    overlay = cv2.addWeighted(original_array, 1 - alpha, heatmap_color, alpha, 0)
    return Image.fromarray(overlay)


def generate_gradcam(model, input_tensor, original_image, target_class_index=None, out_path=None):
    """High-level entry point used by the inference pipeline.

    Returns {"target_class_index": int, "heatmap_path": str | None,
    "overlay_image": PIL.Image}. Raises RuntimeError with a clear message
    if the model mode has no CNN branch (see HybridCNNSwinModel.get_gradcam_target)."""
    target_layer = model.get_gradcam_target()
    cam_tool = GradCAM(model, target_layer)
    try:
        heatmap, predicted_class_index = cam_tool.generate(input_tensor, target_class_index)
    finally:
        cam_tool.remove_hooks()

    overlay_image = overlay_heatmap(original_image, heatmap)

    saved_path = None
    if out_path is not None:
        overlay_image.save(out_path)
        saved_path = str(out_path)

    return {
        "target_class_index": predicted_class_index,
        "heatmap_path": saved_path,
        "overlay_image": overlay_image,
    }
