# http-chunks
Simple http server created to test chunked transfer encoding issues

Starts web server listening on port 3000. When requested with "/" path, sets 1100ms timeout on socket, sends two short chunks in response with interval of 1s and then waits 5s to end response.
