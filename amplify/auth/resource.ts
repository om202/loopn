import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Welcome to Loopn! Verify your email',
      verificationEmailBody: createCode =>
        `Welcome to Loopn!  
  Your verification code is: ${createCode()}  
  Enter this in the app to confirm your account.`,
      userInvitation: {
        emailSubject: "You've been invited to join Loopn!",
        emailBody: (user, code) =>
          `Hello!  
  You've been invited to join Loopn.  
  Login with your email: ${user()}  
  Temporary password: ${code()}  
  Once logged in, you can change your password in settings.`,
      },
    },
  },
  accountRecovery: 'EMAIL_ONLY',
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
});
