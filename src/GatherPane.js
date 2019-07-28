import React, { useState } from 'react';
import { Icon, List, Select } from 'antd';
import * as Icons from './icons';
import VList from 'react-virtualized/dist/commonjs/List';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';

import './GatherPane.css';

const { Option } = Select;

const getPriorityUiString = (priority) => {
  return (10 - priority * 10).toFixed(1);
};

export function GatherPane({ fulldata, selectedPt, handleSelectedPt }) {
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

  const handleItemClick = (item) => {
    handleSelectedPt(item._id)
  };

  const renderItem = ({ index, key, style }) => {
    const item = fulldataSorted[index];
    return (
      <List.Item
        key={key}
        style={style}
        className="row"
        onClick={() => handleItemClick(item)}>
        <List.Item.Meta
          title={<div>{item.name}</div>}
          description={
            <div>
              Overall: {getPriorityUiString(item.overall.priority)}

              <Icon className="rowIcon" component={Icons.Bandage}/>{' '}
              {getPriorityUiString(item.health.priority)}

              <Icon className="rowIcon" component={Icons.Food}/>{' '}
              {getPriorityUiString(item.food.priority)}

              <Icon className="rowIcon" component={Icons.Toilet}/>{' '}
              {getPriorityUiString(item.hygiene.priority)}
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
        Vlist({height, width})}
    </AutoSizer>
  );

  const selectedPtData = fulldata.filter(record => record._id === selectedPt);
  let info;
  if(selectedPtData[0]) {
    const report = selectedPtData[0];
    info =
      <div>
        <div className="row-label">Name:  </div> {report.name} <br/>
        <div className="row-label">Phone:  </div> {report.phone_number} <br/>
        <div className="row-label">Location:  </div> {report.location_information.geometry.location.lat.toFixed(5)}, {report.location_information.geometry.location.lng.toFixed(5)} <br/>
        <div className="row-label">Keywords:  </div> {report.health.key_words.join(', ')} <br/>
        <div className="row-label">Health:  </div> {getPriorityUiString(report.health.priority)} <br/>
        <div className="row-label">Food:  </div> {getPriorityUiString(report.food.priority)} <br/>
        <div className="row-label">Hygiene:  </div> {getPriorityUiString(report.hygiene.priority)} <br/>
      </div>
  } else {
    info = "Select a report for more information"
  }

  return (
    <div className="gather">
      <div className="select">
        <span className="sort">Sort by status:</span>
        <Select value={selected} onChange={v => setSelected(v)}>
          <Option value="overall">
            <div className="option">Overall</div>
          </Option>
          <Option value="health">
            <div className="option">
              <Icon className="icon" component={Icons.Bandage}/>
              Health
            </div>
          </Option>
          <Option value="food">
            <div className="option">
              <Icon className="icon" component={Icons.Food}/>
              Food
            </div>
          </Option>
          <Option value="hygiene">
            <div className="option">
              <Icon className="icon" component={Icons.Toilet}/>
              Hygiene
            </div>
          </Option>
        </Select>
      </div>

      <div className="divider" style={{ gridArea: 'dividerTop' }}/>

      <div className="rawlist">
        <AutoSize/>
      </div>

      <div className="divider" style={{ gridArea: 'dividerBottom' }}/>

      <div className="info">
        {info}
      </div>
    </div>
  );
}