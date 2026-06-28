# 📧 Email Microservice

A lightweight Node.js microservice for sending transactional emails via [Resend](https://resend.com), built with Express.js.

**Base URL:** `https://mailing-rc5o.onrender.com`

---

## Features

- Send transactional emails with HTML and plain-text support
- `To` and `CC` recipient support
- Bearer token authentication to protect the endpoint
- Health check endpoint for uptime monitoring
- Configurable sender display name

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Email Provider:** Resend
- **Hosting:** Render

---

## Environment Variables

Create a `.env` file in the root of the project with the following variables:

```env
RESEND_API_KEY=your_resend_api_key
SERVICE_API_KEY=your_secret_service_key
PORT=5000
```

| Variable         | Required | Description                                      |
|------------------|----------|--------------------------------------------------|
| `RESEND_API_KEY` | Yes      | API key from your [Resend](https://resend.com) dashboard |
| `SERVICE_API_KEY`| Yes      | Secret key used to authenticate incoming requests |
| `PORT`           | No       | Port to run the server on (defaults to `5000`)   |

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <project-folder>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
# Fill in your values in .env
```

### 4. Start the server

```bash
node index.js
```

The server will start on `http://localhost:5000` (or your configured `PORT`).

---

## API Reference

### Authentication

All protected endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <your_SERVICE_API_KEY>
```

---

### `POST /api/send-email`

Sends an email via Resend.

**Headers**

| Header          | Value                        |
|-----------------|------------------------------|
| `Authorization` | `Bearer <SERVICE_API_KEY>`   |
| `Content-Type`  | `application/json`           |

**Request Body**

| Field      | Type             | Required | Default       | Description                          |
|------------|------------------|----------|---------------|--------------------------------------|
| `to`       | `string / array` | Yes      | —             | Recipient email address(es)          |
| `subject`  | `string`         | Yes      | —             | Subject line of the email            |
| `html`     | `string`         | No       | `""`          | HTML body of the email               |
| `text`     | `string`         | No       | `""`          | Plain-text body of the email         |
| `cc`       | `string / array` | No       | —             | CC recipient email address(es)       |
| `fromName` | `string`         | No       | `"Fab Five"`  | Display name for the sender          |

**Example Request**

```bash
curl -X POST https://mailing-rc5o.onrender.com/api/send-email \
  -H "Authorization: Bearer your_service_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Welcome!",
    "html": "<h1>Hello, World!</h1>",
    "text": "Hello, World!",
    "fromName": "Fab Five"
  }'
```

**Success Response** `200 OK`

```json
{
  "success": true,
  "messageId": "re_xxxxxxxxxxxx"
}
```

**Error Responses**

| Status | Description                                 |
|--------|---------------------------------------------|
| `400`  | Missing required fields (`to` or `subject`) |
| `401`  | Invalid or missing `Authorization` header   |
| `500`  | Internal server error from Resend           |

---

### `GET /health`

Returns the current health status of the service. No authentication required.

**Example Request**

```bash
curl https://mailing-rc5o.onrender.com/health
```

**Response** `200 OK`

```json
{
  "status": "UP",
  "uptime": 3600.5,
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

---

## Project Structure

```
├── index.js        # Main application entry point
├── .env            # Environment variables (not committed)
├── .env.example    # Example environment variables
├── package.json
└── README.md
```

---

## License

MIT
