require('dotenv').config();
const express = require('express');
const { Resend } = require('resend');
const cors = require('cors');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.json());
app.use(cors());


const authenticateService = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.SERVICE_API_KEY}`) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Service Key' });
    }
    next();
};


app.post('/api/send-email', authenticateService, async (req, res) => {
    const { to, cc, subject, html, text, fromName = 'Fab Five' } = req.body;

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
            subject,
            html: html || '', 
            text: text || ''  
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Email microservice running on port ${PORT}`);
});