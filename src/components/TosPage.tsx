import React, { useEffect } from 'react';

export default function TosPage() {
  useEffect(() => {
    document.title = 'GridSmith — Terms of Service';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Read the GridSmith Terms of Service covering use of the website, digital downloads, accounts, payments, and legal terms.'
      );
    }
    return () => {
      document.title = 'GridSmith';
    };
  }, []);

  return (
    <main className="legal-page">
      <section className="legal-hero">
        <div className="legal-container">
          <h1>Terms of Service</h1>
          <p className="legal-last-updated">Last updated: March 22, 2026</p>
          <p>
            These Terms of Service govern your access to and use of the GridSmith website, tools, downloads, and related
            services.
          </p>
        </div>
      </section>

      <section className="legal-section">
        <div className="legal-container legal-content">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using GridSmith, you agree to be bound by these Terms of Service and any policies referenced
            within them. If you do not agree to these terms, do not use the service.
          </p>

          <h2>2. About GridSmith</h2>
          <p>
            GridSmith provides digital tools, downloadable files, and related content for modular tabletop terrain and
            accessories. Features may include baseplate generation, downloadable tile files, digital content packs,
            previews, and other related services.
          </p>
          <p>GridSmith may add, remove, or modify features at any time without prior notice.</p>

          <h2>3. Eligibility</h2>
          <p>
            You must be at least 18 years old, or the age of majority in your jurisdiction, to purchase paid products
            from GridSmith. By using the service, you represent that you have the legal capacity to enter into these
            terms.
          </p>

          <h2>4. Accounts</h2>
          <p>
            Some features of GridSmith may require an account. You are responsible for maintaining the confidentiality
            of your account credentials and for all activity that occurs under your account.
          </p>
          <p>
            You agree to provide accurate information and to keep your account information current. GridSmith may suspend
            or terminate accounts that contain false, misleading, or incomplete information.
          </p>

          <h2>5. Permitted Use</h2>
          <p>
            You may use GridSmith for lawful personal or commercial tabletop gaming purposes, subject to these terms.
          </p>
          <p>You may not:</p>
          <ul>
            <li>Use GridSmith in violation of any applicable law or regulation.</li>
            <li>Copy, scrape, reverse engineer, or exploit the service beyond normal intended use.</li>
            <li>Interfere with the operation, security, or performance of the website or tools.</li>
            <li>Use automated methods to access the service in a way that imposes unreasonable load.</li>
            <li>Misrepresent GridSmith content, branding, or files as your own original platform or service.</li>
          </ul>

          <h2>6. Digital Files and Downloads</h2>
          <p>
            GridSmith may provide STL files, generated files, tile packs, previews, and other digital assets. Your
            purchase or download grants you a limited, non-exclusive, non-transferable license to use those files as
            permitted by these terms.
          </p>
          <p>Unless otherwise stated on a specific product page, you may:</p>
          <ul>
            <li>Download and use purchased or free files for your own personal use.</li>
            <li>Print physical copies for your own gaming, hobby, and display purposes.</li>
            <li>Use printed items in gameplay, demonstrations, streaming, or similar hobby contexts.</li>
          </ul>
          <p>Unless otherwise stated on a specific product page, you may not:</p>
          <ul>
            <li>Resell, redistribute, share, upload, or publicly post the digital files themselves.</li>
            <li>Offer GridSmith files as part of another digital bundle, marketplace listing, or subscription.</li>
            <li>Claim GridSmith digital products as your own original digital work.</li>
            <li>Create a competing generator, library, or service primarily based on GridSmith files or outputs.</li>
          </ul>

          <h2>7. Commercial Use of Printed Items</h2>
          <p>
            By default, GridSmith digital files are licensed for personal use only unless a product page or separate
            written license explicitly states otherwise.
          </p>
          <p>
            If GridSmith offers a commercial license for certain files or subscriptions, the scope of that license will
            be described separately and will control for those specific products.
          </p>

          <h2>8. User-Submitted Content</h2>
          <p>
            If GridSmith allows you to upload images, heightmaps, text, or other content, you retain ownership of your
            submitted content. However, you grant GridSmith a limited, non-exclusive, worldwide license to host,
            process, display, and use that content solely as needed to operate, improve, and provide the service.
          </p>
          <p>
            You represent that you have all necessary rights to upload any content you submit, and that your content
            does not infringe the rights of any third party.
          </p>
          <p>
            GridSmith may remove submitted content at its discretion, including content that is unlawful, infringing,
            abusive, or technically harmful to the service.
          </p>

          <h2>9. Payments, Pricing, and Refunds</h2>
          <p>
            Prices may change at any time. If you purchase a paid product, subscription, or physical item, you agree to
            pay all charges displayed at checkout, including any applicable taxes and shipping fees.
          </p>
          <p>
            Due to the nature of digital products, all digital sales are final unless otherwise required by law. If you
            experience a technical issue with a purchase, contact GridSmith and reasonable efforts will be made to
            resolve the issue.
          </p>
          <p>
            Physical product refund, replacement, and return terms may be posted separately when physical items become
            available.
          </p>

          <h2>10. Subscriptions</h2>
          <p>
            If GridSmith offers subscriptions, they may renew automatically unless canceled before the next billing
            cycle. By subscribing, you authorize recurring billing in accordance with the plan you selected.
          </p>
          <p>
            You may cancel a subscription at any time, but fees already paid are non-refundable unless otherwise stated
            or required by law.
          </p>

          <h2>11. Intellectual Property</h2>
          <p>
            GridSmith, including its name, branding, logo, site design, text, graphics, generated outputs, digital
            files, and other content, is owned by or licensed to GridSmith and protected by intellectual property laws.
          </p>
          <p>
            These terms do not transfer any ownership rights to you. Except for the limited license expressly granted,
            all rights are reserved.
          </p>

          <h2>12. Physical Printing and Hobby Use Disclaimer</h2>
          <p>
            3D printing results vary depending on printer hardware, materials, slicer settings, calibration, painting,
            finishing, and user handling. GridSmith does not guarantee that any file will print successfully on every
            machine or under every condition.
          </p>
          <p>
            You are responsible for safe use of printers, tools, paints, adhesives, blades, and any other hobby
            equipment. GridSmith is not responsible for damage, injury, or loss arising from the printing, finishing, or
            use of physical objects made from its files.
          </p>

          <h2>13. Service Availability</h2>
          <p>
            GridSmith is provided on an as available basis. The service may be unavailable from time to time due to
            maintenance, updates, outages, or other reasons.
          </p>
          <p>GridSmith does not guarantee uninterrupted or error-free operation.</p>

          <h2>14. Termination</h2>
          <p>
            GridSmith may suspend or terminate your access to the service at any time if you violate these terms, misuse
            the service, infringe intellectual property rights, or create risk or harm to GridSmith or others.
          </p>
          <p>
            Upon termination, your right to access the service may end immediately. Any provisions that by their nature
            should survive termination will survive, including ownership, payment obligations, disclaimers, limitations
            of liability, and dispute provisions.
          </p>

          <h2>15. Disclaimer of Warranties</h2>
          <p>
            To the fullest extent permitted by law, GridSmith is provided as is and as available, without warranties of
            any kind, whether express or implied, including warranties of merchantability, fitness for a particular
            purpose, non-infringement, and availability.
          </p>
          <p>
            GridSmith does not warrant that the service, files, downloads, or outputs will meet your requirements, be
            free of defects, or be compatible with every workflow, printer, or use case.
          </p>

          <h2>16. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, GridSmith and its owners, operators, affiliates, licensors, and
            service providers will not be liable for any indirect, incidental, special, consequential, exemplary, or
            punitive damages, or for any loss of data, profits, revenue, business, goodwill, or use.
          </p>
          <p>
            To the fullest extent permitted by law, GridSmith&apos;s total liability for any claim arising out of or
            related to the service will not exceed the amount you paid to GridSmith in the 12 months preceding the event
            giving rise to the claim.
          </p>

          <h2>17. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless GridSmith and its owners, operators, affiliates, licensors, and
            service providers from and against claims, liabilities, damages, losses, and expenses arising from your use
            of the service, your violation of these terms, or your infringement of any rights of another person or
            entity.
          </p>

          <h2>18. Governing Law</h2>
          <p>
            These terms are governed by and construed in accordance with the laws of the jurisdiction in which GridSmith
            operates, without regard to conflict of law principles.
          </p>
          <p>You can update this section later with your preferred governing state and venue.</p>

          <h2>19. Changes to These Terms</h2>
          <p>
            GridSmith may update these Terms of Service from time to time. Updated terms will be posted on this page
            with a revised effective date. Your continued use of the service after updated terms are posted constitutes
            acceptance of those changes.
          </p>

          <h2>20. Contact</h2>
          <p>If you have questions about these Terms of Service, contact GridSmith at:</p>
          <p>
            <strong>Email:</strong> hello@gridsmith.io
            <br />
            <strong>Website:</strong>{' '}
            <a href="https://www.gridsmith.io" target="_blank" rel="noreferrer">
              https://www.gridsmith.io
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

