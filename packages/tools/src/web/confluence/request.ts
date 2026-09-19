import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ConfluenceAuth } from './types.js';

type ConfluenceResponseData = AxiosResponse['data'];

interface ConfluenceResponse {
  data: ConfluenceResponseData;
  siteUrl: string;
}

export interface ConfluenceErrorDescription {
  message: string | undefined;
  status: number | undefined;
}

export interface ConfluenceRequest {
  get(path: string, config?: AxiosRequestConfig): Promise<ConfluenceResponse>;
  post(path: string, data: unknown, config?: AxiosRequestConfig): Promise<ConfluenceResponse>;
  put(path: string, data: unknown, config?: AxiosRequestConfig): Promise<ConfluenceResponse>;
  describeError(error: unknown): ConfluenceErrorDescription;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function describeError(error: unknown): ConfluenceErrorDescription {
  const errorRecord = isRecord(error) ? error : undefined;
  const response = isRecord(errorRecord?.response) ? errorRecord.response : undefined;
  const responseData = isRecord(response?.data) ? response.data : undefined;
  const providerMessage =
    typeof responseData?.message === 'string' ? responseData.message : undefined;
  const errorMessage = typeof errorRecord?.message === 'string' ? errorRecord.message : undefined;

  return {
    message: providerMessage || errorMessage,
    status: typeof response?.status === 'number' ? response.status : undefined,
  };
}

function authenticatedConfig(
  auth: ConfluenceAuth,
  config: AxiosRequestConfig = {}
): AxiosRequestConfig {
  const credentials = Buffer.from(`${auth.ATLASSIAN_EMAIL}:${auth.ATLASSIAN_API_KEY}`).toString(
    'base64'
  );

  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Basic ${credentials}`,
    },
  };
}

export function createConfluenceRequest(getAuth: () => ConfluenceAuth): ConfluenceRequest {
  return {
    async get(path, config = {}) {
      const auth = getAuth();
      const response = await axios.get(
        `${auth.ATLASSIAN_SITE_URL}${path}`,
        authenticatedConfig(auth, config)
      );
      return { data: response.data, siteUrl: auth.ATLASSIAN_SITE_URL };
    },

    async post(path, data, config = {}) {
      const auth = getAuth();
      const response = await axios.post(
        `${auth.ATLASSIAN_SITE_URL}${path}`,
        data,
        authenticatedConfig(auth, config)
      );
      return { data: response.data, siteUrl: auth.ATLASSIAN_SITE_URL };
    },

    async put(path, data, config = {}) {
      const auth = getAuth();
      const response = await axios.put(
        `${auth.ATLASSIAN_SITE_URL}${path}`,
        data,
        authenticatedConfig(auth, config)
      );
      return { data: response.data, siteUrl: auth.ATLASSIAN_SITE_URL };
    },

    describeError,
  };
}
