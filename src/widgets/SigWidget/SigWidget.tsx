import React, { useEffect } from "react";
import {useState} from "react";
import {useRef} from "react";
import { WebvizWidgetBase, IWebvizWidget, WidgetContext } from "../../core/base-widget";
import { ApiCallState, ApiRequestState } from "../../api/services";
/*
    A simple test implementation of a custom Webviz widget
*/

type SigWidgetSharedStates = {
    view_iterationId: string | null;
    view_baseVectorName: string | null;
    view_diffVectorName: string | null;
};

export class SigWidget extends WebvizWidgetBase<SigWidgetSharedStates> implements IWebvizWidget {

    constructor() {
        super("Sigurds Widget", {
            view_iterationId: null,
            view_baseVectorName: null,
            view_diffVectorName: null,
        });
    }


    protected viewContent(widgetCtx: WidgetContext<SigWidgetSharedStates>): () => React.ReactElement {
        return (): React.ReactElement => {
            const iterationId = widgetCtx.useState("view_iterationId");
            const baseVectorName = widgetCtx.useState("view_baseVectorName");
            const diffVectorName = widgetCtx.useState("view_diffVectorName");

            console.log(`render viewContent  iterationId=${iterationId} baseVectorName=${baseVectorName} diffVectorName=${diffVectorName}`);

            // let baseDisplayStr = "nada";
            // let diffDisplayStr = "nada";

            const baseDataCallState = widgetCtx.useApiEndpoint("getVectorData", iterationId && baseVectorName ? true : false, iterationId || "", baseVectorName || "");
            const diffDataCallState = widgetCtx.useApiEndpoint("getVectorData", iterationId && diffVectorName ? true : false, iterationId || "", diffVectorName || "");

            let baseDisplayStr = baseDataCallState.state.toString();
            if (baseDataCallState.state === ApiRequestState.FULFILLED && baseDataCallState.result) {
                baseDisplayStr = `[${baseDataCallState.result.toString()}]`;
            }

            let diffDisplayStr = diffDataCallState.state.toString();
            if (diffDataCallState.state === ApiRequestState.FULFILLED && diffDataCallState.result) {
                diffDisplayStr = `[${diffDataCallState.result.toString()}]`;
            }

            return (
                <div>
                    View spec:<br />
                    iteration id: {iterationId ? iterationId : "---"}<br />
                    base vector: {baseVectorName ? baseVectorName : "---"}<br />
                    diff vector: {diffVectorName ? diffVectorName : "---"}<br />
                    <br /><br />
                    base data: {baseDisplayStr}<br />
                    diff data: {diffDisplayStr}<br />
                </div>
            );
        };
    }


  protected settingsContent(widgetCtx: WidgetContext<SigWidgetSharedStates>): () => React.ReactElement {
    return (): React.ReactElement  => {
        console.log("render settingsContent");

        const iterationIdsCallState = widgetCtx.useApiEndpoint<"getIterationIds", string[]>("getIterationIds", true);
        const [iterationId, setIterationId] = useState("");

        const vectorNamesCallState = widgetCtx.useApiEndpoint<"getVectorNames", string[]>("getVectorNames", iterationId ? true : false, iterationId);
        const [baseVectorName, setBaseVectorName] = useState("");
        const [enableDiffCalculation, setEnableDiffCalculation] = useState(false)
        const [diffVectorName, setDiffVectorName] = useState("");

        const stashedBaseVectorName = useRef("")
        const stashedDiffVectorName = useRef("")

        const vectorNamesArr: string[] | null = Array.isArray(vectorNamesCallState.result) ? vectorNamesCallState.result : null;

        // Using effects for this stinks, right?
        useEffect(function selectDefaultIterationId() {
            console.log("selectDefaultIterationId()");
            if (iterationIdsCallState.result && iterationIdsCallState.result.length) {
                setIterationId(iterationIdsCallState.result[iterationIdsCallState.result.length - 1]);
            }
        }, [iterationIdsCallState]);

        useEffect(function selectDefaultVectorNames() {
            console.log("selectDefaultVectorNames()");
            if (vectorNamesArr && vectorNamesArr.length > 0) {
                if (vectorNamesArr.includes(stashedBaseVectorName.current)) {
                    setBaseVectorName(stashedBaseVectorName.current);
                }
                else {
                    setBaseVectorName(vectorNamesArr[0]);
                }
                if (vectorNamesArr.includes(stashedDiffVectorName.current)) {
                    setDiffVectorName(stashedDiffVectorName.current);
                }
                else {
                    setDiffVectorName(vectorNamesArr[vectorNamesArr.length - 1]);
                }
            }
        }, [vectorNamesArr]);

        // How about this??
        useEffect(function updateViewSpec() {
            //console.log(`updateViewSpec() ${iterationId}  ${baseVectorName}  ${enableDiffCalculation}  ${diffVectorName}`);
            const specIterId = iterationId ? iterationId : null;
            const specBaseVecName = (specIterId && baseVectorName) ? baseVectorName : null;
            const specDiffVecName = (specIterId && enableDiffCalculation && diffVectorName) ? diffVectorName : null;
            widgetCtx.setState("view_iterationId", specIterId);
            widgetCtx.setState("view_baseVectorName", specBaseVecName || null);
            widgetCtx.setState("view_diffVectorName", specDiffVecName || null);
        });


        function makeSelect(opts: ApiCallState<unknown>, selected: string, onChangeHandler: any) {
            if (opts.state === ApiRequestState.PENDING) {
                return <div>Loading...</div>;
            }
            if (opts.state === ApiRequestState.REJECTED) {
                return <div>Error</div>;
            }
            if (opts.state === ApiRequestState.FULFILLED) {
                return (
                    <select value={selected} onChange={onChangeHandler}>
                        {(opts.result as string[]).map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                );
            }
            return <div>No options</div>;
        }

        function handleIterationSelectionChange(event: React.ChangeEvent<HTMLSelectElement>) {
            console.log("handleIterationSelectionChange() " + event.target.value);
            setIterationId(event.target.value);
            stashedBaseVectorName.current = baseVectorName;
            stashedDiffVectorName.current = diffVectorName;
            setBaseVectorName("");
            setDiffVectorName("");
        };

        function handleBaseVectorSelectionChange(event: React.ChangeEvent<HTMLSelectElement>) {
            console.log("handleBaseVectorSelectionChange() " + event.target.value);
            setBaseVectorName(event.target.value);
        };

        function handleEnableDiffCheckboxChange(event: React.ChangeEvent<HTMLInputElement>) {
            console.log("handleEnableDiffCheckboxChange() " + event.target.checked);
            setEnableDiffCalculation(event.target.checked)
        }
    
        function handleDiffVectorSelectionChange(event: React.ChangeEvent<HTMLSelectElement>) {
            console.log("handleSelectedDiffVectorChange() " + event.target.value);
            setDiffVectorName(event.target.value);
        };

        return (
            <>
                <label>Iteration</label><br />
                {makeSelect(iterationIdsCallState, iterationId, handleIterationSelectionChange)}

                <br /><br />
                <label>Select base vector</label><br />
                {makeSelect(vectorNamesCallState, baseVectorName, handleBaseVectorSelectionChange)}

                <br /><br />
                <label>
                    <input type="checkbox" checked={enableDiffCalculation} onChange={handleEnableDiffCheckboxChange} />
                    Calculate diff
                </label>

                { enableDiffCalculation &&
                    <>
                        <br />
                        <label>Select diff vector</label><br />
                        {makeSelect(vectorNamesCallState, diffVectorName || "", handleDiffVectorSelectionChange)}
                    </>
                }
            </>
        );
    };
  }
}
