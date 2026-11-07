import { useEffect } from 'react';

interface SEOConfigProps {
  title: string;
  description: string;
  pagePath?: string;
}

export default function SEOConfig({ title, description, pagePath = "" }: SEOConfigProps) {
  useEffect(() => {
    // 1. Update document title
    document.title = `${title} | LIONS KARATE CLUB PUNE`;

    // 2. Update meta tags
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

    updateMetaTag('description', description);
    updateMetaTag('og:title', `${title} | LIONS KARATE CLUB PUNE`, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:image', 'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto,f_auto/v1781350157/WhatsApp_Image_2026-06-13_at_4.57.58_PM_mvcjyf.jpg', true);
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', `${title} | LIONS KARATE CLUB PUNE`);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', 'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto,f_auto/v1781350157/WhatsApp_Image_2026-06-13_at_4.57.58_PM_mvcjyf.jpg');

    // 3. Inject structured LocalBusiness JSON-LD markup
    const schemaId = 'json-ld-karate-dojo';
    let scriptElement = document.getElementById(schemaId) as HTMLScriptElement;
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = schemaId;
      scriptElement.type = 'application/ld+json';
      document.head.appendChild(scriptElement);
    }

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SportsActivityLocation",
      "additionalType": [
        "http://www.productontology.org/doc/Karate",
        "http://www.productontology.org/doc/Martial_arts",
        "http://www.productontology.org/doc/Kickboxing",
        "http://www.productontology.org/doc/Self-defense"
      ],
      "name": "LIONS KARATE CLUB PUNE",
      "alternateName": [
        "Lions Karate Pune", 
        "Lions Karate Club Duttanagar", 
        "Lions Karate Narhe", 
        "Lions Martial Arts Academy Pune",
        "Lions Kickboxing Academy Pune"
      ],
      "description": "LIONS KARATE CLUB PUNE delivers top-notch traditional Shotokan Karate classes, professional kickboxing, martial arts training, and children's self-defense courses. Serving Katraj, Narhe, Duttanagar, Jambhulwadi, Hadapsar, Kothrud, Baner, Hinjewadi, and Camp with offline dojos and flexible online classes.",
      "image": [
        "https://res.cloudinary.com/dlzdagymx/image/upload/q_auto,f_auto/v1781350157/WhatsApp_Image_2026-06-13_at_4.57.58_PM_mvcjyf.jpg",
        "https://res.cloudinary.com/dlzdagymx/image/upload/q_auto,f_auto/v1781350158/WhatsApp_Image_2026-06-13_at_4.58.00_PM_xp52ff.jpg",
        "https://res.cloudinary.com/dlzdagymx/image/upload/q_auto,f_auto/v1781350156/WhatsApp_Image_2026-06-13_at_4.57.59_PM_cwcle3.jpg",
        "https://res.cloudinary.com/dlzdagymx/image/upload/q_auto,f_auto/v1781348302/shoury_image_unjx3u.jpg"
      ],
      "priceRange": "INR",
      "telephone": "9049688172",
      "email": "LIONSKARATECLUBPUNE09@gmail.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Vasundhara Pre-Primary School, Near Ganpati Mandir, Manaji Nagar, Narhe",
        "addressLocality": "Pune",
        "addressRegion": "Maharashtra",
        "postalCode": "411041",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 18.4452,
        "longitude": 73.8179
      },
      "areaServed": [
        "Pune", "Katraj", "Narhe", "Manaji Nagar", "Duttanagar", "Jambhulwadi", "Hadapsar", "Kothrud", "Baner", "Hinjewadi", "Wakad", "Kharadi", "Viman Nagar", "Camp", "Kalyani Nagar"
      ],
      "subOrganization": [
        {
          "@type": "SportsActivityLocation",
          "name": "Lions Karate Club — Narhe & Manaji Nagar Branch",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Vasundhara Pre-Primary School, Near Ganpati Mandir, Manaji Nagar, Narhe",
            "addressLocality": "Pune",
            "addressRegion": "Maharashtra",
            "postalCode": "411041"
          }
        },
        {
          "@type": "SportsActivityLocation",
          "name": "Lions Karate Club — Katraj & Duttanagar Branch",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Primary Sports Complex Arena, Duttanagar-Katraj Road",
            "addressLocality": "Pune",
            "addressRegion": "Maharashtra",
            "postalCode": "411046"
          }
        },
        {
          "@type": "SportsActivityLocation",
          "name": "Lions Karate Club — Jambulwadi Lake View Branch",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Ambegaon-Narhe Bypass Road, Jambulwadi Lakeview",
            "addressLocality": "Pune",
            "addressRegion": "Maharashtra",
            "postalCode": "411041"
          }
        }
      ],
      "url": window.location.origin,
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Wednesday", "Friday"],
          "opens": "16:00",
          "closes": "21:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Tuesday", "Thursday"],
          "opens": "17:00",
          "closes": "21:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Saturday"],
          "opens": "09:00",
          "closes": "15:00"
        }
      ],
      "sameAs": [
        "https://facebook.com/lionskarateclubpune",
        "https://instagram.com/lionskarateclubpune"
      ]
    };

    scriptElement.textContent = JSON.stringify(structuredData);

    return () => {
      // Cleanup is handled gracefully by over-writing next time
    };
  }, [title, description, pagePath]);

  return null;
}
