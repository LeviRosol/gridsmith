import React from 'react';
import { useConsent } from './ConsentProvider';
import { FaDiscord, FaInstagram, FaRedditAlien, FaXTwitter } from 'react-icons/fa6';
import { SiPrintables, SiThingiverse } from 'react-icons/si';
import { PiCubeDuotone } from 'react-icons/pi';

const socialLinks = [
  {
    name: 'Reddit',
    href: 'https://www.reddit.com/r/gridsmith/',
    icon: FaRedditAlien,
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/gridsmithio',
    icon: FaInstagram,
  },
  {
    name: 'X (Twitter)',
    href: 'https://x.com/gridsmithio',
    icon: FaXTwitter,
  },
  {
    name: 'Thingiverse',
    href: 'https://www.thingiverse.com/Gridsmithio',
    icon: SiThingiverse,
  },
  {
    name: 'Printables',
    href: 'https://www.printables.com/@Gridsmithio_4636544',
    icon: SiPrintables,
  },
  {
    name: 'MakerWorld',
    href: 'https://makerworld.com/en/@iveld',
    icon: PiCubeDuotone,
  },
  {
    name: 'Discord',
    href: 'https://discord.gg/AeBpv33ru',
    icon: FaDiscord,
  },
] as const;

export default function SiteFooter() {
  const { openCookieSettings } = useConsent();
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '0.25rem',
        }}
      >
        <a href="/" className="app-footer-link">Home</a>
        <a href="/baseplate" className="app-footer-link">Baseplate</a>
        <a href="/tile-builder" className="app-footer-link">Tile builder</a>
        <a href="/tiles" className="app-footer-link">Get Tiles</a>
        <a href="/about" className="app-footer-link">About</a>
        <a href="/profile" className="app-footer-link">Profile</a>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '0.25rem',
        }}
      >
        <a href="/tos" className="app-footer-link">Terms of Service</a>
        <a href="/privacy" className="app-footer-link">Privacy Policy</a>
        <a
          href="#cookie-settings"
          className="app-footer-link"
          onClick={(e) => {
            e.preventDefault();
            openCookieSettings();
          }}
        >
          Cookie settings
        </a>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '0.25rem',
        }}
      >
        {socialLinks.map(({ name, href, icon: Icon }) => (
          <a
            key={name}
            href={href}
            className="app-footer-link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={name}
            title={name}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Icon size={15} aria-hidden="true" />
            <span>{name}</span>
          </a>
        ))}
      </div>
      <div>© {year} GridSmith. All rights reserved.</div>
    </footer>
  );
}

