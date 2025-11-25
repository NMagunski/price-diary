export interface UserProfile {
  id: string;
  email: string;
  familyId?: string | null;
  createdAt: Date | null;
}
