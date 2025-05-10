export interface Theme {
  background: string;
  card: string;
  text: string;
  subtext: string;
  primary: string;
  secondary: string;
  border: string;
  tabBar: string;
  tabIcon: string;
  statusBar: 'light' | 'dark';
  disabled: string;
};

const dark: Theme = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  subtext: '#9E9E9E',
  primary: '#7B68EE',
  secondary: '#FF6B6B',
  border: '#2C2C2C',
  tabBar: '#1A1A1A',
  tabIcon: '#6E6E6E',
  statusBar: 'light',
  disabled: '#555555',
};
const light: Theme = {
  background: '#FFFFFF',
  card: '#F5F5F5',
  text: '#000000',
  subtext: '#6E6E6E',
  primary: '#7B68EE',
  secondary: '#FF6B6B',
  border: '#E0E0E0',
  tabBar: '#F5F5F5',
  tabIcon: '#A0A0A0',
  statusBar: 'dark',
  disabled: '#CCCCCC',
};
const amoled: Theme = {
  background: '#000000',
  card: '#121212',
  text: '#FFFFFF',
  subtext: '#9E9E9E',
  primary: '#7B68EE',
  secondary: '#FF6B6B',
  border: '#1A1A1A',
  tabBar: '#000000',
  tabIcon: '#6E6E6E',
  statusBar: 'light',
  disabled: '#333333',
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