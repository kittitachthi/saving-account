import * as oidc from "openid-client";
import type { GoogleIdentityProvider, OAuthAttempt } from "./auth.types.js";

type GoogleProviderConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export function createGoogleIdentityProvider(
  providerConfig: GoogleProviderConfig,
): GoogleIdentityProvider {
  const configuration = oidc.discovery(
    new URL("https://accounts.google.com"),
    providerConfig.clientId,
    providerConfig.clientSecret,
  );

  return {
    async createAuthorizationRequest() {
      const [config, codeVerifier] = await Promise.all([
        configuration,
        Promise.resolve(oidc.randomPKCECodeVerifier()),
      ]);
      const state = oidc.randomState();
      const nonce = oidc.randomNonce();
      const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
      const authorizationUrl = oidc.buildAuthorizationUrl(config, {
        redirect_uri: providerConfig.redirectUri,
        response_type: "code",
        scope: "openid email profile",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state,
        nonce,
      });
      return {
        authorizationUrl: authorizationUrl.href,
        state,
        nonce,
        codeVerifier,
      };
    },

    async consumeAuthorizationResponse(
      callbackUrl: URL,
      attempt: OAuthAttempt,
    ) {
      const tokens = await oidc.authorizationCodeGrant(
        await configuration,
        callbackUrl,
        {
          pkceCodeVerifier: attempt.codeVerifier,
          expectedState: attempt.state,
          expectedNonce: attempt.nonce,
        },
      );
      const claims = tokens.claims();
      if (
        !claims ||
        typeof claims.sub !== "string" ||
        typeof claims.email !== "string"
      ) {
        throw new Error("Google identity response is incomplete");
      }
      return {
        subject: claims.sub,
        email: claims.email,
        emailVerified: claims.email_verified === true,
        displayName:
          typeof claims.name === "string" ? claims.name : claims.email,
      };
    },
  };
}
