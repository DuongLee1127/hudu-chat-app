import { theme, type ThemeConfig } from 'antd';

const BRAND_COLOR = '#5b5bf6';

export const antdTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: BRAND_COLOR,
    borderRadius: 6,
    fontFamily: 'var(--font-geist-sans), Arial, Helvetica, sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#ffffff',
      bodyBg: '#f4f5fb',
    },
  },
};
