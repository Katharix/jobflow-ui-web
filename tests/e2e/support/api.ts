import { APIRequestContext } from '@playwright/test';

export async function authJson<T>(
  request: APIRequestContext,
  method: 'get' | 'post' | 'put' | 'delete',
  absoluteUrl: string,
  bearerToken: string,
  data?: unknown
): Promise<T> {
  const response = await request.fetch(absoluteUrl, {
    method,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json'
    },
    data
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok()) {
    throw new Error(
      `Request failed: ${method.toUpperCase()} ${absoluteUrl} -> ${response.status()} ${response.statusText()} | ${JSON.stringify(body)}`
    );
  }

  return body as T;
}

export function unwrapResult<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'value' in payload) {
    return (payload as { value: T }).value;
  }

  return payload as T;
}
