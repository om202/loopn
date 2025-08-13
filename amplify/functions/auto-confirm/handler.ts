import { PreSignUpTriggerHandler } from 'aws-lambda';

/**
 * Lambda function to conditionally auto-confirm users during sign-up
 * Uses DISABLE_EMAIL_VERIFICATION environment variable to toggle behavior
 * When true: allows creating multiple fake accounts without email verification
 * When false: normal email verification flow
 */
export const handler: PreSignUpTriggerHandler = async event => {
  // Check if email verification should be disabled
  const disableEmailVerification =
    process.env.DISABLE_EMAIL_VERIFICATION === 'true';

  if (disableEmailVerification) {
    console.log('Email verification disabled - auto-confirming user');
    // Auto-confirm the user
    event.response.autoConfirmUser = true;

    // Auto-verify email (no verification email sent)
    event.response.autoVerifyEmail = true;
  } else {
    console.log('Email verification enabled - normal verification flow');
    // Let the normal verification process happen
    // Don't set autoConfirmUser or autoVerifyEmail
  }

  return event;
};
