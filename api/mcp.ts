export default function handler(req: any, res: any) {
  // CORS Headers for Gemini / Spark
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle MCP initialize & JSON-RPC 2.0 requests
  if (req.method === 'POST') {
    const { method, id } = req.body || {};

    if (method === 'initialize') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id: id ?? 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'Lions Karate Club Pune MCP',
            version: '1.0.0'
          }
        }
      });
    }

    if (method === 'tools/list') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id: id ?? 1,
        result: {
          tools: [
            {
              name: 'get_dojo_branches',
              description: 'Get training dojo details in Pune (Narhe Manaji Nagar)',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            },
            {
              name: 'get_batch_schedules',
              description: 'Get daily training batch schedules and age categories',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            }
          ]
        }
      });
    }

    if (method === 'tools/call') {
      const { name } = req.body.params || {};
      if (name === 'get_dojo_branches') {
        return res.status(200).json({
          jsonrpc: '2.0',
          id: id ?? 1,
          result: {
            content: [
              {
                type: 'text',
                text: 'Location: Narhe Manaji Nagar Dojo, Pune (Head Coach: Maruti Sir, 2nd Dan Black Belt).'
              }
            ]
          }
        });
      }
    }

    return res.status(200).json({
      jsonrpc: '2.0',
      id: id ?? 1,
      result: {}
    });
  }

  // Server-Sent Events (SSE) GET endpoint for MCP handshakes
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write(`event: endpoint\ndata: /api/mcp\n\n`);
}
