param(
    [string]$url
)

# Create a new HTTP response object
$response = New-Object System.Net.HttpListenerResponse

# Set the status code to 302 (Found) for redirection
$response.StatusCode = 302

# Set the Location header to the target URL
$response.Headers.Set("Location", $url)

# Close the response
$response.OutputStream.Close()