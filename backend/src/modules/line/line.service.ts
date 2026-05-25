import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  language?: string;
}

export type LineOutboundMessage =
  | { type: 'text'; text: string }
  | { type: 'image'; originalContentUrl: string; previewImageUrl: string }
  | { type: 'sticker'; packageId: string; stickerId: string };

@Injectable()
export class LineService {
  private readonly logger = new Logger(LineService.name);
  private readonly api: AxiosInstance;
  private readonly dataApi: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.api = axios.create({
      baseURL: this.config.get<string>('line.apiBaseUrl'),
      timeout: 15_000,
    });
    this.dataApi = axios.create({
      baseURL: this.config.get<string>('line.dataApiBaseUrl'),
      timeout: 30_000,
    });
  }

  private headers(token: string) {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async getProfile(accessToken: string, lineUserId: string): Promise<LineProfile | null> {
    try {
      const { data } = await this.api.get<LineProfile>(`/v2/bot/profile/${lineUserId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return data;
    } catch (err: any) {
      this.logger.warn(`getProfile failed for ${lineUserId}: ${err?.response?.status ?? err.message}`);
      return null;
    }
  }

  async pushMessage(accessToken: string, to: string, messages: LineOutboundMessage[]) {
    const payload = { to, messages };
    const { status, data } = await this.api.post('/v2/bot/message/push', payload, {
      headers: this.headers(accessToken),
      validateStatus: () => true,
    });
    return { status, data, payload };
  }

  async replyMessage(accessToken: string, replyToken: string, messages: LineOutboundMessage[]) {
    const payload = { replyToken, messages };
    const { status, data } = await this.api.post('/v2/bot/message/reply', payload, {
      headers: this.headers(accessToken),
      validateStatus: () => true,
    });
    return { status, data, payload };
  }

  async downloadContent(accessToken: string, messageId: string): Promise<{ buffer: Buffer; contentType: string | undefined }> {
    const res = await this.dataApi.get(`/v2/bot/message/${messageId}/content`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: 'arraybuffer',
    });
    return {
      buffer: Buffer.from(res.data),
      contentType: res.headers['content-type'] as string | undefined,
    };
  }
}
