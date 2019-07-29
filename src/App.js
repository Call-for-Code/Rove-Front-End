import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import 'antd/dist/antd.css';
import Map from './Map';
import { Tabs } from 'antd';
import { GatherPane } from './GatherPane';
import { OrganizePane } from './OrganizePane';
import kmeans from 'node-kmeans';
const { TabPane } = Tabs;

export const K_PARTITIONS = 15;

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

  const fulldata = useMemo(
    () =>
      data.map(record => ({
        ...record,
        overall: {
          priority: calculateOverallPriority(record)
        }
      })),
    [data]
  );

  const fulldataLnglats = useMemo(
    () =>
      fulldata.map(record => [
        record.location_information.geometry.location.lng,
        record.location_information.geometry.location.lat
      ]),
    [fulldata]
  );

  const [kmeansResult, setKmeansResult] = useState('');
  useEffect(() => {
    if(!fulldataLnglats || fulldataLnglats.length === 0){
      return;
    }
    kmeans.clusterize(fulldataLnglats, {k: K_PARTITIONS}, (err,res) => {
      if (err) console.error(err);
      else setKmeansResult(res);
    });
  }, [fulldataLnglats]);


  const [selectedPt, setSelectedPt] = useState('');

  const handleSelectedPt = useCallback(pt => setSelectedPt(pt), []);

  return (
    <div className="App">
      <div className="menu">
        <h1 className="header">Emergency Dashboard</h1>

        <Tabs className="tabs" defaultActiveKey={tab} onChange={setTab}>
          <TabPane className="tab-pane" tab="1. Visualize" key="1">
            <GatherPane
              fulldata={fulldata}
              handleSelectedPt={handleSelectedPt}
              selectedPt={selectedPt}
            />
          </TabPane>
          <TabPane className="tab-pane" tab="2. Organize" key="2">
            <OrganizePane
              fulldata={fulldata}
              fulldataLngLats={fulldataLnglats}
              kmeansResult={kmeansResult}
            />
          </TabPane>
          <TabPane className="tab-pane" tab="3. Respond" key="3">
            Content of Tab Pane 3
          </TabPane>
        </Tabs>
      </div>
      <Map
        fulldata={fulldata}
        fulldataLnglats={fulldataLnglats}
        handleSelectedPt={handleSelectedPt}
        kmeansResult={kmeansResult}
        tab={tab}
      />
    </div>
  );
}

export default App;
