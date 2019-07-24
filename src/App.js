import React, { useEffect, useState } from 'react';
import './App.css';
import 'antd/dist/antd.css';

import Map from './Map';

import { Tabs, Icon, Select, List } from 'antd';
import * as Icons from './icons';

import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import VList from 'react-virtualized/dist/commonjs/List';

const { TabPane } = Tabs;
const { Option } = Select;

function GatherPane({ fulldata }) {
  const [selected, setSelected] = useState('overall');

  const fulldataSorted = fulldata.sort((left, right) => {
    if (selected === 'overall') {
      return right.overall.priority - left.overall.priority;
    } else if (selected === 'health') {
      return right.health.priority - left.health.priority;
    } else if (selected === 'food') {
      return right.food.priority - left.food.priority;
    } else if (selected === 'hygiene') {
      return right.hygiene.priority - left.hygiene.priority;
    }
    return 0;
  });

  const renderItem = ({ index, key, style }) => {
    const item = fulldataSorted[index];
    return (
      <List.Item key={key} style={style} className="row">
        <List.Item.Meta
          title={<div>{item.name}</div>}
          description={
            <div>
              Overall: {Math.round(item.overall.priority)}
              <Icon className="rowIcon" component={Icons.Bandage} />:{' '}
              {Math.round(item.health.priority*10)}
              <Icon className="rowIcon" component={Icons.Food} />:{' '}
              {Math.round(item.food.priority*10)}
              <Icon className="rowIcon" component={Icons.Toilet} />:{' '}
              {Math.round(item.hygiene.priority*10)}
            </div>
          }
        />
      </List.Item>
    );
  };

  const Vlist = ({ height, width }) => (
    <VList
      height={height}
      overscanRowCount={2}
      rowCount={fulldataSorted.length}
      rowHeight={73}
      rowRenderer={renderItem}
      width={width}
    />
  );
  const AutoSize = () => (
    <AutoSizer>
      {({ width, height }) =>
        Vlist({
          height,
          width
        })
      }
    </AutoSizer>
  );

  return (
    <div className="gather">
      <div className="select">
        <span className="sort">Sort by Priority:</span>
        <Select value={selected} onChange={v => setSelected(v)}>
          <Option value="overall">
            <div className="option">Overall</div>
          </Option>
          <Option value="health">
            <div className="option">
              <Icon className="icon" component={Icons.Bandage} />
              Health
            </div>
          </Option>
          <Option value="food">
            <div className="option">
              <Icon className="icon" component={Icons.Food} />
              Food
            </div>
          </Option>
          <Option value="hygiene">
            <div className="option">
              <Icon className="icon" component={Icons.Toilet} />
              Hygiene
            </div>
          </Option>
        </Select>
      </div>

      <div className="divider" style={{ gridArea: 'dividerTop' }} />

      <div className="rawlist">
        <AutoSize />
      </div>

      <div className="divider" style={{ gridArea: 'dividerBottom' }} />

      <div className="info">HERE'S SOME INFO</div>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState('1');

  const calculateOverallPriority = record =>
    record.health.priority * 0.7 +
    record.food.priority * 0.2 +
    record.hygiene.priority * 0.1;

  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const result = await (await fetch('/fulldata.json')).json();
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

  return (
    <div className="App">
      <div className="menu">
        <h1 className="header">Emergency Dashboard</h1>

        <Tabs className="tabs" defaultActiveKey={tab} onChange={setTab}>
          <TabPane className="tabPane" tab="1. Gather" key="1">
            <GatherPane fulldata={fulldataWithOverall} />
          </TabPane>
          <TabPane tab="2. Organize" key="2">
            Content of Tab Pane 2
          </TabPane>
          <TabPane tab="3. Respond" key="3">
            Content of Tab Pane 3
          </TabPane>
        </Tabs>
      </div>
      <Map fulldata={fulldataWithOverall} />
    </div>
  );
}

export default App;
