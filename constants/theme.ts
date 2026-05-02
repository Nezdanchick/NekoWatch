export interface Theme {
  background: string;
  surface: string;
  surfaceVariant: string;
  card: string;
  text: string;
  subtext: string;
  primary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  border: string;
  outline: string;
  tabBar: string;
  tabIcon: string;
  statusBar: 'light' | 'dark';
  disabled: string;
  elevation1: string;
  elevation2: string;
};

const dark: Theme = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2C2C2C',
  card: '#1E1E1E',
  text: '#E6E1E5',
  subtext: '#CAC4D0',
  primary: '#D0BCFF',
  primaryContainer: '#4F378B',
  onPrimaryContainer: '#EADDFF',
  secondary: '#CCC2DC',
  secondaryContainer: '#4A4458',
  onSecondaryContainer: '#E8DEF8',
  border: '#49454F',
  outline: '#938F99',
  tabBar: '#1C1B1F',
  tabIcon: '#79747E',
  statusBar: 'light',
  disabled: '#49454F',
  elevation1: '#252529',
  elevation2: '#2B2930',
};
const light: Theme = {
  background: '#FFFBFE',
  surface: '#FFFBFE',
  surfaceVariant: '#E7E0EC',
  card: '#F7F2FA',
  text: '#1C1B1F',
  subtext: '#49454F',
  primary: '#6750A4',
  primaryContainer: '#EADDFF',
  onPrimaryContainer: '#21005D',
  secondary: '#625B71',
  secondaryContainer: '#E8DEF8',
  onSecondaryContainer: '#1D192B',
  border: '#CAC4D0',
  outline: '#79747E',
  tabBar: '#FFFBFE',
  tabIcon: '#79747E',
  statusBar: 'dark',
  disabled: '#CAC4D0',
  elevation1: '#F6F2FA',
  elevation2: '#F2ECFA',
};
const amoled: Theme = {
  background: '#000000',
  surface: '#0E0E12',
  surfaceVariant: '#1A1A22',
  card: '#0E0E12',
  text: '#E6E1E5',
  subtext: '#CAC4D0',
  primary: '#D0BCFF',
  primaryContainer: '#4F378B',
  onPrimaryContainer: '#EADDFF',
  secondary: '#CCC2DC',
  secondaryContainer: '#4A4458',
  onSecondaryContainer: '#E8DEF8',
  border: '#2C2C34',
  outline: '#938F99',
  tabBar: '#000000',
  tabIcon: '#79747E',
  statusBar: 'light',
  disabled: '#2C2C34',
  elevation1: '#0A0A10',
  elevation2: '#121218',
};
export const theme = {
  dark: dark,
  light: light,
  amoled: amoled,

  default: dark
}
export const themeMap = {
  'dark': 0,
  'light': 1,
  'amoled': 2,

  'default': 0
}
export type ThemeName = keyof typeof theme;