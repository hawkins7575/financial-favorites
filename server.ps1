# PowerShell REST API Server for Financial Favorites

$port = 8085
$dbFile = "database.json"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://*:$port/")
$listener.Start()
Write-Host "Server started on http://localhost:$port" -ForegroundColor Cyan

function Send-Response($context, $content, $contentType = "application/json", $statusCode = 200) {
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
    $context.Response.StatusCode = $statusCode
    $context.Response.ContentType = "$contentType; charset=utf-8"
    $context.Response.ContentLength64 = $buffer.Length
    $context.Response.OutputStream.Write($buffer, 0, $buffer.Length)
    $context.Response.Close()
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $path = $request.Url.LocalPath

    if ($path -eq "/api/data" -and $request.HttpMethod -eq "GET") {
        if (Test-Path $dbFile) {
            $data = Get-Content $dbFile -Raw -Encoding utf8
            Send-Response $context $data
        } else {
            Send-Response $context "{}"
        }
    }
    elseif ($path -eq "/api/data" -and $request.HttpMethod -eq "POST") {
        $reader = New-Object System.IO.StreamReader($request.InputStream)
        $body = $reader.ReadToEnd()
        $body | Out-File $dbFile -Encoding utf8
        Send-Response $context '{"status":"success"}'
    }
    elseif ($path -eq "/api/fetch-meta" -and $request.HttpMethod -eq "GET") {
        $url = $request.QueryString["url"]
        try {
            $page = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UserAgent "Mozilla/5.0"
            $title = ""
            if ($page.Content -match "<title>(.*?)</title>") { $title = $Matches[1] }
            $desc = ""
            if ($page.Content -match '<meta name="description" content="(.*?)"') { $desc = $Matches[1] }
            
            $json = @{ title = $title; description = $desc } | ConvertTo-Json
            Send-Response $context $json
        } catch {
            Send-Response $context '{"error":"failed"}' -statusCode 500
        }
    }
    else {
        # Serve static files
        $filePath = Join-Path (Get-Location) $path.Replace("/", "\").TrimStart("\")
        if ($path -eq "/") { $filePath = Join-Path (Get-Location) "index.html" }
        
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath)
            $mime = switch ($ext) {
                ".html" { "text/html" }
                ".css"  { "text/css" }
                ".js"   { "application/javascript" }
                ".json" { "application/json" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                default { "application/octet-stream" }
            }
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $context.Response.ContentType = $mime
            $context.Response.ContentLength64 = $content.Length
            $context.Response.OutputStream.Write($content, 0, $content.Length)
            $context.Response.Close()
        } else {
            Send-Response $context "Not Found" -statusCode 404
        }
    }
}
