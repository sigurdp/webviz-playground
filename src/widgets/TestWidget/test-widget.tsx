import React from "react";
import { WebvizWidgetBase, WidgetActionType, IWebvizWidget, WidgetContext } from "../../core/base-widget";
import { ApiCallState, ApiRequestState } from "../../api/services";
/*
    A simple test implementation of a custom Webviz widget
*/

type TestWidgetStates = {
  selectedNumber: number;
  testmode: boolean;
  selectedOption: string | null;
};

export class TestWidget extends WebvizWidgetBase<TestWidgetStates> implements IWebvizWidget {
  constructor() {
    super("Test Widget", {
      selectedNumber: 1,
      testmode: false,
      selectedOption: null,
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
      const data = widget.useApiEndpoint("getData", true, "test", 1);
      const testmode = widget.useState("testmode");
      const selectedOption = widget.useState("selectedOption");

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

      return <div>Yeah, results!<br />Btw, your selected option is {selectedOption}...</div>;
    };
  }

  protected settingsContent(widget: WidgetContext<TestWidgetStates>): () => React.ReactElement {
    return (): React.ReactElement  => {
        const options = widget.useApiEndpoint("getOptions", true);
        const selectedOption = widget.useState("selectedOption");
        const moreOptions = widget.useApiEndpoint("getMoreOptions", selectedOption !== null, selectedOption || "");

        const handleOptionChange = (
            event: React.ChangeEvent<HTMLSelectElement>
        ) => {
            widget.setState("selectedOption", event.target.value);
        };

        const makeSelect = (opts: ApiCallState<unknown>, selected: string) => {
            if (opts.state === ApiRequestState.PENDING) {
                return <div>Loading...</div>;
            }
            if (opts.state === ApiRequestState.REJECTED) {
                return <div>Error</div>;
            }
            if (opts.state === ApiRequestState.FULFILLED) {
                return (
                    <select onChange={handleOptionChange}>
                        {(opts.result as string[]).map((option) => (
                            <option key={option} value={option} selected={selected === option}>
                                {option}
                            </option>
                        ))}
                    </select>
                );
            }
            return <div>No options</div>;
        }

        return (<>
            <label>Option 1</label>
            <br />
            {makeSelect(options, selectedOption || "")}
            <br />
            <label>Option 2</label>
            <br />
            {makeSelect(moreOptions, "")}
        </>);
    };
  }
}
