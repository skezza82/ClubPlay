const admin = require('firebase-admin');

// Initialize with default credentials
admin.initializeApp();

const uid = 'p1VGBJJAjJgrKGH0EYNXbG9uMLa2';
const newPassword = 'password123';

admin.auth().updateUser(uid, {
    password: newPassword
})
    .then((userRecord) => {
        console.log('Successfully updated user password:', userRecord.toJSON());
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error updating password:', error);
        process.exit(1);
    });
