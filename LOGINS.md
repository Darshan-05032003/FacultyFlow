# FacultyFlow Seeded Logins

This document contains the seeded test accounts available in the database for local development and demonstration purposes.

All passwords are set to **`FacultyFlow@123`**.

## Admin Role

| Name        | Email                            | Password          | Role  |
| ----------- | -------------------------------- | ----------------- | ----- |
| System Admin| admin.demo@facultyflow.local     | FacultyFlow@123   | ADMIN |

## Head of Department (HOD) Role

| Name             | Email                          | Password          | Role | Department |
| ---------------- | ------------------------------ | ----------------- | ---- | ---------- |
| Dr. Anjali Sharma| hod.demo@facultyflow.local     | FacultyFlow@123   | HOD  | Computer Engineering (CE) |

## Faculty Role (Computer Engineering)

| Name             | Email                            | Password          | Role    | Department |
| ---------------- | -------------------------------- | ----------------- | ------- | ---------- |
| Prof. Rahul Mehta| faculty.demo@facultyflow.local   | FacultyFlow@123   | FACULTY | Computer Engineering (CE) |
| Prof. Priya Patel| faculty2.demo@facultyflow.local  | FacultyFlow@123   | FACULTY | Computer Engineering (CE) |

## Faculty Role (Information Technology)

| Name             | Email                            | Password          | Role    | Department |
| ---------------- | -------------------------------- | ----------------- | ------- | ---------- |
| Prof. Vijay Kumar| faculty3.demo@facultyflow.local  | FacultyFlow@123   | FACULTY | Information Technology (IT) |

## Usage
When running the frontend (`npm run dev` in `/client`), use any of the emails above with the password `FacultyFlow@123` to log in and view role-specific dashboards and data.
