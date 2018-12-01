# http-chunks
Simple http server created to test chunked transfer encoding issues

Starts web server listening on port 3000.
When requested with "/" path, returns list of available endpoints that behave differently:

- /dropBeforeEndCacheable - cacheable headers, sends chunks in 0.1s interval for 2s, then closes connection after 1100ms
- /correctChunksCacheable - cacheable headers, sends chunks in 0.1s interval for 2s, then waits 5s, sends final chunk keeps connection for 1100s and closes it
- /dropBeforeEndNonCacheable - like above, non cacheable headers
- /correctChunksNonCacheable - like above, non cacheable headers
