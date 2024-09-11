from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import re
from langchain_milvus.vectorstores import Milvus
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from openai import OpenAI
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__)
CORS(app)

# Set API key
os.environ["OPENAI_API_KEY"] = "" # Replace with your actual API key

# Initialize the OpenAI model
llm = ChatOpenAI(model_name="gpt-3.5-turbo")
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

# Initialize OpenAI Embeddings
embedding_function = OpenAIEmbeddings(model="text-embedding-ada-002")


# Initialize two vector stores
vectorstore_general = Milvus(
    collection_name="pepperchatfile_basic",  # General information container
    connection_args={"uri": "http://127.0.0.1:19530"},
    embedding_function=embedding_function,
)

vectorstore_medical = Milvus(
    collection_name="pepperchatfile_medical",  # Patient information container22
    connection_args={"uri": "http://127.0.0.1:19530"},
    embedding_function=embedding_function,
)







# Define the SYSTEM_PROMPT
SYSTEM_PROMPT = """
You are an AI assistant helping patients and staff in a hospital environment.
You can provide information based on the vector stores from Milvus:
- Use the collection "pepperchatfile_basic" for hospital inquiries.
- Use the collection "pepperchatfile_medical" for inquiries related to medical information.
It is important to correctly classify the nature of each inquiry to ensure the response is drawn from the appropriate vector store.
Do not answer questions related to diseases, symptoms, or medical diagnoses directly. If a patient asks such questions, always respond with: "Please consult your attending physician for professional medical advice."
Please be precise and clear in your responses, ensuring they are relevant and based on the context given from the appropriate Milvus vector store.
"""

general_chat_keywords = set(["hello", "hi", "how are you", "weather", "what's up", "greetings", "germany", "munich"])
hospital_related_keywords = set(["wi-fi", "wlan", "arrival", "parking", "park", "checklist", "restaurant", "stay", "admission", "eat", "opening hours", "direction", "how to get there", "tv-programme", "meals", "catering", "visiting hours", "visit"])
medical_keywords = set(["operation", "aftercare", "medication", "symptom", "care", "doctor", "nurse", "disease", "diagnosis", "treatment", "illness", "fever", "pain"])
nutrition_keywords = set(["nutrition", "diet", "food", "recipe", "fitness", "health", "vitamin"])

def word_in_query(word, query):
    return re.search(r'\b' + re.escape(word) + r'\b', query, re.IGNORECASE) is not None

def determine_scenario(query):
    query_lower = query.lower()
    
    print(f"Debug: Analyzing query: '{query_lower}'")
    
    if any(word_in_query(keyword, query_lower) for keyword in medical_keywords):
        print(f"Debug: Matched medical keyword")
        return "medical"
    
    if any(word_in_query(keyword, query_lower) for keyword in nutrition_keywords):
        print(f"Debug: Matched nutrition keyword")
        return "nutrition"
    
    if any(word_in_query(keyword, query_lower) for keyword in hospital_related_keywords):
        print(f"Debug: Matched hospital keyword")
        return "hospital"
    
    if any(word_in_query(keyword, query_lower) for keyword in general_chat_keywords):
        print(f"Debug: Matched general keyword")
        return "general"
    
    print("Debug: No keyword match, performing semantic analysis")
    context = "This query did not match specific keywords and needs deeper analysis."
    result = semantic_analysis(query, context).strip().lower()
    print(f"Debug: Semantic analysis result: '{result}'")
    
    category_mapping = {
        "hospital related": "hospital",
        "medical information": "medical",
        "nutrition information": "nutrition"
    }
    return category_mapping.get(result, "hospital")

def semantic_analysis(query, context):
    SEMANTIC_PROMPT = f"""
    Analyze the following query in the context of a hospital environment:
    Query: {query}

    Context:
    {context}

    Please provide a brief analysis of:
    1. The main intent of the query
    2. Any specific topics or keywords that are relevant
    3. The appropriate category for this query, based on the context.

    Categorize the query into EXACTLY ONE of the following categories:
    - General: For general inquiries not related to hospital, medical, or nutrition information.
    - Hospital Related: For inquiries about hospital services, facilities, or non-medical information.
    - Medical Information: For health-related or medical inquiries, including questions about diseases, symptoms, or treatments.
    - Nutrition Information: For inquiries specifically about diet, food, or nutritional health.

    Respond with ONLY ONE of these exact phrases: "General", "Hospital Related", "Medical Information", or "Nutrition Information".
    """
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": SEMANTIC_PROMPT}],
            temperature=0.3,
            max_tokens=150
        )
        return response.choices[0].message.content.lower()
    except Exception as e:
        print(f"Error in semantic analysis: {e}")
        return "general"  # Fallback to general if there's an error

def send_email_alert(query):
    sender_email = "hs5721571@gmail.com"
    receiver_email = "hsdeguo@163.com"
    password = "Hs961217wza,"  # 注意：建议使用环境变量存储密码

    message = MIMEMultipart("alternative")
    message["Subject"] = "Medical Query Alert"
    message["From"] = sender_email
    message["To"] = receiver_email

    text = f"""\
    A medical query has been detected that requires professional attention.
    Query: {query}
    Please follow up with the patient regarding this query."""

    part1 = MIMEText(text, "plain")
    message.attach(part1)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:  # 使用Gmail的SMTP服务器
            server.login(sender_email, password)
            server.sendmail(sender_email, receiver_email, message.as_string())
        print("Email alert sent successfully")
    except Exception as e:
        print(f"Failed to send email alert: {e}")

def handle_query_based_on_scenario(query, chat_history=None):
    if chat_history is None:
        chat_history = []

    scenario = determine_scenario(query)
    print("Determined scenario:", scenario)

    if scenario == "medical":
        answer = "Please consult your attending physician for professional medical advice."
        send_email_alert(query)
    
    elif scenario == "nutrition":
        search_results = vectorstore_medical.similarity_search(query, k=3)
        context = "\n".join([result.page_content for result in search_results])
        
        NUTRITION_PROMPT = f"""
        Based on the following nutrition-related information, please answer the question:

        Context:
        {context}

        Question: {query}

        Please provide a brief, friendly, and conversational response that:
        1. Gives a simple answer to the question
        2. Mentions one or two key benefits or facts
        3. Encourages eating a balanced diet
        4. Suggests consulting a professional for personalized advice if needed

        Keep the response under 50 words and use everyday language.
        """
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": NUTRITION_PROMPT}
            ],
            temperature=0.7,
            max_tokens=100
        )
        answer = response.choices[0].message.content
    
    else:  # general or hospital
        if scenario == "hospital":
            search_results = vectorstore_general.similarity_search(query, k=3)
            context = "\n".join([result.page_content for result in search_results])
            USER_PROMPT = f"""
            Based on the following information from the hospital documents, please answer the question:

            Context:
            {context}

            Question: {query}

            Provide a clear and concise answer that addresses all aspects of the question. 
            Ensure the answer is accurate, relevant to hospital services or general inquiries, and use everyday language.
            Keep the response under 100 words if possible.
            """
        else:  # general
            USER_PROMPT = query

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": USER_PROMPT}
            ],
            temperature=0.7,
            max_tokens=150 if scenario == "general" else 200
        )
        answer = response.choices[0].message.content

    chat_history.append((query, answer))
    return answer, chat_history

# Serving the HTML file
@app.route('/')
def index():
    return send_from_directory('.', 'chat.html')

@app.route('/voicechat')
def voicechat():
    return send_from_directory('.', 'voicechat.html')


# Serving static files (like JS, CSS)
@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('.', path)

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        prompt = data.get('prompt')
        chat_history = data.get('chat_history', [])

        # 调用 handle_query_based_on_scenario，只传递 prompt 和 chat_history
        answer, updated_chat_history = handle_query_based_on_scenario(prompt, chat_history)

        return jsonify({'content': answer, 'chat_history': updated_chat_history})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5100, debug=True)

