from app.rag.loader import load_pdf

pdf_path = "data/sample_customer_support_policy.pdf"

try:
    text = load_pdf(pdf_path)

    print("PDF loaded successfully!")
    print("Characters extracted:", len(text))

    print("\nFirst 1000 characters:")
    print(text[:1000])

except Exception as error:
    print("PDF loading failed.")
    print("Error:", error)