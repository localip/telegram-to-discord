import { Api } from 'telegram';

export type Chat = {
  forum: boolean;
} & Api.Chat;

export type Reply = {
  action: ReplyAction;
} & Api.Message;

export type ReplyAction = {
  title: string;
} & Api.TypeMessageAction;

export interface Listener {
  users?: string[];
  name: string;
  group: string;
  forum: boolean;
  webhook?: string;
  channels?: {
    name?: string;
    main?: boolean;
    webhook: string;
  }[];
}