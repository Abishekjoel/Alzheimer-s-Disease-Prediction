"""ROC and precision-recall curve plotting (one-vs-rest, per class)."""

import numpy as np
from sklearn.metrics import auc, precision_recall_curve, roc_curve


def plot_roc_curves(targets, probabilities, class_names, out_path, title="ROC Curves (one-vs-rest)"):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    targets = np.asarray(targets)
    probabilities = np.asarray(probabilities)

    fig, ax = plt.subplots(figsize=(6, 5))
    for i, name in enumerate(class_names):
        binary_targets = (targets == i).astype(int)
        if binary_targets.sum() == 0 or binary_targets.sum() == len(binary_targets):
            continue  # class absent or only class present in this split — AUC undefined
        fpr, tpr, _ = roc_curve(binary_targets, probabilities[:, i])
        roc_auc = auc(fpr, tpr)
        ax.plot(fpr, tpr, label=f"{name} (AUC={roc_auc:.3f})")

    ax.plot([0, 1], [0, 1], linestyle="--", color="gray", label="Chance")
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title(title)
    ax.legend(loc="lower right")
    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    return str(out_path)


def plot_precision_recall_curves(targets, probabilities, class_names, out_path, title="Precision-Recall Curves"):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    targets = np.asarray(targets)
    probabilities = np.asarray(probabilities)

    fig, ax = plt.subplots(figsize=(6, 5))
    for i, name in enumerate(class_names):
        binary_targets = (targets == i).astype(int)
        if binary_targets.sum() == 0:
            continue
        precision, recall, _ = precision_recall_curve(binary_targets, probabilities[:, i])
        ax.plot(recall, precision, label=name)

    ax.set_xlabel("Recall")
    ax.set_ylabel("Precision")
    ax.set_title(title)
    ax.legend(loc="lower left")
    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    return str(out_path)


def plot_training_curves(history, out_path):
    """Training/validation loss + accuracy curves from a history dict
    produced by ml.training.train.train_model."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, axes = plt.subplots(1, 2, figsize=(11, 4))

    axes[0].plot(history["epoch"], history["train_loss"], label="train")
    axes[0].plot(history["epoch"], history["val_loss"], label="validation")
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Loss")
    axes[0].set_title("Loss")
    axes[0].legend()

    axes[1].plot(history["epoch"], history["train_accuracy"], label="train")
    axes[1].plot(history["epoch"], history["val_accuracy"], label="validation")
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Accuracy")
    axes[1].set_title("Accuracy")
    axes[1].legend()

    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    return str(out_path)
