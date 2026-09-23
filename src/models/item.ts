export type Item = {
  id: number;
  typeId: number;
  title: string;
  content: string | null;
  importance: number | null;
  urgency: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ItemWithType = Item & {
  typeName: string;
};

export type CreateItemInput = {
  typeId: number;
  title: string;
  content?: string | null;
  importance?: number | null;
  urgency?: number | null;
  status?: string;
};

export type UpdateItemInput = {
  title?: string;
  content?: string | null;
  typeId?: number;
  importance?: number | null;
  urgency?: number | null;
  status?: string;
};
