# Use official Python slim runtime
FROM python:3.11-slim

# Set work directory
WORKDIR /code

# Install system dependencies needed for PDF font/graphics rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy source code
COPY . /code

# Expose FastAPI default port
EXPOSE 8000

# Start Uvicorn ASGI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
