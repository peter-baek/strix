import 'react-i18next';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof import('../../public/locales/en/common.json');
      scan: typeof import('../../public/locales/en/scan.json');
      vulnerability: typeof import('../../public/locales/en/vulnerability.json');
      dashboard: typeof import('../../public/locales/en/dashboard.json');
    };
  }
}
