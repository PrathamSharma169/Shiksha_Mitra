import os
import google.generativeai as genai  
from PIL import Image  
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

    # Improved prompt to extract all Q&A pairs
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

        return qa_list if qa_list else [{"question": "No questions detected", "answer": "No answers detected"}]
    
    return [{"question": "No questions detected", "answer": "No answers detected"}]

# Example Usage
image_path = "pratham.jpeg"
qa_list = extract_qa_from_image(image_path)
print(qa_list)  # Output: [{'question': 'What is Google?', 'answer': 'Google is a company...'}, {'question': 'Who founded it?', 'answer': 'Larry Page and Sergey Brin.'}]

# import os
# import io
# from flask import Flask, request, jsonify
# import google.generativeai as genai
# from PIL import Image
# from dotenv import load_dotenv

# # Configure the API
# load_dotenv()

# # Fetch API key from environment variables
# api_key = os.getenv("GOOGLE_API_KEY")

# # Check if API key is found
# if not api_key:
#     raise ValueError("GOOGLE_API_KEY not found in .env file.")

# # Configure the API
# genai.configure(api_key=api_key)

# # Initialize the model
# model = genai.GenerativeModel("gemini-1.5-flash")

# app = Flask(__name__)

# def extract_qa_from_image(image):
#     """
#     Extracts multiple questions and answers from an image.

#     Args:
#         image (PIL.Image): Image object.

#     Returns:
#         list: A list of dictionaries with 'question' and 'answer'.
#     """
#     # Prompt to ensure structured output
#     prompt = (
#         "Extract all question-answer pairs from the image. "
#         "Return the output in this structured format:\n"
#         "Q1: <question>\nA1: <answer>\n"
#         "Q2: <question>\nA2: <answer>\n"
#         "Continue this format for all questions."
#     )

#     response = model.generate_content([prompt, image])

#     if response and response.text:
#         extracted_text = response.text.strip()
#         qa_list = []
#         lines = extracted_text.split("\n")

#         for i in range(0, len(lines) - 1, 2):  # Process two lines at a time (Q and A)
#             if lines[i].startswith("Q") and lines[i + 1].startswith("A"):
#                 question = lines[i].split(":", 1)[1].strip()
#                 answer = lines[i + 1].split(":", 1)[1].strip()
#                 qa_list.append({"question": question, "answer": answer})

#         return qa_list if qa_list else [{"question": "No questions detected", "answer": "No answers detected"}]

#     return [{"question": "No questions detected", "answer": "No answers detected"}]

# @app.route('/extract_qa', methods=['POST'])
# def extract_qa():
#     """
#     API endpoint to extract Q&A pairs from an image.

#     Supports:
#     - Image upload via 'image' field (multipart/form-data)
#     - Image path via JSON { "image_path": "path/to/image.jpg" }
#     """
#     # Handle image upload
#     if 'image' in request.files:
#         image_file = request.files['image']
#         image = Image.open(io.BytesIO(image_file.read()))
#         qa_list = extract_qa_from_image(image)
#         return jsonify({"questions_answers": qa_list}), 200

#     # Handle image path
#     if request.is_json:
#         data = request.get_json()
#         if "image_path" in data:
#             image_path = data["image_path"]
#             if not os.path.exists(image_path):
#                 return jsonify({"error": "Image file not found"}), 400
#             image = Image.open(image_path)
#             qa_list = extract_qa_from_image(image)
#             return jsonify({"questions_answers": qa_list}), 200

#     return jsonify({"error": "No valid image provided"}), 400

# if __name__ == '__main__':
#     app.run(debug=True)

# import os
# import io
# from flask import Flask, request, jsonify
# import google.generativeai as genai
# from PIL import Image
# from dotenv import load_dotenv

# # Load environment variables
# load_dotenv()

# # Fetch API key
# api_key = os.getenv("GOOGLE_API_KEY")
# if not api_key:
#     raise ValueError("GOOGLE_API_KEY not found in .env file.")

# # Configure the API
# genai.configure(api_key=api_key)

# # Initialize the model
# model = genai.GenerativeModel("gemini-1.5-flash")

# app = Flask(__name__)

# def extract_qa_from_image(image):
#     """
#     Extracts multiple questions and answers from an image.

#     Args:
#         image (PIL.Image): Image object.

#     Returns:
#         list: A list of dictionaries with 'question' and 'answer'.
#     """
#     # Convert image to RGB format to avoid issues
#     image = image.convert("RGB")

#     # Prompt to ensure structured output
#     prompt = (
#         "Extract all question-answer pairs from the image. "
#         "Return the output in this structured format:\n"
#         "Q1: <question>\nA1: <answer>\n"
#         "Q2: <question>\nA2: <answer>\n"
#         "Continue this format for all questions."
#     )

#     response = model.generate_content([prompt, image])

#     if response and response.text:
#         extracted_text = response.text.strip()
#         qa_list = []
#         lines = extracted_text.split("\n")

#         for i in range(0, len(lines) - 1, 2):  # Process two lines at a time (Q and A)
#             if lines[i].startswith("Q") and lines[i + 1].startswith("A"):
#                 question = lines[i].split(":", 1)[1].strip()
#                 answer = lines[i + 1].split(":", 1)[1].strip()
#                 qa_list.append({"question": question, "answer": answer})

#         return qa_list if qa_list else [{"question": "No questions detected", "answer": "No answers detected"}]

#     return [{"question": "No questions detected", "answer": "No answers detected"}]

# @app.route('/extract_qa', methods=['POST'])
# def extract_qa():
#     """
#     API endpoint to extract Q&A pairs from an image.

#     Supports:
#     - Image upload via 'image' field (multipart/form-data)
#     - Image path via JSON { "image_path": "path/to/image.jpg" }
#     """
#     try:
#         # Handle image upload
#         if 'image' in request.files:
#             image_file = request.files['image']
#             image = Image.open(io.BytesIO(image_file.read()))
#             qa_list = extract_qa_from_image(image)
#             return jsonify({"questions_answers": qa_list}), 200

#         # Handle image path
#         if request.is_json:
#             data = request.get_json()
#             if "image_path" in data:
#                 image_path = data["image_path"]
#                 if not os.path.exists(image_path):
#                     return jsonify({"error": "Image file not found"}), 400
#                 image = Image.open(image_path)
#                 qa_list = extract_qa_from_image(image)
#                 return jsonify({"questions_answers": qa_list}), 200

#         return jsonify({"error": "No valid image provided"}), 400

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# if __name__ == '__main__':
#     app.run(host="0.0.0.0", port=5000, debug=True)

# import os
# import io
# from flask import Flask, request, jsonify
# from flask_cors import CORS  # Enable frontend-backend communication
# import google.generativeai as genai
# from PIL import Image
# from dotenv import load_dotenv

# # Load environment variables
# load_dotenv()

# # Fetch API key
# api_key = os.getenv("GOOGLE_API_KEY")
# if not api_key:
#     raise ValueError("GOOGLE_API_KEY not found in .env file.")

# # Configure the API
# genai.configure(api_key=api_key)

# # Initialize the model
# model = genai.GenerativeModel("gemini-1.5-flash")

# # Create Flask app
# app = Flask(__name__)
# CORS(app)  # Enable CORS for all routes

# def extract_qa_from_image(image):
#     """
#     Extracts multiple questions and answers from an image.

#     Args:
#         image (PIL.Image): Image object.

#     Returns:
#         list: A list of dictionaries with 'question' and 'answer'.
#     """
#     # Convert image to RGB format to avoid issues
#     image = image.convert("RGB")

#     # Prompt to ensure structured output
#     prompt = (
#         "Extract all question-answer pairs from the image. "
#         "Return the output in this structured format:\n"
#         "Q1: <question>\nA1: <answer>\n"
#         "Q2: <question>\nA2: <answer>\n"
#         "Continue this format for all questions."
#     )

#     response = model.generate_content([prompt, image])

#     if response and response.text:
#         extracted_text = response.text.strip()
#         qa_list = []
#         lines = extracted_text.split("\n")

#         for i in range(0, len(lines) - 1, 2):  # Process two lines at a time (Q and A)
#             if lines[i].startswith("Q") and lines[i + 1].startswith("A"):
#                 question = lines[i].split(":", 1)[1].strip()
#                 answer = lines[i + 1].split(":", 1)[1].strip()
#                 qa_list.append({"question": question, "answer": answer})

#         return qa_list if qa_list else [{"question": "No questions detected", "answer": "No answers detected"}]

#     return [{"question": "No questions detected", "answer": "No answers detected"}]

# @app.route('/extract_qa', methods=['POST'])
# def extract_qa():
#     """
#     API endpoint to extract Q&A pairs from an image.

#     Supports:
#     - Image upload via 'image' field (multipart/form-data)
#     """
#     try:
#         # Handle image upload
#         if 'image' in request.files:
#             image_file = request.files['image']
#             image = Image.open(io.BytesIO(image_file.read()))
#             qa_list = extract_qa_from_image(image)
#             return jsonify({"questions_answers": qa_list}), 200

#         return jsonify({"error": "No valid image provided"}), 400

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# if __name__ == '__main__':
#     app.run(host="0.0.0.0", port=5000, debug=True)
