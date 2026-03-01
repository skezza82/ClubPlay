const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'club-play-app'
    });
}

const auth = admin.auth();
const email = 'brucewayne@waynemail.com';
const newPassword = 'password123';

async function setPassword() {
    try {
        const user = await auth.getUserByEmail(email);
        await auth.updateUser(user.uid, {
            password: newPassword
        });
        console.log(`Successfully updated password for ${email}`);
        process.exit(0);
    } catch (error) {
        console.error('Error updating password:', error);
        process.exit(1);
    }
}

setPassword();
