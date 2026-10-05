/**
 * Decorative imagery only — never used in place of a real analysis image,
 * Grad-CAM, or attention map. Each photo ID below was individually
 * confirmed to resolve on images.unsplash.com before being used here.
 * Free to use under the Unsplash License.
 */

function unsplash(id: string, width: number, quality = 80) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

export const UNSPLASH = {
  // "iridescent brain render on blue purple background" — Milad Fakurian.
  // Verified clean (no baked-in text/overlay) by rendering the raw CDN
  // URL before use.
  iridescentBrain: (width = 1200) => unsplash("1617791160536-598cf32026fb", width),
  // "a laboratory workbench with a microscope and analytical equipment
  // in a bright room" — research lab
  researchLab: (width = 800) => unsplash("1602052577122-f73b9710adba", width),
};

// NOTE: photo-1549925245-f20a1bac6454 ("glowing neural network brain")
// was deliberately dropped after checking the raw image directly — it
// turned out to be an editorial poster composition with a headline and
// paragraph of body text baked into the photo itself, not a clean
// render, so it clashed with any UI text placed over it.
