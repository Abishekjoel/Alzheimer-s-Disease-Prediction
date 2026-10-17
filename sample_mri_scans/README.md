# Sample MRI scans for manual testing

60 real MRI slice images, 20 per class, held out from training (from
`dataset/test/`). Filenames state the true label (`CN_01.jpg` ...
`CN_20.jpg`, same pattern for `MCI`/`AD`).

## Measured accuracy on this exact set

Run through the currently active model (`Hybrid-CNN-Swin v0.1.0`,
`ml/weights/balanced_v1_best.pt`) at the time these files were added:

| Class | Correct | Accuracy |
|---|---|---|
| CN | 17/20 | 85.0% |
| MCI | 20/20 | 100% |
| AD | 15/20 | 75.0% |
| **Overall** | **52/60** | **86.7%** |

**These numbers are higher than the model's real test-set accuracy**
(69.8% overall across the full 960-image test set — see the model's
`notes`/`metrics` in `ModelVersion`). That's because this 60-image subset
is just the first 20 files per class in alphabetical order, not a random
sample, so it isn't representative of overall performance. Use the full
test-set numbers as the trustworthy figure; use this folder only for
spot-checking the pipeline by hand.

Misclassified in this set, if you want to specifically test confusion
cases:
- `CN_10.jpg`, `CN_13.jpg`, `CN_16.jpg` → predicted MCI
- `AD_05.jpg`, `AD_11.jpg`, `AD_13.jpg` → predicted MCI
- `AD_10.jpg`, `AD_17.jpg` → predicted CN (confidently, which is the more
  concerning error type — worth looking at manually)

## Source and important caveats

- From the Kaggle "Alzheimer's Dataset (4 class of Images)" test split.
  `NonDemented` → CN, `VeryMildDemented` → MCI, `MildDemented`/
  `ModerateDemented` → AD.
- **Not clinically sourced or verified** — labels come from the Kaggle
  dataset's own categorization, not a clinical diagnosis.
- **Known dataset caveat**: this Kaggle set is known to contain
  augmented/near-duplicate copies of the same underlying scans. The
  train/validation/test split was done by file, not by original source
  scan, so some "held out" test images may be visually close to
  something the model trained on. Treat all accuracy numbers here as an
  optimistic case, not a guarantee of real-world accuracy.
- The active model was trained for only 7 epochs on a class-balanced,
  undersampled subset (2,072 training images) on CPU. It is **not
  validated for clinical or diagnostic use**.
