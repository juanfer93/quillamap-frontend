export const corporateColors = {
  gold: '#D4AF37',
  sandGold: '#c7ad8c',
  sharkBlue: '#004574',
  white: '#FFFFFF',
  black: '#000000',
  lightGray: '#f2f2f2',
  mediumGray: '#e0e0e0',
  darkGray: '#333333',
  charcoal: '#121212', // Fondo principal oscuro
  slate: '#1E1E1E',    // Fondo de la tarjeta (card) oscuro
};

export const COLORS = {
  light: {
    background: corporateColors.white,
    surface: corporateColors.white,
    text: corporateColors.black,
    textSecondary: corporateColors.darkGray,
    primary: corporateColors.sharkBlue,
    secondary: corporateColors.sandGold,
    border: corporateColors.mediumGray,
  },
  dark: {
    background: corporateColors.charcoal,
    surface: corporateColors.slate,
    text: corporateColors.white,
    textSecondary: corporateColors.lightGray,
    primary: corporateColors.sandGold,
    secondary: corporateColors.sharkBlue,
    border: corporateColors.darkGray,
  },
  sandGold: corporateColors.sandGold,
  sharkBlue: corporateColors.sharkBlue,
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 40,
};

export const BORDER_RADIUS = {
  s: 4,
  m: 10,
  l: 25,
  xl: 75,
};