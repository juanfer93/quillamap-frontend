const { corporateColors, SPACING, BORDER_RADIUS } = require('./src/constants/theme.ts');

module.exports = {
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
        'charcoal': corporateColors.charcoal, 
        'slate': corporateColors.slate, 
        'error': corporateColors.error,      
      },
      spacing: {
        'xs': `${SPACING.xs}px`,
        's': `${SPACING.s}px`,
        'm': `${SPACING.m}px`,
        'l': `${SPACING.l}px`,
        'xl': `${SPACING.xl}px`,
      },
      borderRadius: {
        's': `${BORDER_RADIUS.s}px`,
        'm': `${BORDER_RADIUS.m}px`,
        'l': `${BORDER_RADIUS.l}px`,
        'xl': `${BORDER_RADIUS.xl}px`,
      },
    },
  },
  plugins: [],
};