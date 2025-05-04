# PowerShell deployment script for edu-platform
# Variables setup
$SERVER_IP = "14.103.240.228"
$DOMAIN = "qimingyu.xyz"
$APP_NAME = "edu-platform"
$DEPLOY_PATH = "/var/www/$APP_NAME"
$JAR_FILE = "server/target/$APP_NAME-0.0.1-SNAPSHOT.jar"

# Compile backend
Write-Host "Compiling backend application..."
Set-Location -Path server
./mvnw clean package -DskipTests
Set-Location -Path ..

# Check if compilation was successful
if (-not (Test-Path $JAR_FILE)) {
    Write-Host "Build failed, JAR file does not exist: $JAR_FILE"
    exit 1
}

# Create frontend directory structure
Write-Host "Organizing frontend files..."
New-Item -Path "dist/public" -ItemType Directory -Force
New-Item -Path "dist/student-app" -ItemType Directory -Force
New-Item -Path "dist/teacher-app" -ItemType Directory -Force

# Copy frontend files
Copy-Item -Path "public/*" -Destination "dist/public" -Recurse -Force
Copy-Item -Path "student-app/*" -Destination "dist/student-app" -Recurse -Force
Copy-Item -Path "teacher-app/*" -Destination "dist/teacher-app" -Recurse -Force

# Use SCP command to upload files
Write-Host "Deploying frontend files..."
Write-Host "To deploy to the server, you need to execute these commands on a system with SSH and SCP:"
Write-Host "ssh root@${SERVER_IP} 'mkdir -p ${DEPLOY_PATH}/public ${DEPLOY_PATH}/student-app ${DEPLOY_PATH}/teacher-app'"
Write-Host "scp -r dist/* root@${SERVER_IP}:${DEPLOY_PATH}/"
Write-Host "scp ${JAR_FILE} root@${SERVER_IP}:${DEPLOY_PATH}/"

# Create systemd service file
$serviceContent = @"
[Unit]
Description=Education Platform Service
After=network.target

[Service]
User=root
WorkingDirectory=$DEPLOY_PATH
ExecStart=/usr/bin/java -jar $DEPLOY_PATH/$APP_NAME-0.0.1-SNAPSHOT.jar
SuccessExitStatus=143
TimeoutStopSec=10
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
"@

Set-Content -Path "edu-platform.service" -Value $serviceContent

# Create Nginx configuration file
$nginxContent = @"
server {
    listen 80;
    server_name $DOMAIN;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /student-app {
        root $DEPLOY_PATH;
        try_files \$uri \$uri/ /student-app/index.html;
    }

    location /teacher-app {
        root $DEPLOY_PATH;
        try_files \$uri \$uri/ /teacher-app/index.html;
    }

    location / {
        root $DEPLOY_PATH/public;
        try_files \$uri \$uri/ /index.html;
    }
}
"@

Set-Content -Path "nginx.conf" -Value $nginxContent

Write-Host "Service and Nginx configuration files created."
Write-Host "To set up the service and Nginx on the server, execute these commands:"
Write-Host "scp edu-platform.service root@${SERVER_IP}:/etc/systemd/system/"
Write-Host "ssh root@${SERVER_IP} 'systemctl daemon-reload && systemctl enable edu-platform.service && systemctl start edu-platform.service'"
Write-Host "scp nginx.conf root@${SERVER_IP}:/etc/nginx/sites-available/${DOMAIN}"
Write-Host "ssh root@${SERVER_IP} 'ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx'"

Write-Host "Deployment instructions prepared! When executed, the application will be available at http://${DOMAIN}" 