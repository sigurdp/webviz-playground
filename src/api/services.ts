/*
    API Service class - could for example be created by using OpenAPI Generator
*/

export class ApiService {
  public getData(type: string, value: number): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({ type, data: "Hello World" });
      }, 3000);
    });
  }

  public getUsers(type: string): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({ type, data: "Hello World" });
      }, 3000);
    });
  }

  public getOptions(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(["Option 1", "Option 2", "Option 3"]);
      }, 3000);
    });
  }

  public getMoreOptions(option: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve([`${option} 1`, `${option} 2`, `${option} 3`]);
      }, 3000);
    });
  }
}

/*
    Some type definitions to make using the API service more typesafe
*/

export type ApiEndpoints = {
  [K in keyof ApiService]: {
    argumentsType: Parameters<ApiService[K]>;
    returnType: ReturnType<ApiService[K]>;
  };
};

export type ApiEndpointNames = keyof ApiEndpoints;

export enum ApiRequestState {
  PENDING = "pending",
  FULFILLED = "fulfilled",
  REJECTED = "rejected",
  IDLE = "idle",
}

export type ApiCallState<L> = {
  state: ApiRequestState;
  result: L | null;
  error?: string;
};
