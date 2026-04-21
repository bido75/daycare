import { Injectable, Logger } from '@nestjs/common';
import { EmailProviderFactory } from './providers/provider-factory';

// ─────────────────────────────────────────────
// Email templates (HTML string builders)
// ─────────────────────────────────────────────

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Creative Kids Academy</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#4f46e5;padding:24px 32px;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Creative Kids Academy</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f4f7f9;padding:20px 32px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              Creative Kids Academy · This is an automated message, please do not reply.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;margin:20px 0;">${label}</a>`;
}

export const EmailTemplates = {
  passwordReset(resetUrl: string, userName?: string): { subject: string; html: string; text: string } {
    const name = userName ?? 'there';
    const html = baseLayout(`
      <h2 style="margin:0 0 12px;color:#111827;font-size:22px;">Reset Your Password</h2>
      <p style="color:#4b5563;font-size:15px;line-height:1.6;">Hi ${name},</p>
      <p style="color:#4b5563;font-size:15px;line-height:1.6;">
        We received a request to reset your password. Click the button below to choose a new password.
        This link expires in 1 hour.
      </p>
      ${button(resetUrl, 'Reset Password')}
      <p style="color:#6b7280;font-size:13px;margin-top:16px;">
        If you did not request a password reset, you can safely ignore this email.
      </p>
      <p style="color:#9ca3af;font-size:12px;margin-top:8px;">Or copy this URL into your browser:<br>${resetUrl}</p>
    `);
    return {
      subject: 'Reset your Creative Kids Academy password',
      html,
      text: `Hi ${name},\n\nReset your password here: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, ignore this email.`,
    };
  },

  welcomeEmail(userName: string): { subject: string; html: string; text: string } {
    const html = baseLayout(`
      <h2 style="margin:0 0 12px;color:#111827;font-size:22px;">Welcome to Creative Kids Academy!</h2>
      <p style="color:#4b5563;font-size:15px;line-height:1.6;">Hi ${userName},</p>
      <p style="color:#4b5563;font-size:15px;line-height:1.6;">
        Thank you for registering with Creative Kids Academy. Your account has been created and you can now log in to your parent portal.
      </p>
      ${button(`${process.env.APP_URL ?? 'http://localhost:3000'}/parent/dashboard`, 'Go to Parent Portal')}
      <p style="color:#6b7280;font-size:13px;margin-top:16px;">
        If you have any questions, please contact us — we're here to help!
      </p>
    `);
    return {
      subject: 'Welcome to Creative Kids Academy!',
      html,
      text: `Hi ${userName},\n\nWelcome to Creative Kids Academy! Your account has been created.\n\nLog in at: ${process.env.APP_URL ?? 'http://localhost:3000'}/parent/dashboard`,
    };
  },

  registrationSubmitted(childName: string, parentName: string): { subject: string; html: string; text: string } {
    const html = baseLayout(`
      <h2 style="margin:0 0 12px;color:#111827;font-size:22px;">Registration Received</h2>
      <p style="color:#4b5563;font-size:15px;line-height:1.6;">Hi ${parentName},</p>
      <p style="color:#4b5563;font-size:15px;line-height:1.6;">
        We've received the enrollment registration for <strong>${childName}</strong>. Our team will review the application and get back to you shortly.
      </p>
      <p style="color:#4b5563;font-size:15px;line-height:1.6;">You can track the status in your parent portal.</p>
      ${button(`${process.env.APP_URL ?? 'http://localhost:3000'}/parent/registration`, 'View Registration')}
    `);
    return {
      subject: `Registration received for ${childName}`,
      html,
      text: `Hi ${parentName},\n\nWe've received the enrollment registration for ${childName}. Our team will review it shortly.\n\nTrack status at: ${process.env.APP_URL ?? 'http://localhost:3000'}/parent/registration`,
    };
  },

  registrationApproval(childName: string, parentName: string): { subject: string; html: string; text: string } {
    const html = baseLayout(`
      <h2 style="margin:0 0 12px;color:#111827;font-size:22px;">🎉 Registration Approved!</h2>
      <p style="color:#4b5563;font-size:15px;line-height:1.6;">Hi ${parentName},</p>
      <p style="color:#4b5563;font-size:15px;line-height:1.6;">
        We're thrilled to let you know that <strong>${childName}</strong>'s registration at Creative Kids Academy has been <strong style="color:#16a34a;">approved</strong>! Welcome to our family!
      </p>
      <p style="color:#4b5563;font-size:15px;line-height:1.6;">
        Please log in to your parent portal to view enrollment details and next steps.
      </p>
      ${button(`${process.env.APP_URL ?? 'http://localhost:3000'}/parent/dashboard`, 'View Dashboard')}
    `);
    return {
      subject: `${childName}'s registration has been approved!`,
      html,
      text: `Hi ${parentName},\n\nGreat news! ${childName}'s registration at Creative Kids Academy has been approved! Welcome to our family!\n\nLog in at: ${process.env.APP_URL ?? 'http://localhost:3000'}/parent/dashboard`,
    };
  },

  registrationRejection(childName: string, parentName: string, reason?: string): { subject: string; html: string; text: string } {
    const reasonSection = reason
      ? `<p style="color:#4b5563;font-size:15px;line-height:1.6;"><strong>Reason:</strong> ${reason}</p>`
      : '';
    const html = baseLayout(`
      <h2 style="margin:0 0 12px;color:#111827;font-size:22px;">Registration Update</h2>
      <p style="color:#4b5563;font-size:15px;line-height:1.6;">Hi ${parentName},</p>
      <p style="color:#4b5563;font-size:15px;line-height:1.6;">
        After careful review, we're sorry to inform you that <strong>${childName}</strong>'s registration could not be approved at this time.
      </p>
      ${reasonSection}
      <p style="color:#4b5563;font-size:15px;line-height:1.6;">
        Please don't hesitate to contact us if you'd like more information or wish to reapply.
      </p>
    `);
    return {
      subject: `Update on ${childName}'s registration`,
      html,
      text: `Hi ${parentName},\n\nWe're sorry to inform you that ${childName}'s registration could not be approved at this time.${reason ? '\n\nReason: ' + reason : ''}\n\nPlease contact us for more information.`,
    };
  },

  notification(title: string, message: string, actionUrl?: string, actionText?: string): { subject: string; html: string; text: string } {
    const actionSection = actionUrl
      ? button(actionUrl, actionText ?? 'View Details')
      : '';
    const html = baseLayout(`
      <h2 style="margin:0 0 12px;color:#111827;font-size:22px;">${title}</h2>
      <p style="color:#4b5563;font-size:15px;line-height:1.6;">${message}</p>
      ${actionSection}
    `);
    return {
      subject: title,
      html,
      text: `${title}\n\n${message}${actionUrl ? '\n\n' + (actionText ?? 'View details') + ': ' + actionUrl : ''}`,
    };
  },
};

// ─────────────────────────────────────────────
// EmailService
// ─────────────────────────────────────────────

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly providerFactory: EmailProviderFactory) {}

  async sendEmail(
    to: string | string[],
    subject: string,
    html: string,
    options?: { text?: string; from?: string; replyTo?: string; context?: string },
  ) {
    const provider = await this.providerFactory.getDefaultProvider(options?.context);
    const result = await provider.sendEmail({ to, subject, html, ...options });

    if (result.success) {
      this.logger.log(`Email sent to ${Array.isArray(to) ? to.join(', ') : to} | Subject: ${subject}`);
    } else {
      this.logger.warn(`Email failed to ${Array.isArray(to) ? to.join(', ') : to}: ${result.error}`);
    }

    return result;
  }

  async sendTemplatedEmail(
    to: string | string[],
    templateName: keyof typeof EmailTemplates,
    variables: Record<string, any>,
    context?: string,
  ) {
    const templateFn = EmailTemplates[templateName] as (...args: any[]) => { subject: string; html: string; text: string };
    const args = Object.values(variables);
    const { subject, html, text } = templateFn(...args);
    return this.sendEmail(to, subject, html, { text, context });
  }
}
