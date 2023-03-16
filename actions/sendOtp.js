const nodemailer=require('nodemailer')
module.exports = function sendOtp (email,otp){
    return new Promise((resolve,reject)=>{


      
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com", // SMTP server address (usually mail.your-domain.com)
            port: 465, // Port for SMTP (usually 465)
            secure: true, // Usually true if connecting to port 465
            auth: {
              user: process.env.Email, // Your email address
              pass: process.env.Password, // Password (for gmail, your app password)
            },
          });

          var mailOptions={
            from: 'amipk2001@gmail.com',
            to: email,
            subject: "Aeshion Email verification",
            html: `
            <h1>Verify Your Email For Aeshion</h1>
              <h3>use this code to verify your email</h3>
              <h2>${otp}</h2>
            `,
          }
      
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              reject("email sent error ", error)
            } else {
              resolve("email sent successfull")
            }
          });
    })
}