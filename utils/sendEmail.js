const nodeMailer = require('nodemailer');

exports.sendEmail = async (subject, message, to) => {
  console.log("INSIDE SEND EMAIL DEVELOPER")

  const transporter = nodeMailer.createTransport({
    host: process.env.SMPT_HOST,
    port: process.env.SMPT_PORT,
    service: process.env.SMPT_SERVICE,
    secure: true,
    tls: { rejectUnauthorized: false },
    auth: {
      user: process.env.SMPT_EMAIL,
      pass: process.env.SMPT_PASSWORD
    }
  })

  const id = await transporter.sendMail({
    from: process.env.SMPT_EMAIL,
    to: to,
    subject: subject,
    html: message,
  });

  console.log({ id });
};

