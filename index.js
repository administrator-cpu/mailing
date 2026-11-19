require('dotenv').config();
const express = require('express');
const { Resend } = require('resend');
const cors = require('cors');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.json({ limit: "25mb" }));
app.use(cors());


const authenticateService = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.SERVICE_API_KEY}`) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Service Key' });
    }
    next();
};

app.post('/api/batch-send-email', authenticateService, async (req, res) => {
    const { emails, fromName = 'Fab5 Connect' } = req.body;

    // 1. Validate the main payload
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({
            error: 'Bad Request: "emails" array is required and cannot be empty.'
        });
    }

    // Resend limits batch sends to 100 per API call
    if (emails.length > 100) {
        return res.status(400).json({
            error: 'Bad Request: You can only send up to 100 emails per batch.'
        });
    }

    // 2. Format and validate each email in the batch
    const formattedEmails = [];
    for (const [index, email] of emails.entries()) {
        if (!email.to || !email.subject) {
            return res.status(400).json({
                error: `Bad Request: Email at index ${index} is missing required "to" or "subject" fields.`
            });
        }

        formattedEmails.push({
            from: email.from || `${fromName} <no-reply@fab5network.com>`,
            to: email.to,
            cc: email.cc,
            bcc: email.bcc,
            subject: email.subject,
            html: email.html || '',
            text: email.text || ''
            // Note: attachments are explicitly excluded as they are not supported in batch sending yet.
        });
    }

    try {
        const { data, error } = await resend.batch.send(formattedEmails);

        if (error) {
            return res.status(400).json({ success: false, error });
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Batch Email Service Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error while sending batch emails.'
        });
    }
});

app.post('/api/billing/send-email', authenticateService, async (req, res) => {
    // scheduledAt (ISO 8601) and idempotencyKey are optional.
    const { to, cc, subject, html, text, bcc, fromName = 'Fab5 Connect', attachments, scheduledAt, idempotencyKey } = req.body;
    if (!to || !subject) {
        return res.status(400).json({
            error: 'Bad Request: "to" and "subject" fields are required.'
        });
    }
    try {
        // resend.emails.send() resolves to { data, error } and does NOT throw when Resend
        // refuses an email, so the error has to be checked here.
        const { data, error } = await resend.emails.send({
            from: `${fromName} <billing@fab5network.com>`,
            to,
            cc,
            bcc,
            subject,
            html: html || '',
            text: text || '',
            attachments,
            // Resend sends it at this time instead of now (billing staggers mail to one domain).
            scheduledAt
        }, idempotencyKey ? { idempotencyKey } : undefined);

        // Resend refused it (invalid address, unverified domain, rate limit, too large).
        if (error) {
            console.error('Email Service Error (Resend refused):', error);
            return res.status(error.statusCode || 502).json({ success: false, error });
        }
        res.status(200).json({ success: true, messageId: data.id });
    } catch (error) {
        console.error('Email Service Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error while sending email.'
        });
    }
});

// Latest status of one billing email (last_event: delivered, bounced, delivery_delayed, ...),
// so the billing app can catch up on delivery webhooks it missed.
app.get('/api/billing/emails/:id', authenticateService, async (req, res) => {
    try {
        const { data, error } = await resend.emails.get(req.params.id);
        if (error) {
            return res.status(error.statusCode || 502).json({ success: false, error });
        }
        res.status(200).json({
            success: true,
            data: { id: data.id, last_event: data.last_event, to: data.to, cc: data.cc, bcc: data.bcc, created_at: data.created_at }
        });
    } catch (error) {
        console.error('Email Status Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error while reading email status.'
        });
    }
});

app.post('/api/send-email', authenticateService, async (req, res) => {
    const { to, cc, subject, html, text, bcc, fromName = 'Fab5 Connect', attachments } = req.body;

    if (!to || !subject) {
        return res.status(400).json({
            error: 'Bad Request: "to" and "subject" fields are required.'
        });
    }

    try {
        const data = await resend.emails.send({
            from: `${fromName} <no-reply@fab5network.com>`,
            to,
            cc,
            bcc,
            subject,
            html: html || '',
            text: text || '',
            attachments
        });
        res.status(200).json({ success: true, messageId: data.id });

    } catch (error) {
        console.error('Email Service Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error while sending email.'
        });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Email microservice running on port ${PORT}`);
});