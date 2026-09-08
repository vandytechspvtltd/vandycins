# Vandycin Full Node.js Backend

Hostinger-ready Express + MySQL backend based on the supplied Smart Doctor & Pharmacy app architecture.

## Covered modules

- Authentication / Users
- Doctors
- Patients
- Appointments
- Live queue / token management
- E-prescriptions
- Medicine orders
- Pharmacy / inventory
- Delivery / order tracking
- Payments (provider adapter placeholder)
- Notifications (DB + provider adapter placeholder)
- Analytics / reports
- ABDM Drug Registry integration
- Health check

## Important scope note

The supplied architecture image identifies these services and integrations, but it does not define every field, business rule, payment provider, SMS provider, video SDK, map provider, or delivery workflow. This backend therefore provides a working generic REST foundation and database schema for the visible modules. Provider-specific payment/SMS/video/map implementations must be configured when the actual vendors are selected.

## Run locally

```bash
npm install
cp .env.example .env
# edit .env
npm start
```

Health:
`GET /health`

API base:
`/api/v1`

## Database

Create a MySQL database on Hostinger and run:

```bash
mysql -u YOUR_USER -p YOUR_DATABASE < database/schema.sql
```

Or import `database/schema.sql` through phpMyAdmin.

## Authentication

Register:

`POST /api/v1/auth/register`

Login:

`POST /api/v1/auth/login`

Use the returned JWT:

`Authorization: Bearer YOUR_TOKEN`

The token contains the user id and role.

## Main routes

### Auth
- POST `/api/v1/auth/register`
- POST `/api/v1/auth/login`
- GET `/api/v1/auth/me`

### Users
- GET `/api/v1/users`
- GET `/api/v1/users/:id`
- PATCH `/api/v1/users/:id`
- DELETE `/api/v1/users/:id`

### Doctors
- GET `/api/v1/doctors`
- POST `/api/v1/doctors`
- GET `/api/v1/doctors/:id`
- PATCH `/api/v1/doctors/:id`
- DELETE `/api/v1/doctors/:id`

### Appointments
- GET `/api/v1/appointments`
- POST `/api/v1/appointments`
- GET `/api/v1/appointments/:id`
- PATCH `/api/v1/appointments/:id/status`
- DELETE `/api/v1/appointments/:id`

### Queue
- GET `/api/v1/queues/:appointmentId`
- POST `/api/v1/queues/:appointmentId/join`
- POST `/api/v1/queues/:appointmentId/call-next`
- POST `/api/v1/queues/:appointmentId/status`

### Prescriptions
- GET `/api/v1/prescriptions`
- POST `/api/v1/prescriptions`
- GET `/api/v1/prescriptions/:id`
- PATCH `/api/v1/prescriptions/:id`

### Medicines / ABDM
- GET `/api/v1/medicines/search?q=Paracetamol&page=0&limit=10`
- GET `/api/v1/medicines/brand/:brandIdentifier`
- GET `/api/v1/medicines/generic/:genericIdentifier`
- GET `/api/v1/medicines/supplier/:supplierIdentifier?page=0&limit=10`
- GET `/api/v1/medicines/substance/:substanceIdentifier`

### Orders
- GET `/api/v1/orders`
- POST `/api/v1/orders`
- GET `/api/v1/orders/:id`
- PATCH `/api/v1/orders/:id/status`

### Inventory
- GET `/api/v1/inventory`
- POST `/api/v1/inventory`
- PATCH `/api/v1/inventory/:id`
- DELETE `/api/v1/inventory/:id`

### Delivery
- GET `/api/v1/deliveries`
- POST `/api/v1/deliveries`
- GET `/api/v1/deliveries/:id`
- PATCH `/api/v1/deliveries/:id/status`

### Payments
- GET `/api/v1/payments`
- POST `/api/v1/payments`
- PATCH `/api/v1/payments/:id/status`

### Notifications
- GET `/api/v1/notifications`
- POST `/api/v1/notifications`
- PATCH `/api/v1/notifications/:id/read`

### Analytics
- GET `/api/v1/analytics/dashboard`
- GET `/api/v1/analytics/orders`
- GET `/api/v1/analytics/appointments`

## Hostinger deployment

Use a Hostinger plan that supports Node.js applications. Upload the project, configure the Node.js app to use `src/server.js` (or `npm start`), set environment variables, install dependencies, create/import the MySQL database, then enable HTTPS.

Do not upload a real `.env` to source control.

## Android

Use the HTTPS API base URL, for example:

```kotlin
Retrofit.Builder()
    .baseUrl("https://api.example.com/")
```

Do not put ABDM Client Secret, database credentials, JWT signing secret, or payment provider secret in the Android app.
