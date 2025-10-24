// Dummy email service for development
const nodemailer = require('nodemailer');

const sendWelcomeEmail = async (user) => {
  try {
    // Create a dummy transporter for development
    const transporter = nodemailer.createTransporter({
      host: 'localhost',
      port: 25,
      ignoreTLS: true,
      secure: false
    });

    // Send test email
    await transporter.sendMail({
      from: '"Tripolar Usher" <noreply@tripolar.com>',
      to: user.email,
      subject: 'Welcome to Tripolar Ushers!',
      html: `
        <h1>Welcome ${user.name}!</h1>
        <p>Your account has been created successfully.</p>
        <p>Role: ${user.role.toUpperCase()}</p>
        <p>Get ready to usher in excellence!</p>
        <hr>
        <p>This is a development email. In production, configure real SMTP.</p>
      `
    });

    console.log(`✅ Welcome email sent to ${user.email}`);
  } catch (error) {
    console.warn('⚠️ Failed to send welcome email:', error.message);
  }
};

module.exports = { sendWelcomeEmail };