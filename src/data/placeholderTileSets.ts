/** Optional “What you get” block on the tile detail page (set-specific). */
export type TileSetWhatYouGet = {
  heading: string;
  intro?: string;
  bullets: string[];
  closing?: string;
};

export type TileSetCatalogItem = {
  slug: string;
  name: string;
  /** Display price on the card, e.g. "$15" (omit when not shown) */
  priceLabel?: string;
  /** Path under public/ */
  imageSrc: string;
  description: string;
  /** Shown on the product tag (PrimeBlocks-style badge) */
  tagLabel: string;
  /** Unavailable listing: dimmed card, overlay, non-interactive CTA */
  disabled?: boolean;
  /** Detail page “Add to cart” only; not tied to listing `disabled`. */
  addToCartDisabled: boolean;
  /** Sort key for storefront grid (ascending). */
  order: number;
  /** Detail page only: extra section (e.g. tile list). */
  whatYouGet?: TileSetWhatYouGet;
  /** Set when catalog is loaded from Stripe (checkout wiring). */
  stripeProductId?: string;
  stripePriceId?: string;
  /**
   * From Stripe Product metadata `tile_builder_features` (truthy). When true, owning this pack
   * unlocks Med/High resolution render and STL export in the Tile Builder.
   */
  tileBuilderFeatures?: boolean;
  /**
   * Optional folder key under `/tile-pack-gallery/<key>/` for supporting images; filenames
   * are listed in `/tile-packs/<slug>.json` (`gallery` + optional `galleryFolder`).
   */
  imagePath?: string;
};

const PLACEHOLDER_DESCRIPTION =
  'Ananda balasana pose ardha chandrasana bhujangasana chakravakasana dandasana dolphin plank pose kapalabhati pranayama laghu vajrasana mula bandha parivrtta janu sirsasana parivrtta trikonasana parsvakonasana purvottanasana salamba sirsasana supta matsyendrasana supta virasana tolasana uddiyana bandha utthan pristhasana.';

const PLACEHOLDER_TILE_SETS_RAW: TileSetCatalogItem[] = [
  {
    slug: 'tavern-set',
    name: 'Tavern Set',
    priceLabel: '$15',
    imageSrc: '/logo512.png',
    description:
      'Modular tavern terrain for real table play. Full copy loads from /tile-packs/tavern-set.json when available.',
    tagLabel: 'Tile pack',
    addToCartDisabled: true,
    order: 1,
  },
  {
    slug: 'cave-set',
    name: 'Cave Set',
    imageSrc: '/logo512.png',
    description: PLACEHOLDER_DESCRIPTION,
    tagLabel: 'Tile pack',
    disabled: true,
    addToCartDisabled: true,
    order: 2,
  },
  {
    slug: 'dungeon-set',
    name: 'Dungeon Set',
    imageSrc: '/logo512.png',
    description: PLACEHOLDER_DESCRIPTION,
    tagLabel: 'Tile pack',
    disabled: true,
    addToCartDisabled: true,
    order: 3,
  },
  {
    slug: 'sewer-set',
    name: 'Sewer Set',
    imageSrc: '/logo512.png',
    description: PLACEHOLDER_DESCRIPTION,
    tagLabel: 'Tile pack',
    disabled: true,
    addToCartDisabled: true,
    order: 4,
  },
  {
    slug: 'cobblestone-set',
    name: 'Cobblestone Set',
    imageSrc: '/logo512.png',
    description: PLACEHOLDER_DESCRIPTION,
    tagLabel: 'Tile pack',
    disabled: true,
    addToCartDisabled: true,
    order: 5,
  },
  {
    slug: 'dirt-set',
    name: 'Dirt Set',
    imageSrc: '/logo512.png',
    description: PLACEHOLDER_DESCRIPTION,
    tagLabel: 'Tile pack',
    disabled: true,
    addToCartDisabled: true,
    order: 60,
  },
  {
    slug: 'ruins-set',
    name: 'Ruins Set',
    imageSrc: '/logo512.png',
    description: PLACEHOLDER_DESCRIPTION,
    tagLabel: 'Tile pack',
    disabled: true,
    addToCartDisabled: true,
    order: 70,
  },
  {
    slug: 'ice-set',
    name: 'Ice Set',
    imageSrc: '/logo512.png',
    description: PLACEHOLDER_DESCRIPTION,
    tagLabel: 'Tile pack',
    disabled: true,
    addToCartDisabled: true,
    order: 80,
  },
  {
    slug: 'lava-set',
    name: 'Lava Set',
    imageSrc: '/logo512.png',
    description: PLACEHOLDER_DESCRIPTION,
    tagLabel: 'Tile pack',
    disabled: true,
    addToCartDisabled: true,
    order: 90,
  },
  {
    slug: 'temple-set',
    name: 'Temple Set',
    imageSrc: '/logo512.png',
    description: PLACEHOLDER_DESCRIPTION,
    tagLabel: 'Tile pack',
    disabled: true,
    addToCartDisabled: true,
    order: 100,
  },
  {
    slug: 'boardwalk-set',
    name: 'Boardwalk Set',
    imageSrc: '/logo512.png',
    description: PLACEHOLDER_DESCRIPTION,
    tagLabel: 'Tile pack',
    disabled: true,
    addToCartDisabled: true,
    order: 110,
  },
];

export const PLACEHOLDER_TILE_SETS: TileSetCatalogItem[] = [...PLACEHOLDER_TILE_SETS_RAW].sort(
  (a, b) => a.order - b.order,
);

export function getTileSetBySlug(slug: string): TileSetCatalogItem | undefined {
  return PLACEHOLDER_TILE_SETS.find((t) => t.slug === slug);
}
