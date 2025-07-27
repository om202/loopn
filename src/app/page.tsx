'use client';

import { Authenticator, ThemeProvider, type Theme } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

const theme: Theme = {
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
          backgroundColor: 'rgb(79, 70, 229)', // indigo-600
          _hover: {
            backgroundColor: 'rgb(67, 56, 202)', // indigo-700
          },
          _focus: {
            backgroundColor: 'rgb(67, 56, 202)',
          },
          _active: {
            backgroundColor: 'rgb(55, 48, 163)', // indigo-800
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
          color: 'rgb(107, 114, 128)', // gray-500
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
          10: 'rgb(238, 242, 255)', // indigo-50
          20: 'rgb(224, 231, 255)', // indigo-100
          40: 'rgb(165, 180, 252)', // indigo-300
          60: 'rgb(129, 140, 248)', // indigo-400
          80: 'rgb(99, 102, 241)',  // indigo-500
          90: 'rgb(79, 70, 229)',   // indigo-600
          100: 'rgb(67, 56, 202)',  // indigo-700
        },
      },
    },
  },
};

function AuthHeader() {
  return (
    <div className="text-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Welcome to Loopn
      </h1>
      <p className="text-gray-600">
        Sign in to your account or create a new one
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <ThemeProvider theme={theme}>
        <Authenticator
          formFields={{
            signIn: {
              username: {
                placeholder: 'Enter your email',
                isRequired: true,
                label: 'Email'
              }
            },
            signUp: {
              username: {
                placeholder: 'Enter your email',
                isRequired: true,
                label: 'Email'
              },
              password: {
                placeholder: 'Enter your password',
                isRequired: true,
                label: 'Password'
              },
              confirm_password: {
                placeholder: 'Confirm your password',
                isRequired: true,
                label: 'Confirm Password'
              }
            }
          }}
          components={{
            Header: AuthHeader,
          }}
        >
          {({ signOut, user }) => (
            <div className='min-h-screen flex flex-col'>
              {/* Header */}
              <header className='bg-white shadow-sm border-b'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                  <div className='flex justify-between items-center h-16'>
                    <h1 className='text-2xl font-bold text-gray-900'>
                      Loopn App
                    </h1>
                    <div className='flex items-center space-x-4'>
                      <span className='text-gray-700'>
                        Welcome, {user?.signInDetails?.loginId}!
                      </span>
                      <button
                        onClick={signOut}
                        className='bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors'
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </header>

              {/* Main Content */}
              <main className='flex-1 py-8'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                  <div className='bg-white rounded-lg shadow p-6'>
                    <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                      Dashboard
                    </h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                      {/* User Info Card */}
                      <div className='bg-indigo-50 p-4 rounded-lg'>
                        <h3 className='font-medium text-indigo-900 mb-2'>
                          User Information
                        </h3>
                        <p className='text-sm text-indigo-700'>
                          <strong>Email:</strong>{' '}
                          {user?.signInDetails?.loginId || 'N/A'}
                        </p>
                        <p className='text-sm text-indigo-700'>
                          <strong>User ID:</strong> {user?.userId || 'N/A'}
                        </p>
                      </div>

                      {/* Features Card */}
                      <div className='bg-green-50 p-4 rounded-lg'>
                        <h3 className='font-medium text-green-900 mb-2'>
                          Features Available
                        </h3>
                        <ul className='text-sm text-green-700 space-y-1'>
                          <li>✅ Email Authentication</li>
                          <li>✅ User Registration</li>
                          <li>✅ Email Verification</li>
                          <li>✅ Password Reset</li>
                          <li>✅ Secure Sessions</li>
                        </ul>
                      </div>

                      {/* Quick Actions Card */}
                      <div className='bg-gray-50 p-4 rounded-lg'>
                        <h3 className='font-medium text-gray-900 mb-2'>
                          Quick Actions
                        </h3>
                        <div className='space-y-2'>
                          <button className='w-full text-left text-sm text-gray-700 hover:text-indigo-600 transition-colors'>
                            Update Profile
                          </button>
                          <button className='w-full text-left text-sm text-gray-700 hover:text-indigo-600 transition-colors'>
                            Change Password
                          </button>
                          <button className='w-full text-left text-sm text-gray-700 hover:text-indigo-600 transition-colors'>
                            View Activity
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Welcome Message */}
                    <div className='mt-8 p-4 bg-blue-50 rounded-lg'>
                      <h3 className='text-lg font-medium text-blue-900 mb-2'>
                        🎉 Themed Authentication Successfully Configured!
                      </h3>
                      <p className='text-blue-700'>
                        Your app now uses a custom indigo theme for authentication
                        forms, matching your app&apos;s design system perfectly.
                      </p>
                    </div>
                  </div>
                </div>
              </main>

              {/* Footer */}
              <footer className='bg-white border-t'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
                  <p className='text-center text-sm text-gray-500'>
                    Powered by AWS Amplify Gen 2 • Custom Themed Authentication
                  </p>
                </div>
              </footer>
            </div>
          )}
        </Authenticator>
      </ThemeProvider>
    </div>
  );
}
