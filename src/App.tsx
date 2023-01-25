import React from 'react';
// import { TestWidget } from './widgets/TestWidget';
import { SigWidget } from './widgets/SigWidget';
import './App.css';

// const testWidget = new TestWidget();
// const MyTestWidgetViewLayout = testWidget.viewLayout();
// const MyTestWidgetSettingsLayout = testWidget.settingsLayout();

const sigWidget = new SigWidget();
const SigWidgetViewLayout = sigWidget.viewLayout();
const SigWidgetSettingsLayout = sigWidget.settingsLayout();


function App() {
  return (
    <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
      <div style={{ backgroundColor: "#eee", width: 300, height: "100vh", padding: 16, borderRight: "1px black solid", marginRight: 16 }}>
        <SigWidgetSettingsLayout />
        {/* <hr />
        <MyTestWidgetSettingsLayout /> */}
      </div>
    <SigWidgetViewLayout />
    {/* <MyTestWidgetViewLayout /> */}
    </div>
  );
}

export default App;
