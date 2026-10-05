"""
Root pytest conftest.

Sets environment variables BEFORE Django/ml.config are ever imported so
the test suite never downloads ImageNet-pretrained weights (CNN_PRETRAINED
/ SWIN_PRETRAINED = false) and never requires a GPU (ml.config.get_device
falls back to CPU automatically). This is what the project spec means by
using mock/lightweight weights for automated tests (Phase 24) — the model
architecture under test is the real HybridCNNSwinModel, just initialized
with random (untrained) weights instead of downloaded pretrained ones, so
tests are fast and fully offline.
"""

import os

os.environ.setdefault("CNN_PRETRAINED", "false")
os.environ.setdefault("SWIN_PRETRAINED", "false")
os.environ.setdefault("DEVICE", "cpu")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("DEBUG", "True")
os.environ.setdefault("ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")
os.environ.setdefault("DEMO_MODE", "True")
