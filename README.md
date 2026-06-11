# 🎓 ClassPortal

ClassPortal is a modern, minimalist web application designed to connect teachers and students in a seamless digital classroom. It features secure Firebase Authentication, MongoDB for robust data storage, and Cloudinary for hosting and sharing notes, slides, and homework attachments.

### 🔗 Live Demo
* **Web App Frontend:** [https://class-portal-zeta.vercel.app/](https://class-portal-zeta.vercel.app/)
* **Backend API Service:** [https://class-portal.onrender.com/api](https://class-portal.onrender.com/api)

---

## 🚀 Key Features

* **Secure Authentication:** User sign-up and log-in powered by Firebase Auth.
* **Workspaces (Classrooms):** Teachers can create classrooms that generate a unique 6-character code. Students can instantly join classrooms using this code.
* **Class Stream (Announcements):** Post announcements, upload multiple file attachments, and write comments/discussions.
* **Classwork & Grading:** Teachers can assign tasks with deadlines and criteria files. Students can upload their submissions in any format (e.g., `.zip`, `.pdf`, `.py`). Teachers can view, grade, and leave feedback comments on submissions.
* **Global Materials Library:** A central repository where teachers can publish global study materials/slides and students can search and download them.

---

## 📖 How to Use the Portal

### For Teachers 🧑‍🏫
1. **Create an Account:** Register on the platform and select the **Teacher** role.
2. **Create a Class:** Click the **Create Class** button on the Dashboard, enter a class name, section, and description.
3. **Invite Students:** Share the unique **6-character Invitation Code** (e.g., `ABC123`) shown on your classroom header.
4. **Post Announcements:** Use the **Stream** tab to share notes, guidelines, or files. You can attach PDFs, images, code files, or compressed folders.
5. **Assign Homework:** Under the **Classwork** tab, click **Create Assignment**. Specify a title, due date, instructions, and optionally attach criteria documents.
6. **Grade Submissions:** Click on any assignment to see the list of student submissions. Click **Submissions**, review the uploaded files, assign a grade (e.g., A+, 95/100), and write feedback comments.
7. **Manage Materials:** Navigate to the **Teacher Portal** link in the navigation bar to upload course-wide notes and manage global materials.

### For Students 🧑‍🎓
1. **Create an Account:** Register on the platform and select the **Student** role.
2. **Join a Class:** Click **Join Class** on the Dashboard, enter the **6-character Code** shared by your teacher, and click submit.
3. **Read Streams:** Visit the **Stream** tab in your classroom to see announcements, view attached files, and write comments.
4. **Complete Assignments:** Go to the **Classwork** tab, find an assignment, and click **View Task**. Download attachments, view instructions, and drag-and-drop or select your submission file (any format).
5. **View Grades:** Check the assignment page to see grades and written feedback from your teacher.
6. **Library Search:** Access the **Materials Library** from the navbar to search, filter, and download general reference materials uploaded by teachers.

---

## 🛠️ Local Development Setup

If you want to run this project on your local machine:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended) and credentials for MongoDB, Firebase, and Cloudinary.

### 1. Clone the Project
```bash
git clone git@github.com:sujeetv-125/class-portal.git
cd class-portal
```

### 2. Install Dependencies
Install all package dependencies for both the frontend and backend with a single command:
```bash
npm run install:all
```

### 3. Environment Configuration
Create a `.env` file in the root folder (you can copy [.env.example](file:///home/sujeetv/Documents/nilet/sir-ka-website-2/.env.example)) and fill in your credentials:
```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Firebase Credentials
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
```

### 4. Run Locally
Start the server and client concurrently:
```bash
npm run dev
```
The frontend will open at `http://localhost:5173` and the backend will run at `http://localhost:5000`.

---

## 📂 Folder Structure
* [/client](file:///home/sujeetv/Documents/nilet/sir-ka-website-2/client) - React app built with Vite and Tailwind CSS.
* [/server](file:///home/sujeetv/Documents/nilet/sir-ka-website-2/server) - Node.js & Express API backend with Mongoose.
* [render.yaml](file:///home/sujeetv/Documents/nilet/sir-ka-website-2/render.yaml) - Deployment configuration for Render.
* [package.json](file:///home/sujeetv/Documents/nilet/sir-ka-website-2/package.json) - Node workspace script configurations.
