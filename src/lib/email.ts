
'use server';

import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Function to get the Google Auth client for Gmail, aligned with the calendar auth method.
const getGoogleAuthForGmail = () => {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountPrivateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const userEmailToImpersonate = process.env.GOOGLE_ADMIN_EMAIL; // The user email to send 'from'

    if (!serviceAccountEmail || !serviceAccountPrivateKey) {
        throw new Error("Google service account credentials are not set in environment variables.");
    }
    if (!userEmailToImpersonate) {
        throw new Error("GOOGLE_ADMIN_EMAIL to impersonate for sending email is not set.");
    }
    
    // Use GoogleAuth with impersonation, which is the modern and correct way.
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: serviceAccountEmail,
            private_key: serviceAccountPrivateKey,
        },
        scopes: SCOPES,
    });

    return auth.fromJSON({
        type: 'service_account',
        client_email: serviceAccountEmail,
        private_key: serviceAccountPrivateKey,
        client_id: '', // Not strictly needed for JWT-like flow with GoogleAuth
        token_url: 'https://oauth2.googleapis.com/token',
        universe_domain: 'googleapis.com',
    }).createScoped(SCOPES).createImpersonated(userEmailToImpersonate);
};

interface EmailDetails {
    to: string;
    subject: string;
    body: string; // HTML body
}

/**
 * Sends an email using the Gmail API with a service account.
 * Note: This requires the service account to have domain-wide delegation
 * enabled in the Google Workspace Admin console for the specified scope.
 * The service account must be authorized to act on behalf of the `GOOGLE_ADMIN_EMAIL` user.
 */
export async function sendEmail({ to, subject, body }: EmailDetails): Promise<void> {
    const auth = getGoogleAuthForGmail();
    const gmail = google.gmail({ version: 'v1', auth });

    const emailContent = [
        `Content-Type: text/html; charset="UTF-8"`,
        `MIME-Version: 1.0`,
        `Content-Transfer-Encoding: 7bit`,
        `to: ${to}`,
        `from: ${process.env.GOOGLE_ADMIN_EMAIL}`, // This will show as sent from this user
        `subject: ${subject}`,
        ``,
        body,
    ].join('\n');

    // The email needs to be base64url encoded
    const encodedMessage = Buffer.from(emailContent)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    try {
        await gmail.users.messages.send({
            userId: 'me', // 'me' refers to the impersonated user
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
