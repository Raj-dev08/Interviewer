export const otpEmailTemplate = (otp) => {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background: #f6f7fb; padding: 40px 0;">
    <div style="max-width: 520px; margin: auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #eaeaea;">

      <!-- Header -->
      <div style="background: #111827; padding: 20px 24px;">
        <h2 style="color: #ffffff; margin: 0; font-size: 18px;">
          Interview Platform Verification
        </h2>
      </div>

      <!-- Body -->
      <div style="padding: 28px 24px;">
        <p style="font-size: 14px; color: #374151; margin: 0 0 12px;">
          Hi,
        </p>

        <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
          Use the verification code below to complete your login / registration.
        </p>

        <!-- OTP Box -->
        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; padding: 14px 28px; font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #111827; background: #f3f4f6; border-radius: 10px;">
            ${otp}
          </div>
        </div>

        <p style="font-size: 13px; color: #6b7280; text-align: center;">
          This code expires in <b>5 minutes</b>.
        </p>

        <!-- Warning -->
        <div style="margin-top: 24px; padding: 12px; background: #fff7ed; border-left: 4px solid #f97316; border-radius: 6px;">
          <p style="margin: 0; font-size: 12px; color: #9a3412;">
            If you didn’t request this, you can safely ignore this email.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 16px 24px; font-size: 11px; color: #9ca3af; text-align: center; border-top: 1px solid #eee;">
        © ${new Date().getFullYear()} Interview Platform. All rights reserved.
      </div>

    </div>
  </div>
  `;
};