"""Confusion-matrix plotting, split out from metrics.py since not every
caller of compute_full_metrics needs an image written to disk."""

import numpy as np


def plot_confusion_matrix(cm, class_names, out_path, normalize=False, title="Confusion Matrix"):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns

    cm = np.asarray(cm, dtype=float)
    if normalize:
        row_sums = cm.sum(axis=1, keepdims=True)
        row_sums[row_sums == 0] = 1
        cm = cm / row_sums
        fmt = ".2f"
    else:
        fmt = "d" if cm.dtype == int or np.allclose(cm, cm.astype(int)) else ".2f"
        cm = cm.astype(int) if fmt == "d" else cm

    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt=fmt, cmap="Blues", xticklabels=class_names,
                yticklabels=class_names, ax=ax, cbar=True)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_title(title)
    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    return str(out_path)
