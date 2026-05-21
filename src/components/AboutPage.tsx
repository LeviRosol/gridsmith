import React, { useEffect } from 'react';
import {
  MarketingCtaBand,
  MarketingHero,
  MarketingTextSection,
} from './home/marketing-blocks';

const TITLE = 'GridSmith — About';
const DESCRIPTION =
  'Learn what GridSmith is, how the modular terrain system works, and why it is built for creative tabletop play.';

const ABOUT_HERO_IMAGE = '/walls_combined_close.png';

export default function AboutPage() {
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
        title="Build Your World. One Tile at a Time."
        lead="GridSmith is a modular terrain system designed to give you complete control over your tabletop."
        supportingLines={[
          'Start simple. Expand endlessly. Create spaces that evolve with your story.',
        ]}
        primaryCta={{ label: 'Shop Tile Sets', path: '/tiles' }}
        secondaryCta={{ label: 'Build for Free', path: '/tile-builder' }}
        imageSrc={ABOUT_HERO_IMAGE}
        imageAlt="GridSmith modular terrain tiles arranged for tabletop play"
      />

      <MarketingTextSection
        id="what-is-gridsmith"
        tone="light"
        title="What is GridSmith?"
        paragraphs={[
          'GridSmith is a flexible, tile-based terrain system built for tabletop gaming. It lets you create custom layouts using interchangeable pieces, so every room, hallway, and encounter space is exactly what you need it to be.',
          "Whether you're building a quick skirmish map or a sprawling dungeon, GridSmith adapts to your table, your game, and your imagination.",
        ]}
      />

      <MarketingTextSection
        id="designed-to-adapt"
        tone="dark"
        title="Designed to Adapt"
        paragraphs={[
          'Traditional terrain locks you into fixed layouts. GridSmith breaks that constraint. Rearrange, expand, or rebuild your environment in seconds, without starting over.',
          'Every piece is part of a larger system, designed to work together seamlessly while still giving you the freedom to create something uniquely yours.',
        ]}
      />

      <MarketingTextSection
        id="built-for-the-table"
        tone="light"
        title="Built for the Table"
        paragraphs={[
          "GridSmith isn't just about building, it's about playing. The system is designed to feel solid, intuitive, and reliable during real gameplay.",
          'Set it down, move pieces as needed, and focus on what matters: the story unfolding at your table.',
        ]}
      />

      <MarketingTextSection
        id="start-small"
        tone="dark"
        title="Start Small. Grow Over Time."
        paragraphs={[
          "You don't need everything at once. Begin with a simple setup and expand your collection as your world grows.",
          "Add new environments, new textures, and new possibilities whenever you're ready.",
        ]}
      />

      <MarketingTextSection
        id="built-for-creators"
        tone="light"
        title="Built for Creators"
        paragraphs={[
          "GridSmith exists for people who want more control over their tabletop experience. It's a system that rewards creativity, experimentation, and iteration.",
          "If you've ever wanted terrain that keeps up with your ideas, you're exactly who this was built for.",
        ]}
      />

      <MarketingCtaBand
        title="Ready to Build Your First Layout?"
        tone="black"
        primaryCta={{ label: 'Shop Tile Sets', path: '/tiles', outlined: false }}
        secondaryCta={{ label: 'Build for Free', path: '/tile-builder', outlined: true }}
      />
    </main>
  );
}
