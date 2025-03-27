import os
import google.generativeai as genai  
from PIL import Image  

# Configure the API
from dotenv import load_dotenv
# Configure the API
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY environment variable not set.")
genai.configure(api_key=api_key)
if not api_key:
    raise ValueError("GOOGLE_API_KEY environment variable not set.")
genai.configure(api_key=api_key)

# Initialize the model
model = genai.GenerativeModel("gemini-1.5-flash")  

def extract_qa_from_image(image_path: str) -> list:
    """
    Extracts multiple questions and answers from an image.

    Args:
        image_path (str): Path to the image file.

    Returns:
        list: A list of dictionaries with 'question' and 'answer'.
    """
    try:
        image = Image.open(image_path)  # Load image
    except FileNotFoundError:
        raise FileNotFoundError(f"Image file '{image_path}' not found.")

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

        for i in range(0, len(lines) - 1, 2):  
            if lines[i].startswith("Q") and lines[i + 1].startswith("A"):
                question = lines[i].split(":", 1)[1].strip()
                answer = lines[i + 1].split(":", 1)[1].strip()
                qa_list.append({"question": question, "answer": answer})

        return qa_list if qa_list else [{"question": "No questions detected", "answer": "No answers detected"}]
    
    return [{"question": "No questions detected", "answer": "No answers detected"}]


def grade_answers(qa_list: list) -> list:
    """
    Grades the answers based on correctness and provides improvement suggestions.

    Args:
        qa_list (list): List of dictionaries containing 'question' and 'answer'.

    Returns:
        list: List of dictionaries with 'question', 'answer', 'grade', and 'improvement_suggestions'.
    """
    graded_results = []
    
    for qa in qa_list:
        question = qa["question"]
        answer = qa["answer"]
        
        grading_prompt = (
            f"Evaluate the following answer strictly based on correctness:\n\n"
            f"Question: {question}\n"
            f"Answer: {answer}\n\n"
            "1. Give a **score from 0 to 10** based on accuracy.\n"
            "2. Provide **at least 2 improvement suggestions**, even if the answer is correct.\n"
            "3. Format your response as follows:\n"
            "   Score: <score>\n"
            "   Suggestions:\n"
            "   - <Improvement 1>\n"
            "   - <Improvement 2>\n"
            "   - (Add more if necessary)\n"
            "4. If the answer is **perfect (10/10)**, still suggest ways to make it **more detailed or insightful**."
        )

        response = model.generate_content(grading_prompt)

        if response and response.text:
            response_text = response.text.strip()
            
            # Extract score
            score = 0
            suggestions = []
            lines = response_text.split("\n")
            
            for line in lines:
                if line.startswith("Score:"):
                    try:
                        score = int(line.split(":")[1].strip())
                    except ValueError:
                        score = 0  # Default in case parsing fails
                
                elif line.startswith("- "):  
                    suggestions.append(line[2:].strip())  

            if not suggestions:
                suggestions = ["No improvement suggested, but more details can be added."]

            graded_results.append({
                "question": question,
                "answer": answer,
                "grade": score,
                "improvement_suggestions": suggestions
            })
    
    return graded_results


# Example Usage
image_path = "pratham.jpeg"
qa_list = extract_qa_from_image(image_path)
graded_results = grade_answers(qa_list)

for result in graded_results:
    print(result)  
