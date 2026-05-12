import { create } from 'twrnc';
import { corporateColors, SPACING, BORDER_RADIUS } from '@/constants/theme'; // Importamos todo el sistema

const tw = create({
  theme: {
    extend: {
      colors: {
        'gold': corporateColors.gold,
        'sand-gold': corporateColors.sandGold,
        'shark-blue': corporateColors.sharkBlue, // El azul oficial #004574
        'light-gray': corporateColors.lightGray,
        'medium-gray': corporateColors.mediumGray,
        'dark-gray': corporateColors.darkGray,
      },
      spacing: {
        'xs': `${SPACING.xs}`,
        's': `${SPACING.s}`,
        'm': `${SPACING.m}`,
        'l': `${SPACING.l}`,
        'xl': `${SPACING.xl}`,
      },
      borderRadius: {
        's': `${BORDER_RADIUS.s}`,
        'm': `${BORDER_RADIUS.m}`,
        'l': `${BORDER_RADIUS.l}`,
        'xl': `${BORDER_RADIUS.xl}`,
      },
    },
  },
});

export default tw;
