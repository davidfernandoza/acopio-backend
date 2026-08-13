import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import { appConfig } from '../config/appConfig';
import { HttpError } from '../middlewares/errorHandler';

const templatesDirectory = path.join(__dirname, '..', 'templates', 'emails');
const logoPath = path.join(templatesDirectory, 'assets', 'logo.png');
const compiledTemplateCache = new Map<string, HandlebarsTemplateDelegate>();

function isSmtpConfigured(): boolean {
  return Boolean(appConfig.smtp.host && appConfig.smtp.user && appConfig.smtp.password);
}

function createMailTransporter() {
  if (!isSmtpConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: appConfig.smtp.host,
    port: appConfig.smtp.port,
    secure: appConfig.smtp.port === 465,
    requireTLS: appConfig.smtp.port === 587,
    auth: {
      user: appConfig.smtp.user,
      pass: appConfig.smtp.password,
    },
  });
}

function renderEmailTemplate(
  templateName: string,
  templateData: Record<string, unknown>
): string {
  let compiledTemplate = compiledTemplateCache.get(templateName);
  if (!compiledTemplate) {
    const templatePath = path.join(templatesDirectory, `${templateName}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    compiledTemplate = Handlebars.compile(templateSource);
    compiledTemplateCache.set(templateName, compiledTemplate);
  }

  return compiledTemplate(templateData);
}

function getLogoAttachment() {
  return {
    filename: 'logo.png',
    path: logoPath,
    cid: 'acopio-logo',
  };
}

async function sendMailOrFail(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  const transporter = createMailTransporter();
  if (!transporter) {
    throw new HttpError(
      503,
      'SMTP no configurado. Completa SMTP_HOST, SMTP_USER y SMTP_PASSWORD en backend/.env'
    );
  }

  try {
    await transporter.sendMail({
      from: appConfig.smtp.from,
      to: options.to,
      replyTo: options.replyTo,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: [getLogoAttachment()],
    });
  } catch (error: unknown) {
    const mailError = error as { message?: string; response?: string };
    const detail = [mailError?.message, mailError?.response]
      .filter(Boolean)
      .join(' ');
    console.error('[mail] send failed:', detail || error);

    if (/sender you used .+ is not valid|not valid\. Validate your sender/i.test(detail)) {
      throw new HttpError(
        502,
        'Brevo rechazó el remitente de SMTP_FROM. Verifica ese correo en Brevo (Senders) o usa uno ya verificado en backend/.env'
      );
    }

    throw new HttpError(
      502,
      mailError?.message ||
        'No se pudo enviar el correo. Revisa SMTP_PASSWORD y que SMTP_FROM esté verificado en Brevo'
    );
  }
}

export async function sendManagerInvitationEmail(options: {
  toEmail: string;
  managerName: string;
  acopioName: string;
  temporaryPassword?: string | null;
}): Promise<void> {
  const loginUrl = `${appConfig.frontendUrl}/login`;
  const temporaryPassword = options.temporaryPassword || null;

  const textPasswordLines = temporaryPassword
    ? [`Correo: ${options.toEmail}`, `Contraseña temporal: ${temporaryPassword}`, '']
    : [
        `Correo: ${options.toEmail}`,
        'Usa la contraseña que ya tienes, o inicia sesión con Google si ese correo está vinculado.',
        '',
      ];

  const html = renderEmailTemplate('manager-invitation', {
    managerName: options.managerName,
    acopioName: options.acopioName,
    toEmail: options.toEmail,
    temporaryPassword,
    loginUrl,
  });

  await sendMailOrFail({
    to: options.toEmail,
    subject: `Invitación a gestionar el acopio ${options.acopioName}`,
    text: [
      `Hola ${options.managerName},`,
      '',
      `Te invitaron a gestionar el acopio "${options.acopioName}".`,
      ...textPasswordLines,
      `Ingresa en: ${loginUrl}`,
    ].join('\n'),
    html,
  });
}

export async function sendPasswordRecoveryEmail(options: {
  toEmail: string;
  managerName: string;
  temporaryPassword: string;
}): Promise<void> {
  const loginUrl = `${appConfig.frontendUrl}/login`;

  const html = renderEmailTemplate('password-recovery', {
    managerName: options.managerName,
    toEmail: options.toEmail,
    temporaryPassword: options.temporaryPassword,
    loginUrl,
  });

  await sendMailOrFail({
    to: options.toEmail,
    subject: 'Recuperación de contraseña — Acopio',
    text: [
      `Hola ${options.managerName},`,
      '',
      'Generamos una contraseña temporal para tu cuenta de gestor.',
      `Correo: ${options.toEmail}`,
      `Contraseña temporal: ${options.temporaryPassword}`,
      '',
      `Ingresa en: ${loginUrl}`,
    ].join('\n'),
    html,
  });
}

export async function sendContactSupportEmail(options: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const html = renderEmailTemplate('contact-support', {
    name: options.name,
    email: options.email,
    message: options.message,
  });

  await sendMailOrFail({
    to: appConfig.supportEmail,
    replyTo: options.email,
    subject: `Contacto Acopio — ${options.name}`,
    text: [
      'Nuevo mensaje desde el formulario de contacto:',
      '',
      `Nombre: ${options.name}`,
      `Correo: ${options.email}`,
      '',
      'Mensaje:',
      options.message,
    ].join('\n'),
    html,
  });
}
