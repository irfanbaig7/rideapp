let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendOtpSms(phone, otp) {
    if (!client) {
        console.log(`📩 [DEV MODE] OTP for ${phone}: ${otp}`);
        return { simulated: true };
    }
    try {
        await client.messages.create({
            body: `Your Chalo verification code is ${otp}.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `+91${phone}`,
        });
        return { simulated: false };
    } catch (err) {
        console.log(`📩 [Fallback] OTP for ${phone}: ${otp}`);
        return { simulated: true, error: err.message };
    }
}

module.exports = { sendOtpSms };