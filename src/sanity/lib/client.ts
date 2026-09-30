import 'server-only';
import { createClient, type SanityClient } from 'next-sanity';
import { apiVersion, dataset, isSanityConfigured, projectId } from '../env';

let readClient: SanityClient | null = null;
let writeClient: SanityClient | null = null;

/** Read client. The dataset is private, so reads are authenticated and never run in the browser. */
export function getReadClient(): SanityClient | null {
  if (!isSanityConfigured) return null;
  if (!readClient) {
    const token = process.env.SANITY_API_READ_TOKEN;
    readClient = createClient({
      projectId,
      dataset,
      apiVersion,
      token,
      useCdn: false,
      perspective: 'published',
    });
  }
  return readClient;
}

export function getWriteClient(): SanityClient | null {
  if (!isSanityConfigured) return null;
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) return null;
  if (!writeClient) {
    writeClient = createClient({
      projectId,
      dataset,
      apiVersion,
      token,
      useCdn: false,
      perspective: 'raw',
    });
  }
  return writeClient;
}
