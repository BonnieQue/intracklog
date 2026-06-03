import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications are presented when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permission and return true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule a local reminder to log trips.
 * @param hour 24-hour clock (e.g. 18 = 6pm)
 * @param minute minute of the hour
 */
export async function scheduleDailyTripReminder(hour: number = 18, minute: number = 0): Promise<void> {
  await cancelTripReminders();
  const granted = await requestNotificationPermission();
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Log today\'s trips',
      body: 'Don\'t forget to record your trips and expenses for today.',
      data: { type: 'trip_reminder' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute } as any,
  });
}

/**
 * Schedule a monthly report reminder.
 */
export async function scheduleMonthlyReportReminder(): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Generate this month\'s report',
      body: 'Your monthly mileage report is ready to be generated and submitted.',
      data: { type: 'monthly_report' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, day: 1, hour: 9, minute: 0, repeats: true } as any,
  });
}

export async function cancelTripReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as any)?.type === 'trip_reminder') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Send an immediate test notification.
 */
export async function sendTestNotification(): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'InTrackLog notifications enabled',
      body: 'You\'ll get reminders to log trips and generate reports.',
    },
    trigger: null, // immediate
  });
}
