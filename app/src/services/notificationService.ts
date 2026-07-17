import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import type { Severity } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  const finalStatus =
    existing === 'granted'
      ? existing
      : (await Notifications.requestPermissionsAsync()).status;

  if (finalStatus !== 'granted') return null;

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export async function sendLocalAlert(
  severity: Severity,
  description: string,
  action: string
): Promise<void> {
  const titles: Record<Severity, string> = {
    low: '通知',
    medium: '注意 - MIRAI.MAMORU',
    high: '警告 - MIRAI.MAMORU',
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: titles[severity],
      body: `${description}\n推奨: ${action}`,
      sound: severity === 'high' ? 'default' : undefined,
      priority:
        severity === 'high'
          ? Notifications.AndroidNotificationPriority.MAX
          : Notifications.AndroidNotificationPriority.DEFAULT,
    },
    trigger: null,
  });
}
