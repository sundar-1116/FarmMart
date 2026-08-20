# FarmMart 2.0 API Authorization Matrix

This document maps out the HTTP endpoints exposed by the FarmMart backend, their required authentication status, role permissions, and resource ownership rules (BOLA).

| Endpoint | HTTP Method | Access Level | Required Role | Auth Required | Description / Security Checks |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/signup` | `POST` | Public | None | No | Registers user. Role is strictly forced to `'user'`. Admin signup is disabled. |
| `/api/auth/login` | `POST` | Public | None | No | Validates credentials and returns JWT. |
| `/api/auth/profile` | `PUT` | Authenticated | `'user'` or `'admin'` | Yes | Updates profile. Identity resolved from JWT (`req.user.id`). Body `userId` and `role` fields are ignored (prevents IDOR/Role elevation). |
| `/api/auth/password` | `POST` | Authenticated | `'user'` or `'admin'` | Yes | Changes password. Identity resolved from JWT (`req.user.id`). Password must be >= 8 characters. |
| `/api/auth/forgot-password`| `POST` | Public | None | No | Generates cryptographically secure reset token. Token hashed in DB, never exposed in response or logs. |
| `/api/auth/reset-password` | `POST` | Public | None | No | Resets password. Verifies hashed token, checks 15m expiration, invalidates code upon success. |
| `/api/demands` | `GET` | Authenticated | `'user'` or `'admin'` | Yes | Retrieves list of all demands. |
| `/api/demands` | `POST` | Authenticated | `'user'` or `'admin'` | Yes | Creates store demand. Quantity must be positive. |
| `/api/demands/:id` | `PUT` | Authenticated | `'user'` or `'admin'` | Yes | Updates demand status (pending/assigned/completed). |
| `/api/tasks` | `GET` | Scoped / Admin | `'admin'` (unfiltered) or `'user'` (scoped) | Yes | Normal users can only get tasks assigned to themselves (enforced via query filter). Omit query filter is admin-only. |
| `/api/tasks` | `POST` | Scoped / Admin | `'admin'` (unfiltered) or `'user'` (scoped) | Yes | Creates procurement task. Regular users can only assign to themselves. Values validated. |
| `/api/tasks/stats` | `GET` | Scoped / Admin | `'admin'` (unfiltered) or `'user'` (scoped) | Yes | Normal users can only query stats for tasks assigned to themselves. Omit query filter is admin-only. |
| `/api/tasks/:id` | `PUT` | Scoped / Admin | `'admin'` or Task Owner | Yes | Updates task terms. Validates positive values. |
| `/api/tasks/:id/payment`| `PUT` | Scoped / Admin | `'admin'` or Task Owner | Yes | Marks task payment status as `'paid'`. |
| `/api/tasks/:id/delivery`| `PUT` | Scoped / Admin | `'admin'` or Task Owner | Yes | Marks task delivery status as `'delivered'`. Enforces task is paid and FIFO check (no older unpaid tasks). |
