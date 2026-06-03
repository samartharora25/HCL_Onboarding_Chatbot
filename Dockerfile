# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Define build arguments so Render can pass these env variables to the build stage
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set them as env variables for the Vite build process
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

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

# Limit PyTorch CPU threads to reduce memory footprint on free tier
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1

# Expose port and run using gunicorn with a single worker process
EXPOSE 5000
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 1 --threads 2 --timeout 120 app:app"]
