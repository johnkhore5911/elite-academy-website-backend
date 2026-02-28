const JobApplication = require("../models/jobApplication");
const Razorpay = require("razorpay");
const cloudinary = require("cloudinary").v2;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Use INR for testing (set JOB_APPLICATION_CURRENCY=INR). For international use USD (set JOB_APPLICATION_CURRENCY=USD).
const JOB_CURRENCY = (process.env.JOB_APPLICATION_CURRENCY || "INR").toUpperCase();
const getJobPriceAndCurrency = () => {
  if (JOB_CURRENCY === "INR") {
    const price = Number(process.env.JOB_APPLICATION_PRICE_INR || 5000);
    return { price, currency: "INR" };
  }
  const price = Number(process.env.JOB_APPLICATION_PRICE_USD || 50);
  return { price, currency: "USD" };
};

// GET /api/job/info
exports.getJobInfo = (req, res) => {
  const { price, currency } = getJobPriceAndCurrency();
  res.json({
    price,
    currency,
    description: "Application fee for Elite Academy recruitment",
  });
};

// Upload buffer to Cloudinary (PDF/DOC/DOCX) and return secure_url
function uploadResumeToCloudinary(buffer, mimetype) {
  return new Promise((resolve, reject) => {
    const options = {
      resource_type: "raw",
      folder: "job-resumes",
    };
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result.secure_url);
    });
    stream.end(buffer);
  });
}

// POST /api/job/create-order (multipart: resume file + fields)
exports.createJobOrder = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "Resume file is required (PDF, DOC or DOCX)." });
    }

    const { name, email, phone, address, role, country, contract, interview } = req.body;
    if (!name || !email || !phone || !role) {
      return res.status(400).json({ error: "Missing required fields: name, email, phone, role." });
    }

    const resumeUrl = await uploadResumeToCloudinary(req.file.buffer, req.file.mimetype);

    const { price: amount, currency } = getJobPriceAndCurrency();
    // Razorpay: INR = paise (×100), USD = cents (×100)
    const amountInSubunits = Math.round(amount * 100);

    const options = {
      amount: amountInSubunits,
      currency,
      receipt: `job_rcpt_${Date.now()}`,
      notes: {
        purchaseType: "job_application",
        applicant_name: name,
        role: role,
      },
    };

    const order = await razorpay.orders.create(options);

    const newApplication = new JobApplication({
      fullName: name,
      email: email,
      phone: phone,
      address: address || "",
      role: role,
      country: country || "",
      contract: contract || "12month",
      interviewSlot: interview || "",
      resumeUrl,
      amount,
      currency,
      razorpayOrderId: order.id,
      status: "pending",
    });

    await newApplication.save();

    res.status(201).json({
      order,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Job create-order error:", error);
    res.status(500).json({
      message: "Could not create order or upload resume.",
      error: error.message,
    });
  }
};
