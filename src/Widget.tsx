import React from "react";
import { v4 } from "uuid";

/*
    API Service class - could for example be created by using OpenAPI Generator
*/

class ApiService {
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
}

/*
    Some type definitions to make using the API service more typesafe
*/

type ApiEndpoints = {
  [K in keyof ApiService]: {
    argumentsType: Parameters<ApiService[K]>;
    returnType: ReturnType<ApiService[K]>;
  };
};

type ApiEndpointNames = keyof ApiEndpoints;

enum ApiRequestState {
  PENDING = "pending",
  FULFILLED = "fulfilled",
  REJECTED = "rejected",
  IDLE = "idle",
}

type ApiCallState<L> = {
  state: ApiRequestState;
  result: L | null;
  error?: string;
};

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
type WidgetAction = WidgetActionsWithTypes[keyof WidgetActionsWithTypes];

/*
    Base class for a custom Webviz widget

    This does already implement a lot of logic that is common to all widgets, such as:
    - Handling of API calls
    - Handling of actions
    - Handling of settings
    - Handling of layout

*/

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
    useApiEndpoint: <K extends ApiEndpointNames, L>(endpointName: K, ...args: ApiEndpoints[K]["argumentsType"]) => ApiCallState<L>;
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
    ...args: ApiEndpoints[K]["argumentsType"]
  ) => ApiCallState<L> {
    return <K extends ApiEndpointNames, L>(
      endpoint: K,
      ...args: ApiEndpoints[K]["argumentsType"]
    ) => {
      const [state, setState] = React.useState<ApiCallState<L>>({
        state: ApiRequestState.IDLE,
        result: null,
        error: undefined,
      });

      React.useEffect(() => {
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
      }, [endpoint].concat(args));

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
}

/*
    A simple test implementation of a custom Webviz widget
*/

type TestWidgetStates = {
  selectedNumber: number;
  testmode: boolean;
};

export class TestWidget extends WebvizWidgetBase<TestWidgetStates> implements IWebvizWidget {
  constructor() {
    super("Test Widget", {
      selectedNumber: 1,
      testmode: false,
    });
    this.addAction({
      type: WidgetActionType.TOGGLE,
      shortcut: "Ctrl+T",
      tooltip: "Toggle test mode",
      onToggle: () => {
        this.setState("testmode", !this.getState("testmode"));
      },
      icon: "EdsTest",
    });
  }

  protected viewContent(widget: WidgetContext<TestWidgetStates>): () => React.ReactElement {
    return (): React.ReactElement => {
      const data = widget.useApiEndpoint("getData", "test", 1);
      const testmode = widget.useState("testmode");
      const myNumber = widget.useState("selectedNumber");

      if (testmode) {
        return <div>Test mode</div>;
      }

      if (data.state === ApiRequestState.IDLE) {
        return <div>No request sent yet</div>;
      }

      if (data.state === ApiRequestState.PENDING) {
        return <div>Loading...</div>;
      }

      if (data.state === ApiRequestState.REJECTED) {
        return <div>Error</div>;
      }

      return <div>Yeah, results!<br />Btw, your number is {myNumber}...</div>;
    };
  }

  protected settingsContent(widget: WidgetContext<TestWidgetStates>): () => React.ReactElement {
    return (): React.ReactElement  => {
        const myNumber = widget.useState("selectedNumber");
      const handleNumberChange = (
        event: React.ChangeEvent<HTMLInputElement>
      ) => {
        widget.setState("selectedNumber", Number(event.target.value));
      };
      return (
        <input
          type="number"
          value={myNumber}
          onChange={handleNumberChange}
        />
      );
    };
  }
}
