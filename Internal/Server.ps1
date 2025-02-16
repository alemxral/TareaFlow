$port = 8080
$webRoot = "$PSScriptRoot"  # Root directory for serving files
# Ensure the data directory exists for JSON storage
$dataDir = "$PSScriptRoot\data"
if (!(Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
}
# Start the HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "PowerShell HTTP Server started on http://localhost:$port/"
# Function to get MIME type based on file extension
function Get-MimeType($file) {
    switch -Regex ($file) {
        "\.html$" { "text/html" }
        "\.css$" { "text/css" }
        "\.js$" { "application/javascript" }
        "\.json$" { "application/json" }
        "\.png$" { "image/png" }
        "\.jpg$" { "image/jpeg" }
        "\.gif$" { "image/gif" }
        default { "application/octet-stream" }
    }
}

while ($true) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    $path = $request.Url.LocalPath.TrimStart("/")

    # Handle root path redirection to index.html
    if ($path -eq "") {
        $redirectUrl = "http://localhost:$port/index.html"
        $response.Headers.Set("Location", $redirectUrl)
        $response.StatusCode = 302  # Temporary redirect
        $response.OutputStream.Close()
        continue
    }

    $filePath = Join-Path $webRoot $path

    # Check if request is for static files
    if ($request.HttpMethod -eq "GET" -and (Test-Path $filePath)) {
        try {
            $mimeType = Get-MimeType $filePath
            $response.ContentType = $mimeType
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.OutputStream.Write($content, 0, $content.Length)
        } catch {
            $redirectUrl = "http://localhost:$port/index.html"
            $response.Headers.Set("Location", $redirectUrl)
            $response.StatusCode = 302  # Temporary redirect
            $response.OutputStream.Close()
            continue
        }
    }
    # API: Save JSON Data
    elseif ($request.HttpMethod -eq "POST" -and $path -eq "api/save") {
        $reader = New-Object System.IO.StreamReader($request.InputStream)
        $jsonData = $reader.ReadToEnd()
        $reader.Close()
        $data = ConvertFrom-Json $jsonData
        $filePath = "$dataDir\$($data.filename).json"
        $jsonData | Set-Content -Path $filePath -Encoding utf8
        Write-Host "Saved data to $filePath"
        $response.StatusCode = 200
        [System.Text.Encoding]::UTF8.GetBytes("{'status': 'success'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
    }
    # API: Load JSON Data
    elseif ($request.HttpMethod -eq "GET" -and $path -match "api/load/(.*)") {
        $fileName = $matches[1]
        $filePath = "$dataDir\$fileName.json"
        if (Test-Path $filePath) {
            $jsonContent = Get-Content -Path $filePath -Raw
            $response.ContentType = "application/json"
            [System.Text.Encoding]::UTF8.GetBytes($jsonContent) | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        } else {
            $response.StatusCode = 404
            [System.Text.Encoding]::UTF8.GetBytes("[]") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        }
    }
    else {
        $redirectUrl = "http://localhost:$port/index.html"
        $response.Headers.Set("Location", $redirectUrl)
        $response.StatusCode = 302  # Temporary redirect
        $response.OutputStream.Close()
        continue
    }
    $response.OutputStream.Close()
}