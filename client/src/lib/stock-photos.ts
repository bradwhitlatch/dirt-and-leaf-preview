/**
 * Curated stock photography reused across the app (species reference images,
 * room hero shots, product imagery) — sourced from the approved UI
 * reference. These are shown in place of user photos everywhere except the
 * identification/progress-comparison flow, per spec ("customer photos
 * reserved for identification and growth tracking").
 */
export const STOCK_PHOTOS = {
  heroPlant: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/0509bcf44436822dcb9999f9c0d1ddcdd08ca135.jpg",
  livingRoom: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/2f7d59b0b46396ab6a280ae4cc1ba831b83cb102.jpg",
  office: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/0b3fa622feb42c41ca3fbb785fe0014d25ce6980.jpg",
  monstera: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/4643d8940a3a1b5edbae380c8f1667def76247aa.jpg",
  philodendron: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/dbd7a70d946d6bdadc5ff96b8b607fc36c15f29c.jpg",
  products: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/19fe21f5dc77d469dea6f87ba3ecd6097a56bd1c.jpg",
};

const FALLBACK_ROTATION = [
  STOCK_PHOTOS.monstera,
  STOCK_PHOTOS.heroPlant,
  STOCK_PHOTOS.philodendron,
  STOCK_PHOTOS.livingRoom,
  STOCK_PHOTOS.office,
];

/** Deterministic fallback photo for a plant/species when no curated photo is set. */
export function fallbackPhotoFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return FALLBACK_ROTATION[hash % FALLBACK_ROTATION.length];
}
