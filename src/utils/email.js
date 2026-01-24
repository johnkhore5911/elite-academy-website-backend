// src/utils/email.js
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends plain/simple email
 */
const sendEmail = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    from: '"Elite Academy" <support@eliteacademy.pro>',
    to,
    subject,
    text,
    html,
  });
};

/**
 * Sends booking confirmation emails to user and admin
 */
const sendBookingEmails = async ({ user, admin, slot, meetLink }) => {
  const start = new Date(slot.startTime).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
  const end = new Date(slot.endTime).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });

  const subject = "Your session is confirmed - Elite Meet";
  const html = `
    <p>Hi ${user.name || ""},</p>
    <p>Your session is confirmed.</p>
    <p><strong>Time:</strong> ${start} - ${end} (IST)</p>
    <p><strong>Meet link:</strong> <a href="${meetLink}">${meetLink}</a></p>
    <p>Thanks!</p>
  `;

  // to user
  await sendEmail({
    to: user.email,
    subject,
    html,
  });

  // to admin
  await sendEmail({
    to: admin.email,
    subject: `New booking: ${user.name || user.email}`,
    html: `
      <p>New booking received.</p>
      <p><strong>User:</strong> ${user.name || ""} (${user.email})</p>
      <p><strong>Time:</strong> ${start} - ${end}</p>
      <p><strong>Meet link:</strong> <a href="${meetLink}">${meetLink}</a></p>
    `,
  });
};

/**
 * Sends email with PDF attachment
 */
const sendEmailWithPDF = async ({ to, subject, text, html, pdfPath, pdfName }) => {
  // Check if PDF file exists
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ PDF file not found at path: ${pdfPath}`);
    throw new Error(`PDF file not found: ${pdfPath}`);
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Elite Meet" <no-reply@elitemeet.com>`,
    to,
    subject,
    text,
    html,
    attachments: [
      {
        filename: pdfName || "elite_academy_magazine.pdf",
        path: pdfPath,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};

// ✅ Book name mapping
const BOOK_NAMES = {
  polity: 'Complete Polity Package',
  economics: 'Complete Economics Package',
  geography: 'Complete Geography Package',
  environment: 'Complete Environment Package',
  science: 'Complete Science Package',
  modern_history: 'Complete Modern History Package',
  ancient_history: 'Complete Ancient History Package',
  medieval_history: 'Complete Medieval History Package'
};

/**
 * Send email for single book purchase
 */
const sendBookEmail = async (to, userName, bookName, bookType, bookInfo, pdfLink, driveLink, amount, paymentId) => {
  const emoji = getBookEmoji(bookType);
  const displayName = getBookDisplayName(bookType);
  
  // Generate features list HTML
  const featuresHTML = bookInfo.features.map(feature => 
    `<li style="margin: 8px 0; color: #1f2937;">${feature}</li>`
  ).join('');
  
  // Generate highlights list HTML
  const highlightsHTML = bookInfo.highlights.map(highlight => 
    `<li style="margin: 6px 0; color: #475569; font-size: 14px;">✓ ${highlight}</li>`
  ).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px 20px; }
        .success-badge { background: #10b981; color: white; display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; }
        .book-card { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .book-title { font-size: 22px; font-weight: bold; color: #1e293b; margin-bottom: 15px; }
        .book-stats { display: flex; gap: 15px; margin: 15px 0; }
        .stat-box { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; flex: 1; text-align: center; }
        .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
        .stat-value { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 5px; }
        .features-section { margin: 20px 0; background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 8px; }
        .highlights-section { margin: 20px 0; background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; border-radius: 8px; }
        .section-title { font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 10px; }
        ul { margin: 10px 0; padding-left: 20px; }
        .download-btn { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 10px 0; text-align: center; width: 100%; box-sizing: border-box; }
        .download-btn:hover { background: linear-gradient(135deg, #059669, #047857); }
        .link-text { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px; margin-top: 12px; font-size: 13px; word-break: break-all; }
        .link-text strong { color: #b45309; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
        .info-table td:first-child { font-weight: 600; color: #64748b; width: 40%; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${emoji} ${bookName}</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">For PSSSB & Punjab Exams</p>
        </div>
        
        <div class="content">
          <div class="success-badge">✅ Payment Confirmed</div>
          <p style="font-size: 16px; color: #1e293b;">Hi <strong>${userName}</strong>,</p>
          <p style="font-size: 15px; color: #475569;">Your <strong>${displayName}</strong> book is ready! Download it now and start preparing. 🚀</p>
          
          <div class="book-card">
            <div class="book-title">${emoji} ${displayName} Book</div>
            
            <div class="book-stats">
              <div class="stat-box">
                <div class="stat-label">Pages</div>
                <div class="stat-value">${bookInfo.pages || 'N/A'}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">PYQ Questions</div>
                <div class="stat-value">${bookInfo.pyqPages || 'N/A'}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Price</div>
                <div class="stat-value">₹${bookInfo.price}</div>
              </div>
            </div>
            
            <div class="features-section">
              <div class="section-title">📦 What's Inside</div>
              <ul>${featuresHTML}</ul>
            </div>
            
            <div class="highlights-section">
              <div class="section-title">🎯 Topics Covered</div>
              <ul>${highlightsHTML}</ul>
            </div>
            
            <a href="${pdfLink}" class="download-btn">📥 Download PDF Now</a>
            
            <div class="link-text">
              <strong>⚠️ Button not working?</strong><br>
              <a href="${driveLink}" style="color: #b45309; text-decoration: none;">${driveLink}</a>
            </div>
          </div>
          
          <table class="info-table">
            <tr>
              <td>Amount Paid</td>
              <td><strong>₹${amount}</strong></td>
            </tr>
            <tr>
              <td>Payment ID</td>
              <td><strong>${paymentId}</strong></td>
            </tr>
            <tr style="border-bottom: none;">
              <td>Status</td>
              <td><strong style="color: #10b981;">✓ Delivered</strong></td>
            </tr>
          </table>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
            <strong>📌 Need Help?</strong> Reply to this email or contact us at <strong>2025eliteacademy@gmail.com</strong>
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 10px 0;"><strong>Elite Academy</strong></p>
          <p style="margin: 0;">Your Success, Our Mission 🎓</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Elite Academy <noreply@eliteacademy.com>',
    to,
    subject: `${emoji} Your ${displayName} Book is Ready!`,
    html
  });
};

/**
 * Send email for package purchase (bundles)
 */
const sendPackageEmail = async (to, userName, packageName, packageInfo, books, pdfLinks, driveLinks, amount, paymentId) => {
  const booksCount = books.length;
  const packageEmoji = booksCount === 8 ? '📚' : '📖';
  
  // Calculate total pages
  const totalPages = books.reduce((sum, bookType) => {
    const bookInfo = require('../controllers/bookController').BOOK_INFO[bookType];
    return sum + (bookInfo?.pages || 0) + (bookInfo?.pyqPages || 0);
  }, 0);
  
  // Generate book download cards with full info
  const bookCards = books.map(bookType => {
    const emoji = getBookEmoji(bookType);
    const displayName = getBookDisplayName(bookType);
    const pdfLink = pdfLinks[bookType];
    const driveLink = driveLinks[bookType];
    const bookInfo = require('../controllers/bookController').BOOK_INFO[bookType];
    
    return `
      <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 10px; padding: 15px; margin: 10px 0;">
        <div style="font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 10px;">
          ${emoji} ${displayName}
        </div>
        <div style="font-size: 13px; color: #64748b; margin-bottom: 10px;">
          📄 ${bookInfo?.pages || 'N/A'} pages + ${bookInfo?.pyqPages || 'N/A'} PYQ questions
        </div>
        <a href="${pdfLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
          📥 Download PDF
        </a>
        <div style="margin-top: 10px; padding: 8px; background: #fef3c7; border-radius: 5px; font-size: 11px; word-break: break-all;">
          <strong>Link:</strong> <a href="${driveLink}" style="color: #b45309; text-decoration: none;">${driveLink}</a>
        </div>
      </div>
    `;
  }).join('');
  
  // Generate package features HTML
  const featuresHTML = packageInfo.features.map(feature => 
    `<li style="margin: 8px 0; color: #1f2937;">✓ ${feature}</li>`
  ).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 26px; }
        .content { padding: 30px 20px; }
        .success-badge { background: #10b981; color: white; display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; }
        .package-stats { display: flex; gap: 10px; margin: 20px 0; }
        .stat-card { background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 12px; flex: 1; text-align: center; }
        .stat-label { font-size: 11px; color: #047857; text-transform: uppercase; font-weight: bold; }
        .stat-value { font-size: 20px; font-weight: bold; color: #065f46; margin-top: 5px; }
        .features-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
        .info-table td:first-child { font-weight: 600; color: #64748b; width: 40%; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${packageEmoji} ${packageName}</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">For PSSSB & Punjab Exams</p>
        </div>
        
        <div class="content">
          <div class="success-badge">✅ Payment Confirmed</div>
          <p style="font-size: 16px; color: #1e293b;">Hi <strong>${userName}</strong>,</p>
          <p style="font-size: 15px; color: #475569;">
            Your <strong>${packageName}</strong> is ready! You got <strong>${booksCount} books</strong> 🎉 Download all below.
          </p>
          
          <div class="package-stats">
            <div class="stat-card">
              <div class="stat-label">Books</div>
              <div class="stat-value">${booksCount}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Pages</div>
              <div class="stat-value">${totalPages}+</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">You Saved</div>
              <div class="stat-value">₹${packageInfo.discount || 0}</div>
            </div>
          </div>
          
          <div class="features-box">
            <div style="font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 10px;">🎁 Package Includes</div>
            <ul style="margin: 10px 0; padding-left: 20px;">${featuresHTML}</ul>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px; margin: 20px 0; text-align: center; font-size: 14px;">
            <strong>💡 Pro Tip:</strong> Bookmark this email to access all PDFs anytime!
          </div>
          
          <h3 style="font-size: 18px; color: #1e293b; margin: 25px 0 15px 0;">📥 Download Your Books</h3>
          ${bookCards}
          
          <table class="info-table">
            <tr>
              <td>Total Books</td>
              <td><strong>${booksCount} Books</strong></td>
            </tr>
            <tr>
              <td>Amount Paid</td>
              <td><strong>₹${amount}</strong></td>
            </tr>
            <tr>
              <td>Payment ID</td>
              <td><strong>${paymentId}</strong></td>
            </tr>
            <tr style="border-bottom: none;">
              <td>Status</td>
              <td><strong style="color: #10b981;">✓ All Delivered</strong></td>
            </tr>
          </table>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
            <strong>📌 Need Help?</strong> Reply to this email or contact us at <strong>2025eliteacademy@gmail.com</strong>
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 10px 0;"><strong>Elite Academy</strong></p>
          <p style="margin: 0;">Your Success, Our Mission 🎓</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Elite Academy <noreply@eliteacademy.com>',
    to,
    subject: `${packageEmoji} Your ${packageName} is Ready! (${booksCount} Books)`,
    html
  });
};


// const sendCoachingEmail = async (enrollment) => {
//   const adminEmail = process.env.ADMIN_EMAIL || "2025eliteacademy@gmail.com";

//   // --- HTML TEMPLATE ---
// const html = `
//     <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
//       <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center;">
//         <h1>🎓 Registration Completed!</h1>
//         <p>Welcome to the Elite Academy Coaching Program</p>
//       </div>
      
//       <div style="padding: 30px; color: #1f2937;">
//         <p>Hi <strong>${enrollment.fullName}</strong>,</p>
//         <p>Your payment of <strong>₹${enrollment.amount}</strong> was successful. Your seat is officially reserved for the upcoming batch!</p>
        
//         <div style="background: #eef2ff; border: 1px dashed #4f46e5; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
//           <h3 style="margin: 0; color: #4f46e5;">🚀 Batch Starts: 1st February, 2026</h3>
//           <p style="margin: 5px 0; font-size: 14px;">Your course access on website and mobile login will be activated on this date.</p>
//         </div>

//         <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #4f46e5;">
//           <h3 style="margin-top: 0; color: #4f46e5;">📱 Mobile App Login Details</h3>
//           <p style="margin: 5px 0;"><strong>User ID/Email:</strong> ${enrollment.email}</p>
//           <p style="margin: 5px 0;"><strong>Password:</strong> ${enrollment.appPassword}</p>
//           <p style="font-size: 13px; color: #ef4444; margin-top: 10px;">
//             <strong>Note:</strong> Login access will be enabled on <b>February 1st</b>.
//           </p>
//         </div>

//         <h3>Student Profile Details:</h3>
//         <ul style="list-style: none; padding: 0;">
//           <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Father's Name:</strong> ${enrollment.fatherName}</li>
//           <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Mobile Number:</strong> ${enrollment.mobile}</li>
//           <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Order ID:</strong> ${enrollment.razorpayOrderId}</li>
//         </ul>

//         <p style="margin-top: 30px;">We are excited to have you on board! If you have any questions before the batch starts, feel free to reach out.</p>
//       </div>
      
//       <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
//         © 2026 Elite Academy | Your Success, Our Mission
//       </div>
//     </div>
// `;

//   // 1. Send to Student
//   await transporter.sendMail({
//     from: process.env.EMAIL_FROM || '"Elite Academy" <noreply@eliteacademy.com>',
//     to: enrollment.email,
//     subject: "🎉 Welcome to Elite Academy - Enrollment Successful",
//     html: html
//   });

//   // 2. Send to Admin (Detailed Report)
//   await transporter.sendMail({
//     from: '"System Notification" <noreply@eliteacademy.com>',
//     to: adminEmail,
//     subject: `🚀 NEW COACHING ENROLLMENT: ${enrollment.fullName}`,
//     html: `<h3>New Enrollment Details:</h3>` + html // Reusing the same HTML for admin
//   });
// };





// Helper to get book display name


/**
 * Sends coaching confirmation with App Login + 8 Book Links
 */
const sendCoachingEmail = async (enrollment, pdfLinks, paymentId) => {
  const adminEmail = process.env.ADMIN_EMAIL || "2025eliteacademy@gmail.com";

  // --- GENERATE BOOKS DOWNLOAD SECTION ---
  // This loops through the pdfLinks object and creates a nice list of buttons
  const booksHtml = Object.entries(pdfLinks).map(([key, link]) => {
    // Reusing your existing helpers to get names (e.g., 'polity' -> 'Polity')
    const bookName = typeof getBookDisplayName === 'function' ? getBookDisplayName(key) : key;
    const emoji = typeof getBookEmoji === 'function' ? getBookEmoji(key) : '📚';
    
    return `
      <div style="margin-bottom: 12px; padding: 12px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 14px; color: #1f2937;">${emoji} <strong>${bookName}</strong></span>
        <a href="${link}" style="background: #4f46e5; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">Download PDF</a>
      </div>
    `;
  }).join('');

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center;">
        <h1>🎓 Registration Completed!</h1>
        <p>Welcome to the Elite Academy Coaching Program</p>
      </div>
      
      <div style="padding: 30px; color: #1f2937;">
        <p>Hi <strong>${enrollment.fullName}</strong>,</p>
        <p>Your payment of <strong>₹${enrollment.amount}</strong> was successful. Your seat is officially reserved!</p>
        
        <div style="background: #eef2ff; border: 1px dashed #4f46e5; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0; color: #4f46e5;">🚀 Batch Starts: 1st February, 2026</h3>
          <p style="margin: 5px 0; font-size: 14px;">Your course access will be activated on this date.</p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">📚 Your 8 Bonus Books (Immediate Access)</h3>
          <p style="font-size: 14px; color: #475569; margin-bottom: 15px;">As part of your coaching, you get instant access to our complete book library:</p>
          ${booksHtml}
        </div>

        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #4f46e5;">
          <h3 style="margin-top: 0; color: #4f46e5;">📱 Mobile App Login Details</h3>
          <p style="margin: 5px 0;"><strong>User ID/Email:</strong> ${enrollment.email}</p>
          <p style="margin: 5px 0;"><strong>Password:</strong> ${enrollment.appPassword}</p>
          <p style="font-size: 13px; color: #ef4444; margin-top: 10px;">
            <strong>Note:</strong> App login access will be enabled on <b>February 1st</b>.
          </p>
        </div>

        <h3>Student Profile:</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Father's Name:</strong> ${enrollment.fatherName}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Mobile:</strong> ${enrollment.mobile}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Payment ID:</strong> ${paymentId}</li>
        </ul>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
        © 2026 Elite Academy | Your Success, Our Mission
      </div>
    </div>
  `;

  // 1. Send to Student
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Elite Academy" <noreply@eliteacademy.com>',
    to: enrollment.email,
    subject: "🎉 Welcome to Elite Academy - Enrollment Successful + 8 Books",
    html: html
  });

  // 2. Send to Admin
  await transporter.sendMail({
    from: '"Elite Academy" <support@eliteacademy.pro>',
    to: adminEmail,
    subject: `🚀 NEW COACHING ENROLLMENT: ${enrollment.fullName}`,
    html: `<h3>Admin Report:</h3>` + html
  });
};

const getBookDisplayName = (bookType) => {
  const names = {
    'polity': 'Polity',
    'economics': 'Economics',
    'geography': 'Geography',
    'environment': 'Environment',
    'science': 'Science',
    'modern-history': 'Modern History',
    'ancient-history': 'Ancient History',
    'medieval-history': 'Medieval History'
  };
  return names[bookType] || bookType;
};

// Helper to get book emoji
const getBookEmoji = (bookType) => {
  const emojis = {
    'polity': '⚖️',
    'economics': '💰',
    'geography': '🌍',
    'environment': '🌱',
    'science': '🔬',
    'modern-history': '📜',
    'ancient-history': '🏛️',
    'medieval-history': '🏰'
  };
  return emojis[bookType] || '📚';
};

/**
 * Sends crash course confirmation with App Login + 8 Book Links
 */
const sendCrashCourseEmail = async (enrollment, pdfLinks, paymentId) => {
  const adminEmail = process.env.ADMIN_EMAIL || "2025eliteacademy@gmail.com";

  // --- GENERATE BOOKS DOWNLOAD SECTION ---
  const booksHtml = Object.entries(pdfLinks).map(([key, link]) => {
    const bookName = typeof getBookDisplayName === 'function' ? getBookDisplayName(key) : key;
    const emoji = typeof getBookEmoji === 'function' ? getBookEmoji(key) : '📚';
    
    return `
      <div style="margin-bottom: 12px; padding: 12px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 14px; color: #1f2937;">${emoji} <strong>${bookName}</strong></span>
        <a href="${link}" style="background: #4f46e5; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">Download PDF</a>
      </div>
    `;
  }).join('');

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center;">
        <h1>Crash Course Registration Complete!</h1>
        <p>Welcome to the Elite Academy Crash Course Program</p>
      </div>
      
      <div style="padding: 30px; color: #1f2937;">
        <p>Hi <strong>${enrollment.fullName}</strong>,</p>
        <p>Your payment of <strong>₹${enrollment.amount}</strong> was successful. Your seat is officially reserved for the crash course!</p>
        
        <div style="background: #fed7aa; border: 1px dashed #f97316; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0; color: #c2410c;">🎯 Program Starts: 1st February, 2026</h3>
          <p style="margin: 5px 0; font-size: 14px;">Your course access will be activated on this date.</p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">📚 Your 8 Bonus Books (Immediate Access)</h3>
          <p style="font-size: 14px; color: #475569; margin-bottom: 15px;">As part of your crash course, you get instant access to our complete book library:</p>
          ${booksHtml}
        </div>

        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f97316;">
          <h3 style="margin-top: 0; color: #f97316;">📱 Mobile App Login Details</h3>
          <p style="margin: 5px 0;"><strong>User ID/Email:</strong> ${enrollment.email}</p>
          <p style="margin: 5px 0;"><strong>Password:</strong> ${enrollment.appPassword}</p>
          <p style="font-size: 13px; color: #ef4444; margin-top: 10px;">
            <strong>Note:</strong> App login access will be enabled on <b>February 1st</b>.
          </p>
        </div>

        <h3>Student Profile:</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Father's Name:</strong> ${enrollment.fatherName}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Mobile:</strong> ${enrollment.mobile}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Payment ID:</strong> ${paymentId}</li>
        </ul>

        <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
          💡 <strong>Tip:</strong> Save this email to access all your PDFs and login details anytime.
        </p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
        © 2026 Elite Academy | Your Success, Our Mission 🎓
      </div>
    </div>
  `;

  // 1. Send to Student
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Elite Academy" <noreply@eliteacademy.com>',
    to: enrollment.email,
    subject: "🚀 Welcome to Crash Course - Registration Successful + 8 Books",
    html: html
  });

  // 2. Send to Admin
  await transporter.sendMail({
    from: '"Elite Academy" <support@eliteacademy.pro>',
    to: adminEmail,
    subject: `🎯 NEW CRASH COURSE ENROLLMENT: ${enrollment.fullName}`,
    html: `<h3>Admin Report:</h3>` + html
  });
};

async function sendWeeklyTestSeriesEnrollmentEmail({ email, fullName, mobile, appPassword, amount, paymentId, mode, fatherName }) {
  const modeInfo = mode === "online" 
    ? {
        title: "Online Test Series",
        accessInfo: "You can access the test series on your mobile device using the Elite Academy app.",
        downloadSection: `
          <h3 style="color: #2563eb; margin-top: 24px;">📱 Download the App</h3>
          <p style="margin: 12px 0;">Get started by downloading our app:</p>
          <div style="margin: 20px 0;">
            <a href="https://play.google.com/store/apps/details?id=com.johnnykhore.eliteacademy&hl=en" 
               style="display: inline-block; background: #34d399; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
              📱 Download on Play Store
            </a>
            <a href="https://apps.apple.com/in/app/elite-academy-mock-tests/id6746954938" 
               style="display: inline-block; background: #60a5fa; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              📱 Download on App Store
            </a>
          </div>
        `,
        instructionsIcon: "📱",
        instructionsText: "Login to the app using your credentials and start taking tests from anywhere!"
      }
    : {
        title: "Offline Test Series",
        accessInfo: "You can give tests at our institute. Please visit the institute with your enrollment details.",
        downloadSection: `
          <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">🏢 Visit Our Institute</h3>
            <p style="color: #78350f; margin: 8px 0;">
              <strong>Elite Academy</strong><br>
              SCO-212 Sector 24D Chandigarh<br>
              Contact: 7696954686
            </p>
            <p style="color: #78350f; margin: 8px 0;">
              <strong>Timing:</strong> Monday to Saturday, 9:00 AM - 6:00 PM
            </p>
          </div>
        `,
        instructionsIcon: "🏢",
        instructionsText: "Visit the institute and login at the test center using your credentials."
      };

  const subject = `🎉 Enrollment Confirmed - Weekly Test Series (${modeInfo.title})`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Enrollment Confirmed!</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Welcome to Weekly Test Series</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Dear <strong>${fullName}</strong>,
          </p>

          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Congratulations! 🎉 Your payment has been confirmed and you're now enrolled in the <strong>${modeInfo.title}</strong>.
          </p>

          <!-- Login Credentials Box -->
          <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border: 2px solid #667eea;">
            <h2 style="color: #667eea; margin-top: 0; font-size: 20px;">🔐 Your Login Credentials</h2>
            
            <div style="background: white; padding: 16px; border-radius: 8px; margin: 12px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Email:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 500;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Password:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 500; font-family: monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${appPassword}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Mobile:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 500;">${mobile}</td>
                </tr>
              </table>
            </div>

            <div style="background: #fef3c7; padding: 12px; border-radius: 6px; margin-top: 16px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⚠️ <strong>Important:</strong> Please keep these credentials safe. You'll need them to access your tests.
              </p>
            </div>
          </div>

          <!-- Mode Specific Instructions -->
          <div style="margin: 24px 0;">
            <h3 style="color: #111827; font-size: 18px;">${modeInfo.instructionsIcon} How to Access</h3>
            <p style="color: #374151; line-height: 1.6; margin: 12px 0;">
              ${modeInfo.accessInfo}
            </p>
            ${modeInfo.downloadSection}
            <p style="color: #374151; line-height: 1.6; margin: 12px 0;">
              ${modeInfo.instructionsText}
            </p>
          </div>

          <!-- Enrollment Details -->
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #111827; margin-top: 0; font-size: 18px;">📋 Enrollment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; color: #6b7280;">Student Name</td>
                <td style="padding: 12px 0; color: #111827; text-align: right; font-weight: 500;">${fullName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; color: #6b7280;">Father's Name</td>
                <td style="padding: 12px 0; color: #111827; text-align: right; font-weight: 500;">${fatherName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; color: #6b7280;">Mode</td>
                <td style="padding: 12px 0; color: #111827; text-align: right; font-weight: 500;">${modeInfo.title}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; color: #6b7280;">Amount Paid</td>
                <td style="padding: 12px 0; color: #059669; text-align: right; font-weight: 600;">₹${amount}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #6b7280;">Payment ID</td>
                <td style="padding: 12px 0; color: #111827; text-align: right; font-size: 12px; font-family: monospace;">${paymentId}</td>
              </tr>
            </table>
          </div>

          <!-- Support Section -->
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 6px; margin: 24px 0;">
            <h3 style="color: #1e40af; margin-top: 0; font-size: 16px;">💬 Need Help?</h3>
            <p style="color: #1e40af; margin: 8px 0; line-height: 1.6;">
              If you face any issues logging in or have questions, feel free to reach out to us:
            </p>
            <p style="color: #1e40af; margin: 8px 0;">
              📧 Email: <a href="mailto:2025eliteacademy@gmail.com" style="color: #2563eb;">2025eliteacademy@gmail.com</a><br>
              📱 WhatsApp: 7696954686
            </p>
          </div>

          <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 24px;">
            Best regards,<br>
            <strong>Elite Academy Team</strong>
          </p>

          <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
            🌟 All the best for your exam preparation! We're here to help you succeed.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">
            © 2026 Elite Academy. All rights reserved.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">
            This is an automated email. Please do not reply directly to this message.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  const text = `
Enrollment Confirmed - Weekly Test Series (${modeInfo.title})

Dear ${fullName},

Congratulations! Your payment has been confirmed and you're now enrolled in the ${modeInfo.title}.

🔐 Your Login Credentials:
Email: ${email}
Password: ${appPassword}
Mobile: ${mobile}

${mode === "online" 
  ? "Access: You can access the test series on your mobile device using the Elite Academy app. Download from Play Store or App Store and login with your credentials."
  : "Access: Visit our institute to give tests. Please bring your enrollment details.\n\nInstitute Address: Elite Academy, [Your Address]\nTiming: Monday to Saturday, 9:00 AM - 6:00 PM"
}

📋 Enrollment Details:
- Student Name: ${fullName}
- Father's Name: ${fatherName}
- Mode: ${modeInfo.title}
- Amount Paid: ₹${amount}
- Payment ID: ${paymentId}


Need Help?
Email: 2025eliteacademy@gmail.com
WhatsApp: 7696954686

Best regards,
Elite Academy Team

All the best for your exam preparation! 🌟
  `;

  // await sendEmail(email, subject, text, html);
  await sendEmail({ 
    to: email, 
    subject: subject, 
    text: text, 
    html: html 
  });
  console.log(`Weekly Test Series enrollment email sent to ${email}`);
}


// ✅ CORRECT EXPORT
module.exports = {
  sendEmail,
  sendEmailWithPDF,
  sendBookingEmails,    // ✅ This is the correct name (not sendBookingConfirmation)
  sendBookEmail,        // ✅ NEW - for single books
  sendPackageEmail,      // ✅ NEW - for packages
  sendCoachingEmail,
  sendCrashCourseEmail,   // ✅ NEW - for crash course
  sendWeeklyTestSeriesEnrollmentEmail
};
