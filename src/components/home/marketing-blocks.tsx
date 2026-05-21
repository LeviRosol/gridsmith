import React from 'react';
import { FaEtsy } from 'react-icons/fa6';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Image } from 'primereact/image';
/** Fixed light/dark/black bands for home/about, or `theme` to follow body dark/light mode. */
export type MarketingTone = 'light' | 'dark' | 'black' | 'theme';

const TONE_CLASS: Record<MarketingTone, string> = {
  light: 'home-landing-band--light',
  /** Matches About page `.home-section-alt` in dark mode */
  dark: 'home-landing-band--dark',
  /** Footer CTA — deeper black */
  black: 'home-landing-band--black',
  /** Blog and other pages that should match the app theme toggle */
  theme: 'home-landing-band--theme',
};

export function navigateMarketing(path: string) {
  window.location.pathname = path;
}

function primeIconClass(icon: string): string {
  if (icon.startsWith('pi ')) return icon;
  if (icon.startsWith('pi-')) return `pi ${icon}`;
  return `pi pi-${icon}`;
}

/** PrimeBlocks-style centered content column (Landing 1 container). */
export function MarketingContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`home-landing-container px-4 md:px-6 lg:px-8 mx-auto w-full ${className}`.trim()}>
      {children}
    </div>
  );
}

export function MarketingSection({
  id,
  tone = 'light',
  className = '',
  children,
  fullBleed = false,
}: {
  id?: string;
  tone?: MarketingTone;
  className?: string;
  children: React.ReactNode;
  /** Skip inner container padding wrapper (hero uses full-bleed layout). */
  fullBleed?: boolean;
}) {
  return (
    <section
      id={id}
      className={`${TONE_CLASS[tone]} py-6 md:py-8 ${className}`.trim()}
    >
      {fullBleed ? children : <MarketingContainer>{children}</MarketingContainer>}
    </section>
  );
}

/** Landing 1 section intro: title + optional subtitle. */
export function MarketingSectionHeader({
  title,
  subtitle,
  align = 'center',
  className = '',
}: {
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  className?: string;
}) {
  const centered = align === 'center';
  return (
    <header
      className={`mb-5 md:mb-6 ${centered ? 'text-center mx-auto home-landing-section-header--center' : ''} ${className}`.trim()}
    >
      <h2 className="text-3xl md:text-4xl font-bold text-color line-height-2 m-0 mb-3">{title}</h2>
      {subtitle ? (
        <p className="text-lg text-color-secondary line-height-3 m-0">{subtitle}</p>
      ) : null}
    </header>
  );
}

/** Copy-only section (About page bands, etc.). */
export function MarketingTextSection({
  id,
  tone,
  title,
  paragraphs,
}: {
  id?: string;
  tone: MarketingTone;
  title: string;
  paragraphs: readonly string[];
}) {
  return (
    <MarketingSection id={id} tone={tone}>
      <article className="home-landing-text-block">
        <h2 className="text-3xl md:text-4xl font-bold text-color line-height-2 m-0 mb-4">{title}</h2>
        {paragraphs.map((text, i) => (
          <p key={i} className="text-color-secondary line-height-3 m-0 mb-3">
            {text}
          </p>
        ))}
      </article>
    </MarketingSection>
  );
}

export function MarketingPhoto({
  src,
  alt,
  className = '',
  imageClassName = 'w-full border-round',
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      preview={false}
      width="960"
      height="640"
      loading="lazy"
      className={`block w-full shadow-2 ${className}`.trim()}
      imageClassName={imageClassName}
    />
  );
}

export type MarketingButtonConfig = {
  label: string;
  path?: string;
  href?: string;
  outlined?: boolean;
  icon?: React.ReactNode;
};

export function MarketingButton({
  label,
  path,
  href,
  outlined,
  className = '',
  icon,
}: MarketingButtonConfig & { className?: string }) {
  const onClick = () => {
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    if (path) {
      navigateMarketing(path);
    }
  };

  return (
    <Button
      type="button"
      label={label}
      icon={icon}
      outlined={outlined}
      className={className}
      onClick={onClick}
    />
  );
}

export function MarketingEtsyIcon() {
  return <FaEtsy aria-hidden />;
}

/** Hero with full-bleed background image and gradient overlay. */
export function MarketingHero({
  title,
  lead,
  supportingLines,
  tagline,
  primaryCta,
  secondaryCta,
  imageSrc,
  imageAlt,
}: {
  title: string;
  lead: string;
  supportingLines?: string[];
  tagline?: string;
  primaryCta: { label: string; path: string };
  secondaryCta?: { label: string; path: string };
  imageSrc: string;
  imageAlt: string;
}) {
  return (
    <section
      id="hero"
      className="home-landing-hero home-landing-hero--bg"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.72) 100%), url(${imageSrc})`,
      }}
      aria-label={imageAlt}
    >
      <MarketingContainer className="home-landing-hero-inner">
        <div className="home-landing-hero-content">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-color line-height-2 m-0 mb-4">
            {title}
          </h1>
          <p className="text-xl text-color-secondary line-height-3 m-0 mb-3">{lead}</p>
          {supportingLines?.map((line) => (
            <p key={line} className="text-lg text-color-secondary line-height-3 m-0 mb-2">
              {line}
            </p>
          ))}
          {tagline ? (
            <p className="text-lg text-color font-semibold line-height-3 m-0 mt-3">{tagline}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 mt-4">
            <MarketingButton label={primaryCta.label} path={primaryCta.path} />
            {secondaryCta ? (
              <MarketingButton
                label={secondaryCta.label}
                path={secondaryCta.path}
                outlined
                className="home-landing-hero-btn-outlined"
              />
            ) : null}
          </div>
        </div>
      </MarketingContainer>
    </section>
  );
}

/** Landing 1 feature card: primary icon circle, title, body, image. */
export function MarketingFeatureCard({
  icon,
  title,
  children,
  imageSrc,
  imageAlt,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  imageSrc: string;
  imageAlt: string;
}) {
  return (
    <Card className="h-full shadow-2 border-round-xl home-landing-feature-card">
      <div className="flex flex-column gap-3 h-full">
        <div className="flex align-items-center gap-3">
          <Avatar
            icon={primeIconClass(icon)}
            size="large"
            shape="circle"
            className="bg-primary text-0 flex-shrink-0"
          />
          <h3 className="home-landing-feature-title m-0">{title}</h3>
        </div>
        <p className="home-landing-feature-body m-0 flex-grow-1">{children}</p>
        <MarketingPhoto
          src={imageSrc}
          alt={imageAlt}
          className="mt-auto"
          imageClassName="w-full border-round home-landing-feature-photo"
        />
      </div>
    </Card>
  );
}

export function MarketingFeatureGrid({ children }: { children: React.ReactNode }) {
  return <div className="home-landing-feature-grid">{children}</div>;
}

export function MarketingFeatureGridItem({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/** Landing 1 split row: image + copy (alternating via imagePosition). */
export function MarketingSplit({
  id,
  tone,
  imagePosition = 'left',
  imageSrc,
  imageAlt,
  title,
  children,
  actions,
}: {
  id: string;
  tone: MarketingTone;
  imagePosition?: 'left' | 'right';
  imageSrc: string;
  imageAlt: string;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const imageCol = (
    <div className="col-12 lg:col-6 py-3 lg:py-0">
      <MarketingPhoto src={imageSrc} alt={imageAlt} />
    </div>
  );
  const copyCol = (
    <div className="col-12 lg:col-6 py-3 lg:py-0 flex flex-column justify-content-center">
      <h2 className="text-3xl md:text-4xl font-bold text-color line-height-2 m-0 mb-3">{title}</h2>
      <div className="text-color-secondary line-height-3">{children}</div>
      {actions ? <div className="mt-4">{actions}</div> : null}
    </div>
  );

  return (
    <MarketingSection id={id} tone={tone}>
      <div className="grid align-items-center">
        {imagePosition === 'left' ? (
          <>
            {imageCol}
            {copyCol}
          </>
        ) : (
          <>
            {copyCol}
            {imageCol}
          </>
        )}
      </div>
    </MarketingSection>
  );
}

export function MarketingChecklist({ items }: { items: readonly string[] }) {
  return (
    <ul className="list-none p-0 m-0 my-3 flex flex-column gap-2">
      {items.map((item) => (
        <li key={item} className="flex align-items-start gap-2 text-color">
          <i className="pi pi-check-circle text-primary text-lg flex-shrink-0 mt-1" aria-hidden />
          <span className="line-height-3">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Landing 1 icon highlight row (e.g. product options, build-log topics). */
export function MarketingHighlight({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <div className="flex flex-column align-items-center gap-2 text-center home-landing-highlight">
      <Avatar icon={primeIconClass(icon)} size="large" shape="circle" className="bg-primary text-0" />
      <span className="text-sm font-semibold text-color-secondary uppercase line-height-3">{label}</span>
    </div>
  );
}

export function MarketingHighlightRow({
  items,
  'aria-label': ariaLabel,
}: {
  items: { icon: string; label: string }[];
  'aria-label'?: string;
}) {
  return (
    <div className="flex flex-wrap gap-4 md:gap-5 my-3" aria-label={ariaLabel}>
      {items.map((item) => (
        <MarketingHighlight key={item.label} icon={item.icon} label={item.label} />
      ))}
    </div>
  );
}

/** Bottom CTA band (follows page tone alternation). */
export function MarketingCtaBand({
  title,
  tone,
  primaryCta,
  secondaryCta,
}: {
  title: string;
  tone: MarketingTone;
  primaryCta: MarketingButtonConfig;
  secondaryCta: MarketingButtonConfig;
}) {
  return (
    <MarketingSection id="cta" tone={tone} className="home-landing-cta-band">
      <div className="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between gap-4">
        <h2 className="text-3xl md:text-4xl font-bold text-color line-height-2 m-0">{title}</h2>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <MarketingButton
            {...primaryCta}
            className={`flex-1 md:flex-initial${primaryCta.outlined ? ' home-landing-cta-btn-outlined' : ''}`}
          />
          <MarketingButton
            {...secondaryCta}
            className={`flex-1 md:flex-initial${secondaryCta.outlined ? ' home-landing-cta-btn-outlined' : ''}`}
          />
        </div>
      </div>
    </MarketingSection>
  );
}
