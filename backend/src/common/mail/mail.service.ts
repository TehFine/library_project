import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter | null = null
    private readonly logger = new Logger(MailService.name)
    private readonly fromAddress: string

    constructor(private config: ConfigService) {
        const host = this.config.get<string>('MAIL_HOST')
        const port = this.config.get<number>('MAIL_PORT')
        const user = this.config.get<string>('MAIL_USER')
        const pass = this.config.get<string>('MAIL_PASS')
        this.fromAddress = this.config.get<string>('MAIL_FROM') || `"Thư viện" <${user}>`

        if (host && user && pass) {
            this.transporter = nodemailer.createTransport({
                host,
                port: port || 587,
                secure: port === 465,
                auth: { user, pass },
            })
            this.logger.log(`Mail transporter initialized (${host}:${port || 587})`)
        } else {
            this.logger.warn('Mail credentials not configured — emails will be logged to console only')
        }
    }

    async sendMail(to: string, subject: string, html: string): Promise<boolean> {
        if (!this.transporter) {
            this.logger.warn(`[DEV] Email to ${to}:`)
            this.logger.warn(`  Subject: ${subject}`)
            this.logger.warn(`  Body (HTML): ${html.substring(0, 200)}...`)
            return false
        }

        try {
            await this.transporter.sendMail({
                from: this.fromAddress,
                to,
                subject,
                html,
            })
            this.logger.log(`Email sent to ${to}: "${subject}"`)
            return true
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}:`, error)
            return false
        }
    }

    /**
     * Gửi email đặt lại mật khẩu với template HTML đẹp
     */
    async sendPasswordResetEmail(to: string, resetLink: string, userName?: string): Promise<boolean> {
        const subject = '🔐 Đặt lại mật khẩu — Hệ thống Thư viện'
        const html = this.buildPasswordResetTemplate(resetLink, userName || to)
        return this.sendMail(to, subject, html)
    }

    private buildPasswordResetTemplate(resetLink: string, userName: string): string {
        return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#d97706,#b45309);padding:32px 40px;text-align:center;">
              <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
                <span style="font-size:28px;">🔐</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Đặt lại mật khẩu</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Hệ thống Quản lý Thư viện</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;color:#1f2937;font-size:15px;line-height:1.6;">
                Xin chào <strong>${userName}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.6;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn nút bên dưới để tạo mật khẩu mới:
              </p>
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${resetLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#d97706,#b45309);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:12px;box-shadow:0 4px 14px rgba(217,119,6,0.3);">
                      Đặt lại mật khẩu
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Info box -->
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
                <p style="margin:0 0 4px;color:#92400e;font-size:13px;font-weight:600;">⏰ Lưu ý:</p>
                <p style="margin:0;color:#a16207;font-size:13px;line-height:1.5;">
                  Link này có hiệu lực trong <strong>30 phút</strong>. Sau thời gian này, bạn cần yêu cầu đặt lại mật khẩu mới.
                </p>
              </div>
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
              </p>
              <!-- Fallback link -->
              <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6;">
                <p style="margin:0 0 4px;color:#9ca3af;font-size:11px;">Nếu nút không hoạt động, copy link sau vào trình duyệt:</p>
                <p style="margin:0;color:#6b7280;font-size:11px;word-break:break-all;">${resetLink}</p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0;color:#9ca3af;font-size:11px;">
                © ${new Date().getFullYear()} Hệ thống Quản lý Thư viện. Mọi quyền được bảo lưu.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
    }
}
