const FrenchCourse = require("../models/frenchCourse");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Currency and pricing configuration
const COURSE_CURRENCY = (process.env.FRENCH_COURSE_CURRENCY || "USD").toUpperCase();

const getCoursePricesAndCurrency = () => {
  if (COURSE_CURRENCY === "INR") {
    const price1Month = Number(process.env.FRENCH_COURSE_PRICE_1MONTH_INR || 16666); // ~$200
    const price3Month = Number(process.env.FRENCH_COURSE_PRICE_3MONTH_INR || 41666); // ~$500
    return { price1Month, price3Month, currency: "INR" };
  }
  const price1Month = Number(process.env.FRENCH_COURSE_PRICE_1MONTH_USD || 200);
  const price3Month = Number(process.env.FRENCH_COURSE_PRICE_3MONTH_USD || 500);
  return { price1Month, price3Month, currency: "USD" };
};

// GET /api/french-course/info
exports.getCourseInfo = (req, res) => {
  const { price1Month, price3Month, currency } = getCoursePricesAndCurrency();
  res.json({
    price1Month,
    price3Month,
    currency,
    description: "French Language Course - Get Your PR",
    features: [
      "3 Month Program (Basic to Advanced)",
      "Expert Teachers (Native & Indian)",
      "Live + Recorded Classes",
      "Monday to Friday | 7:00 PM IST",
      "Certificate Included"
    ]
  });
};

// POST /api/french-course/create-order
exports.createCourseOrder = async (req, res) => {
  try {
    const { name, email, phone, country, plan } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !country || !plan) {
      return res.status(400).json({ error: "Missing required fields: name, email, phone, country, plan." });
    }

    // Validate plan
    if (!["1month", "3month"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan. Must be '1month' or '3month'." });
    }

    const { price1Month, price3Month, currency } = getCoursePricesAndCurrency();
    const amount = plan === "1month" ? price1Month : price3Month;
    const planLabel = plan === "1month" ? "1 Month" : "3 Months";

    // Razorpay: INR = paise (×100), USD = cents (×100)
    const amountInSubunits = Math.round(amount * 100);

    const options = {
      amount: amountInSubunits,
      currency,
      receipt: `french_rcpt_${Date.now()}`,
      notes: {
        purchaseType: "french_course",
        student_name: name,
        plan: plan,
      },
    };

    const order = await razorpay.orders.create(options);

    const newEnrollment = new FrenchCourse({
      fullName: name,
      email: email,
      phone: phone,
      country: country,
      plan: plan,
      planLabel: planLabel,
      amount,
      currency,
      razorpayOrderId: order.id,
      status: "pending",
    });

    await newEnrollment.save();

    res.status(201).json({
      order,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("French course create-order error:", error);
    res.status(500).json({
      message: "Could not create order for French course.",
      error: error.message,
    });
  }
};
