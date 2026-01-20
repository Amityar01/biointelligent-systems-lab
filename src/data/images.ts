// Lab images from official sources
export const labImages = {
  // Hero/Banner images
  hero: {
    // Main banner from department page - shows neural network visualization
    banner: 'https://www.kikaib.t.u-tokyo.ac.jp/wp-content/uploads/2024/03/simei_chino_topimg-scaled.jpg',
    bannerMobile: 'https://www.kikaib.t.u-tokyo.ac.jp/wp-content/uploads/2024/03/m_seimei_chino_tpimg.jpg',
  },

  // Faculty photos (higher quality alternatives)
  faculty: {
    takahashi: 'https://www.kikaib.t.u-tokyo.ac.jp/wp-content/uploads/elementor/thumbs/seimei_takahashi_t-qkjq5n5l2xpr4rmajni215jz7tvzbkr4ffnd7lr8sw.jpg',
    shiramatsu: 'https://www.kikaib.t.u-tokyo.ac.jp/wp-content/uploads/elementor/thumbs/seimei_shiramatsu_t-qkjq5m7qw3ogt5nnp53fgnsimg0m3vne3azvqbsmz4.jpg',
  },

  // Research equipment and experiments
  research: {
    // Lab overview/visualization
    labVisualization: 'https://www.ne.t.u-tokyo.ac.jp/eng12.jpg',

    // Neural cultures - In Vitro
    neuronalCulture: 'https://www.ne.t.u-tokyo.ac.jp/image1.jpg',

    // CMOS array - key technology
    cmosArray: 'https://www.ne.t.u-tokyo.ac.jp/image.jpg',

    // Microelectrode arrays
    microelectrodeArrays: 'https://www.ne.t.u-tokyo.ac.jp/image4.jpg',

    // ECoG electrode array - Clinical
    ecogElectrode: 'https://www.ne.t.u-tokyo.ac.jp/image31.jpg',

    // Research diagrams
    researchDiagram: 'https://www.ne.t.u-tokyo.ac.jp/research6.png',
    figDiagram: 'https://www.ne.t.u-tokyo.ac.jp/fig92.png',

    // MaxLab recording
    maxlab: 'https://www.ne.t.u-tokyo.ac.jp/maxlab1.png',

    // Lab photo
    labPhoto: 'https://www.ne.t.u-tokyo.ac.jp/_DSF69951.jpg',
  },

  // Books by Takahashi
  books: {
    lifeIntelligence: 'https://www.ne.t.u-tokyo.ac.jp/image3.jpg',
    brainForEngineers1: 'https://www.ne.t.u-tokyo.ac.jp/51prEWgW7AL1._SX353_BO1,204,203,200_[1].jpg',
    brainForEngineers2: 'https://www.ne.t.u-tokyo.ac.jp/61Ghjgu90YL._SX352_BO1,204,203,200_[1].jpg',
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
