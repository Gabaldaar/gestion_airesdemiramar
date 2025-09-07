
'use server';

import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

interface EmailDetails {
    to: string;
    subject: string;
    body: string;
}

/**
 * Sends an email using the Gmail API with a service account.
 * This requires the service account to have domain-wide delegation
 * enabled in the Google Workspace Admin console for the specified scope.
 */
export async function sendEmail({ to, subject, body }: EmailDetails): Promise<void> {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountPrivateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const userEmailToImpersonate = process.env.GOOGLE_ADMIN_EMAIL;

    if (!serviceAccountEmail || !serviceAccountPrivateKey || !userEmailToImpersonate) {
        throw new Error("Google service account credentials or user to impersonate are not set in environment variables.");
    }
    
    // Create a new JWT client with the service account credentials, specifying the user to impersonate.
    const auth = new google.auth.JWT(
        serviceAccountEmail,
        undefined,
        serviceAccountPrivateKey,
        SCOPES,
        userEmailToImpersonate // The email address of the user to impersonate.
    );
    
    const gmail = google.gmail({ version: 'v1', auth });

    // The from address must be the same as the impersonated user's email.
    const fromAddress = userEmailToImpersonate;

    // Create a raw email string following RFC 2822 format.
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: "Aires de Miramar" <${fromAddress}>`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      body
    ];
    const emailContent = messageParts.join('\n');

    // The email needs to be base64url encoded for the Gmail API's raw field.
    const encodedMessage = Buffer.from(emailContent)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    try {
        await gmail.users.messages.send({
            userId: 'me', // 'me' refers to the impersonated user (subject of the JWT)
            requestBody: {
                raw: encodedMessage,
            },
        });
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error('The API returned an error: ' + error);
        throw new Error('Failed to send email via Gmail API.');
    }
}
