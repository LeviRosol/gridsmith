import React, { useEffect } from 'react';
import {
  MarketingCtaBand,
  MarketingFeatureCard,
  MarketingFeatureGrid,
  MarketingFeatureGridItem,
  MarketingHero,
  MarketingHighlightRow,
  MarketingButton,
  MarketingEtsyIcon,
  MarketingChecklist,
  MarketingSection,
  MarketingSectionHeader,
  MarketingSplit,
} from './home/marketing-blocks';

const TITLE = 'GridSmith — Your First Terrain System';
const DESCRIPTION =
  'Fast-print modular terrain designed to get you from printer setup to playable maps quickly. Print, snap together, and play—no magnets or clips required.';

const IMAGES = {
  hero: '/gs_hero_final.png',
  fastPrints: '/combined_hero_even.png',
  snapFit: '/walls_combined_close.png',
  gameNight: '/tile-pack-gallery/tavern/2.jpg',
  storage: '/gs_hero_final.png',
  tavernSpread: '/tile-pack-gallery/tavern/1.jpg',
  workbench: '/combined_hero_even.png',
} as const;

const TAVERN_CORE_SLUG = 'tavern-core-set';

const BEGINNER_BULLETS = [
  'Prints cleanly using standard slicer settings',
  'No supports or specialty hardware required',
  'Works great on modern consumer printers',
  'Modular layouts without complicated setup',
  'Easy to organize, expand, and store',
] as const;

const TAVERN_OPTIONS = [
  { icon: 'pi-download', label: 'STL Downloads' },
  { icon: 'pi-box', label: 'Physical Printed Sets' },
  { icon: 'pi-inbox', label: 'Optional Storage Trays' },
] as const;

const BUILD_LOG_TOPICS = [
  { icon: 'pi-plus-circle', label: 'New Tile Sets' },
  { icon: 'pi-cog', label: 'Printing Experiments' },
  { icon: 'pi-eye', label: 'Behind the Scenes' },
  { icon: 'pi-palette', label: 'Painting Progress' },
  { icon: 'pi-calendar', label: 'Upcoming Features' },
] as const;

export default function HomePage() {
  useEffect(() => {
    document.title = TITLE;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', DESCRIPTION);
    }
    return () => {
      document.title = 'GridSmith';
    };
  }, []);

  return (
    <main className="home-page home-landing">
      <MarketingHero
        title="Your First Terrain System"
        lead="Fast-print modular terrain designed to get you from printer setup to playable maps as quickly as possible."
        supportingLines={['No magnets. No clips. No complicated assembly.']}
        tagline="Just print, snap together, and play."
        primaryCta={{ label: 'Shop Tile Sets', path: '/tiles' }}
        secondaryCta={{ label: 'Build for Free', path: '/tile-builder' }}
        imageSrc={IMAGES.hero}
        imageAlt="Tavern Core Set storage tray with organized tiles beside a partially assembled tavern layout"
      />

      <MarketingSection id="why-gridsmith" tone="light">
        <MarketingSectionHeader
          title="Terrain That Actually Gets Used"
          subtitle="Modular terrain designed for efficient printing, fast table setup, and layouts you will actually bring to game night."
        />
        <MarketingFeatureGrid>
          <MarketingFeatureGridItem>
            <MarketingFeatureCard
              icon="pi-bolt"
              title="Fast Prints"
              imageSrc={IMAGES.fastPrints}
              imageAlt="A full build plate of modular terrain tiles on a 3D printer"
            >
              Designed around efficient printing so you spend less time waiting and more time building.
            </MarketingFeatureCard>
          </MarketingFeatureGridItem>
          <MarketingFeatureGridItem>
            <MarketingFeatureCard
              icon="pi-th-large"
              title="Snap-Fit System"
              imageSrc={IMAGES.snapFit}
              imageAlt="Hand snapping a terrain tile into a modular base grid"
            >
              Tiles snap directly into modular base grids for fast setup and stable gameplay. No magnets or clips
              required.
            </MarketingFeatureCard>
          </MarketingFeatureGridItem>
          <MarketingFeatureGridItem>
            <MarketingFeatureCard
              icon="pi-circle"
              title="Ready for Game Night"
              imageSrc={IMAGES.gameNight}
              imageAlt="Fully assembled tavern encounter map with miniatures"
            >
              Build taverns, dungeons, hallways, and encounter maps in minutes. Rearrange layouts between sessions
              without rebuilding from scratch.
            </MarketingFeatureCard>
          </MarketingFeatureGridItem>
        </MarketingFeatureGrid>
      </MarketingSection>

      <MarketingSplit
        id="beginner-friendly"
        tone="dark"
        imagePosition="right"
        imageSrc={IMAGES.storage}
        imageAlt="Stacked GridSmith storage trays with labeled lids and organized tile compartments"
        title="Built for New Printer Owners"
      >
        <p className="m-0 mb-0">
          GridSmith was intentionally designed to remove friction from printable terrain.
        </p>
        <MarketingChecklist items={BEGINNER_BULLETS} />
        <p className="m-0 mt-3">
          Whether this is your first terrain system or your fiftieth, GridSmith is focused on one thing: making terrain
          easy to print and fun to use.
        </p>
      </MarketingSplit>

      <MarketingSplit
        id="tavern-core"
        tone="light"
        imagePosition="left"
        imageSrc={IMAGES.tavernSpread}
        imageAlt="Top-down view of the Tavern Core Set tile spread"
        title="Start with the Tavern Core Set"
        actions={
          <MarketingButton label="View Tavern Core Set" path={`/tile-details/${TAVERN_CORE_SLUG}`} />
        }
      >
        <p className="m-0 mb-3">
          The Tavern Core Set includes a balanced mix of walls, floors, hallways, doors, windows, and specialty tiles
          designed to create flexible encounter layouts right out of the box.
        </p>
        <p className="m-0 mb-2">Available as:</p>
        <MarketingHighlightRow items={TAVERN_OPTIONS} aria-label="Tavern Core Set purchase options" />
      </MarketingSplit>

      <MarketingSplit
        id="build-log"
        tone="dark"
        imagePosition="left"
        imageSrc={IMAGES.workbench}
        imageAlt="GridSmith workbench with a 3D printer, storage trays, and tiles in progress"
        title="Built in the Open"
        actions={<MarketingButton label="Read the Build Log" path="/about" />}
      >
        <p className="m-0 mb-2">
          GridSmith is actively developed through real prints, real gameplay, and continuous iteration. Follow the build
          log for:
        </p>
        <MarketingHighlightRow items={BUILD_LOG_TOPICS} aria-label="Build log topics" />
      </MarketingSplit>

      <MarketingCtaBand
        title="Start Printing Terrain Tonight"
        tone="black"
        primaryCta={{ label: 'Shop Tile Sets', path: '/tiles', outlined: false }}
        secondaryCta={{
          label: 'Shop Printed Sets',
          href: 'https://gridsmithio.etsy.com',
          outlined: true,
          icon: <MarketingEtsyIcon />,
        }}
      />
    </main>
  );
}
