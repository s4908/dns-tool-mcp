import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import DNS2 from 'dns2';

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
    const resolver = new DNS2({ nameServers: [dnsServer] });
    const response = await resolver.resolveA(domain);
    const records: string[] = [];
    for (const ans of response.answers) {
      if ('address' in ans && ans.address) {
        records.push(ans.address as string);
      }
    }
    return records.join(', ');
  }
});

server.start({
  transportType: 'httpStream',
  httpStream: { port: 8080 }
});
