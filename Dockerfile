FROM python:3.11-alpine

# Lambda adapter
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

ENV PORT=8000
WORKDIR /var/task

# Install dependencies
COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY *.py ./

# CMD using JSON array for safer signal handling
CMD ["sh", "-c", "exec uvicorn --port=$PORT main:app"]
