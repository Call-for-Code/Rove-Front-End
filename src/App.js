import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import 'antd/dist/antd.css';
import Map from './Map';
import { Tabs } from 'antd';
import { GatherPane } from './GatherPane';
import { OrganizePane } from './OrganizePane';
import kmeans from 'node-kmeans';
import { RespondPane } from './RespondPane';
import { ErrorBoundary } from './ErrorBoundary';
import localforage from 'localforage';
import logo from './rove_logo.png';
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

  const fulldataLngLats = useMemo(
    () =>
      fulldata.map(record => [
        record.location_information.geometry.location.lng,
        record.location_information.geometry.location.lat
      ]),
    [fulldata]
  );

  const [actualClusters, setActualClusters] = useState(15);
  const [kmeansResult, setKmeansResult] = useState('');
  useEffect(() => {
    if (!fulldataLngLats || fulldataLngLats.length === 0) {
      return;
    }
    kmeans.clusterize(fulldataLngLats, { k: actualClusters }, (err, res) => {
      if (err) console.error(err);
      else setKmeansResult(res);
    });
  }, [fulldataLngLats, actualClusters]);
  const fullclusters = useMemo(
    () =>
      kmeansResult
        ? kmeansResult.map(cluster => {
            let overallPriority = 0;
            let healthPriority = 0;
            let foodPriority = 0;
            let hygienePriority = 0;
            let reports = [];
            cluster.clusterInd.forEach(ind => {
              const report = fulldata[ind];
              overallPriority += report.overall.priority;
              healthPriority += report.health.priority;
              foodPriority += report.food.priority;
              hygienePriority += report.hygiene.priority;
              reports.push(report);
            });
            return {
              centroid: cluster.centroid,
              reports: reports,
              overallPriority: overallPriority / reports.length,
              healthPriority: healthPriority / reports.length,
              foodPriority: foodPriority / reports.length,
              hygienePriority: hygienePriority / reports.length
            };
          })
        : [],
    [fulldata, kmeansResult]
  );

  const [selectedPt, setSelectedPt] = useState('');
  const handleSelectedPt = useCallback(pt => setSelectedPt(pt), []);

  const [selectedCluster, setSelectedCluster] = useState(null);
  const handleSelectedCluster = useCallback(
    cluster => setSelectedCluster(cluster),
    []
  );

  const [firestations, setFirestations] = useState(null);
  useEffect(() => {
    async function fetchData() {
      let result = await (await fetch(
        process.env.PUBLIC_URL + '/firestations.json'
      )).json();
      result.features = result.features.filter(station => !!station.properties);
      setFirestations(result);
    }
    fetchData();
  }, []);

  const [selectedFirestation, setSelectedFirestation] = useState(null);
  const handleSelectedFirestation = useCallback(
    firestation => setSelectedFirestation(firestation),
    []
  );

  const SPLIT = 5;
  const [buildings, setBuildings] = useState(null);
  const [startBuildings, setStartBuildings] = useState(false);
  const handleTabChange = (tab) => {
    if(tab==="3"){
      setStartBuildings(true);
    }
    setTab(tab);
  };
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    async function fetchData() {
      let cached = await localforage.getItem('buildings');
      if (cached) {
        cached.features = [];
        for (let i = 0; i < SPLIT; i++) {
          let featuresSlice = await localforage.getItem(`features-${i}`);
          cached.features = cached.features.concat(featuresSlice);
        }
        setBuildings(cached);
        return;
      }

      let result = await (await fetch(
        'https://storage.googleapis.com/ibm-frontend/buildings.geojson',
        { cache: 'force-cache' }
      )).json();
      setBuildings(result);

      const cache = {
        ...result,
        features: null
      };
      localforage.setItem('buildings', cache);
      const length = result.features.length;
      for (let i = 0; i < SPLIT; i++) {
        const end = i === SPLIT - 1 ? length : ((i + 1) * length) / SPLIT;
        const featuresSlice = result.features.slice((i * length) / SPLIT, end);
        localforage.setItem(`features-${i}`, featuresSlice);
      }
    }
    fetchData();
  }, [startBuildings]);

  const [roads, setRoads] = useState(null);
  useEffect(() => {
    async function fetchData() {
      let result = await (await fetch(
        process.env.PUBLIC_URL + '/roads.geojson'
      )).json();
      setRoads(result);
    }
    fetchData();
  }, []);

  const [route, setRoute] = useState(null);
  useEffect(() => {
    if (tab === '3' && selectedFirestation && selectedCluster) {
      async function fetchData() {
        const result = await fetch(
          `https://ligma.mybluemix.net/api/route/` +
            `?start=${selectedFirestation.geometry.coordinates[1]},${
              selectedFirestation.geometry.coordinates[0]
            }` +
            `&end=${selectedCluster.centroid[1]},${
              selectedCluster.centroid[0]
            }`,
          {
            mode: 'cors'
          }
        );

        const resJson = await result.json();

        const pathData = resJson.route.map(str => {
          const arr = str.split(',').map(inStr => parseFloat(inStr));
          return [arr[1], arr[0], 20];
        });
        setRoute(pathData);
      }
      fetchData();
    }
  }, [tab, selectedFirestation, selectedCluster]);

  return (
    <div className="App">
      <div className="menu">
        <h1 className="header">
          <img src={logo} className="logo" />
          ROVE
        </h1>

        <Tabs className="tabs" defaultActiveKey={tab} onChange={handleTabChange}>
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
              fulldataLngLats={fulldataLngLats}
              fullclusters={fullclusters}
              selectedCluster={selectedCluster}
              handleSelectedCluster={handleSelectedCluster}
              handleActualClusters={setActualClusters}
            />
          </TabPane>
          <TabPane className="tab-pane" tab="3. Respond" key="3">
            <RespondPane
              fulldata={fulldata}
              fulldataLngLats={fulldataLngLats}
              fullclusters={fullclusters}
              firestations={firestations}
              selectedFirestation={selectedFirestation}
              handleSelectedFirestation={handleSelectedFirestation}
              selectedCluster={selectedCluster}
              handleSelectedCluster={handleSelectedCluster}
            />
          </TabPane>
        </Tabs>
      </div>
      <Map
        fulldata={fulldata}
        fulldataLngLats={fulldataLngLats}
        fullclusters={fullclusters}
        selectedPt={selectedPt}
        handleSelectedPt={handleSelectedPt}
        tab={tab}
        firestations={firestations}
        route={route}
        handleSelectedFirestation={handleSelectedFirestation}
        handleSelectedCluster={handleSelectedCluster}
        buildings={buildings}
        kmeansResult={kmeansResult}
        roads={roads}
      />
    </div>
  );
}

class AppWrapper extends React.Component {
  render() {
    return (
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  }
}

export default AppWrapper;
