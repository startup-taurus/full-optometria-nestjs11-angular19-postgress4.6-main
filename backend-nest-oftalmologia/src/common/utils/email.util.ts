import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailUtil {
  constructor(private configService: ConfigService) {}

  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${
      this.configService.get('FRONTEND_URL') || 'http://localhost:4200'
    }/auth/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get('MAIL_PORT')) || 587,
      secure: this.configService.get('MAIL_SECURE') === 'true' || false,
      auth: {

        user: this.configService.get('MAIL_USER'), 
        pass: this.configService.get('MAIL_PASS'),
      },
    });

    if (
      !this.configService.get('MAIL_USER') ||
      !this.configService.get('MAIL_PASS')
    ) {
      throw new Error(
        'Email configuration not found. Add MAIL_USER and MAIL_PASS to environment variables.'
      );
    }

    const mailOptions = {
      from: this.configService.get('MAIL_USER'),
      to: email,
      subject: 'Restablecer contraseña - Sistema Oftalmología',
      html: this.getResetPasswordTemplate(resetUrl),
    };

    await transporter.sendMail(mailOptions);
  }

  private getResetPasswordTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer Contraseña</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f8fafc; line-height: 1.6;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; padding: 40px 0;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); overflow: hidden;">
                
                <!-- Header con gradiente -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <div style="background-color: rgba(255, 255, 255, 0.15); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                      <div style="font-size: 40px;">🏥</div>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                      Sistema Oftalmología
                    </h1>
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 16px; font-weight: 400;">
                      Restablecer contraseña
                    </p>
                  </td>
                </tr>

                <!-- Contenido principal -->
                <tr>
                  <td style="padding: 50px 40px;">
                    <div style="text-align: center; margin-bottom: 40px;">
                      <div style="background-color: #fef3c7; border-radius: 50%; width: 60px; height: 60px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 30px;">🔐</span>
                      </div>
                      <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 24px; font-weight: 600;">
                        Solicitud de restablecimiento
                      </h2>
                      <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.5;">
                        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
                      </p>
                    </div>

                    <!-- Botón principal -->
                    <div style="text-align: center; margin: 40px 0;">
                      <a href="${resetUrl}" style="
                        display: inline-block;
                        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                        color: #ffffff;
                        padding: 16px 32px;
                        text-decoration: none;
                        border-radius: 12px;
                        font-size: 16px;
                        font-weight: 600;
                        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                        transition: all 0.2s ease;
                        border: none;
                        cursor: pointer;
                      " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(59, 130, 246, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.3)';">
                        🔄 Restablecer mi contraseña
                      </a>
                    </div>

                    <!-- Información adicional -->
                    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin: 30px 0;">
                      <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                        <span style="font-size: 20px; margin-right: 12px;">⏰</span>
                        <div>
                          <h4 style="color: #374151; margin: 0 0 4px; font-size: 14px; font-weight: 600;">
                            Tiempo de expiración
                          </h4>
                          <p style="color: #6b7280; margin: 0; font-size: 14px;">
                            Este enlace expirará en <strong>1 hora</strong> por razones de seguridad.
                          </p>
                        </div>
                      </div>
                      <div style="display: flex; align-items: flex-start;">
                        <span style="font-size: 20px; margin-right: 12px;">🛡️</span>
                        <div>
                          <h4 style="color: #374151; margin: 0 0 4px; font-size: 14px; font-weight: 600;">
                            Seguridad
                          </h4>
                          <p style="color: #6b7280; margin: 0; font-size: 14px;">
                            Si no solicitaste este cambio, puedes ignorar este mensaje.
                          </p>
                        </div>
                      </div>
                    </div>

                    <!-- Enlace alternativo -->
                    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <p style="color: #374151; margin: 0 0 12px; font-size: 14px; font-weight: 600;">
                        ¿Problemas con el botón? Copia y pega este enlace en tu navegador:
                      </p>
                      <p style="color: #3b82f6; margin: 0; font-size: 12px; word-break: break-all; background-color: #ffffff; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb;">
                        ${resetUrl}
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <div style="margin-bottom: 20px;">
                      <h3 style="color: #374151; margin: 0 0 8px; font-size: 18px; font-weight: 600;">
                        Sistema de Gestión Oftalmológica
                      </h3>
                      <p style="color: #6b7280; margin: 0; font-size: 14px;">
                        Cuidando tu salud visual con tecnología avanzada
                      </p>
                    </div>
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                      <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                        © 2025 Sistema Oftalmología. Todos los derechos reservados.
                      </p>
                      <p style="color: #9ca3af; margin: 8px 0 0; font-size: 12px;">
                        Este es un correo automático, por favor no respondas a este mensaje.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
