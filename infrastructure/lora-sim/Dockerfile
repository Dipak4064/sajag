FROM python:3.12-slim
WORKDIR /app
COPY infrastructure/lora-sim/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY infrastructure/lora-sim/*.py ./
USER nobody
EXPOSE 4002
CMD ["python", "-u", "gateway.py"]
