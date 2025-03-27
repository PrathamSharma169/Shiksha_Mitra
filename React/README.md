# Shiksha Mitra

This project is a React-based web application that uses the Gemini API to evaluate exam answer sheets. It allows users to upload answer sheet images and question papers, then provides automated evaluation and feedback.

## Features

- Upload multiple answer sheet images (10-30 pages)
- Upload question paper as PDF or paste text directly
- Specify maximum marks for evaluation
- Get automated evaluation with marks and detailed feedback
- Clean and user-friendly interface

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Upload answer sheet images using drag-and-drop or file selection
2. Upload a question paper PDF or paste the questions directly
3. Set the maximum marks for the evaluation
4. Click "Submit for Evaluation" to process
5. View the evaluation results including marks and feedback

## Technologies Used

- React.js with Vite
- Tailwind CSS for styling
- react-dropzone for file uploads
- PDF.js for PDF text extraction
- Google's Generative AI (Gemini) for evaluation