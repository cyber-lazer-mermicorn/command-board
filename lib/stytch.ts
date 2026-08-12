// Stytch auth helpers
// https://stytch.com/docs/b2c/sdks/next-js

export const stytchConfig = {
  publicToken: process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN ?? '',
  loginRedirectURL: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  signupRedirectURL: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
}

// Magic link config for passwordless login
export const magicLinkConfig = {
  login_magic_link_url: stytchConfig.loginRedirectURL,
  signup_magic_link_url: stytchConfig.signupRedirectURL,
}
