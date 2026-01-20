// Lab images - using locally scraped images from original lab sites
// These images were downloaded by scripts/import-scraped-to-cms.ts
// and can be managed via Decap CMS at content/settings/homepage.yaml

export const labImages = {
  // Hero/Banner images
  hero: {
    // Main banner from department page - shows neural network visualization
    banner: '/uploads/scraped/hero-banner.jpg',
    bannerMobile: '/uploads/scraped/hero-banner-mobile.jpg',
  },

  // Faculty photos
  faculty: {
    takahashi: '/uploads/scraped/takahashi.jpg',
    shiramatsu: '/uploads/scraped/shiramatsu.jpg',
  },

  // Research equipment and experiments
  research: {
    // Lab overview/visualization
    labVisualization: '/uploads/scraped/lab-visualization.jpg',

    // Neural cultures - In Vitro
    neuronalCulture: '/uploads/scraped/neuronal-culture.jpg',

    // CMOS array - key technology
    cmosArray: '/uploads/scraped/cmos-array.jpg',

    // Microelectrode arrays
    microelectrodeArrays: '/uploads/scraped/microelectrode-arrays.jpg',

    // ECoG electrode array - Clinical
    ecogElectrode: '/uploads/scraped/ecog-electrode.jpg',

    // Research diagrams
    researchDiagram: '/uploads/scraped/research-diagram.png',
    figDiagram: '/uploads/scraped/fig-diagram.png',

    // MaxLab recording
    maxlab: '/uploads/scraped/maxlab.png',

    // Lab photo
    labPhoto: '/uploads/scraped/lab-photo.jpg',
  },

  // Books by Takahashi
  books: {
    lifeIntelligence: '/uploads/scraped/life-intelligence-book.jpg',
    brainForEngineers1: '/uploads/scraped/brain-engineers-1.jpg',
    brainForEngineers2: '/uploads/scraped/brain-engineers-2.jpg',
  },

  // Stock photos for areas that need placeholders
  // Using Unsplash for high-quality free stock photos
  stock: {
    // Brain/neuroscience themed
    brain: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80',
    neurons: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&q=80',

    // Lab/science themed
    laboratory: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80',
    microscope: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&q=80',

    // Music/audio themed (for beat sync research)
    music: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',
    waveform: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',

    // University/academic
    university: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
    team: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
  },
};

// Research area specific images
export const researchImages = {
  cultures: {
    main: labImages.research.neuronalCulture,
    secondary: labImages.research.cmosArray,
    diagram: labImages.research.maxlab,
  },
  auditory: {
    main: labImages.research.labVisualization,
    secondary: labImages.stock.waveform,
    diagram: labImages.research.researchDiagram,
  },
  clinical: {
    main: labImages.research.ecogElectrode,
    secondary: labImages.research.microelectrodeArrays,
    diagram: labImages.research.figDiagram,
  },
  theory: {
    main: labImages.research.researchDiagram, // Using the diagram as it represents theory well
    secondary: labImages.stock.brain,
    diagram: labImages.research.figDiagram,
  },
};

export default labImages;
