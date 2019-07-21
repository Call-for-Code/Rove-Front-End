import React, { useState } from 'react';
import './App.css';
import 'antd/dist/antd.css';

import Map from './Map';

import { Tabs, Icon } from 'antd';
import * as Icons from './icons';

const { TabPane } = Tabs;

function App() {
  const [tab, setTab] = useState('1');

  return (
    <div className="App">
      <div className="menu">
        <Tabs
          className="tabs"
          defaultActiveKey={tab}
          onChange={setTab}
          size="small"
        >
          <TabPane
            tab={
              <div>
                <Icon component={Icons.Bandage} />
                Health
              </div>
            }
            key="1"
          >
            Content of Tab Pane 1
          </TabPane>
          <TabPane
            tab={
              <div>
                <Icon component={Icons.Food} />
                Food
              </div>
            }
            key="2"
          >
            Content of Tab Pane 2
          </TabPane>
          <TabPane
            tab={
              <div>
                <Icon component={Icons.Toilet} />
                Hygiene
              </div>
            }
            key="3"
          >
            Content of Tab Pane 3
          </TabPane>
        </Tabs>
      </div>
      <Map />
    </div>
  );
}

export default App;
