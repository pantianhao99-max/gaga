param(
  [int]$Port = 8109
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootFull = [System.IO.Path]::GetFullPath($root)
$listener = [System.Net.HttpListener]::new()
$prefix = "http://localhost:$Port/"

$listener.Prefixes.Add($prefix)

try {
  $listener.Start()
}
catch {
  try {
    $status = Invoke-WebRequest -UseBasicParsing $prefix -TimeoutSec 2 | Select-Object -ExpandProperty StatusCode
    if ($status -eq 200) {
      Write-Host "Preview already running at $prefix"
      exit 0
    }
  }
  catch {
  }

  throw
}

Write-Host "Serving $rootFull at $prefix"

$contentTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg" = "image/svg+xml"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".gif" = "image/gif"
  ".ico" = "image/x-icon"
  ".txt" = "text/plain; charset=utf-8"
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    try {
      $relativePath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath.TrimStart("/"))

      if ([string]::IsNullOrWhiteSpace($relativePath)) {
        $relativePath = "index.html"
      }

      $candidatePath = Join-Path $rootFull $relativePath
      $fullPath = [System.IO.Path]::GetFullPath($candidatePath)

      if (-not $fullPath.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
        $response.StatusCode = 403
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("Forbidden")
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
        continue
      }

      if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
        $response.StatusCode = 404
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
        continue
      }

      $extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
      $response.ContentType = $contentTypes[$extension]
      if (-not $response.ContentType) {
        $response.ContentType = "application/octet-stream"
      }

      $bytes = [System.IO.File]::ReadAllBytes($fullPath)
      $response.StatusCode = 200
      $response.ContentLength64 = $bytes.Length
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    catch {
      $response.StatusCode = 500
      $bytes = [System.Text.Encoding]::UTF8.GetBytes("Internal Server Error")
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    finally {
      $response.OutputStream.Close()
    }
  }
}
finally {
  $listener.Stop()
  $listener.Close()
}
