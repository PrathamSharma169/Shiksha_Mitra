import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjsLib from "pdfjs-dist";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FaCloudUploadAlt,
  FaFilePdf,
  FaRegFileAlt,
  FaUndo,
  FaPaperPlane,
} from "react-icons/fa";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function App() {
  const [answerSheets, setAnswerSheets] = useState([]);
  const [questionPaper, setQuestionPaper] = useState(null);
  const [questionText, setQuestionText] = useState("");
  const [maxMarks, setMaxMarks] = useState(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [marks, setMarks] = useState(null);

  const { getRootProps: getAnswerProps, getInputProps: getAnswerInput } =
    useDropzone({
      accept: {
        "image/*": [".png", ".jpg", ".jpeg"],
      },
      onDrop: (acceptedFiles) => {
        setAnswerSheets(acceptedFiles);
      },
    });

  const { getRootProps: getQuestionProps, getInputProps: getQuestionInput } =
    useDropzone({
      accept: {
        "application/pdf": [".pdf"],
      },
      multiple: false,
      onDrop: async (acceptedFiles) => {
        const file = acceptedFiles[0];
        setQuestionPaper(file);

        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = "";

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item) => item.str)
              .join(" ");
            fullText += pageText + "\n";
          }

          setQuestionText(fullText);
        } catch (error) {
          console.error("Error extracting PDF text:", error);
        }
      },
    });

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const extractMarks = (text) => {
    const marksRegex = /(\d+)\/(\d+)/;
    const match = text.match(marksRegex);
    if (match) {
      return {
        obtained: parseInt(match[1]),
        total: parseInt(match[2]),
      };
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const imagePromises = answerSheets.map(convertImageToBase64);
      const base64Images = await Promise.all(imagePromises);

      const prompt = `Evaluate the following answer sheet images based on the provided questions. 
        Assign marks out of ${maxMarks}. Provide a detailed report with marks obtained, weak points, 
        and strong points. Format the response in markdown with clear sections for marks, strengths, and areas for improvement.
        Use emojis where appropriate.\n\nQuestions:\n${
          questionText || "Questions from uploaded PDF"
        }`;

      const result = await model.generateContent([
        prompt,
        ...base64Images.map((img) => ({
          inlineData: { data: img.split(",")[1], mimeType: "image/jpeg" },
        })),
      ]);

      const response = await result.response;
      const responseText = response.text();
      setResult(responseText);
      setMarks(extractMarks(responseText));
    } catch (error) {
      console.error("Error processing evaluation:", error);
      alert("Error processing evaluation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnswerSheets([]);
    setQuestionPaper(null);
    setQuestionText("");
    setMaxMarks(100);
    setResult(null);
    setMarks(null);
  };

  const getScoreColor = (score) => {
    if (!score) return "text-gray-700";
    const percentage = (score.obtained / score.total) * 100;
    if (percentage >= 80) return "text-emerald-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-amber-500";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-6 shadow-md">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
              <span className="text-indigo-600 text-xl font-bold">SM</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Shiksha Mitra</h1>
          </div>
          <div className="hidden md:block">
            <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium">
              AI-Powered Evaluation
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="text-center mb-10">
          <p className="text-gray-600 text-lg">
            Your AI-Powered Exam Evaluation Assistant
          </p>
          <div className="mt-2 h-1 w-24 bg-indigo-500 mx-auto rounded-full"></div>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Answer sheet upload */}
              <div className="bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl">
                <h2 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                  <FaRegFileAlt className="mr-2 text-indigo-500" />
                  Answer Sheets
                </h2>
                <div
                  {...getAnswerProps()}
                  className="border-2 border-dashed hover:border-indigo-400 focus:border-indigo-400 transition-colors bg-indigo-50 rounded-lg p-6 text-center cursor-pointer h-48 flex flex-col items-center justify-center"
                >
                  <input {...getAnswerInput()} />
                  <FaCloudUploadAlt className="text-4xl text-indigo-400 mb-2" />
                  <p className="text-gray-600">
                    Drag and drop answer sheet images here, or click to select
                  </p>
                </div>
                {answerSheets.length > 0 && (
                  <div className="mt-4 bg-indigo-50 p-3 rounded-lg">
                    <p className="font-medium text-indigo-700">
                      Selected files ({answerSheets.length}):
                    </p>
                    <ul className="text-sm text-gray-500 mt-1 max-h-24 overflow-y-auto">
                      {answerSheets.map((file) => (
                        <li
                          key={file.name}
                          className="py-1 border-b border-indigo-100 last:border-0"
                        >
                          {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Question paper upload */}
              <div className="bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl">
                <h2 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                  <FaFilePdf className="mr-2 text-indigo-500" />
                  Question Paper
                </h2>
                <div
                  {...getQuestionProps()}
                  className="border-2 border-dashed hover:border-indigo-400 focus:border-indigo-400 transition-colors bg-indigo-50 rounded-lg p-6 text-center cursor-pointer h-48 flex flex-col items-center justify-center"
                >
                  <input {...getQuestionInput()} />
                  <FaFilePdf className="text-4xl text-indigo-400 mb-2" />
                  <p className="text-gray-600">
                    Drag and drop question paper PDF here, or click to select
                  </p>
                </div>
                {questionPaper && (
                  <div className="mt-4 bg-indigo-50 p-3 rounded-lg">
                    <p className="font-medium text-indigo-700">
                      Selected file:
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {questionPaper.name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Question text and marks */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <span className="w-1 h-5 bg-indigo-500 rounded mr-2"></span>
                  Question Text (Optional)
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 rounded-lg transition-all outline-none"
                  placeholder="Paste question text here if PDF upload is not available..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <span className="w-1 h-5 bg-indigo-500 rounded mr-2"></span>
                  Maximum Marks
                </label>
                <input
                  type="number"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(parseInt(e.target.value))}
                  className="w-full md:w-1/3 p-3 border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 rounded-lg transition-all outline-none"
                  min="1"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={
                  loading ||
                  answerSheets.length === 0 ||
                  (!questionPaper && !questionText)
                }
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-full font-medium shadow-md hover:shadow-lg transform transition hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing Evaluation...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="mr-2" />
                    Submit for Evaluation
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 transition-all animate-fade-in">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <span className="w-2 h-8 bg-indigo-500 rounded mr-3"></span>
                Evaluation Results
              </h2>
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                📝 AI Graded
              </span>
            </div>

            {marks && (
              <div
                className={`text-center mb-8 p-6 rounded-lg ${getScoreColor(
                  marks
                )} bg-opacity-10 bg-current`}
              >
                <div className="mb-2">
                  <span
                    className={`inline-block text-5xl font-bold ${getScoreColor(
                      marks
                    )}`}
                  >
                    {marks.obtained}
                  </span>
                  <span className="text-2xl text-gray-400 mx-1">/</span>
                  <span className="text-2xl text-gray-600">{marks.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3 mb-4">
                  <div
                    className={`h-2.5 rounded-full ${getScoreColor(marks)}`}
                    style={{
                      width: `${(marks.obtained / marks.total) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xl">
                  {marks.obtained >= marks.total * 0.8
                    ? "🌟 Excellent!"
                    : marks.obtained >= marks.total * 0.6
                    ? "👍 Good Job!"
                    : marks.obtained >= marks.total * 0.4
                    ? "💪 Keep Improving!"
                    : "📚 Need More Practice"}
                </p>
              </div>
            )}

            <div className="prose max-w-none bg-white p-4 rounded-lg border border-gray-100">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => (
                    <h1
                      className="text-2xl font-bold mt-6 mb-4 text-indigo-800 border-b pb-2"
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-xl font-bold mt-5 mb-3 text-indigo-700"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      className="text-lg font-bold mt-4 mb-2 text-indigo-600"
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="mb-4 leading-relaxed" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc ml-6 mb-4 space-y-1" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="mb-1" {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-bold text-indigo-700" {...props} />
                  ),
                }}
              >
                {result}
              </ReactMarkdown>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-full font-medium shadow-md hover:shadow-lg transform transition hover:-translate-y-1 flex items-center mx-auto"
              >
                <FaUndo className="mr-2" />
                Start New Evaluation
              </button>
            </div>
          </div>
        )}

        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>
            © {new Date().getFullYear()} Shiksha Mitra • AI-Powered Answer
            Evaluation
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
