# FarmMart 2.0 API Authorization Matrix

This document maps out the HTTP endpoints exposed by the FarmMart backend, their required authentication status, role permissions, and resource ownership rules (BOLA).

| Endpoint | HTTP Method | Access Level | Required Role | Auth Required | Description / Security Checks |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/signup` | `POST` | Public | None | No | Registers user. Role parameter is validated (only `'buyer'` or `'farmer'` allowed). Admin/user signups are rejected. Defaults to `'buyer'`. |
| `/api/auth/login` | `POST` | Public | None | No | Validates credentials and returns JWT. Derived role is strictly from the database. Client-submitted role is treated as consistency check only. |
| `/api/auth/profile` | `PUT` | Authenticated | `'buyer'`, `'farmer'`, or `'admin'` | Yes | Updates profile. Identity resolved from JWT (`req.user.id`). Body `userId` and `role` fields are ignored (prevents IDOR/Role elevation). |
| `/api/auth/password` | `POST` | Authenticated | `'buyer'`, `'farmer'`, or `'admin'` | Yes | Changes password. Identity resolved from JWT (`req.user.id`). Password must be >= 8 characters. |
| `/api/auth/forgot-password`| `POST` | Public | None | No | Generates cryptographically secure reset token. Token hashed in DB, never exposed in response or logs. |
| `/api/auth/reset-password` | `POST` | Public | None | No | Resets password. Verifies hashed token, checks 15m expiration, invalidates code upon success. |
| `/api/demands` | `GET` | Authenticated | `'buyer'`, `'farmer'`, or `'admin'` | Yes | Retrieves list of all demands. |
| `/api/demands` | `POST` | Authenticated | `'admin'` | Yes | Creates store demand. Quantity must be positive. Restricted from `'buyer'` and `'farmer'` roles. |
| `/api/demands/:id` | `PUT` | Authenticated | `'buyer'` or `'admin'` | Yes | Updates demand status (e.g. buyer claims it). Restricted from `'farmer'`. |
| `/api/tasks` | `GET` | Scoped / Admin | `'admin'` (unfiltered) or `'buyer'` (scoped) | Yes | Buyers can only get tasks assigned to themselves. Omitted filter is admin-only. Restricted from `'farmer'`. |
| `/api/tasks` | `POST` | Scoped / Admin | `'admin'` or `'buyer'` (scoped) | Yes | Creates procurement task. Buyers can only assign to themselves. Restricted from `'farmer'`. |
| `/api/tasks/stats` | `GET` | Scoped / Admin | `'admin'` or `'buyer'` (scoped) | Yes | Buyers can only query stats for tasks assigned to themselves. Restricted from `'farmer'`. |
| `/api/tasks/:id` | `PUT` | Scoped / Admin | `'admin'` or Task Owner (`buyer`) | Yes | Updates task terms. Validates positive values. Restricted from `'farmer'`. |
| `/api/tasks/:id/payment`| `PUT` | Scoped / Admin | `'admin'` or Task Owner (`buyer`) | Yes | Marks task payment status as `'paid'`. Restricted from `'farmer'`. |
| `/api/tasks/:id/delivery`| `PUT` | Scoped / Admin | `'admin'` or Task Owner (`buyer`) | Yes | Marks task delivery status as `'delivered'`. Enforces task is paid and FIFO check. Restricted from `'farmer'`. |
