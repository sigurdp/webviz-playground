import React from 'react';
import { TestWidget } from './widgets/TestWidget';
import './App.css';

const testWidget = new TestWidget();
const MyTestWidgetViewLayout = testWidget.viewLayout();
const MyTestWidgetSettingsLayout = testWidget.settingsLayout();

function App() {
  return (
    <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
      <div style={{ backgroundColor: "#eee", width: 300, height: "100vh", padding: 16, borderRight: "1px black solid", marginRight: 16 }}>
        <MyTestWidgetSettingsLayout />
      </div>
    <MyTestWidgetViewLayout />
    </div>
  );
}

export default App;
