export type SmsStatus =
  | 'created'
  | 'queued'
  | 'sent_to_provider'
  | 'delivered'
  | 'failed'
  | 'undeliverable';

export interface OutboundSmsRequest {
  internalMessageId: string;
  to: string;
  body: string;
  attempt?: number;
  meta?: {
    context?: string;
    classroomId?: string;
  };
}

export interface OutboundSmsResult {
  internalMessageId: string;
  to: string;
  status: SmsStatus;
  provider: string;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface SmsProviderInterface {
  sendSms(message: OutboundSmsRequest): Promise<OutboundSmsResult>;
}
