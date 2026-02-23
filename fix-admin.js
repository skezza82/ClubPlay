import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

async function fixBrokenBanners() {
    const clubsToUpdate = ['6GiEgXsWCNgOgkKSapsR', 'UhiAu0qgPtC5eUFe2cSe'];
    const newBanner = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200&h=400';

    for (const clubId of clubsToUpdate) {
        await db.collection('clubs').doc(clubId).update({
            bannerUrl: newBanner
        });
        console.log(`Updated banner for club ${clubId}`);
    }
}

fixBrokenBanners().catch(console.error);
