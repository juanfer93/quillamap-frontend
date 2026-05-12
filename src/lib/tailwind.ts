import { create } from 'twrnc';
import { corporateColors } from '@/constants/theme'; // Importación directa del origen de verdad

const tw = create({
  theme: {
    extend: {
      colors: {
        'gold': corporateColors.gold,
        'sand-gold': corporateColors.sandGold,
        'shark-blue': corporateColors.sharkBlue,
        'white': corporateColors.white,
        'black': corporateColors.black,
        'light-gray': corporateColors.lightGray,
        'medium-gray': corporateColors.mediumGray,
        'dark-gray': corporateColors.darkGray,
      },
    },
  },
});

export default tw;