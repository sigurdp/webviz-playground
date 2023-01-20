import React from "react";
import { v4 } from "uuid";

import { ApiService, ApiCallState, ApiRequestState, ApiEndpointNames, ApiEndpoints } from "../api/services";

/*
    Types for actions that can be performed on a widget - those could be located in the widget's title bar

    #-------------------- [BUTTON] [X] -#
    |                                   |
    |              CONTENT              |
    |                                   |
    #-----------------------------------#

*/

export enum WidgetActionType {
  BUTTON = "button",
  SWITCH = "switch",
  TOGGLE = "toggle",
  DROPDOWN = "dropdown",
}

export type Shortcut = string;

export type WidgetActions = {
  [WidgetActionType.BUTTON]: {
    shortcut: Shortcut;
    icon: string;
    tooltip: string;
    onClick: () => void;
  };
  [WidgetActionType.SWITCH]: {
    shortcut: Shortcut;
    icon: string;
    tooltip: string;
    onToggle: (value: boolean) => void;
  };
  [WidgetActionType.TOGGLE]: {
    shortcut: Shortcut;
    icon: string;
    tooltip: string;
    onToggle: () => void;
  };
  [WidgetActionType.DROPDOWN]: {
    shortcut: Shortcut;
    icon: string;
    tooltip: string;
    options: { label: string; value: string | number }[];
    onSelected: (value: string) => void;
  };
};

type WidgetActionsWithTypes = {
  [K in keyof WidgetActions]: WidgetActions[K] & { type: K };
};
export type WidgetAction = WidgetActionsWithTypes[keyof WidgetActionsWithTypes];

/*
    Base class for a custom Webviz widget

    This does already implement a lot of logic that is common to all widgets, such as:
    - Handling of API calls
    - Handling of actions
    - Handling of settings
    - Handling of layout

*/

enum DataProcessorState { 
  IDLE = "idle",
  PENDING = "pending",
  REJECTED = "rejected",
  RESOLVED = "resolved",
}
type DataProcessor<Data> = () => { state: DataProcessorState; errorMessage?: string; data: Data | null };

type WidgetState = {
  [key: string]: unknown;
};

export interface IWebvizWidget {
  viewLayout(): React.FC;
  settingsLayout(): React.FC;
  name(): string;
}

class StateStore<S extends WidgetState> {
    private states: S;
    public lastUpdatedMs: number;
    private uuid: string;
    
    constructor(initialState: S) {
        this.states = initialState;
        this.lastUpdatedMs = Date.now();
        this.uuid = v4();
    }
    
    public getState<K extends keyof S>(name: K): S[K] {
        return this.states[name];
    }
    
    public updateState<K extends keyof S>(name: K, value: S[K]) {
        this.states = {
        ...this.states,
        [name]: value,
        };
        this.lastUpdatedMs = Date.now();

        dispatchEvent(new CustomEvent(this.getCustomEventName(name)));
    }

    public getCustomEventName<K extends keyof S>(name: K): string {
        return `${this.uuid}-${name as string}`;
    }
}

export type WidgetContext<S extends WidgetState> = {
    useApiEndpoint: <K extends ApiEndpointNames, L>(endpointName: K, condition: boolean, ...args: ApiEndpoints[K]["argumentsType"]) => ApiCallState<L>;
    useState: <K extends keyof S>(name: K) => S[K];
    setState: <K extends keyof S>(name: K, value: S[K]) => void;
};

export class WebvizWidgetBase<S extends WidgetState> implements IWebvizWidget {
  private _name: string;
  private _uuid: string;
  private _actions: WidgetAction[];
  private apiService: ApiService;
  protected stateStore: StateStore<S>;

  constructor(name: string, initialState: S) {
    this._name = name;
    this._uuid = v4();
    this._actions = [];
    this.stateStore = new StateStore<S>(initialState);

    // This should be global
    this.apiService = new ApiService();
  }

  public name(): string {
    return this._name;
  }

  public uuid(): string {
    return this._uuid;
  }

  private createContext = (): WidgetContext<S> => {
    return {
        useApiEndpoint: this.useApiEndpoint(),
        useState: this.useState(),
        setState: this.setState.bind(this),
    };
};

  public viewLayout(): () => React.ReactElement {
    return (): React.ReactElement => {
        const ViewContent = this.viewContent(this.createContext());
        return (
            <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", flexDirection: "row", padding: 8, backgroundColor: "#ccc"}}>
                    <>
                    {this.name()}
                    {this.actions()()}
                    </>
                </div>
                <div style={{padding: 8, border: "1px #ccc solid"}}>
                    <ViewContent />
                </div>
            </div>);
    };
}
    public settingsLayout(): () => React.ReactElement {
        return (): React.ReactElement => {
            const SettingsContent = this.settingsContent(this.createContext());
            return (
                <SettingsContent />
            );
        }
    }

  protected viewContent(widget: WidgetContext<S>): () => React.ReactElement {
    throw new Error("Method not implemented.");
  }

  protected settingsContent(widget: WidgetContext<S>): () => React.ReactElement {
    throw new Error("Method not implemented.");
  }

  protected actions(): () => React.ReactElement {
    return () => (
      <>
        {this._actions.map((action) => {
          if (action.type === WidgetActionType.BUTTON) {
            return <button>{action.icon}</button>;
          }
          else if (action.type === WidgetActionType.TOGGLE) {
            return <button onClick={action.onToggle}>{action.icon}</button>;
          }
          return null;
        })}
      </>
    );
  }

  protected addAction(action: WidgetAction) {
    this._actions.push(action);
  }

  protected setState(name: keyof S, value: S[keyof S]) {
    this.stateStore.updateState(name, value);
  }

    protected getState<K extends keyof S>(name: K): S[K] {
        return this.stateStore.getState(name);
    }

  protected useApiEndpoint(): <K extends ApiEndpointNames, L>(
    endpoint: K,
    condition: boolean,
    ...args: ApiEndpoints[K]["argumentsType"]
  ) => ApiCallState<L> {
    return <K extends ApiEndpointNames, L>(
      endpoint: K,
      condition = true,
      ...args: ApiEndpoints[K]["argumentsType"]
    ) => {
      const [state, setState] = React.useState<ApiCallState<L>>({
        state: ApiRequestState.IDLE,
        result: null,
        error: undefined,
      });

      React.useEffect(() => {
        if (!condition) {
          return;
        }
        setState(prevState => ({...prevState, state: ApiRequestState.PENDING, result: null, error: undefined}));
        // @ts-ignore
        const promise = this.apiService[endpoint](...args);
        promise
          .then((response: L) => {
            setState(prevState => ({...prevState, state: ApiRequestState.FULFILLED, result: response}));
          })
          .catch((error: any) => {
            setState(prevState => ({...prevState, state: ApiRequestState.REJECTED, result: null, error}));
          });
        // @ts-ignore
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [endpoint, condition].concat(args));

      return state;
    };
  }

  protected useState(): <K extends keyof S>(name: K) => S[K] { 
    const stateStore = this.stateStore;
    return <K extends keyof S>(name: K): S[K] => {
        const [state, setState] = React.useState<S[K]>(stateStore.getState(name));

        React.useEffect(() => {
            const handleStateUpdate = () => {
                const newState = stateStore.getState(name);
                setState(newState);
            };

            window.addEventListener(stateStore.getCustomEventName(name), handleStateUpdate);

            return () => {
                window.removeEventListener(stateStore.getCustomEventName(name), handleStateUpdate);
            };
        }, [name]);

        return state;
    };
  }

  protected useDataPreprocessor(): <K extends keyof InstanceType<typeof WebvizWidgetBase>>(preprocessor: (...args: Parameters<this[K]>) => ReturnType<this[K]>, ...args: Parameters<this[K]>) => DataProcessor<ReturnType<this[K]>> {
    return <K extends keyof InstanceType<typeof WebvizWidgetBase>>(preprocessor: (...args: Parameters<this[K]>) => ReturnType<this[K]>, ...args: Parameters<this[K]>): DataProcessor<ReturnType<this[K]>> => {
      const [state, setState] = React.useState<DataProcessor<ReturnType<this[K]>>>({
        state: DataProcessorState.IDLE,
        data: null,
      });

      React.useEffect(() => {
       const promise = new Promise<ReturnType<this[K]>>((resolve, reject) => {
            const result = preprocessor(...args);
            resolve(result);
      }).then((data: ReturnType<this[K]>) => {
        setState(prevState => ({...prevState, state: DataProcessorState.RESOLVED, data}));
      }).catch((error: any) => {
        setState(prevState => ({...prevState, state: DataProcessorState.REJECTED, data: null}));
      });
    }, [preprocessor, ...args]);

    return state;
  }
}

