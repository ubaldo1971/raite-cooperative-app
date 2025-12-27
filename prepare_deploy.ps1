$source = "c:\Users\Broly\Desktop\registracion app cooperativa"
$dest = "c:\Users\Broly\Desktop\registracion app cooperativa\deploy_ready"

# Create destination structure
New-Item -ItemType Directory -Force -Path "$dest\client"
New-Item -ItemType Directory -Force -Path "$dest\admin"
New-Item -ItemType Directory -Force -Path "$dest\server"

# 1. Copy Client Build
Write-Host "Copying Client build..."
Copy-Item -Recurse -Force "$source\client\dist" "$dest\client\dist"

# 2. Copy Admin Build
Write-Host "Copying Admin build..."
Copy-Item -Recurse -Force "$source\admin\dist" "$dest\admin\dist"

# 3. Copy Server Files
Write-Host "Copying Server files..."
Copy-Item -Recurse -Force "$source\server\src" "$dest\server\src"
Copy-Item -Recurse -Force "$source\server\package.json" "$dest\server\package.json"
Copy-Item -Recurse -Force "$source\server\package-lock.json" "$dest\server\package-lock.json"

# Copy uploads if exists
if (Test-Path "$source\server\uploads") {
    Copy-Item -Recurse -Force "$source\server\uploads" "$dest\server\uploads"
}

# Copy env if exists, else verify
if (Test-Path "$source\server\.env") {
    Copy-Item -Force "$source\server\.env" "$dest\server\.env"
} else {
    Write-Host "WARNING: .env file not found in server root. You will need to create it on the server." -ForegroundColor Yellow
}

# Check for db.json location (it might be in src/db or separate)
# Based on code it seems db.json is created dynamically or in src/db
if (Test-Path "$source\server\src\db\db.json") {
     Write-Host "Copying local database..."
     Copy-Item -Force "$source\server\src\db\db.json" "$dest\server\src\db\db.json"
}

Write-Host "Deployment package ready at: $dest" -ForegroundColor Green
