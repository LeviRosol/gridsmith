import React, { useEffect } from 'react';

const TITLE = 'GridSmith — Modular Terrain for Tabletop Play';
const DESCRIPTION =
  'Generate 3D-printable terrain base grids, download free starter tiles, and build modular tabletop worlds with GridSmith.';

function HomeLinkButton({
  href,
  label,
  outlined,
}: {
  href: string;
  label: string;
  outlined?: boolean;
}) {
  return (
    <a
      href={href}
      className={`${outlined ? 'p-button p-component p-button-outlined' : 'p-button p-component'} home-page-cta`}
    >
      <span className="p-button-label">{label}</span>
    </a>
  );
}

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
    <main className="home-page">
      <section id="hero" className="home-section home-section-hero">
        <div className="home-page-container">
          <p className="home-eyebrow">GridSmith</p>
          <h1 className="home-h1">Build Your World. One Tile at a Time.</h1>
          <p className="home-subhead">
            Generate 3D-printable terrain grids and snap-fit tiles to create modular tabletop environments that are built for real play.
          </p>
          <p className="home-supporting">Strong enough to play on. Thin enough to customize.</p>
          <div className="home-actions">
            <HomeLinkButton href="/viewer" label="Generate a Base Grid" />
            <HomeLinkButton href="/tiles" label="Get Free Starter Tiles" outlined />
          </div>
        </div>
      </section>

      <section id="system-overview" className="home-section home-section-alt">
        <div className="home-page-container">
          <p className="home-eyebrow">Why GridSmith</p>
          <h2 className="home-h2">A system for building worlds, not just printing parts.</h2>
          <div className="home-prose">
            <p>
              Most printable terrain systems require you to keep printing full structural pieces over and over again. GridSmith separates the reusable base from the swappable surface, so you print the structure once and expand your world tile by tile.
            </p>
            <p>
              Generate the base layout you want. Print a free starter set. Then add new environments, special features,
              and future expansions as your table grows.
            </p>
          </div>
        </div>
      </section>

      <section className="home-section home-section-subtle">
        <div className="home-page-container">
          <h2 className="home-h2">Works With What You Already Have</h2>
          <div className="home-prose">
            <p>
              GridSmith is built to be flexible, not restrictive. In addition to native GridSmith tiles, you can
              generate base plates compatible with popular systems like OpenForge.
            </p>
            <p>
              Whether you&apos;re starting fresh or building on an existing collection, GridSmith fits into your
              workflow, not the other way around.
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="home-section home-section-how-it-works">
        <div className="home-page-container">
          <p className="home-eyebrow">How It Works</p>
          <h2 className="home-h2">Start with a grid. Build from there.</h2>
          <div className="home-steps">
            <article className="home-step">
              <h3 className="home-h3">1. Generate your base grid</h3>
              <p>
                Choose the layout you want and download a printable base grid STL. The generator gives you the freedom to
                create the footprint that fits your table and your encounter.
              </p>
            </article>
            <article className="home-step">
              <h3 className="home-h3">2. Print and assemble</h3>
              <p>
                Print the grid, drop in the tiles, and create a unified play surface that stays together during real gameplay.
              </p>
            </article>
            <article className="home-step">
              <h3 className="home-h3">3. Add more tile sets</h3>
              <p>
                Start with free generic tiles, then expand into themed sets like caverns, dungeon stone, ruins, and
                specialty tiles such as doors, stairs, and other encounter features.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="features" className="home-section home-section-alt">
        <div className="home-page-container">
          <p className="home-eyebrow">What Makes GridSmith Different</p>
          <h2 className="home-h2">Designed for real play, not just good renders.</h2>
          <div className="home-feature-grid">
            <article className="home-feature">
              <h3 className="home-h3">Snap-fit tile system</h3>
              <p>
                Tiles are designed to fit securely into the grid so your layout stays together. Pick it up, move it, and
                play without everything shifting or falling apart.
              </p>
            </article>
            <article className="home-feature">
              <h3 className="home-h3">Precision-fit tile system</h3>
              <p>
                GridSmith tiles are designed to sit securely in the base grid, so the assembled layout feels like a
                single unified tray instead of a loose scatter of parts.
              </p>
            </article>
            <article className="home-feature">
              <h3 className="home-h3">Fast, efficient printing</h3>
              <p>
                The base grid is thin, strong, and practical to print. Tiles are kept lightweight and support-free
                wherever possible, with a 0.4 nozzle as the baseline target.
              </p>
            </article>
            <article className="home-feature">
              <h3 className="home-h3">Modular by design</h3>
              <p>
                Print a standard grid, then adapt it to your needs. Keep it square, trim it down, or build unusual layouts
                without committing to a single fixed terrain footprint.
              </p>
            </article>
            <article className="home-feature">
              <h3 className="home-h3">Built for expansion</h3>
              <p>
                The base generator is the entry point. Free starter tiles get you playing, and future tile packs let you
                grow your collection without rebuilding the system from scratch.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="starter" className="home-section">
        <div className="home-page-container">
          <p className="home-eyebrow">Start Here</p>
          <h2 className="home-h2">Start building your world for free.</h2>
          <div className="home-prose">
            <p>
              GridSmith begins with two things: a base grid generator and a free starter tile set. That gives you
              everything you need to print, test, and see how the system works on your own table before you invest in
              additional tile packs.
            </p>
          </div>
          <div className="home-actions">
            <HomeLinkButton href="/viewer" label="Generate a Free Base Grid" />
            <HomeLinkButton href="/tiles" label="Download Starter Tiles" outlined />
          </div>
        </div>
      </section>

      <section id="coming-soon" className="home-section home-section-alt">
        <div className="home-page-container">
          <p className="home-eyebrow">Coming Soon</p>
          <h2 className="home-h2">More tiles. More environments. More to build.</h2>
          <div className="home-prose">
            <p>
              GridSmith is just getting started. Planned expansions include themed tile sets, specialty encounter pieces,
              advanced generation tools, and possibly physical starter packs for players who want a ready-to-go system
              without printing it themselves.
            </p>
            <ul className="home-list">
              <li>Expanded terrain tile sets</li>
              <li>Doors, stairs, and feature tiles</li>
              <li>Advanced tools for power users</li>
              <li>Potential physical starter kits</li>
            </ul>
            <p>Want to know when new sets drop? Follow along and keep an eye on the next release.</p>
          </div>
        </div>
      </section>

      <section id="physical" className="home-section">
        <div className="home-page-container">
          <p className="home-eyebrow">Future Offering</p>
          <h2 className="home-h2">Prefer ready-to-play terrain?</h2>
          <div className="home-prose">
            <p>
              GridSmith may eventually offer physical starter packs for players who want the system without owning a
              printer. That means base grids, core tiles, and a practical entry point into modular tabletop terrain.
            </p>
          </div>
          <div className="home-actions home-actions-single">
            <HomeLinkButton href="/tiles" label="Get a Starter Set" outlined />
          </div>
          <p className="home-fine-print">
            Starter sets are not yet available. Join the waitlist to be notified when they launch.
          </p>
        </div>
      </section>

      <section id="philosophy" className="home-section home-section-alt">
        <div className="home-page-container">
          <p className="home-eyebrow">GridSmith Philosophy</p>
          <h2 className="home-h2">Build your world without rebuilding your terrain.</h2>
          <div className="home-prose">
            <p>
              GridSmith is built around a simple idea: the structural part of a terrain system should be reusable, while
              the visual layer should be flexible, swappable, and easy to expand. That approach saves print time, reduces
              waste, and makes storage far simpler than traditional terrain systems.
            </p>
            <p>The result is a platform for building worlds one tile at a time.</p>
          </div>
        </div>
      </section>

      <section id="cta" className="home-section home-section-cta">
        <div className="home-page-container">
          <h2 className="home-h2 home-h2-tight">Build Your World. One Tile at a Time.</h2>
          <div className="home-prose">
            <p>
              Generate a base grid, print your first tiles, and start building a modular tabletop world that grows with you.
            </p>
          </div>
          <div className="home-actions">
            <HomeLinkButton href="/viewer" label="Open the Generator" />
            <HomeLinkButton href="/tiles" label="Browse Tile Sets" outlined />
          </div>
        </div>
      </section>
    </main>
  );
}
