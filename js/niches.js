/* Sample-ad data for the Pick your business tabs on /cita and the homepage.
   Add a niche (restaurants, cafes, gyms, …) by appending an object with
   enabled: true. No markup change. status "placeholder" means poster only. */
window.VELOX_NICHES = [
  {
    id: "beauty",
    enabled: true,
    status: "placeholder",
    label: { en: "Beauty", es: "Belleza" },
    caption: {
      en: "Sample spec ad for a beauty salon. Not client work.",
      es: "Anuncio de muestra para un salón de belleza. No es trabajo de un cliente."
    },
    alt: {
      en: "Sample spec ad for a beauty salon",
      es: "Anuncio de muestra para un salón de belleza"
    },
    poster: "/assets/ads/beauty-poster",
    src: "/assets/ads/beauty-sample",
    tracks: {
      en: "/assets/ads/beauty-sample.en.vtt",
      es: "/assets/ads/beauty-sample.es.vtt"
    },
    placeholderId: "P21"
  },
  {
    id: "lashes",
    enabled: true,
    status: "placeholder",
    label: { en: "Lashes", es: "Pestañas" },
    caption: {
      en: "Sample spec ad for a lash studio. Not client work.",
      es: "Anuncio de muestra para un estudio de pestañas. No es trabajo de un cliente."
    },
    alt: {
      en: "Sample spec ad for a lash studio",
      es: "Anuncio de muestra para un estudio de pestañas"
    },
    poster: "/assets/ads/lashes-poster",
    src: "/assets/ads/lashes-sample",
    tracks: {
      en: "/assets/ads/lashes-sample.en.vtt",
      es: "/assets/ads/lashes-sample.es.vtt"
    },
    placeholderId: "P22"
  },
  {
    id: "medspa",
    enabled: true,
    status: "placeholder",
    label: { en: "Med spa", es: "Med spa" },
    caption: {
      en: "Sample spec ad for a med spa. Not client work.",
      es: "Anuncio de muestra para un med spa. No es trabajo de un cliente."
    },
    alt: {
      en: "Sample spec ad for a med spa",
      es: "Anuncio de muestra para un med spa"
    },
    poster: "/assets/ads/medspa-poster",
    src: "/assets/ads/medspa-sample",
    tracks: {
      en: "/assets/ads/medspa-sample.en.vtt",
      es: "/assets/ads/medspa-sample.es.vtt"
    },
    placeholderId: "P23"
  }
];
