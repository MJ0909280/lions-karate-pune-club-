import { useEffect } from 'react';

interface SEOConfigProps {
  title: string;
  description: string;
  pagePath?: string;
}

export default function SEOConfig({ title, description, pagePath = '' }: SEOConfigProps) {
  useEffect(() => {
    const fullTitle = `${title} | LIONS KARATE CLUB PUNE`;
    document.title = fullTitle;

    const baseUrl = 'https://lions-karate-club-pune.vercel.app';
    const canonicalUrl = `${baseUrl}${pagePath}`;

    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      let element = document.querySelector(isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        if (isProperty) {
          element.setAttribute('property', name);
        } else {
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const ogImage = 'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto,f_auto/v1781350157/WhatsApp_Image_2026-06-13_at_4.57.58_PM_mvcjyf.jpg';

    updateMetaTag('description', description);
    updateMetaTag(
      'keywords',
      'Lions Karate Club Pune, Karate Classes Near Me, Karate Classes in Narhe, Karate Classes in Dhayari Pune, Ambegaon Pathar Karate, Katraj Bypass Karate, Martial Arts Pune, कराटे क्लासेस पुणे'
    );
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:url', canonicalUrl, true);
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:site_name', 'LIONS KARATE CLUB PUNE', true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:url', canonicalUrl);
    updateMetaTag('twitter:image', ogImage);

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    const schemaId = 'json-ld-karate-dojo';
    let scriptElement = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = schemaId;
      scriptElement.type = 'application/ld+json';
      document.head.appendChild(scriptElement);
    }

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': ['SportsClub', 'SportsActivityLocation', 'LocalBusiness'],
      '@id': `${baseUrl}/#club`,
      name: 'LIONS KARATE CLUB PUNE',
      alternateName: 'लायन्स कराटे क्लब पुणे',
      description:
        'Traditional Shotokan Karate, Martial Arts, Kickboxing, and Self-Defense Academy serving Narhe, Manaji Nagar, Dhayari, Ambegaon Pathar, Katraj Bypass, Bhumkar Bridge & Jambulwadi, Pune.',
      image: [
        'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto,f_auto/v1781350907/logo_new_bgwsw9.jpg',
        ogImage
      ],
      telephone: '+919049688172',
      email: 'LIONSKARATECLUBPUNE09@gmail.com',
      hasMap: 'https://maps.app.goo.gl/3XTDzC6wYw5RB6Uk8',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Vasundhara Pre-Primary School, Near Ganpati Mandir, Manaji Nagar, Narhe',
        addressLocality: 'Narhe, Pune',
        addressRegion: 'Maharashtra',
        postalCode: '411041',
        addressCountry: 'IN'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 18.4485,
        longitude: 73.8267
      },
      areaServed: [
        { '@type': 'Place', name: 'Narhe, Pune' },
        { '@type': 'Place', name: 'Manaji Nagar, Narhe, Pune' },
        { '@type': 'Place', name: 'Dhayari, Pune' },
        { '@type': 'Place', name: 'Ambegaon Pathar, Pune' },
        { '@type': 'Place', name: 'Katraj Bypass, Pune' },
        { '@type': 'Place', name: 'Bhumkar Bridge, Pune' },
        { '@type': 'Place', name: 'Jambulwadi, Pune' },
        { '@type': 'Place', name: 'Sinhagad Road, Pune' }
      ],
      knowsAbout: [
        'Shotokan Karate',
        'Kids Self-Defense',
        'Martial Arts Classes',
        'Kickboxing Fitness',
        'कराटे क्लासेस पुणे'
      ],
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '16:30',
        closes: '21:30'
      },
      url: baseUrl,
      sameAs: [
        'https://www.instagram.com/lions_karate_club_pune',
        'https://www.youtube.com/@LionsKarateClub'
      ]
    };

    scriptElement.textContent = JSON.stringify(structuredData);
  }, [title, description, pagePath]);

  return null;
}
