# 🛡️ TenantShield

**Take a photo. Know your rights. Get justice.**

TenantShield is a web application powered by Google's Gemini AI that empowers tenants to identify potential lease violations, understand their rights, and take informed action. Users can upload photos of issues like mold, pests, or damage, and the AI provides a detailed report including applicable local laws, recommended actions, and even a draft message to their landlord.

## ✨ Features

- **AI-Powered Analysis**: Uses Google's Gemini multimodal capabilities to analyze images and text descriptions of housing issues.
- **Location-Aware**: Leverages user location to cite specific, relevant local housing laws and ordinances.
- **Comprehensive Reporting**: Generates a multi-section report covering:
  - A summary of the issue.
  - A breakdown of tenant rights.
  - A list of applicable laws.
  - Recommended next steps.
  - An evidence checklist.
- **Automated Drafts**: Creates a pre-written, professional message for the user to send to their landlord.
- **Find Local Help**: Identifies and displays nearby legal aid clinics on a map for further assistance.
- **Simple Interface**: An intuitive, step-by-step form for uploading evidence and describing the problem.

## 🚀 How It Works

1.  **Upload Evidence**: The user takes or uploads photos of the issue in their rental unit.
2.  **Add Details**: The user provides a written description of the problem and its history.
3.  **Set Location**: The user enters their address or uses the auto-detect feature to provide location context for the AI.
4.  **Run Scan**: TenantShield sends the images, text, and location to the backend, which uses the Gemini API to perform the analysis.
5.  **View Report**: The user receives a detailed, actionable report to help them resolve their housing issue.

## 🛠️ Tech Stack

- **Frontend**: [React](https://reactjs.org/) (with [Vite](https://vitejs.dev/))
- **Styling**: Plain CSS with a responsive, mobile-first design.
- **AI Model**: [Google Gemini](https://deepmind.google/technologies/gemini/)
- **Backend**: A separate server (e.g., Node.js/Express or Python/Flask) is required to handle API requests and interact with the Gemini API.

## 📦 Getting Started

To get the frontend of TenantShield running locally, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) or another package manager like [yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/).
- A running instance of the TenantShield backend server.

### Frontend (Client) Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>/client
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the `/client` directory and add the URL of your backend server.

    ```env
    # /client/.env

    VITE_API_URL=http://localhost:5001
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The application should now be running on `http://localhost:5173` (or another port if 5173 is in use).

### Backend (Server)

This repository contains the frontend client. A corresponding backend server is required to process the analysis requests. The backend is responsible for:

- Providing a `/api/analyze` endpoint that accepts `POST` requests.
- Receiving the image data, user details, and location.
- Formatting the request for the Google Gemini API.
- Sending the request to Gemini and returning the structured JSON report to the client.
- Securely managing the Google AI API Key.

---

*This project was created for the CSHubHacks hackathon.*
