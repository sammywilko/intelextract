
export interface UserProfile {
  name: string;
  email: string;
  picture: string;
  accessToken?: string;
}

/**
 * Mock User for Preview/Developer Bypass
 */
export const MOCK_USER: UserProfile = {
  name: "Commander Developer",
  email: "dev@repstack.ai",
  picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  accessToken: "mock_access_token_dev_bypass"
};

/**
 * Manages Google OAuth 2.0 Handshake
 */
export const initGoogleAuth = (callback: (user: UserProfile) => void) => {
  if (typeof window === 'undefined' || !(window as any).google) return;

  (window as any).google.accounts.id.initialize({
    client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com", // Replace with real ID in production
    callback: (response: any) => {
      try {
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        const user: UserProfile = {
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
          accessToken: response.credential
        };
        callback(user);
      } catch (e) {
        console.error("Auth Decoding Failed", e);
      }
    },
  });
};

export const promptGoogleLogin = () => {
  if (!(window as any).google) {
    console.warn("Google Identity Services script not loaded.");
    return;
  }
  (window as any).google.accounts.id.prompt();
};

export const signOut = () => {
  if ((window as any).google) {
    (window as any).google.accounts.id.disableAutoSelect();
  }
  localStorage.removeItem('cc_user_session');
  window.location.reload();
};
