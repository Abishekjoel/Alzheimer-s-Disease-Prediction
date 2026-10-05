"""
Improved attention-based feature fusion — the primary research contribution
of this project (spec Phase 7).

Mathematical formulation
-------------------------
Let f_c in R^{d_c} be the CNN branch's feature vector and f_s in R^{d_s} be
the Swin Transformer branch's feature vector for one MRI image.

1. Projection into a shared space (so the two branches become comparable):
       p_c = ReLU(BN(W_c f_c + b_c))   in R^{d}
       p_s = ReLU(BN(W_s f_s + b_s))   in R^{d}
   where d = fusion_dim.

2. Cross-attention refinement. The two projected vectors are treated as a
   2-token sequence S = [p_c; p_s] in R^{2 x d} and passed through standard
   multi-head scaled dot-product attention:
       Q = S W_Q,  K = S W_K,  V = S W_V   (per head)
       A = softmax(Q K^T / sqrt(d_h)) V
   Because attention is computed over the *full* 2-token sequence (not
   masked), each token's refined representation is a learned mixture of
   both its own and the other branch's projected features — this is what
   lets the model learn, per attention head, how much CNN texture
   information should inform the Swin-refined representation and vice
   versa, rather than fusing the two streams with a fixed rule. The
   refined vectors are r_c = A[:, 0, :] and r_s = A[:, 1, :].

3. Gated fusion. A gate vector is computed from both refined
   representations:
       g = sigmoid(W_g [r_c ; r_s] + b_g)   in R^{d}, each element in (0, 1)
   and used as a per-channel convex combination:
       fused = g ⊙ r_c + (1 - g) ⊙ r_s
   A channel where g is close to 1 means the CNN branch's evidence
   dominates that feature dimension for this sample; close to 0 means the
   Swin branch dominates. This is strictly more expressive than a single
   scalar weight (the "basic weighted fusion" ablation baseline below)
   because the network can trust CNN texture features on some channels and
   Swin structural features on others, for the same image.

4. A residual term 0.5*(p_c + p_s) is added before LayerNorm to keep the
   pre-attention signal directly reachable (stabilizes early training,
   standard post-norm-residual pattern), then dropout is applied.

The module returns the fused representation *and* every intermediate
quantity (`cnn_projected`, `swin_projected`, `cross_attention_weights`,
`gate_weights`) so the hybrid model, ablation study, and any future
interpretability work can inspect exactly how each prediction weighted the
two modalities — nothing is fabricated or hidden.

Two intentionally simple baseline fusion modules are also implemented in
this file (`ConcatFusion`, `WeightedFusion`) purely so the ablation study
(Phase 12, experiments C and D) can be run against real, working
alternatives rather than invented numbers.
"""

import torch
import torch.nn as nn


def _projection(in_dim, out_dim):
    return nn.Sequential(
        nn.Linear(in_dim, out_dim),
        nn.BatchNorm1d(out_dim),
        nn.ReLU(inplace=True),
    )


class AttentionFeatureFusion(nn.Module):
    """The proposed fusion mechanism: cross-attention + learned per-channel
    gating. See module docstring for the full derivation."""

    def __init__(self, cnn_dim, swin_dim, fusion_dim=512, num_heads=4, dropout=0.3):
        super().__init__()
        if fusion_dim % num_heads != 0:
            raise ValueError(f"fusion_dim ({fusion_dim}) must be divisible by num_heads ({num_heads})")

        self.fusion_dim = fusion_dim
        self.cnn_proj = _projection(cnn_dim, fusion_dim)
        self.swin_proj = _projection(swin_dim, fusion_dim)

        self.cross_attention = nn.MultiheadAttention(
            embed_dim=fusion_dim, num_heads=num_heads, dropout=dropout, batch_first=True
        )
        self.gate = nn.Sequential(
            nn.Linear(fusion_dim * 2, fusion_dim),
            nn.Sigmoid(),
        )
        self.norm = nn.LayerNorm(fusion_dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, cnn_features, swin_features):
        p_c = self.cnn_proj(cnn_features)  # (B, d)
        p_s = self.swin_proj(swin_features)  # (B, d)

        sequence = torch.stack([p_c, p_s], dim=1)  # (B, 2, d)
        attended, attn_weights = self.cross_attention(
            sequence, sequence, sequence, need_weights=True, average_attn_weights=True
        )  # attended: (B, 2, d), attn_weights: (B, 2, 2)

        r_c = attended[:, 0, :]
        r_s = attended[:, 1, :]

        gate_input = torch.cat([r_c, r_s], dim=-1)
        g = self.gate(gate_input)  # (B, d) in (0, 1)

        fused = g * r_c + (1 - g) * r_s
        fused = fused + 0.5 * (p_c + p_s)
        fused = self.norm(fused)
        fused = self.dropout(fused)

        return {
            "fused": fused,
            "cnn_projected": p_c,
            "swin_projected": p_s,
            "cross_attention_weights": attn_weights,
            "gate_weights": g,
        }


class ConcatFusion(nn.Module):
    """Ablation baseline C: naive concatenation, no learned weighting at
    all. Projects both branches to fusion_dim/2 so the concatenated vector
    still has size fusion_dim, keeping the downstream classifier head
    identical across every ablation experiment."""

    def __init__(self, cnn_dim, swin_dim, fusion_dim=512):
        super().__init__()
        half = fusion_dim // 2
        self.cnn_proj = _projection(cnn_dim, half)
        self.swin_proj = _projection(swin_dim, half)
        self.fusion_dim = half * 2

    def forward(self, cnn_features, swin_features):
        p_c = self.cnn_proj(cnn_features)
        p_s = self.swin_proj(swin_features)
        fused = torch.cat([p_c, p_s], dim=-1)
        return {"fused": fused, "cnn_projected": p_c, "swin_projected": p_s}


class WeightedFusion(nn.Module):
    """Ablation baseline D: a single learnable scalar weight per branch
    (not per-channel, no attention) — a simple learned convex combination,
    strictly less expressive than AttentionFeatureFusion's per-channel gate."""

    def __init__(self, cnn_dim, swin_dim, fusion_dim=512):
        super().__init__()
        self.cnn_proj = _projection(cnn_dim, fusion_dim)
        self.swin_proj = _projection(swin_dim, fusion_dim)
        self.raw_weight = nn.Parameter(torch.tensor(0.0))  # sigmoid(0) = 0.5, balanced start
        self.fusion_dim = fusion_dim

    def forward(self, cnn_features, swin_features):
        p_c = self.cnn_proj(cnn_features)
        p_s = self.swin_proj(swin_features)
        w = torch.sigmoid(self.raw_weight)
        fused = w * p_c + (1 - w) * p_s
        return {"fused": fused, "cnn_projected": p_c, "swin_projected": p_s, "scalar_weight": w}


FUSION_REGISTRY = {
    "attention_gated": AttentionFeatureFusion,
    "concat": ConcatFusion,
    "weighted": WeightedFusion,
}


def build_fusion(method, cnn_dim, swin_dim, fusion_dim=512, **kwargs):
    if method not in FUSION_REGISTRY:
        raise ValueError(f"Unknown fusion method '{method}'. Options: {list(FUSION_REGISTRY)}")
    cls = FUSION_REGISTRY[method]
    if cls is AttentionFeatureFusion:
        return cls(cnn_dim, swin_dim, fusion_dim=fusion_dim, num_heads=kwargs.get("num_heads", 4),
                    dropout=kwargs.get("dropout", 0.3))
    return cls(cnn_dim, swin_dim, fusion_dim=fusion_dim)


if __name__ == "__main__":
    fusion = AttentionFeatureFusion(cnn_dim=2048, swin_dim=768, fusion_dim=512)
    fc = torch.randn(4, 2048)
    fs = torch.randn(4, 768)
    out = fusion(fc, fs)
    for k, v in out.items():
        print(k, tuple(v.shape))
