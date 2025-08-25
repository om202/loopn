import { type Theme } from '@aws-amplify/ui-react';

export const amplifyTheme: Theme = {
  name: 'loopn-theme',
  tokens: {
    components: {
      authenticator: {
        router: {
          boxShadow: '0 0 16px rgba(0, 0, 0, 0.1)',
          borderWidth: '1px',
          borderColor: 'rgb(229, 231, 235)',
        },
        form: {
          padding: '2rem',
        },
      },
      button: {
        primary: {
          backgroundColor: 'rgb(120, 77, 186)', // brand-600
          _hover: {
            backgroundColor: 'rgb(102, 58, 164)', // brand-700
          },
          _focus: {
            backgroundColor: 'rgb(102, 58, 164)',
          },
          _active: {
            backgroundColor: 'rgb(84, 40, 142)', // brand-800
          },
        },
        link: {
          color: 'rgb(120, 77, 186)',
          _hover: {
            color: 'rgb(102, 58, 164)',
          },
        },
      },
      fieldcontrol: {
        _focus: {
          borderColor: 'rgb(120, 77, 186)',
          boxShadow: '0 0 0 3px rgba(120, 77, 186, 0.1)',
        },
      },
      tabs: {
        item: {
          color: 'rgb(107, 114, 128)', // slate-1000
          _active: {
            borderColor: 'rgb(120, 77, 186)',
            color: 'rgb(120, 77, 186)',
          },
          _hover: {
            color: 'rgb(120, 77, 186)',
          },
        },
      },
    },
    colors: {
      brand: {
        primary: {
          10: 'rgb(249, 246, 255)', // brand-50
          20: 'rgb(240, 232, 255)', // brand-100
          40: 'rgb(186, 158, 228)', // brand-300
          60: 'rgb(165, 128, 215)', // brand-400
          80: 'rgb(120, 77, 186)', // brand-600
          90: 'rgb(142, 102, 201)', // brand-500
          100: 'rgb(102, 58, 164)', // brand-700
        },
      },
    },
  },
};
