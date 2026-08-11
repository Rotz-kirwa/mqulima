export type Attachment = {
  name: string;
  mimeType: string;
  size: number;
  base64: string;
};

export type MessageAttachment = Omit<Attachment, "base64">;

export type Message = {
  id?: string;
  role: "user" | "model";
  content: string;
  attachments?: MessageAttachment[];
  created_at?: string;
};

export type Conversation = {
  id: string;
  title: string;
  is_pinned: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type WeatherState = {
  temp?: number;
  desc?: string;
};
