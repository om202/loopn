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
          backgroundColor: 'rgb(79, 70, 229)', // blue-600
          _hover: {
            backgroundColor: 'rgb(67, 56, 202)', // blue-700
          },
          _focus: {
            backgroundColor: 'rgb(67, 56, 202)',
          },
          _active: {
            backgroundColor: 'rgb(55, 48, 163)', // blue-800
          },
        },
        link: {
          color: 'rgb(79, 70, 229)',
          _hover: {
            color: 'rgb(67, 56, 202)',
          },
        },
      },
      fieldcontrol: {
        _focus: {
          borderColor: 'rgb(79, 70, 229)',
          boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)',
        },
      },
      tabs: {
        item: {
          color: 'rgb(107, 114, 128)', // slate-500
          _active: {
            borderColor: 'rgb(79, 70, 229)',
            color: 'rgb(79, 70, 229)',
          },
          _hover: {
            color: 'rgb(79, 70, 229)',
          },
        },
      },
    },
    colors: {
      brand: {
        primary: {
          10: 'rgb(238, 242, 255)', // blue-50
          20: 'rgb(224, 231, 255)', // blue-100
          40: 'rgb(165, 180, 252)', // blue-300
          60: 'rgb(129, 140, 248)', // blue-400
          80: 'rgb(99, 102, 241)', // blue-500
          90: 'rgb(79, 70, 229)', // blue-600
          100: 'rgb(67, 56, 202)', // blue-700
        },
      },
    },
  },
};
