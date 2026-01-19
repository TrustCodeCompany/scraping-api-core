export interface ClientInfo {
  ruc: string,
  businessName: string,
  success: boolean,
  notifications: NotificationInfo[],
  //url: string,
  count: number
}

export interface NotificationInfo {
  title: string,
  date: String,
  read: number
}

export interface ClientData {
  ruc: string,
  businessName: string,
  secureUrl: string
}
