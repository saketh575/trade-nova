import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSetupResult {
  enabled: boolean;
  pushToken: string | null;
  message: string;
}

export async function enableNotifications(): Promise<NotificationSetupResult> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('market-updates', {
      name: 'Market updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: '#B6F23A',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    return { enabled: false, pushToken: null, message: 'Notification permission was not granted.' };
  }

  const projectId = Constants.easConfig?.projectId;
  if (!projectId) {
    return {
      enabled: true,
      pushToken: null,
      message: 'Device notifications are enabled. Add an EAS project ID to register for remote push delivery.',
    };
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return { enabled: true, pushToken: token.data, message: 'Device is registered for push notifications.' };
}

export async function sendLocalNotification(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: false },
    trigger: null,
  });
}
