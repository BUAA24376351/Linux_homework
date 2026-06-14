FROM python:3.12-slim

WORKDIR /app

# Copy project files
COPY backend/ backend/
COPY frontend/ frontend/

# Install dependencies
RUN pip install --no-cache-dir flask flask-sqlalchemy

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "backend/app.py"]
