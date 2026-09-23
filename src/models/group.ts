export type Group = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GroupWithCount = Group & {
  itemCount: number;
};

export type CreateGroupInput = {
  name: string;
  description?: string | null;
};

export type UpdateGroupInput = {
  name?: string;
  description?: string | null;
};
