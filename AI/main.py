import os
import google.generativeai as genai  
from PIL import Image
import pdf2image  # Convert PDF pages to images
from dotenv import load_dotenv

# Configure the API
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY environment variable not set.")
genai.configure(api_key=api_key)

# Initialize the model
model = genai.GenerativeModel("gemini-1.5-flash")  

def extract_qa_from_image(image: Image.Image) -> list:
    """
    Extracts multiple questions and answers from an image.

    Args:
        image (Image.Image): PIL Image object.

    Returns:
        list: A list of dictionaries with 'question' and 'answer'.
    """
    prompt = (
        "Extract all question-answer pairs from the image. "
        "Return the output in this structured format:\n"
        "Q1: <question>\nA1: <answer>\n"
        "Q2: <question>\nA2: <answer>\n"
        "Continue this format for all questions."
    )

    response = model.generate_content([prompt, image])

    if response and response.text:
        extracted_text = response.text.strip()
        qa_list = []
        lines = extracted_text.split("\n")

        for i in range(0, len(lines) - 1, 2):  # Process two lines at a time (Q and A)
            if lines[i].startswith("Q") and lines[i + 1].startswith("A"):
                question = lines[i].split(":", 1)[1].strip()
                answer = lines[i + 1].split(":", 1)[1].strip()
                qa_list.append({"question": question, "answer": answer})

        return qa_list if qa_list else []
    
    return []

def extract_qa_from_pdf(pdf_path: str) -> list:
    """
    Extracts Q&A from all images in a PDF.

    Args:
        pdf_path (str): Path to the PDF file.

    Returns:
        list: A combined list of extracted Q&A from all pages.
    """
    try:
        images = pdf2image.convert_from_path(pdf_path, poppler_path=r"C:\Users\lenovo\Downloads\Release-24.08.0-0\poppler-24.08.0\Library\bin")  # Convert PDF pages to images
    except Exception as e:
        raise RuntimeError(f"Error processing PDF: {e}")
    
    all_qa = []
    for image in images:
        all_qa.extend(extract_qa_from_image(image))
    
    return all_qa if all_qa else [{"question": "No questions detected", "answer": "No answers detected"}]

def grade_answers(qa_list: list) -> list:
    """
    Grades the answers and provides feedback for improvement.
    
    Args:
        qa_list (list): List of dictionaries with 'question' and 'answer'.
    
    Returns:
        list: A list of dictionaries containing 'question', 'answer', 'score', and 'suggestion'.
    """
    graded_qa = []
    for qa in qa_list:
        question = qa["question"]
        answer = qa["answer"]
        prompt = (
            "Evaluate the following answer to the given question on a scale of 1 to 5. "
            "Provide a short suggestion for improvement if necessary. "
            "Return the response in the format:\n"
            "Score: <score>/5\n"
            "Suggestion: <suggestion>\n"
            f"Question: {question}\n"
            f"Answer: {answer}"
        )
        
        response = model.generate_content(prompt)
        if response and response.text:
            lines = response.text.strip().split("\n")
            score = 0
            suggestion = "No suggestion."
            
            for line in lines:
                if line.startswith("Score:"):
                    try:
                        score = int(line.split("/")[0].split(":")[1].strip())
                    except ValueError:
                        score = 0  # Default to 0 if parsing fails
                elif line.startswith("Suggestion:"):
                    suggestion = line.split(":", 1)[1].strip()
            
            graded_qa.append({
                "question": question,
                "answer": answer,
                "score": score,
                "suggestion": suggestion
            })
    
    return graded_qa

# Example Usage
pdf_path = "sample.pdf"
qa_list = extract_qa_from_pdf(pdf_path)
grades = grade_answers(qa_list)
print(grades)
