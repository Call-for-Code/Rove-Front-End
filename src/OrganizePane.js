import React, { useCallback, useMemo, useState } from 'react';
import { Icon, List, Select } from 'antd';
import * as Icons from './icons';
import VList from 'react-virtualized/dist/commonjs/List';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';

import './OrganizePane.css';

const { Option } = Select;

const getPriorityUiString = priority => {
  return Math.max(0, (10 - priority * 10)).toFixed(1);
};

export function OrganizePane({
  fulldata,
  selectedCluster,
  handleSelectedCluster,
  fulldataLngLats,
  kmeansResult,
  fullclusters
}) {
  const [selected, setSelected] = useState('overall');

  const fullclustersSorted = useMemo(
    () =>
      fullclusters.sort((left, right) => {
        if (selected === 'overall') {
          return right.overallPriority - left.overallPriority;
        } else if (selected === 'health') {
          return right.healthPriority - left.healthPriority;
        } else if (selected === 'food') {
          return right.foodPriority - left.foodPriority;
        } else if (selected === 'hygiene') {
          return right.hygienePriority - left.hygienePriority;
        }
        return 0;
      }),
    [fullclusters, selected]
  );


  const renderItem = ({ index, key, style }) => {
    const cluster = fullclustersSorted[index];

    const handleItemClick = item => {
      handleSelectedCluster(item._id);
    };

    return (
      <List.Item
        key={key}
        style={style}
        className="row"
        onClick={() => handleItemClick(cluster)}
      >
        <List.Item.Meta
          title={<div>{cluster.reports.length} reports</div>}
          description={
            <div>
              Overall: {getPriorityUiString(cluster.overallPriority)}
              <Icon className="rowIcon" component={Icons.Bandage} />{' '}
              {getPriorityUiString(cluster.healthPriority)}
              <Icon className="rowIcon" component={Icons.Food} />{' '}
              {getPriorityUiString(cluster.foodPriority)}
              <Icon className="rowIcon" component={Icons.Toilet} />{' '}
              {getPriorityUiString(cluster.hygienePriority)}
            </div>
          }
        />
      </List.Item>
    );
  };
  /*
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
    info = "Select a report in the above list or Priority Scatterplot"
  }*/

  return (
    <div className="organize">
      <div className="select">
        <span className="sort">Sort clusters by:</span>
        <Select className="organize-select" value={selected} onChange={v => setSelected(v)}>
          <Option value="overall">
            <div className="option">Overall status</div>
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
        <AutoSizer>
          {({ width, height }) => (
            <VList
              height={height}
              overscanRowCount={2}
              rowCount={fullclustersSorted.length}
              rowHeight={73}
              rowRenderer={renderItem}
              width={width}
            />
          )}
        </AutoSizer>
      </div>

      <div className="divider" style={{ gridArea: 'dividerBottom' }} />

      <div className="organize-info">
       {/* {info}*/}
      </div>

      <div className="fyi">
        <Icon type="info-circle"/> Circle color indicates cluster priority
      </div>
    </div>
  );
}
