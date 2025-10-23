require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let User;
try {
  User = require('./models/User');
  console.log('✅ User model imported');
} catch (error) {
  console.error('❌ Model import error:', error.message);
  process.exit(1);
}

const createAdminUser = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bipolar';
    console.log('🔗 Connecting...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected');

    await User.deleteOne({ email: 'admin@bipolar.com' });
    console.log('🗑️ Admin cleared');

    const plainPass = 'admin123456';
    // Test bcrypt
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(plainPass, salt);
    const match = await bcrypt.compare(plainPass, hash);
    if (!match) throw new Error('Bcrypt test failed');
    console.log('✅ Bcrypt OK');

    const admin = new User({
      name: 'Admin User',
      email: 'admin@bipolar.com',
      password: plainPass,
      role: 'admin',
      isActive: true,
      profile: { bio: 'Admin', availability: true }
    });

    const saved = await admin.save();
    console.log('✅ Created ID:', saved._id);
    console.log('🔐 Hash preview:', saved.password.substring(0, 20) + '...');

    // Final test
    const finalMatch = await saved.comparePassword(plainPass);
    if (finalMatch) {
      console.log('✅ Final test SUCCESS');
      console.log('📧 Login: admin@bipolar.com / admin123456');
    } else {
      throw new Error('Final comparison failed');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState === 1) await mongoose.connection.close();
    process.exit(1);
  }
};

createAdminUser();