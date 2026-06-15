import * as Keychain from 'react-native-keychain';

const SERVICE_NAME = 'banking-app-auth';

export const saveTokens = async ({ accessToken, refreshToken }) => {
  await Keychain.setGenericPassword('session', JSON.stringify({ accessToken, refreshToken }), {
    service: SERVICE_NAME,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
};

export const getTokens = async () => {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE_NAME });
  if (!credentials) return null;

  try {
    return JSON.parse(credentials.password);
  } catch {
    return null;
  }
};

export const clearTokens = async () => {
  await Keychain.resetGenericPassword({ service: SERVICE_NAME });
};
