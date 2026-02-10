import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export const initializePushNotifications = async () => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
        console.log('Push notifications are only available on native platforms');
        return null;
    }

    try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
            console.warn('User denied push notification permissions');
            return null;
        }

        await PushNotifications.register();

        // Return a promise that resolves with the token
        return new Promise<string>((resolve, reject) => {
            PushNotifications.addListener('registration', (token) => {
                console.log('Push registration success, token: ' + token.value);
                resolve(token.value);
            });

            PushNotifications.addListener('registrationError', (error) => {
                console.error('Error on registration: ' + JSON.stringify(error));
                reject(error);
            });
        });
    } catch (error) {
        console.error('Error initializing push notifications', error);
        return null;
    }
};

export const saveFcmToken = async (userId: string, token: string) => {
    try {
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('./firebase');
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { fcmToken: token }, { merge: true });
        console.log('FCM Token saved for user:', userId);
    } catch (error) {
        console.error('Error saving FCM token:', error);
    }
};

export const addPushListeners = () => {
    if (!Capacitor.isNativePlatform()) return;

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ' + JSON.stringify(notification));
    });

    PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification) => {
            console.log('Push action performed: ' + JSON.stringify(notification));
        }
    );
};
