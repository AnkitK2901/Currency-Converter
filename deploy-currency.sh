#!/bin/bash

# === CONFIGURE ===
GCE_USER="ankit_anjul"
GCE_HOST="34.93.194.88"    
APP_DIR="/home/ankit_anjul/Currency-Converter"
JAR_NAME="currency-converter-1.0.0-jar-with-dependencies.jar"
SERVICE_NAME="currency-converter"

echo "🔨 Step 1: Building project with Maven..."
mvn clean package || { echo "❌ Build failed"; exit 1; }

echo "📤 Step 2: Copying $JAR_NAME to $GCE_USER@$GCE_HOST..."
scp target/$JAR_NAME $GCE_USER@$GCE_HOST:$APP_DIR/target/

echo "♻️ Step 3: Restarting $SERVICE_NAME on GCE VM..."
ssh $GCE_USER@$GCE_HOST "sudo systemctl restart $SERVICE_NAME"

echo "✅ Step 4: Deployment complete. Current status:"
ssh $GCE_USER@$GCE_HOST "sudo systemctl status $SERVICE_NAME --no-pager"
