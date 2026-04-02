import React, { useEffect } from 'react';

export default function AboutPage() {
  useEffect(() => {
    document.title = 'GridSmith — About';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Learn what GridSmith is, how the modular terrain system works, and why it is built for creative tabletop play.'
      );
    }
    return () => {
      document.title = 'GridSmith';
    };
  }, []);

  return (
    <main className="home-page">
      <section className="home-section home-section-about-hero home-section-about-hero--child">
        <div className="home-page-container">
          <h1 className="home-h1">Build Your World. One Tile at a Time.</h1>
          <div className="home-prose">
            <p>
              GridSmith is a modular terrain system designed to give you complete control over your tabletop. Start
              simple. Expand endlessly. Create spaces that evolve with your story.
            </p>
          </div>
        </div>
      </section>

      <section className="home-section home-section-alt">
        <div className="home-page-container">
          <h2 className="home-h2">What is GridSmith?</h2>
          <div className="home-prose">
            <p>
              GridSmith is a flexible, tile-based terrain system built for tabletop gaming. It lets you create custom
              layouts using interchangeable pieces, so every room, hallway, and encounter space is exactly what you need
              it to be.
            </p>
            <p>
              Whether you&apos;re building a quick skirmish map or a sprawling dungeon, GridSmith adapts to your table,
              your game, and your imagination.
            </p>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-page-container">
          <h2 className="home-h2">Designed to Adapt</h2>
          <div className="home-prose">
            <p>
              Traditional terrain locks you into fixed layouts. GridSmith breaks that constraint. Rearrange, expand, or
              rebuild your environment in seconds, without starting over.
            </p>
            <p>
              Every piece is part of a larger system, designed to work together seamlessly while still giving you the
              freedom to create something uniquely yours.
            </p>
          </div>
        </div>
      </section>

      <section className="home-section home-section-alt">
        <div className="home-page-container">
          <h2 className="home-h2">Built for the Table</h2>
          <div className="home-prose">
            <p>
              GridSmith isn&apos;t just about building, it&apos;s about playing. The system is designed to feel solid,
              intuitive, and reliable during real gameplay.
            </p>
            <p>
              Set it down, move pieces as needed, and focus on what matters: the story unfolding at your table.
            </p>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-page-container">
          <h2 className="home-h2">Start Small. Grow Over Time.</h2>
          <div className="home-prose">
            <p>
              You don&apos;t need everything at once. Begin with a simple setup and expand your collection as your world
              grows.
            </p>
            <p>Add new environments, new textures, and new possibilities whenever you&apos;re ready.</p>
          </div>
        </div>
      </section>

      <section className="home-section home-section-alt">
        <div className="home-page-container">
          <h2 className="home-h2">Built for Creators</h2>
          <div className="home-prose">
            <p>
              GridSmith exists for people who want more control over their tabletop experience. It&apos;s a system that
              rewards creativity, experimentation, and iteration.
            </p>
            <p>
              If you&apos;ve ever wanted terrain that keeps up with your ideas, you&apos;re exactly who this was built
              for.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

