import React, { useEffect, useState } from 'react';
import './App.css';
import 'antd/dist/antd.css';
import Map from './Map';
import { Tabs } from 'antd';
import { GatherPane } from './GatherPane';
const { TabPane } = Tabs;

function App() {
  const [tab, setTab] = useState('1');

  const calculateOverallPriority = record =>
    record.health.priority * 0.7 +
    record.food.priority * 0.2 +
    record.hygiene.priority * 0.1;

  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const result = await (await fetch(
        process.env.PUBLIC_URL + '/fulldata.json'
      )).json();
      setData(result);
    }

    fetchData();
  }, []);

  const fulldataWithOverall = data.map(record => ({
    ...record,
    overall: {
      priority: calculateOverallPriority(record)
    }
  }));

  const [selectedPt, setSelectedPt] = useState("");

  return (
    <div className="App">
      <div className="menu">
        <h1 className="header">Emergency Dashboard</h1>

        <Tabs className="tabs" defaultActiveKey={tab} onChange={setTab}>
          <TabPane className="tabPane" tab="1. Visualize" key="1">
            <GatherPane
              fulldata={fulldataWithOverall}
              selectedPt={selectedPt}/>
          </TabPane>
          <TabPane tab="2. Organize" key="2">
            Content of Tab Pane 2
          </TabPane>
          <TabPane tab="3. Respond" key="3">
            Content of Tab Pane 3
          </TabPane>
        </Tabs>
      </div>
      <Map
        fulldata={fulldataWithOverall}
        handleSelectedPt={setSelectedPt}
      />
    </div>
  );
}

export default App;
