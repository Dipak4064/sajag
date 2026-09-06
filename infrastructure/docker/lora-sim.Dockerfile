FROM python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY infrastructure/lora-sim/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY infrastructure/lora-sim ./infrastructure/lora-sim

EXPOSE 4002

CMD ["python", "-u", "infrastructure/lora-sim/gateway.py"]
