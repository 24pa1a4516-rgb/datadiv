/**
 * Mock SMS Service for OTP delivery.
 * In a real application, this would integrate with Twilio, AWS SNS, etc.
 */

const sendOTP = (phone, otp) => {
    console.log(`\n--------------------------------------`);
    console.log(`📲  SMS SENT TO: ${phone}`);
    console.log(`🔢  YOUR OTP IS: ${otp}`);
    console.log(`--------------------------------------\n`);

    // In a real scenario, this would be an async HTTP request to an SMS gateway
    return Promise.resolve(true);
};

module.exports = {
    sendOTP
};
