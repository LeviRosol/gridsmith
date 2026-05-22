import React from 'react';
import { Button } from 'primereact/button';
import {
  MarketingButton,
  MarketingContainer,
  navigateMarketing,
} from './marketing-blocks.tsx';

export type HomeHeroFeature = {
  icon: string;
  title: string;
  description: string;
};

export type HomeHeroSectionProps = {
  title: string;
  lead: string;
  bullets: readonly { icon: string; label: string }[];
  tagline: string;
  primaryCta: { label: string; path: string };
  secondaryCta: { label: string; href: string };
  freeTiles: {
    title: string;
    description: string;
    linkLabel: string;
    path: string;
  };
  features: readonly HomeHeroFeature[];
  imageSrc: string;
  imageAlt: string;
};

export default function HomeHeroSection({
  title,
  lead,
  bullets,
  tagline,
  primaryCta,
  secondaryCta,
  freeTiles,
  features,
  imageSrc,
  imageAlt,
}: HomeHeroSectionProps) {
  return (
    <section id="hero" className="home-hero-v2" aria-label={imageAlt}>
      <div
        className="home-hero-v2__bg"
        style={{ backgroundImage: `url(${imageSrc})` }}
        role="img"
        aria-label={imageAlt}
      />
      <div className="home-hero-v2__scrim" aria-hidden />

      <div className="home-hero-v2__main">
        <MarketingContainer className="home-hero-v2__container">
          <div className="home-hero-v2__layout">
            <div className="home-hero-v2__copy">
              <div className="home-hero-v2__intro">
                <h1 className="home-hero-v2__title">{title}</h1>
                <p className="home-hero-v2__lead">{lead}</p>

                <ul className="home-hero-v2__bullets list-none p-0">
                  {bullets.map((item) => (
                    <li key={item.label} className="home-hero-v2__bullet">
                      <i className={`${item.icon} home-hero-v2__bullet-icon`} aria-hidden />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="home-hero-v2__tagline">{tagline}</p>

              <div className="home-hero-v2__actions flex flex-wrap gap-2">
                <MarketingButton
                  label={primaryCta.label}
                  path={primaryCta.path}
                  icon="pi pi-shopping-cart"
                  className="home-hero-v2__btn-primary"
                />
                <MarketingButton
                  label={secondaryCta.label}
                  href={secondaryCta.href}
                  outlined
                  className="home-hero-v2__btn-secondary"
                />
              </div>
            </div>

            <aside className="home-hero-v2__free-card" aria-label={freeTiles.title}>
              <i className="pi pi-gift home-hero-v2__free-icon" aria-hidden />
              <div className="home-hero-v2__free-body">
                <p className="home-hero-v2__free-title">{freeTiles.title}</p>
                <p className="home-hero-v2__free-desc">{freeTiles.description}</p>
                <Button
                  type="button"
                  label={freeTiles.linkLabel}
                  link
                  className="home-hero-v2__free-link p-0"
                  onClick={() => navigateMarketing(freeTiles.path)}
                />
              </div>
            </aside>
          </div>
        </MarketingContainer>
      </div>

      <div className="home-hero-v2__feature-bar">
        <MarketingContainer>
          <ul className="home-hero-v2__features list-none p-0 m-0">
            {features.map((feature) => (
              <li key={feature.title} className="home-hero-v2__feature">
                <i className={`${feature.icon} home-hero-v2__feature-icon`} aria-hidden />
                <div>
                  <p className="home-hero-v2__feature-title m-0">{feature.title}</p>
                  <p className="home-hero-v2__feature-desc m-0">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </MarketingContainer>
      </div>
    </section>
  );
}
