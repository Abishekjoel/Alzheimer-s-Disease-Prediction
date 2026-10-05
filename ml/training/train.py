"""
Core training loop. Deliberately framework-agnostic (no Django imports) so
it can run from `python manage.py train_model` or as a plain script on a
training machine that never touches the web app.

Handles: optimizer/scheduler construction, class-imbalance strategy
(weighted loss or weighted sampler), mixed precision, gradient clipping,
early stopping, checkpointing (best + optionally every epoch), and
per-epoch history logging to a machine-readable JSON file.
"""

import json
import logging
import random
import time
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader, WeightedRandomSampler

from ml.training.losses import build_loss, compute_class_weights
from ml.training.validate import run_validation

logger = logging.getLogger("ml")


def set_seed(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def build_optimizer(model, training_config):
    name = training_config["optimizer"].lower()
    lr = training_config["learning_rate"]
    wd = training_config["weight_decay"]
    params = [p for p in model.parameters() if p.requires_grad]

    if name == "adamw":
        return torch.optim.AdamW(params, lr=lr, weight_decay=wd)
    if name == "adam":
        return torch.optim.Adam(params, lr=lr, weight_decay=wd)
    if name == "sgd":
        return torch.optim.SGD(params, lr=lr, momentum=0.9, weight_decay=wd)
    raise ValueError(f"Unknown optimizer '{name}'")


def build_scheduler(optimizer, training_config):
    name = training_config["scheduler"].lower()
    if name == "cosine":
        return torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=training_config["epochs"])
    if name == "step":
        return torch.optim.lr_scheduler.StepLR(optimizer, step_size=max(1, training_config["epochs"] // 3), gamma=0.1)
    if name == "plateau":
        return torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", patience=3, factor=0.5)
    if name == "none":
        return None
    raise ValueError(f"Unknown scheduler '{name}'")


def build_sampler(labels, class_distribution, class_names):
    """WeightedRandomSampler variant of class-imbalance handling: each
    sample is drawn with probability inversely proportional to its class
    frequency, so minority classes are seen roughly as often as majority
    classes over an epoch, without altering the loss function."""
    class_weights = compute_class_weights(class_distribution, class_names)
    sample_weights = [class_weights[label].item() for label in labels]
    return WeightedRandomSampler(sample_weights, num_samples=len(sample_weights), replacement=True)


def train_model(
    model,
    train_dataset,
    val_dataset,
    training_config,
    class_distribution,
    class_names,
    output_dir,
    device,
    experiment_name="run",
):
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    set_seed(training_config["seed"])
    model = model.to(device)

    strategy = training_config["class_imbalance_strategy"]
    logger.info("Class distribution (train split): %s", class_distribution)
    logger.info("Class imbalance strategy: %s", strategy)

    if strategy == "weighted_sampler":
        labels = [train_dataset[i][1] for i in range(len(train_dataset))]
        sampler = build_sampler(labels, class_distribution, class_names)
        train_loader = DataLoader(
            train_dataset, batch_size=training_config["batch_size"], sampler=sampler,
            num_workers=training_config["num_workers"],
        )
    else:
        train_loader = DataLoader(
            train_dataset, batch_size=training_config["batch_size"], shuffle=True,
            num_workers=training_config["num_workers"],
        )

    val_loader = DataLoader(
        val_dataset, batch_size=training_config["batch_size"], shuffle=False,
        num_workers=training_config["num_workers"],
    )

    criterion = build_loss(
        strategy, class_distribution=class_distribution, class_names=class_names,
        focal_gamma=training_config["focal_loss_gamma"], device=device,
    )
    optimizer = build_optimizer(model, training_config)
    scheduler = build_scheduler(optimizer, training_config)

    use_amp = training_config["mixed_precision"] and device.type == "cuda"
    scaler = torch.amp.GradScaler(device.type, enabled=use_amp)

    history = {"epoch": [], "train_loss": [], "train_accuracy": [],
               "val_loss": [], "val_accuracy": [], "val_precision_macro": [],
               "val_recall_macro": [], "val_f1_macro": []}

    best_metric_value = -float("inf")
    best_epoch = -1
    epochs_without_improvement = 0
    best_checkpoint_path = output_dir / f"{experiment_name}_best.pt"

    metric_key = training_config["early_stopping_metric"]

    for epoch in range(1, training_config["epochs"] + 1):
        model.train()
        epoch_start = time.time()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            with torch.autocast(device_type=device.type, enabled=use_amp):
                outputs = model(images)
                loss = criterion(outputs["logits"], labels)

            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), training_config["grad_clip_norm"])
            scaler.step(optimizer)
            scaler.update()

            running_loss += loss.item() * images.size(0)
            correct += (outputs["predicted_index"] == labels).sum().item()
            total += images.size(0)

        train_loss = running_loss / total
        train_accuracy = correct / total

        val_metrics = run_validation(model, val_loader, criterion, device)

        if scheduler is not None:
            if isinstance(scheduler, torch.optim.lr_scheduler.ReduceLROnPlateau):
                scheduler.step(val_metrics[metric_key.replace("val_", "")])
            else:
                scheduler.step()

        history["epoch"].append(epoch)
        history["train_loss"].append(train_loss)
        history["train_accuracy"].append(train_accuracy)
        history["val_loss"].append(val_metrics["loss"])
        history["val_accuracy"].append(val_metrics["accuracy"])
        history["val_precision_macro"].append(val_metrics["precision_macro"])
        history["val_recall_macro"].append(val_metrics["recall_macro"])
        history["val_f1_macro"].append(val_metrics["f1_macro"])

        elapsed = time.time() - epoch_start
        logger.info(
            "[%s] epoch %d/%d | train_loss=%.4f train_acc=%.4f | val_loss=%.4f "
            "val_acc=%.4f val_f1=%.4f | %.1fs",
            experiment_name, epoch, training_config["epochs"], train_loss, train_accuracy,
            val_metrics["loss"], val_metrics["accuracy"], val_metrics["f1_macro"], elapsed,
        )

        current_metric = val_metrics[metric_key.replace("val_", "")]
        improved = current_metric > best_metric_value
        if improved:
            best_metric_value = current_metric
            best_epoch = epoch
            epochs_without_improvement = 0
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "config": model.config if hasattr(model, "config") else {},
                "metrics": val_metrics_without_arrays(val_metrics),
            }, best_checkpoint_path)
        else:
            epochs_without_improvement += 1

        if training_config["checkpoint_every_epoch"]:
            torch.save(model.state_dict(), output_dir / f"{experiment_name}_epoch{epoch}.pt")

        if epochs_without_improvement >= training_config["early_stopping_patience"]:
            logger.info("Early stopping at epoch %d (no improvement in %s for %d epochs).",
                        epoch, metric_key, epochs_without_improvement)
            break

    with open(output_dir / f"{experiment_name}_history.json", "w") as f:
        json.dump(history, f, indent=2)

    return {
        "history": history,
        "best_epoch": best_epoch,
        "best_metric_value": best_metric_value,
        "best_checkpoint_path": str(best_checkpoint_path),
    }


def val_metrics_without_arrays(val_metrics):
    return {k: v for k, v in val_metrics.items() if k not in ("targets", "predictions", "probabilities")}
