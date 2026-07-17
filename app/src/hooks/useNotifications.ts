import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications } from '../services/notificationService';

export function useNotifications() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const listenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    registerForPushNotifications().then(setPushToken);

    listenerRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[notification tapped]', response.notification.request.content);
      }
    );

    return () => {
      listenerRef.current?.remove();
    };
  }, []);

  return { pushToken };
}
