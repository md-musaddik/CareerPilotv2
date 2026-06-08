import type { User } from "firebase/auth";
import { apiConfig } from "@/config/api";

type ApiClientOptions = {
  user: User | null;
};

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

async function readApiError(response: Response): Promise<Error> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    return new Error(payload.error?.message || `Request failed with status ${response.status}.`);
  } catch {
    return new Error(`Request failed with status ${response.status}.`);
  }
}

export function createApiClient({ user }: ApiClientOptions) {
  async function getAuthHeaders(): Promise<HeadersInit> {
    if (!user) {
      throw new Error("You must be signed in to use this action.");
    }

    const token = await user.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async function requestJson<TResponse>(path: string, options: RequestInit = {}): Promise<TResponse> {
    const headers = new Headers(options.headers);
    const authHeaders = await getAuthHeaders();

    for (const [key, value] of Object.entries(authHeaders)) {
      headers.set(key, value);
    }

    if (options.body && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${apiConfig.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as TResponse;
  }

  async function requestForm<TResponse>(path: string, formData: FormData): Promise<TResponse> {
    return requestJson<TResponse>(path, {
      body: formData,
      method: "POST",
    });
  }

  return {
    get: <TResponse>(path: string) => requestJson<TResponse>(path),
    patch: <TResponse>(path: string, body: unknown) =>
      requestJson<TResponse>(path, {
        body: JSON.stringify(body),
        method: "PATCH",
      }),
    postForm: requestForm,
  };
}

