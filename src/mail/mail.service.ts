import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: 'smtp.example.com', //
    port: 587,
    secure: false,
    auth: {
      user: 'your@email.com',
      pass: 'your_password',
    },
  });

  async sendWelcomeEmail(to: string, firstName: string) {
    const loginUrl = 'http://localhost:3001/login'; // or your frontend URL

    const mailOptions = {
      from: '"MyApp" <no-reply@myapp.com>',
      to,
      subject: 'Welcome to MyApp!',
      html: `
        <h2>Hi ${firstName}, welcome to MyApp!</h2>
        <p>Your account was created successfully.</p>
        <p>You can log in using your email and password here:</p>
        <a href="${loginUrl}">${loginUrl}</a>
        <p>Thank you!</p>
      `,
    };

    return this.transporter.sendMail(mailOptions);
  }
}
