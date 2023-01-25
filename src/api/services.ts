/*
    API Service class - could for example be created by using OpenAPI Generator
*/

const iterationsList: string[] = [
    "Iter1",
    "Iter2"
];

function vectorNamesForIteration(iterationId: string): string[] {
    return [
        "Vector_A", 
        "Vector_B", 
        "Vector_C",
        "Vector_X--" + iterationId, 
        "Vector_Y--" + iterationId, 
        "Vector_Z--" + iterationId, 
    ];
}


export class ApiService {
  public getIterationIds(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(iterationsList);
      }, 1000);
    });
  }

  public getVectorNames(iterationId: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(vectorNamesForIteration(iterationId));
      }, 2000);
    });
  }

  public getVectorData(iterationId: string, vectorName: string): Promise<number[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const iterationIdx = iterationsList.indexOf(iterationId);
        const vectorIdx = vectorNamesForIteration(iterationId).indexOf(vectorName);
        if (iterationIdx < 0 || vectorIdx < 0) {
          return reject();
        }

        const value: number = iterationIdx*100 + vectorIdx;
        const valueArr = Array<number>(5).fill(value);
        resolve(valueArr);
        
      }, 1000);
    });
  }

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
