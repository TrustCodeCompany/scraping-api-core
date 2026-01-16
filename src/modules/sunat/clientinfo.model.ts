export interface ClientInfo {
  ruc: string,
  razon_social: string,
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
  razon_social: string,
  secure_url: string
}
