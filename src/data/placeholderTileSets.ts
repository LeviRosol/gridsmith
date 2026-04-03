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
};

const PLACEHOLDER_DESCRIPTION =
  'Ananda balasana pose ardha chandrasana bhujangasana chakravakasana dandasana dolphin plank pose kapalabhati pranayama laghu vajrasana mula bandha parivrtta janu sirsasana parivrtta trikonasana parsvakonasana purvottanasana salamba sirsasana supta matsyendrasana supta virasana tolasana uddiyana bandha utthan pristhasana.';

const PLACEHOLDER_TILE_SETS_RAW: TileSetCatalogItem[] = [
  {
    slug: 'tavern-set',
    name: 'Tavern Set',
    priceLabel: '$15',
    imageSrc: '/logo512.png',
    description: `Build fully modular taverns that actually work at the table.

Welcome to the tavern.

This is where most adventures start—and now you can build it exactly how you want.

The GridSmith Tavern Set is a modular, snap-fit terrain system designed for real gameplay. Tiles drop into a reusable base grid, stay in place, and can be rearranged in seconds. No magnets. No glue. No weird constraints.

Everything is built on a 1x1 (30mm) system, so you're not locked into pre-defined rooms. Want a 5' hallway? Done. Doors in corners? No problem. Awkward layouts from your favorite map? This system was built for that.

And because walls are designed for actual table use, your players can still see their minis without sacrificing the feel of a real space.`,
    tagLabel: 'Tile pack',
    addToCartDisabled: true,
    order: 1,
    whatYouGet: {
      heading: 'What You Get',
      intro:
        'This set includes 16 core tiles, in both Medium and High resolution, covering everything you need to build a fully functional tavern layout:',
      bullets: [
        'Floor',
        'Wall *',
        'Corner *',
        'Curved Wall',
        'Door *',
        'Window *',
        'Stairs *',
        'Trapdoor',
        'Hallway'
      ],
      closing:
        `* Wall, Corner, Door, Window, and Stairs come with two floor rotation variants.

        All tiles are designed to work together seamlessly and can be rotated or combined to fit your layout.`,
    },
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
