// Netlify Function to handle form submissions
const nodemailer = require("nodemailer");

// Simple HTML sanitizer for email bodies
const escapeHtml = (unsafe) => {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid JSON payload" }),
    };
  }

  const {
    name,
    email,
    phone,
    brand_link,
    sales_channels,
    product_count,
    distribution_method,
    manufacturer_rep,
    registered_trademark,
    primary_goal,
  } = data;

  // Validate required fields
  if (!name || !email || !phone) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required fields: name, email, or phone." }),
    };
  }

  // Create email transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Secure and sanitize inputs for the email body
  const sName = escapeHtml(name);
  const sEmail = escapeHtml(email);
  const sPhone = escapeHtml(phone);
  const sBrandLink = escapeHtml(brand_link);
  const sSalesChannels = escapeHtml(sales_channels);
  const sProductCount = escapeHtml(product_count);
  const sDistribution = escapeHtml(distribution_method);
  const sRep = escapeHtml(manufacturer_rep);
  const sTrademark = escapeHtml(registered_trademark);
  const sGoal = escapeHtml(primary_goal);

  // Email to site owner
  const mailToYou = {
    from: '"AGRONOV Admin" <noreply@agronovglobal.com>',
    to: "sales@agronovglobal.com",
    replyTo: `${sName} <${sEmail}>`,
    subject: "NEW BRAND PARTNER APPLICATION 🚀",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF9900; border-bottom: 3px solid #FF9900; padding-bottom: 10px;">
          New Brand Partnership Application
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f9f9f9;">
            <td style="padding: 12px; font-weight: bold; color: #555; width: 200px;">Name:</td>
            <td style="padding: 12px;"><strong>${sName}</strong></td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; color: #555;">Email:</td>
            <td style="padding: 12px;"><a href="mailto:${sEmail}" style="color: #FF9900;">${sEmail}</a></td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 12px; font-weight: bold; color: #555;">Phone:</td>
            <td style="padding: 12px;"><a href="tel:${sPhone}" style="color: #FF9900;">${sPhone}</a></td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; color: #555;">Brand Link:</td>
            <td style="padding: 12px;"><a href="${sBrandLink}" target="_blank" style="color: #FF9900;">${sBrandLink}</a></td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 12px; font-weight: bold; color: #555;">Sales Channels:</td>
            <td style="padding: 12px;">${sSalesChannels}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; color: #555;">Number of Products:</td>
            <td style="padding: 12px;">${sProductCount}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 12px; font-weight: bold; color: #555;">Distribution Method:</td>
            <td style="padding: 12px;">${sDistribution}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; color: #555;">Manufacturer's Rep:</td>
            <td style="padding: 12px;">${sRep}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 12px; font-weight: bold; color: #555;">Registered Trademark:</td>
            <td style="padding: 12px;">${sTrademark}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; color: #555;">Primary Goal:</td>
            <td style="padding: 12px; line-height: 1.5;">${sGoal}</td>
          </tr>
        </table>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #FF9900; color: #777; font-size: 14px;">
          <p><strong>AGRONOV Global LLC</strong></p>
          <p>Submitted securely via agronovglobal.com</p>
          <p>Timestamp: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `,
  };

  // Auto-response email to customer
  const mailToCustomer = {
    from: '"AGRONOV Global" <noreply@agronovglobal.com>',
    to: sEmail,
    replyTo: "sales@agronovglobal.com",
    subject: "Thank you for contacting AGRONOV Global",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #FF9900;">Thank you for your application!</h2>
        <p>Hi ${sName},</p>
        <p>We've securely received your partnership application and will review it carefully.</p>
        <p>Our team analyzes every application and will get back to you within <strong>24-48 hours</strong>.</p>
        <p>If you have any immediate questions, feel free to reach out:</p>
        <p style="background: #fdfdfd; padding: 15px; border-radius: 8px; border-left: 4px solid #FF9900;">
          📧 Email: <a href="mailto:sales@agronovglobal.com" style="color: #FF9900; text-decoration: none;">sales@agronovglobal.com</a><br><br>
          📞 Phone: <a href="tel:+17027276966" style="color: #FF9900; text-decoration: none;">+1 (702) 727-6966</a>
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://agronovglobal.com" style="background: #FF9900; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Visit Our Website
          </a>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 40px;">Best regards,<br><strong>The AGRONOV Global Team</strong></p>
      </div>
    `,
  };

  try {
    // Send both emails in parallel for performance
    await Promise.all([
      transporter.sendMail(mailToYou),
      transporter.sendMail(mailToCustomer)
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Application securely submitted.",
      }),
    };
  } catch (error) {
    console.error("Transmission error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to send application. Please try again later.",
      }),
    };
  }
};
