import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function App() {
  const [answerSheets, setAnswerSheets] = useState([]);
  const [questionPaper, setQuestionPaper] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [marks, setMarks] = useState(null);

  const { getRootProps: getAnswerProps, getInputProps: getAnswerInput } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    onDrop: acceptedFiles => {
      setAnswerSheets(acceptedFiles);
    }
  });

  const { getRootProps: getQuestionProps, getInputProps: getQuestionInput } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      setQuestionPaper(file);
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }
        
        setQuestionText(fullText);
      } catch (error) {
        console.error('Error extracting PDF text:', error);
      }
    }
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
        total: parseInt(match[2])
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
        Use emojis where appropriate.\n\nQuestions:\n${questionText || 'Questions from uploaded PDF'}`;

      const result = await model.generateContent([
        prompt,
        ...base64Images.map(img => ({ inlineData: { data: img.split(',')[1], mimeType: 'image/jpeg' } }))
      ]);

      const response = await result.response;
      const responseText = response.text();
      setResult(responseText);
      setMarks(extractMarks(responseText));
    } catch (error) {
      console.error('Error processing evaluation:', error);
      alert('Error processing evaluation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnswerSheets([]);
    setQuestionPaper(null);
    setQuestionText('');
    setMaxMarks(100);
    setResult(null);
    setMarks(null);
  };

  const getScoreColor = (score) => {
    if (!score) return 'text-gray-700';
    const percentage = (score.obtained / score.total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Shiksha Mitra</h1>
        <p className="text-center text-gray-600 mb-8">Your AI-Powered Exam Evaluation Assistant</p>
        
        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
            <div {...getAnswerProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input {...getAnswerInput()} />
              <p className="text-gray-600">
                Drag and drop answer sheet images here, or click to select files
              </p>
              {answerSheets.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium">Selected files ({answerSheets.length}):</p>
                  <ul className="text-sm text-gray-500">
                    {answerSheets.map(file => (
                      <li key={file.name}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div {...getQuestionProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input {...getQuestionInput()} />
                <p className="text-gray-600">
                  Drag and drop question paper PDF here, or click to select file
                </p>
                {questionPaper && <p className="mt-2 text-sm text-gray-500">{questionPaper.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or paste question text here:
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full h-32 p-2 border rounded"
                  placeholder="Paste question text here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Marks:
                </label>
                <input
                  type="number"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(parseInt(e.target.value))}
                  className="w-full p-2 border rounded"
                  min="1"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || answerSheets.length === 0 || (!questionPaper && !questionText)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Submit for Evaluation'}
            </button>
          </form>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Evaluation Results 📝</h2>
            
            {marks && (
              <div className={`text-center mb-6 ${getScoreColor(marks)}`}>
                <p className="text-4xl font-bold">
                  {marks.obtained}/{marks.total}
                </p>
                <p className="text-xl mt-2">
                  {marks.obtained >= (marks.total * 0.8) ? '🌟 Excellent!' :
                   marks.obtained >= (marks.total * 0.6) ? '👍 Good Job!' :
                   marks.obtained >= (marks.total * 0.4) ? '💪 Keep Improving!' :
                   '📚 Need More Practice'}
                </p>
              </div>
            )}

            <div className="prose max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-4 mb-3" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-3 mb-2" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4" {...props} />,
                  li: ({node, ...props}) => <li className="mb-2" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-blue-600" {...props} />
                }}
              >
                {result}
              </ReactMarkdown>
            </div>
            
            <button
              onClick={handleReset}
              className="mt-6 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
            >
              Start New Evaluation ↺
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;