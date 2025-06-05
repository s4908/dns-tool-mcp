import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import dns from 'node-dns';

const server = new FastMCP({
  name: 'DNS MCP Server',
  version: '1.0.0'
});

server.addTool({
  name: 'dnsLookup',
  description: 'Lookup A records for a domain',
  parameters: z.object({
    domain: z.string().describe('Domain name to query'),
    dns: z.string().optional().describe('DNS server to use, default 8.8.8.8')
  }),
  execute: async ({ domain, dns: dnsServer = '8.8.8.8' }) => {
    return await new Promise((resolve, reject) => {
      const question = dns.Question({ name: domain, type: 'A' });
      const req = dns.Request({
        question,
        server: { address: dnsServer, port: 53, type: 'udp' },
        timeout: 2000
      });
      const records = [];
      req.on('timeout', () => reject(new Error('DNS request timed out')));
      req.on('message', (err, answer) => {
        if (err) return; // ignore per-record errors
        answer.answer.forEach((a) => {
          if (a.address) records.push(a.address);
        });
      });
      req.on('end', () => resolve(records.join(', ')));
      req.send();
    });
  }
});

server.start({
  transportType: 'httpStream',
  httpStream: { port: 8080 }
});
