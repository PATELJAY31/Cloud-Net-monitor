import { z } from 'zod';

const networkInterfaceSchema = z.object({
  name: z.string().trim().max(80).optional(),
  ipAddress: z.string().trim().max(45).optional(),
  macAddress: z.string().trim().max(32).optional(),
  family: z.enum(['IPv4', 'IPv6', 'unknown']).default('unknown'),
});

export const agentRegisterBodySchema = z.object({
  name: z.string().trim().min(2).max(100),
  hostname: z.string().trim().min(1).max(120).toLowerCase(),
  ipAddress: z.string().trim().min(3).max(45),
  publicIpAddress: z.string().trim().max(45).optional(),
  operatingSystem: z.string().trim().min(1).max(120),
  label: z.string().trim().max(120).optional(),
  networkInterfaces: z.array(networkInterfaceSchema).max(20).default([]),
});

export const heartbeatBodySchema = z.object({
  status: z.enum(['online', 'degraded']).default('online'),
  hostname: z.string().trim().max(120).optional(),
  ipAddress: z.string().trim().max(45).optional(),
  operatingSystem: z.string().trim().max(120).optional(),
});
