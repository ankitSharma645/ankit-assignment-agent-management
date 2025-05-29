# Machine Test for MERN Stack Developer

Deployed Link:---  https://agent-management-assignment.netlify.app/


## Objective

To develop a MERN stack-based web application with the following core features:

- Admin Login
- Agent Management
- Task Distribution via CSV Upload
- Agent Login to View and Update Tasks

## Features Implemented

### Admin Login

- Login using email and password
- JWT-based authentication for secure session management
- Redirects to admin dashboard on successful login
- Displays appropriate error messages on login failure

### Agent Management

- Admin can add agents with the following details:
  - Name
  - Email
  - Mobile Number with country code
  - Password
- Agent data is securely stored in MongoDB

### Upload and Distribute Lists

- Admin can upload CSV, XLSX, or XLS files containing:
  - FirstName
  - Phone
  - Notes
- Validates file type and structure before processing
- Distributes uploaded data equally among 5 agents
- If the total number of records is not divisible by 5, remaining records are distributed sequentially
- Saves the distributed data in MongoDB
- Displays distributed list for each agent on the frontend

### Agent Panel

- Agents can log in using their email and password
- Agents can view their assigned tasks
- Agents can update the status of each task
- Task status updates are reflected in real time to the admin dashboard

## Tech Stack

- Frontend: React.js
- Backend: Node.js, Express.js
- Database: MongoDB using Mongoose
- Authentication: JWT (JSON Web Token)
- File Upload: Multer
- File Parsing: csv-parser, xlsx

## Setup Instructions

### Prerequisites

- Node.js and npm
- MongoDB running locally or using MongoDB Atlas
- Git installed
