import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import DNS2 from 'dns2';

const server = new FastMCP({
  name: 'DNS MCP Server',
  version: '1.0.0'
});

const recordTypes = ['A', 'AAAA', 'MX', 'CNAME', 'TXT', 'NS'] as const;
type RecordType = typeof recordTypes[number];

server.addTool({
  name: 'dnsLookup',
  description: 'Lookup DNS records',
  parameters: z.object({
    domain: z.string().describe('Domain name to query'),
    dns: z.string().optional().describe('DNS server to use, default 8.8.8.8'),
    type: z.enum(recordTypes).default('A').describe('Record type to query')
  }),
  execute: async ({ domain, dns: dnsServer = '8.8.8.8', type }) => {
    const resolver = new DNS2({ nameServers: [dnsServer] });
    const recordType = type.toUpperCase() as RecordType;
    let response;

    switch (recordType) {
      case 'AAAA':
        response = await resolver.resolveAAAA(domain);
        break;
      case 'MX':
        response = await resolver.resolveMX(domain);
        break;
      case 'CNAME':
        response = await resolver.resolveCNAME(domain);
        break;
      case 'TXT':
        response = await resolver.resolve(domain, 'TXT');
        break;
      case 'NS':
        response = await resolver.resolve(domain, 'NS');
        break;
      case 'A':
      default:
        response = await resolver.resolveA(domain);
        break;
    }

    const records: string[] = [];
    for (const ans of response.answers) {
      if ('address' in ans && ans.address) {
        records.push(ans.address as string);
      } else if (recordType === 'AAAA' && 'address' in ans && ans.address) {
        records.push(ans.address as string);
      } else if (recordType === 'MX' && 'exchange' in ans) {
        records.push(ans.exchange as string);
      } else if (recordType === 'CNAME' && 'domain' in ans) {
        records.push(ans.domain as string);
      } else if (recordType === 'TXT' && 'data' in ans) {
        const data = (ans as any).data;
        if (Array.isArray(data)) {
          records.push(data.join(''));
        } else {
          records.push(String(data));
        }
      } else if (recordType === 'NS' && 'ns' in ans) {
        records.push(ans.ns as string);
      }
    }

    return records.join(', ');
  }
});

server.start({
  transportType: 'httpStream',
  httpStream: { port: 8080 }
});
