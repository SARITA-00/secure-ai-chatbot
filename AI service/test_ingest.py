from app.rag.ingest import ingest_pdf


ingest_pdf(
    file_path="data/sample_customer_support_policy.pdf",
    title="Customer Support Policy",
    filename="sample_customer_support_policy.pdf"
)