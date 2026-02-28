const cloudinary = require("cloudinary").v2; //! Cloudinary is being required

exports.cloudinaryConnect = () => {
	try {
		cloudinary.config({
			//!    ########   Configuring the Cloudinary to Upload MEDIA ########
			cloud_name: process.env.APP_CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME,
			api_key: process.env.APP_CLOUDINARY_API_KEY || process.env.API_KEY,
			api_secret: process.env.APP_CLOUDINARY_SECRET_KEY || process.env.API_SECRET,
		});
	} catch (error) {
		console.log(error);
	}
};