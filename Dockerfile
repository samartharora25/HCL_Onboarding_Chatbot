# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve the app with Python
FROM python:3.10-slim
WORKDIR /app

# Install build dependencies for ChromaDB or other Python packages if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY app.py .
COPY summaries.json ./
COPY chunks.json ./
COPY src/ ./src/
COPY hcl_chroma_db/ ./hcl_chroma_db/

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port and run using gunicorn
# Render dynamically passes the PORT environment variable, so we use shell form to bind to it or fallback to 5000
EXPOSE 5000
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} --timeout 120 app:app"]
