export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}
