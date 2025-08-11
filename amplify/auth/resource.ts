import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Welcome to our app! Verify your email',
      verificationEmailBody: createCode =>
        `Thank you for signing up! Use this verification code to confirm your account: ${createCode()}`,
      userInvitation: {
        emailSubject: "You're invited to join our app!",
        emailBody: (user, code) =>
          `Welcome! You can now login with your email ${user()} and temporary password ${code()}`,
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
