# Ticketera QR - Frontend

Frontend application for event management, ticket sales, and QR code validation. Built with [Next.js](https://nextjs.org/) and [Tailwind CSS](https://tailwindcss.com/).

## 🚀 Key Technologies

- **Framework:** Next.js
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## 📋 Prerequisites

Make sure you have the following installed in your local environment:
- [Node.js](https://nodejs.org/en/) (latest LTS version recommended)
- Package manager: npm, yarn, or pnpm

## ⚙️ Environment Configuration

1. Copy the `.env.example` file to `.env` (if it exists) or create your own `.env` file.
2. Configure the necessary variables, for example, the API URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

## 🛠️ Installation and Execution

1. Install project dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## 📁 Project Structure

- `/src/app`: Application routes and views.
- `/src/app/components`: Reusable user interface components.
- `/public`: Static assets like images and icons.
- `/src/app/services`: API services
- `/src/types`: TypeScript types.

## 📜 Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm start`: Starts the production server (requires a previous build).
- `npm run lint`: Runs the linter to find code errors.
