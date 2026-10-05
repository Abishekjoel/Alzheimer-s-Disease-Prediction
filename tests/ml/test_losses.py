import torch

from ml.training.losses import FocalLoss, build_loss, compute_class_weights


def test_compute_class_weights_favors_minority_class():
    distribution = {"CN": 100, "MCI": 100, "AD": 10}
    weights = compute_class_weights(distribution, class_names=["CN", "MCI", "AD"])
    assert weights[2] > weights[0]  # AD (minority) gets a larger weight
    assert weights[0] == weights[1]  # equal-count classes get equal weight


def test_build_loss_weighted_ce_returns_cross_entropy_with_weights():
    distribution = {"CN": 10, "MCI": 5, "AD": 2}
    loss_fn = build_loss("weighted_ce", class_distribution=distribution, class_names=["CN", "MCI", "AD"])
    assert isinstance(loss_fn, torch.nn.CrossEntropyLoss)
    assert loss_fn.weight is not None


def test_build_loss_none_and_sampler_return_plain_ce():
    for strategy in ("none", "weighted_sampler"):
        loss_fn = build_loss(strategy)
        assert isinstance(loss_fn, torch.nn.CrossEntropyLoss)
        assert loss_fn.weight is None


def test_focal_loss_reduces_loss_for_confident_correct_predictions():
    focal = FocalLoss(gamma=2.0)
    confident_correct_logits = torch.tensor([[10.0, -10.0, -10.0]])
    unconfident_logits = torch.tensor([[0.1, 0.0, -0.1]])
    target = torch.tensor([0])

    confident_loss = focal(confident_correct_logits, target)
    unconfident_loss = focal(unconfident_logits, target)
    assert confident_loss.item() < unconfident_loss.item()
