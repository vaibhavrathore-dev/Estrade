from starlette.responses import JSONResponse

class UploadBodyLimit:
    """Cap multipart bodies before Starlette can spool an unbounded upload."""
    def __init__(self, app, limit=34 * 1024 * 1024):
        self.app, self.limit = app, limit

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            return await self.app(scope, receive, send)
        headers = dict(scope['headers'])
        try:
            length = int(headers.get(b'content-length', b'0'))
        except ValueError:
            return await JSONResponse({'detail': 'Invalid Content-Length'}, status_code=400)(scope, receive, send)
        if length > self.limit:
            return await JSONResponse({'detail': 'Request body exceeds 34 MiB'}, status_code=413)(scope, receive, send)
        total, exceeded = 0, False
        async def bounded_receive():
            nonlocal total, exceeded
            message = await receive()
            total += len(message.get('body', b''))
            if total > self.limit:
                exceeded = True
                # Stop multipart parsing and release its temporary files.
                from starlette.formparsers import MultiPartException
                raise MultiPartException('Request body exceeds 34 MiB')
            return message
        async def bounded_send(message):
            if exceeded and message['type'] == 'http.response.start':
                message['status'] = 413
            await send(message)
        await self.app(scope, bounded_receive, bounded_send)
