export async function onRequest(context) {
  const response = await context.next();
  
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }
  
  const originalHtml = await response.text();
  const apiEndpoint = context.env.API_ENDPOINT || '';
  
  const envScript = `
    <script>
      window.ENV = {
        API_ENDPOINT: "${apiEndpoint}"
      };
    </script>
  `;
  
  const modifiedHtml = originalHtml.replace('</head>', `${envScript}</head>`);
  
  return new Response(modifiedHtml, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText
  });
} 