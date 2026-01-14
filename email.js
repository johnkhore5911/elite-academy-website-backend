// email.js
const mongoose = require('mongoose');
require('dotenv').config();

const PolityPurchase = require('./src/models/PolityPurchase');
const BookPurchase = require('./src/models/BookPurchase');

async function getPolityOnlyBuyersEmails() {
  try {
    const polityPurchases = await PolityPurchase.find({
      status: 'confirmed'
    }).select('userEmail userFirebaseUid userName');

    console.log(`Total confirmed polity purchases: ${polityPurchases.length}`);

    const polityEmails = [...new Set(polityPurchases.map(p => p.userEmail))];
    const polityUserIds = [...new Set(polityPurchases.map(p => p.userFirebaseUid))];

    console.log(`Unique polity buyers: ${polityEmails.length}`);

    const bookPurchases = await BookPurchase.find({
      $or: [
        { userEmail: { $in: polityEmails } },
        { userId: { $in: polityUserIds } }
      ],
      status: 'completed'
    }).select('userEmail userId');

    const bookBuyerEmails = new Set(bookPurchases.map(p => p.userEmail));
    const bookBuyerIds = new Set(bookPurchases.map(p => p.userId));

    console.log(`Users who also bought from BookPurchase: ${bookBuyerEmails.size}`);

    const polityOnlyBuyers = polityPurchases.filter(purchase => {
      const hasNotBoughtFromBookPurchase = 
        !bookBuyerEmails.has(purchase.userEmail) && 
        !bookBuyerIds.has(purchase.userFirebaseUid);
      return hasNotBoughtFromBookPurchase;
    });

    const uniquePolityOnlyEmails = [...new Set(polityOnlyBuyers.map(p => p.userEmail))];

    console.log('\n========================================');
    console.log('USERS WHO BOUGHT ONLY POLITY BOOK:');
    console.log('========================================');
    console.log(`Total count: ${uniquePolityOnlyEmails.length}\n`);
    
    uniquePolityOnlyEmails.forEach((email, index) => {
      console.log(`${email}`);
    });

    console.log('========================================\n');

    return uniquePolityOnlyEmails;

  } catch (error) {
    console.error('Error fetching polity-only buyers:', error);
    throw error;
  }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully!\n');
    return getPolityOnlyBuyersEmails();
  })
  .then(() => {
    mongoose.connection.close();
    console.log('\nMongoDB connection closed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
