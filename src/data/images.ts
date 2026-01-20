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
    secondary: labImages.research.maxlab,
    diagram: labImages.research.researchDiagram,
  },
  clinical: {
    main: labImages.research.ecogElectrode,
    secondary: labImages.research.microelectrodeArrays,
    diagram: labImages.research.figDiagram,
  },
  theory: {
    main: labImages.research.researchDiagram,
    secondary: labImages.research.figDiagram,
    diagram: labImages.research.figDiagram,
  },
};

export default labImages;
