export enum Role {
  Owner = 'owner',
  Admin = 'admin',
  Supervisor = 'supervisor',
  Agent = 'agent',
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.Owner]: 4,
  [Role.Admin]: 3,
  [Role.Supervisor]: 2,
  [Role.Agent]: 1,
};
