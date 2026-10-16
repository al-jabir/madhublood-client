export interface ApiUser {
  id: string;
  name: string;
  phone: string;
  verified: boolean;
  roles: string[];
  notificationConsent: boolean;
}
export interface SessionResponse {
  user: ApiUser;
  csrf: string;
}
export interface Acknowledgment {
  message: string;
}
export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
}
export interface Items<T> {
  items: T[];
  nextCursor?: string | null;
  total?: number;
}
export interface DonorCard {
  id: string;
  name: string;
  bloodGroup: string;
  area: string;
  available: boolean;
  verified: boolean;
}
export interface DonorProfile {
  _id: string;
  user: string;
  displayName: string;
  bloodGroup: string;
  area: string;
  available: boolean;
  verified: boolean;
  directoryConsent: boolean;
  contactConsent: boolean;
  notificationConsent: boolean;
  lastDonation?: string;
}
export interface BloodRequest {
  id: string;
  _id?: string;
  owner?: string;
  representative?: string;
  contact?: string;
  bloodGroup: string;
  component: string;
  units: number;
  hospital: string;
  area: string;
  requiredAt: string;
  urgency: string;
  status: string;
  createdAt: string;
  instructions?: string;
  contactConsent?: boolean;
}
export interface DonorResponse {
  id: string;
  response: string;
  name?: string;
  phone?: string;
}
export interface DonationRecord {
  _id: string;
  date: string;
  hospital: string;
}
export interface InAppNotification {
  _id: string;
  text: string;
  read: boolean;
}
export interface ModerationQueue {
  requests: BloodRequest[];
  donors: DonorProfile[];
}
export interface ManagedUser {
  _id: string;
  name: string;
  phone: string;
  roles: string[];
  areas: string[];
  verified: boolean;
}
export interface LocationRecord {
  _id: string;
  name: string;
  kind: string;
  sourceUrl: string;
  verifiedAt: string;
}
export interface AuditRecord {
  _id: string;
  action: string;
  createdAt: string;
  target: string;
}
export interface CaseRecord {
  _id: string;
  status: string;
  reason?: string;
  message?: string;
}
export type OperationalMetrics = {
  donors: number;
  available: number;
  active: number;
  completed: number;
};
