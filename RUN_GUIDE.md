# AI Legal Analyst – Setup & Run Guide

Follow these steps to set up and run the project after extracting the ZIP file.

## 1. Prerequisites
Ensure you have the following installed on your system:
*   **Python 3.10 or higher**: [Download here](https://www.python.org/downloads/)
*   **Node.js 18 or higher**: [Download here](https://nodejs.org/)

---

## 2. Backend Setup (AI Services)
Navigate to the `backend` folder and set up the Python environment.

### Linux / macOS
1. Open a terminal in the `backend` directory.
2. Create a virtual environment:
   ```bash
   python3 -m venv .venv
   ```
3. Activate the environment:
   ```bash
   source .venv/bin/activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Windows
1. Open Command Prompt or PowerShell in the `backend` directory.
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```
3. Activate the environment:
   ```cmd
   .venv\Scripts\activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

**The backend will be running at:** `http://localhost:8000`

---

## 3. Frontend Setup (Dashboard UI)
Navigate to the `frontend` folder to install and run the web interface.

1. Open a new terminal in the `frontend` directory.
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

**The frontend will be running at:** `http://localhost:5173`

---

## 4. How to Use
1. Open `http://localhost:5173` in your browser.
2. **Tab A (Judge)**: Select the "Judge" role.
3. **Tab B (Plaintiff)**: Open a second tab and select "Plaintiff".
4. **Tab C (Defendant)**: Open a third tab and select "Defendant".
5. Upload a PDF in the Plaintiff and Defendant tab respectively.
6. Watch the Judge tab update automatically with AI analysis and document previews!

---

## ⚠️ Important Note for Sharing
Before zipping the project to send to a friend, **DELETE** the following folders to keep the file size small (they will be recreated by the commands above):
*   `backend/.venv`
*   `frontend/node_modules`
